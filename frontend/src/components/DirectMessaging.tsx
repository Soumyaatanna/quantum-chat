import React, { useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import api from '../lib/api';

interface User {
  _id: string;
  username: string;
}

interface MessageItem {
  _id: string;
  sender: string;
  content: string;
  iv: string;
  timestamp: string;
}

export default function DirectMessaging() {
  const [users, setUsers] = useState<User[]>([]);
  const [peerId, setPeerId] = useState<string>('');
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [key, setKey] = useState<CryptoKey | null>(null);
  const [loadingKey, setLoadingKey] = useState(false);

  const me = useMemo(() => ({
    id: localStorage.getItem('userId') || '',
    username: localStorage.getItem('username') || 'You'
  }), []);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const s = io('https://quantum-chat-uoq8.onrender.com', { transports: ['websocket'] });
    s.on('connect', () => {
      setConnected(true);
      s.emit('authenticate', { token });
    });
    s.on('disconnect', () => setConnected(false));

    s.on('message', async (data: any) => {
      // Only accept direct messages for current peer
      if (!peerId) return;
      const roomForPeer = [me.id, peerId].sort().join('_');
      if (data.roomId && data.roomId !== roomForPeer) return;

      try {
        if (!key) return;
        const text = await decryptMessage(data.content, data.iv, key);
        setMessages(prev => [...prev, {
          _id: String(Date.now()),
          sender: data.sender,
          content: text,
          iv: data.iv,
          timestamp: new Date().toISOString()
        }]);
      } catch {}
    });

    setSocket(s);
    return () => { s.close(); };
  }, [peerId, key, me.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/api/users');
        const list: User[] = res.data.filter((u: User) => u._id !== me.id);
        setUsers(list);
      } catch (e) {
        console.error('[DirectMessaging] Failed to load users', e);
      }
    })();
  }, [me.id]);

  async function selectPeer(id: string) {
    setPeerId(id);
    setMessages([]);
    // join socket room
    const roomId = [me.id, id].sort().join('_');
    socket?.emit('join_room', { roomId });
    // load history
    try {
      const res = await api.get(`/api/messages/direct/${id}`);
      // Backend stores ciphertext. We show placeholders for history (optional)
      setMessages(res.data.map((m: any) => ({
        _id: m._id,
        sender: m.sender?._id || m.sender,
        content: '[encrypted]',
        iv: m.iv,
        timestamp: m.createdAt
      })));
    } catch (e) {
      console.error('[DirectMessaging] load history failed', e);
    }
  }

  async function startQKD() {
    setLoadingKey(true);
    try {
      const res = await api.post('/api/qkd/bb84', { numPhotons: 128, eve: false });
      const k = await importKeyFromHex(res.data.keyHex);
      setKey(k);
      // share to peer
      socket?.emit('share_key', { peerId, keyHex: res.data.keyHex, qber: res.data.qber, eveDetected: res.data.eveDetected });
      alert('Quantum key established');
    } catch (e: any) {
      alert('QKD failed: ' + (e?.message || 'unknown'));
    } finally {
      setLoadingKey(false);
    }
  }

  async function send() {
    if (!input.trim() || !peerId || !key) return;
    try {
      const { encryptedContent, iv } = await encryptMessage(input, key);
      const payload = { content: encryptedContent, iv, timestamp: new Date().toISOString(), recipient: peerId };
      socket?.emit('direct_message', { message: payload });
      setMessages(prev => [...prev, { _id: String(Date.now()), sender: me.id, content: input, iv, timestamp: new Date().toISOString() }]);
      setInput('');
    } catch (e) {
      console.error('[DirectMessaging] send failed', e);
    }
  }

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div className="w-72 border-r bg-gray-50 p-3 space-y-2">
        <div className="font-semibold">Direct Messages</div>
        <div className="space-y-1 max-h-[calc(100vh-100px)] overflow-y-auto">
          {users.map(u => (
            <button key={u._id} onClick={() => selectPeer(u._id)} className={`w-full text-left px-3 py-2 rounded ${peerId===u._id?'bg-purple-100':'hover:bg-gray-100'}`}>
              {u.username}
            </button>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col">
        <div className="h-14 border-b flex items-center justify-between px-4">
          <div className="font-semibold">{users.find(u=>u._id===peerId)?.username || 'Select a user'}</div>
          <div className="flex items-center gap-2">
            <span className={`text-xs ${connected?'text-green-600':'text-red-600'}`}>{connected?'Connected':'Disconnected'}</span>
            <button disabled={!peerId || loadingKey} onClick={startQKD} className="px-3 py-1 text-sm rounded bg-purple-600 text-white disabled:opacity-50">{loadingKey?'Establishing...':'Start QKD'}</button>
          </div>
        </div>
        <div className="flex-1 p-4 space-y-2 overflow-y-auto bg-white">
          {messages.map(m => (
            <div key={m._id} className={`flex ${m.sender===me.id?'justify-end':'justify-start'}`}>
              <div className={`px-3 py-2 rounded-lg ${m.sender===me.id?'bg-purple-500 text-white':'bg-gray-200'}`}>
                <div className="text-sm">{m.content}</div>
                <div className="text-[10px] opacity-70 mt-1">{new Date(m.timestamp).toLocaleTimeString()}</div>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <div className="h-14 border-t flex items-center gap-2 px-3 bg-white">
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter') send(); }} placeholder="Type a message" className="flex-1 border rounded px-3 py-2" />
          <button onClick={send} className="px-4 py-2 rounded bg-purple-600 text-white disabled:opacity-50" disabled={!peerId || !key}>Send</button>
        </div>
      </div>
    </div>
  );
}

async function importKeyFromHex(hex: string): Promise<CryptoKey> {
  const bytes = new Uint8Array(hex.match(/.{1,2}/g)!.map(b => parseInt(b, 16)));
  return crypto.subtle.importKey('raw', bytes, { name: 'AES-GCM' }, false, ['encrypt','decrypt']);
}

async function encryptMessage(text: string, key: CryptoKey) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.encrypt({ name:'AES-GCM', iv }, key, data);
  return { encryptedContent: btoa(String.fromCharCode(...new Uint8Array(buf))), iv: btoa(String.fromCharCode(...iv)) };
}

async function decryptMessage(contentB64: string, ivB64: string, key: CryptoKey) {
  const content = new Uint8Array(atob(contentB64).split('').map(c=>c.charCodeAt(0)));
  const iv = new Uint8Array(atob(ivB64).split('').map(c=>c.charCodeAt(0)));
  const buf = await crypto.subtle.decrypt({ name:'AES-GCM', iv }, key, content);
  return new TextDecoder().decode(buf);
}

