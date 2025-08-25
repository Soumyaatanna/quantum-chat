import React, { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import api, { API_BASE } from '../lib/api';
import QKDModal from '../components/QKDModal';
import Sidebar, { Conversation } from '../components/Sidebar';
import ChatHeader from '../components/ChatHeader';
import MessageBubble from '../components/MessageBubble';

const wsBase = (import.meta.env.VITE_WS_BASE as string) || API_BASE;

async function importKeyFromHex(hex: string) {
  const src = new Uint8Array(hex.match(/.{1,2}/g)!.map(x => parseInt(x, 16)));
  // Derive a fixed 256-bit key using SHA-256 of the QKD key material
  const digest = await crypto.subtle.digest('SHA-256', src);
  return crypto.subtle.importKey('raw', digest, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

async function encryptAesGcm(key: CryptoKey, plaintext: string) {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext)));
  return { 
    iv: Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join(''), 
    ciphertext: btoa(String.fromCharCode(...ct))
  };
}

async function decryptAesGcm(key: CryptoKey, ivHex: string, ciphertextB64: string) {
  const dec = new TextDecoder();
  const iv = new Uint8Array(ivHex.match(/.{1,2}/g)!.map(x => parseInt(x, 16)));
  const data = Uint8Array.from(atob(ciphertextB64), c => c.charCodeAt(0));
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
  return dec.decode(pt);
}

interface User {
  _id: string;
  username: string;
}

