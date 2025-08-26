import React, { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import api from '../lib/api';
import QKDModal from '../components/QKDModal';
import Sidebar, { Conversation } from '../components/Sidebar';
import ChatHeader from '../components/ChatHeader';
import MessageBubble from '../components/MessageBubble';

const wsBase = 'http://localhost:4000';

// Add key validation function
function validateQKDKey(hex: string): boolean {
  // Check if hex string is valid and has correct length
  if (!/^[0-9a-fA-F]+$/.test(hex)) {
    console.error('[Key Validation] Invalid hex format');
    return false;
  }
  
  if (hex.length !== 32) {
    console.error('[Key Validation] Invalid key length:', hex.length, 'expected 32');
    return false;
  }
  
  console.log('[Key Validation] Key format is valid');
  return true;
}

async function importKeyFromHex(hex: string) {
  try {
    console.log('[Key Import] Starting key import from hex:', hex.substring(0, 16) + '...');
    const src = new Uint8Array(hex.match(/.{1,2}/g)!.map(x => parseInt(x, 16)));
    console.log('[Key Import] Converted hex to bytes:', src.length, 'bytes');
    
    const digest = await crypto.subtle.digest('SHA-256', src);
    console.log('[Key Import] Generated digest:', digest.byteLength, 'bytes');
    
    const key = await crypto.subtle.importKey('raw', digest, 'AES-GCM', false, ['encrypt', 'decrypt']);
    console.log('[Key Import] Key imported successfully');
    return key;
  } catch (error) {
    console.error('[Key Import] Failed to import key:', error);
    throw error;
  }
}

async function encryptAesGcm(key: CryptoKey, plaintext: string) {
  try {
    console.log('[Encrypt] Starting encryption of:', plaintext);
    const enc = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    console.log('[Encrypt] Generated IV:', Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join(''));
    
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext)));
    console.log('[Encrypt] Generated ciphertext:', ct.length, 'bytes');
    
    const result = { 
      iv: Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join(''), 
      ciphertext: btoa(String.fromCharCode(...ct))
    };
    console.log('[Encrypt] Encryption successful');
    return result;
  } catch (error) {
    console.error('[Encrypt] Encryption failed:', error);
    throw error;
  }
}

async function decryptAesGcm(key: CryptoKey, ivHex: string, ciphertextB64: string) {
  try {
    console.log('[Decrypt] Starting decryption');
    console.log('[Decrypt] IV hex:', ivHex);
    console.log('[Decrypt] Ciphertext base64:', ciphertextB64.substring(0, 20) + '...');
    
    const dec = new TextDecoder();
    const iv = new Uint8Array(ivHex.match(/.{1,2}/g)!.map(x => parseInt(x, 16)));
    console.log('[Decrypt] Converted IV to bytes:', iv.length, 'bytes');
    
    const data = Uint8Array.from(atob(ciphertextB64), c => c.charCodeAt(0));
    console.log('[Decrypt] Converted ciphertext to bytes:', data.length, 'bytes');
    
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
    const result = dec.decode(pt);
    console.log('[Decrypt] Decryption successful:', result);
    return result;
  } catch (error) {
    console.error('[Decrypt] Decryption failed:', error);
    throw error;
  }
}

interface User {
  _id: string;
  username: string;
}

interface Message {
  _id: string;
  sender: string | { _id: string; username: string };
  receiver: string | { _id: string; username: string };
  ciphertext: string;
  iv: string;
  plaintext?: string;
  createdAt: string | Date;
}