export default function ChatPage() {
  const [peerId, setPeerId] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [showQKD, setShowQKD] = useState(false);
  const [eve, setEve] = useState(false);
  const [keyHex, setKeyHex] = useState('');
  const [qber, setQber] = useState(0);
  const [eveDetected, setEveDetected] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const socket = useMemo(() => {
    console.log('[ChatPage] Creating socket connection to:', wsBase);
    return io(wsBase, { transports: ['websocket'] });
  }, []);
  const keyRef = useRef<CryptoKey | null>(null);

  const userId = localStorage.getItem('userId')!;
  const token = localStorage.getItem('token')!;

  const roomId = useMemo(() => peerId ? [userId, peerId].sort().join(':') : '', [peerId, userId]);

  // Set up axios interceptor to include auth token
  useEffect(() => {
    api.interceptors.request.use((config) => {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }, [token]);

  useEffect(() => {
    socket.on('connect', () => console.log('[Socket] Connected'));
    socket.on('disconnect', () => console.log('[Socket] Disconnected'));
    socket.on('connect_error', (err) => console.error('[Socket] Connection error:', err));
    
    // Listen for room join confirmation
    socket.on('joined', ({ roomId, userId: socketUserId }) => {
      console.log('[Socket] Successfully joined room:', roomId, 'User:', socketUserId);
    });
    
    // Listen for incoming messages
    socket.on('chat', async ({ message }) => {
      console.log('[ChatPage] Received message from socket:', message);
      
      // Only process messages from other users
      if (message.sender === userId) {
        console.log('[ChatPage] Ignoring own message from socket');
        return;
      }
      
      if (!keyRef.current) {
        console.log('[ChatPage] No key available for decryption, storing encrypted message');
        setMessages(prev => [...prev, { ...message, plaintext: '[encrypted - no key]' }]);
        return;
      }
      
      try {
        const plaintext = await decryptAesGcm(keyRef.current, message.iv, message.ciphertext);
        console.log('[ChatPage] Decrypted message:', plaintext);
        setMessages(prev => [...prev, { ...message, plaintext }]);
      } catch (err) {
        console.error('[ChatPage] Failed to decrypt message:', err);
        setMessages(prev => [...prev, { ...message, plaintext: '[decryption failed]' }]);
      }
    });
    
    // Listen for message sent confirmation
    socket.on('message_sent', ({ message }) => {
      console.log('[ChatPage] Message sent confirmation received');
    });
    
    // Listen for socket errors
    socket.on('error', ({ message }) => {
      console.error('[Socket] Error:', message);
    });
    
    return () => { 
      socket.off('chat'); 
      socket.off('joined');
      socket.off('message_sent');
      socket.off('error');
    };
  }, [socket, userId]);

  useEffect(() => {
    if (!roomId) return;
    console.log('[ChatPage] Joining room:', roomId);
    socket.emit('join', { roomId, token });
  }, [roomId, socket, token]);

  // Load all users on component mount
  useEffect(() => {
    loadUsers();
  }, []);

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
          secure: false
        }));
      
      setConversations(userConversations);
    } catch (err) {
      console.error('[ChatPage] Failed to load users:', err);
    }
  }

  async function loadHistory() {
    if (!peerId) return;
    setLoading(true);
    try {
      console.log('[ChatPage] Loading history for peer:', peerId);
      const res = await api.get(`/api/messages/${peerId}`);
      console.log('[ChatPage] History loaded:', res.data.length, 'messages');
      
      const key = keyRef.current;
      const enriched = await Promise.all(res.data.map(async (m: any) => {
        try {
          if (key) {
            const plaintext = await decryptAesGcm(key, m.iv, m.ciphertext);
            return { ...m, plaintext };
          }
        } catch (err) {
          console.error('[ChatPage] Failed to decrypt history message:', err);
        }
        return m;
      }));
      setMessages(enriched);
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
      
      // Emit to socket for real-time delivery to other users
      console.log('[ChatPage] Emitting to socket, roomId:', roomId);
      socket.emit('chat', { roomId, message: saved.data });
      
      setText('');
    } catch (err: any) {
      console.error('[ChatPage] Failed to send message:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to send message';
      alert(`Failed to send message: ${errorMsg}`);
    }
  }

  function onKey(hex: string, qberVal: number, eveDet: boolean) {
    console.log('[ChatPage] QKD key received:', { hex: hex.substring(0, 16) + '...', qber: qberVal, eveDet });
    setKeyHex(hex);
    setQber(qberVal);
    setEveDetected(eveDet);
    importKeyFromHex(hex).then(k => {
      keyRef.current = k;
      console.log('[ChatPage] Key imported successfully');
      loadHistory();
      
      // Update conversation security status
      if (peerId) {
        setConversations(prev => prev.map(c => 
          c.peerId === peerId ? { ...c, secure: true } : c
        ));
      }
    }).catch(err => {
      console.error('[ChatPage] Failed to import key:', err);
    });
  }

  function startNewChat() {
    const id = prompt('Enter peer userId');
    if (!id) return;
    console.log('[ChatPage] Starting new chat with:', id);
    setPeerId(id);
    setConversations(prev => {
      if (prev.find(p => p.peerId === id)) return prev;
      return [...prev, { peerId: id, title: `User ${id}`, secure: !!keyHex }];
    });
  }

  return (
    <div className="h-screen flex">
      <Sidebar 
        conversations={conversations} 
        onSelect={(c) => { 
          console.log('[ChatPage] Selecting conversation:', c.peerId);
          setPeerId(c.peerId); 
          loadHistory(); 
        }} 
        onNew={startNewChat} 
      />
      <div className="flex-1 flex flex-col">
        <ChatHeader 
          title={peerId ? users.find(u => u._id === peerId)?.username || `User ${peerId}` : 'Select a chat'} 
          secure={!!keyHex} 
          qber={qber} 
          eveDetected={eveDetected} 
        />
        <div className="px-3 py-2 bg-gray-50 flex items-center gap-3 border-b">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={eve} onChange={e => setEve(e.target.checked)} />
            Eve attack
          </label>
          <button onClick={() => setShowQKD(true)} className="px-3 py-1.5 bg-green-600 text-white rounded">
            Start QKD
          </button>
          <button onClick={loadHistory} disabled={loading} className="px-3 py-1.5 border rounded disabled:opacity-50">
            {loading ? 'Loading...' : 'Load History'}
          </button>
          <button onClick={loadUsers} className="px-3 py-1.5 border rounded">
            Refresh Users
          </button>
          <div className="text-xs text-gray-600 border-l pl-3">
            <div>Room: {roomId || 'None'}</div>
            <div>Socket: {socket.connected ? '🟢' : '🔴'}</div>
            <div>Users: {conversations.length}</div>
          </div>
          {keyHex && (
            <div className="text-sm text-gray-600">
              Key: {keyHex.substring(0, 16)}... | QBER: {(qber * 100).toFixed(1)}%
            </div>
          )}
        </div>
        <div className="flex-1 overflow-auto p-4 space-y-2 bg-gray-100">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-8">
              {peerId ? 'No messages yet. Start QKD to begin secure chat.' : 'Select a conversation to start chatting.'}
            </div>
          )}
          {messages.map((m, i) => (
            <MessageBubble 
              key={i} 
              mine={m.sender === userId} 
              text={m.plaintext ?? '[encrypted]'} 
              time={new Date(m.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
            />
          ))}
        </div>
        <div className="p-3 bg-white flex gap-2 border-t">
          <input 
            value={text} 
            onChange={e => setText(e.target.value)} 
            onKeyPress={e => e.key === 'Enter' && send()}
            placeholder="Type a quantum-secured message..." 
            className="border flex-1 p-2 rounded" 
          />
          <button onClick={send} disabled={!text || !keyRef.current || !peerId} className="px-3 py-2 bg-indigo-600 text-white rounded disabled:opacity-50">
            Send
          </button>
        </div>
      </div>
      <QKDModal open={showQKD} onClose={() => setShowQKD(false)} setSessionKey={onKey} eveEnabled={eve} />
    </div>
  );
}