export default function ChatPage() {
  const [peerId, setPeerId] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [showQKD, setShowQKD] = useState(false);
  const [eve, setEve] = useState(false);
  const [keyHex, setKeyHex] = useState('');
  const [qber, setQber] = useState(0);
  const [eveDetected, setEveDetected] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [currentRoomId, setCurrentRoomId] = useState<string>('');
  const [sharedKeys, setSharedKeys] = useState<Record<string, CryptoKey>>({});

  const socket = useMemo(() => {
    console.log('[ChatPage] Creating socket connection to:', wsBase);
    return io(wsBase, { transports: ['websocket'] });
  }, []);
  const keyRef = useRef<CryptoKey | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const userId = localStorage.getItem('userId')!;
  const token = localStorage.getItem('token')!;
  const currentUsername = localStorage.getItem('username') || 'Unknown User';

  // Set up axios interceptor to include auth token
  useEffect(() => {
    api.interceptors.request.use((config) => {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }, [token]);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Socket event listeners
  useEffect(() => {
    console.log('[ChatPage] Setting up socket event listeners');
    
    socket.on('connect', () => {
      console.log('[Socket] Connected successfully');
      console.log('[Socket] Socket ID:', socket.id);
      setSocketConnected(true);
      
      // Authenticate with the server
      console.log('[Socket] Authenticating with token...');
      socket.emit('authenticate', { token });
      
      // Rejoin current room if we have one
      if (currentRoomId) {
        console.log('[Socket] Rejoining room after reconnect:', currentRoomId);
        socket.emit('join_room', { roomId: currentRoomId });
      } else if (peerId) {
        // If we don't have a room ID but have a peer, create and join the room
        const roomId = [userId, peerId].sort().join('_');
        console.log('[Socket] Creating and joining room after reconnect:', roomId);
        socket.emit('join_room', { roomId });
      }
    });
    
    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected');
      setSocketConnected(false);
      
      // Try to reconnect after a short delay
      setTimeout(() => {
        if (!socket.connected) {
          console.log('[Socket] Attempting to reconnect...');
          socket.connect();
        }
      }, 2000);
    });
    
    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err);
      setSocketConnected(false);
      
      // Show connection error to user
      console.error('[ChatPage] Socket connection failed:', err.message);
    });
    
    // Listen for authentication confirmation
    socket.on('authenticated', ({ userId: authUserId, socketId }) => {
      console.log('[Socket] Authentication successful:', authUserId, 'Socket:', socketId);
      
      // Rejoin current room if we have one
      if (currentRoomId) {
        console.log('[Socket] Rejoining room after authentication:', currentRoomId);
        socket.emit('join_room', { roomId: currentRoomId });
      } else if (peerId) {
        // If we don't have a room ID but have a peer, create and join the room
        const roomId = [userId, peerId].sort().join('_');
        console.log('[Socket] Creating and joining room after authentication:', roomId);
        socket.emit('join_room', { roomId });
      }
    });
    
    socket.on('auth_error', ({ message }) => {
      console.error('[Socket] Authentication error:', message);
      alert(`Socket authentication failed: ${message}`);
    });

    // Listen for room events
    socket.on('room_joined', ({ roomId }) => {
      console.log('[Socket] Successfully joined room:', roomId);
      setCurrentRoomId(roomId);
      
      // Notify user that they're connected to the chat
      if (peerId) {
        const peerName = users.find(u => u._id === peerId)?.username || peerId;
        console.log('[ChatPage] Connected to chat with:', peerName);
      }
    });

    socket.on('user_joined_room', ({ userId: joinedUserId, userCount }) => {
      console.log('[Socket] User joined room:', joinedUserId, 'Total users:', userCount);
      
      // Show online status for the peer
      if (joinedUserId !== userId && peerId === joinedUserId) {
        console.log('[ChatPage] Peer is now online:', joinedUserId);
      }
    });
    
    // Listen for incoming messages
    socket.on('chat', async ({ message }) => {
      console.log('[ChatPage] Received message from socket:', message);
      
      // Only process messages from other users
      if (message.sender === userId || (typeof message.sender === 'object' && message.sender._id === userId)) {
        console.log('[ChatPage] Ignoring own message from socket');
        return;
      }
      
      // Get sender ID
      const senderId = typeof message.sender === 'string' ? message.sender : message.sender._id;
      
      // Update unread count for this sender
      setUnreadCounts(prev => ({
        ...prev,
        [senderId]: (prev[senderId] || 0) + 1
      }));
      
      // Check if we have a key to decrypt this message
      if (!keyRef.current) {
        console.log('[ChatPage] No key available for decryption, storing encrypted message');
        // Add message to current chat if it's from the current peer
        if (peerId === senderId) {
          setMessages(prev => [...prev, { ...message, plaintext: '[encrypted - no key]' }]);
        }
        return;
      }
      
      try {
        console.log('[ChatPage] Decrypting message with key...');
        const plaintext = await decryptAesGcm(keyRef.current, message.iv, message.ciphertext);
        console.log('[ChatPage] Message decrypted successfully:', plaintext);
        
        // Add decrypted message to chat if it's the current peer
        if (peerId === senderId) {
          setMessages(prev => [...prev, { ...message, plaintext }]);
        }
      } catch (err) {
        console.error('[ChatPage] Failed to decrypt message:', err);
        if (peerId === senderId) {
          // Try to provide more helpful error message
          let errorMsg = '[decryption failed]';
          if (err instanceof Error) {
            if (err.message.includes('operation failed')) {
              errorMsg = '[decryption failed - invalid key or corrupted data]';
            } else if (err.message.includes('invalid key')) {
              errorMsg = '[decryption failed - key mismatch]';
            }
          }
          setMessages(prev => [...prev, { ...message, plaintext: errorMsg }]);
        }
      }
    });
    
    // Listen for message sent confirmation
    socket.on('message_sent', ({ message }) => {
      console.log('[ChatPage] Message sent confirmation received');
    });
    
    // Listen for socket errors
    socket.on('error', ({ message }) => {
      console.error('[Socket] Error:', message);
      alert(`Socket error: ${message}`);
    });
    
    // Listen for shared keys from peers
    socket.on('key_shared', async ({ peerId: senderId, keyHex, qber, eveDetected }) => {
      console.log('[ChatPage] Received shared key from peer:', senderId);
      console.log('[ChatPage] Key details:', { 
        keyHex: keyHex.substring(0, 16) + '...', 
        qber, 
        eveDetected 
      });
      
      try {
        // Import the shared key
        const sharedKey = await importKeyFromHex(keyHex);
        
        // Store the shared key for this peer
        setSharedKeys(prev => ({
          ...prev,
          [senderId]: sharedKey
        }));
        
        console.log('[ChatPage] Shared key imported successfully for peer:', senderId);
        
        // Update conversation security status
        setConversations(prev => prev.map(c => 
          c.peerId === senderId ? { ...c, secure: true } : c
        ));
        
        // If this is the current peer, also update the main key reference
        if (senderId === peerId) {
          keyRef.current = sharedKey;
          setKeyHex(keyHex);
          setQber(qber);
          setEveDetected(eveDetected);
          console.log('[ChatPage] Current peer key updated from shared key');
        }
        
      } catch (err) {
        console.error('[ChatPage] Failed to import shared key:', err);
      }
    });
    
    return () => { 
      console.log('[ChatPage] Cleaning up socket event listeners');
      socket.off('chat'); 
      socket.off('message_sent');
      socket.off('error');
      socket.off('authenticated');
      socket.off('auth_error');
      socket.off('room_joined');
      socket.off('user_joined_room');
      socket.off('key_shared');
    };
  }, [socket, userId, token, peerId]);

  // Load all users on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  // Join room when peer changes
  useEffect(() => {
    if (peerId && socketConnected) {
      // Leave current room if any
      if (currentRoomId) {
        console.log('[ChatPage] Leaving current room:', currentRoomId);
        socket.emit('leave_room', { roomId: currentRoomId });
        setCurrentRoomId('');
      }
      
      // Join new room
      const roomId = [userId, peerId].sort().join('_');
      console.log('[ChatPage] Joining room for peer:', peerId, 'Room:', roomId);
      socket.emit('join_room', { roomId });
    }
  }, [peerId, socketConnected, userId, socket, currentRoomId]);

  async function loadUsers() {
    try {
      console.log('[ChatPage] Loading users...');
      const res = await api.get('/api/auth/users');
      console.log('[ChatPage] Users loaded:', res.data.length, 'users');
      setUsers(res.data);
      
      // Convert users to conversations format
      const userConversations = res.data
        .filter((user: User) => user._id !== userId)
        .map((user: User) => ({
          peerId: user._id,
          title: user.username,
          secure: false,
          unreadCount: unreadCounts[user._id] || 0
        }));
      
      setConversations(userConversations);
    } catch (err) {
      console.error('[ChatPage] Failed to load users:', err);
    }
  }

  // Update conversations when unread counts change
  useEffect(() => {
    setConversations(prev => prev.map(conv => ({
      ...conv,
      unreadCount: unreadCounts[conv.peerId] || 0
    })));
  }, [unreadCounts]);

  async function loadHistory() {
    if (!peerId) return;
    
    // Only load history if we have a key
    if (!keyRef.current) {
      console.log('[ChatPage] Cannot load history - no QKD key available. Please start QKD first.');
      return;
    }
    
    setLoading(true);
    try {
      console.log('[ChatPage] Loading history for peer:', peerId);
      const res = await api.get(`/api/messages/${peerId}`);
      console.log('[ChatPage] History loaded:', res.data.length, 'messages');
      
      console.log('[ChatPage] Decrypting history messages with key...');
      const enriched = await Promise.all(res.data.map(async (m: any) => {
        try {
          const plaintext = await decryptAesGcm(keyRef.current!, m.iv, m.ciphertext);
          return { ...m, plaintext };
        } catch (err) {
          console.error('[ChatPage] Failed to decrypt history message:', err);
          return { ...m, plaintext: '[decryption failed]' };
        }
      }));
      setMessages(enriched);
      
      // Clear unread count for this peer
      setUnreadCounts(prev => ({ ...prev, [peerId]: 0 }));
    } catch (err) {
      console.error('[ChatPage] Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  }

  async function send() {
    if (!text || !keyRef.current || !peerId) {
      console.log('[ChatPage] Cannot send - missing:', { text: !!text, key: !!keyRef.current, peerId: !!peerId });
      return;
    }
    
    try {
      console.log('[ChatPage] Sending message to:', peerId);
      const { iv, ciphertext } = await encryptAesGcm(keyRef.current, text);
      const payload = { receiver: peerId, iv, ciphertext };
      
      console.log('[ChatPage] Sending payload:', { 
        receiver: payload.receiver, 
        hasIv: !!payload.iv, 
        hasCiphertext: !!payload.ciphertext 
      });
      
      const saved = await api.post(`/api/messages`, payload);
      console.log('[ChatPage] Message saved:', saved.data);
      
      // Add message to local state immediately
      const newMessage = { 
        ...saved.data, 
        plaintext: text,
        sender: userId,
        receiver: peerId,
        createdAt: new Date()
      };
      setMessages(prev => [...prev, newMessage]);
      
      // Send via socket for real-time delivery
      console.log('[ChatPage] Sending via socket to user:', peerId);
      socket.emit('chat', { message: saved.data });
      
      setText('');
    } catch (err: any) {
      console.error('[ChatPage] Failed to send message:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to send message';
      alert(`Failed to send message: ${errorMsg}`);
    }
  }

  function onKey(hex: string, qberVal: number, eveDet: boolean) {
    console.log('[ChatPage] QKD key received:', { hex: hex.substring(0, 16) + '...', qber: qberVal, eveDet });
    
    // Validate the key format first
    if (!validateQKDKey(hex)) {
      alert('⚠️ Invalid QKD key format received. Please try again.');
      return;
    }
    
    setKeyHex(hex);
    setQber(qberVal);
    setEveDetected(eveDet);
    
    if (eveDet) {
      alert('⚠️ EAVESDROPPING DETECTED! QBER > 11%. Session is NOT secure.');
    }
    
    importKeyFromHex(hex).then(k => {
      keyRef.current = k;
      
      // Store the shared key for this peer
      if (peerId) {
        setSharedKeys(prev => ({
          ...prev,
          [peerId]: k
        }));
        console.log('[ChatPage] Key stored for peer:', peerId);
        
        // Send the key to the peer via socket so they can use the same key
        console.log('[ChatPage] Sharing key with peer:', peerId);
        socket.emit('share_key', { 
          peerId: peerId, 
          keyHex: hex, 
          qber: qberVal, 
          eveDetected: eveDet 
        });
      }
      
      console.log('[ChatPage] Key imported successfully');
      
      // Update conversation security status and load history
      if (peerId) {
        // Update conversation security status
        setConversations(prev => prev.map(c => 
          c.peerId === peerId ? { ...c, secure: true } : c
        ));
        
        // Load history automatically when key is established
        loadHistory();
        
        console.log('[ChatPage] QKD key established successfully for peer:', peerId);
      }
    }).catch(err => {
      console.error('[ChatPage] Failed to import key:', err);
      alert(`Failed to import QKD key: ${err.message}`);
    });
  }

  function startNewChat() {
    const id = prompt('Enter peer userId');
    if (!id) return;
    console.log('[ChatPage] Starting new chat with:', id);
    setPeerId(id);
    setConversations(prev => {
      if (prev.find(p => p.peerId === id)) return prev;
      return [...prev, { peerId: id, title: `User ${id}`, secure: !!keyHex, unreadCount: 0 }];
    });
  }

  function selectConversation(conversation: Conversation) {
    console.log('[ChatPage] Selecting conversation:', conversation.peerId);
    
    // Leave current room if any
    if (currentRoomId) {
      console.log('[ChatPage] Leaving current room:', currentRoomId);
      socket.emit('leave_room', { roomId: currentRoomId });
      setCurrentRoomId('');
    }
    
    setPeerId(conversation.peerId);
    setMessages([]); // Clear messages when switching conversations
    
    // Reset QKD state for new conversation
    setKeyHex(''); 
    setQber(0);
    setEveDetected(false);
    keyRef.current = null;
    
    // Clear unread count for this peer
    setUnreadCounts(prev => ({ ...prev, [conversation.peerId]: 0 }));

    // Join the chat room for this conversation
    if (conversation.peerId) {
      const roomId = [userId, conversation.peerId].sort().join('_');
      console.log('[ChatPage] Joining room:', roomId);
      socket.emit('join_room', { roomId });
    }
    
    // Update conversation security status
    setConversations(prev => prev.map(c => ({
      ...c,
      secure: c.peerId === conversation.peerId ? false : c.secure
    })));
  }

  // Helper function to check if a message is from the current user
  function isMyMessage(message: Message): boolean {
    const senderId = typeof message.sender === 'string' ? message.sender : message.sender?._id;
    return senderId === userId;
  }

  // Helper function to get sender name
  function getSenderName(message: Message): string | undefined {
    if (typeof message.sender === 'object' && message.sender?.username) {
      return message.sender.username;
    }
    // If sender is just an ID, find the username from users array
    const senderId = typeof message.sender === 'string' ? message.sender : message.sender?._id;
    return users.find(u => u._id === senderId)?.username;
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sticky Top Bar with User Info */}
      <div className="fixed top-0 left-0 right-0 z-20 bg-white border-b shadow-sm">
        <div className="flex items-center justify-center px-4 py-3">
          <div className="text-center">
            <div className="text-sm font-medium text-gray-700">Logged in as</div>
            <div className="text-xl font-bold text-green-600">{currentUsername}</div>
            <div className="text-xs text-gray-500 flex items-center justify-center gap-2">
              <span>Socket:</span>
              <span className={`inline-block w-2 h-2 rounded-full ${socketConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span>{socketConnected ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Top Margin */}
      <div className="w-full flex pt-20">
        <Sidebar 
          conversations={conversations} 
          onSelect={selectConversation} 
          onNew={startNewChat} 
        />
        <div className="flex-1 flex flex-col bg-white">
          <ChatHeader 
            title={peerId ? users.find(u => u._id === peerId)?.username || `User ${peerId}` : 'Select a chat'} 
            secure={!!keyHex} 
            qber={qber} 
            eveDetected={eveDetected} 
          />
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold text-gray-800">Chats</h1>
              <div className="flex items-center space-x-2">
                <button onClick={startNewChat} className="p-2 hover:bg-gray-100 rounded-full">
                  <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-full">
                  <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-full">
                  <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-full">
                  <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <div className="px-4 py-3 bg-gray-50 flex items-center gap-3 border-b">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={eve} onChange={e => setEve(e.target.checked)} />
              Eve attack
            </label>
            <button onClick={() => setShowQKD(true)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              Start QKD
            </button>
            <button 
              onClick={loadHistory} 
              disabled={loading || !keyRef.current} 
              className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50 transition-colors"
              title={!keyRef.current ? "Start QKD first to load message history" : "Load message history"}
            >
              {loading ? 'Loading...' : 'Load History'}
            </button>
            <button onClick={loadUsers} className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors">
              Refresh Users
            </button>
            <div className="text-xs text-gray-600 border-l pl-3">
              <div>Users: {conversations.length}</div>
              <div>Peer: {peerId ? users.find(u => u._id === peerId)?.username || peerId.substring(0, 8) : 'None'}</div>
            </div>
            {keyHex && (
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <span className="text-green-600">🔐 Secure Connection</span>
                <span>|</span>
                <span>Key: {keyHex.substring(0, 16)}...</span>
                <span>|</span>
                <span>QBER: {(qber * 100).toFixed(1)}%</span>
                {eveDetected && <span className="text-red-600 ml-2">⚠️ EVE DETECTED!</span>}
              </div>
            )}
            {!keyHex && peerId && (
              <div className="text-sm text-orange-600 flex items-center gap-2">
                <span>⚠️ No secure connection</span>
                <span>|</span>
                <span>Click "Start QKD" to establish encryption</span>
              </div>
            )}
            {/* Debug Panel */}
            <details className="text-xs text-gray-600 border-l pl-3">
              <summary className="cursor-pointer hover:text-gray-800">Debug Info</summary>
              <div className="mt-2 space-y-1 text-xs">
                <div>Socket: {socketConnected ? '🟢 Connected' : '🔴 Disconnected'}</div>
                <div>Room: {currentRoomId || 'None'}</div>
                <div>Key: {keyRef.current ? '🟢 Loaded' : '🔴 None'}</div>
                <div>Messages: {messages.length}</div>
                <div>Peer ID: {peerId || 'None'}</div>
                <div>User ID: {userId}</div>
              </div>
            </details>
          </div>
          <div 
            ref={messagesContainerRef}
            className="flex-1 overflow-auto p-4 space-y-3 bg-gray-50"
          >
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-8">
                {peerId ? (
                  keyRef.current ? 
                    'No messages yet. Start chatting!' : 
                    'No messages yet. Click "Start QKD" to establish secure connection and begin chatting.'
                ) : (
                  'Select a conversation to start chatting.'
                )}
              </div>
            )}
            {messages.map((m, i) => (
              <MessageBubble 
                key={i} 
                mine={isMyMessage(m)} 
                text={m.plaintext ?? '[encrypted]'} 
                time={new Date(m.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                sender={getSenderName(m)}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-4 bg-white border-t">
            <div className="flex gap-3">
              <input 
                value={text} 
                onChange={e => setText(e.target.value)} 
                onKeyPress={e => e.key === 'Enter' && send()}
                placeholder="Type a quantum-secured message..." 
                className="flex-1 border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
              />
              <button 
                onClick={send} 
                disabled={!text || !keyRef.current || !peerId} 
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
      <QKDModal open={showQKD} onClose={() => setShowQKD(false)} setSessionKey={onKey} eveEnabled={eve} />
    </div>
  );
}


