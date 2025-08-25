import { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import QKDModal from '../components/QKDModal';
import Sidebar, { Conversation } from '../components/Sidebar';
import ChatHeader from '../components/ChatHeader';
import MessageBubble from '../components/MessageBubble';

const apiBase = import.meta.env.VITE_API_BASE as string;
const wsBase = import.meta.env.VITE_WS_BASE as string || apiBase?.replace('http', 'ws');

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
  return { iv: Buffer.from(iv).toString('hex'), ciphertext: Buffer.from(ct).toString('base64') };
}

async function decryptAesGcm(key: CryptoKey, ivHex: string, ciphertextB64: string) {
  const dec = new TextDecoder();
  const iv = new Uint8Array(ivHex.match(/.{1,2}/g)!.map(x => parseInt(x, 16)));
  const data = Uint8Array.from(atob(ciphertextB64), c => c.charCodeAt(0));
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
  return dec.decode(pt);
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

  const socket = useMemo(()=> io(wsBase, { transports: ['websocket'] }), []);
  const keyRef = useRef<CryptoKey | null>(null);

  const userId = localStorage.getItem('userId')!;
  const token = localStorage.getItem('token')!;

  const roomId = useMemo(()=> peerId ? [userId, peerId].sort().join(':') : '', [peerId, userId]);

  useEffect(()=>{
    if (!roomId) return;
    socket.emit('join', { roomId });
  }, [roomId]);

  useEffect(()=>{
    socket.on('chat', async ({ message }) => {
      if (!keyRef.current) return;
      try {
        const plaintext = await decryptAesGcm(keyRef.current, message.iv, message.ciphertext);
        setMessages(prev => [...prev, { ...message, plaintext }]);
      } catch {}
    });
    return () => { socket.off('chat'); };
  }, []);

  async function loadHistory() {
    if (!peerId) return;
    const res = await axios.get(`${apiBase}/api/messages/${peerId}`, { headers: { Authorization: `Bearer ${token}`}});
    const key = keyRef.current;
    const enriched = await Promise.all(res.data.map(async (m: any) => {
      try {
        if (key) {
          const plaintext = await decryptAesGcm(key, m.iv, m.ciphertext);
          return { ...m, plaintext };
        }
      } catch {}
      return m;
    }));
    setMessages(enriched);
  }

  async function send() {
    if (!text || !keyRef.current || !peerId) return;
    const { iv, ciphertext } = await encryptAesGcm(keyRef.current, text);
    const payload = { receiver: peerId, iv, ciphertext };
    const saved = await axios.post(`${apiBase}/api/messages`, payload, { headers: { Authorization: `Bearer ${token}`}});
    setMessages(prev => [...prev, { ...saved.data, plaintext: text }]);
    socket.emit('chat', { roomId, message: saved.data });
    setText('');
  }

  function onKey(hex: string, qberVal: number, eveDet: boolean) {
    setKeyHex(hex); setQber(qberVal); setEveDetected(eveDet);
    importKeyFromHex(hex).then(k => { keyRef.current = k; loadHistory(); });
  }

  function startNewChat() {
    const id = prompt('Enter peer userId');
    if (!id) return;
    setPeerId(id);
    setConversations(prev => {
      if (prev.find(p => p.peerId === id)) return prev;
      return [...prev, { peerId: id, title: `User ${id}`, secure: !!keyHex }];
    });
  }

  return (
    <div className="h-screen flex">
      <Sidebar conversations={conversations} onSelect={(c)=>{ setPeerId(c.peerId); loadHistory(); }} onNew={startNewChat} />
      <div className="flex-1 flex flex-col">
        <ChatHeader title={peerId ? `User ${peerId}`:'Select a chat'} secure={!!keyHex} qber={qber} eveDetected={eveDetected} />
        <div className="px-3 py-2 bg-gray-50 flex items-center gap-3 border-b">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={eve} onChange={e=>setEve(e.target.checked)} />Eve attack</label>
          <button onClick={()=> setShowQKD(true)} className="px-3 py-1.5 bg-green-600 text-white rounded">Start QKD</button>
          <button onClick={loadHistory} className="px-3 py-1.5 border rounded">Load History</button>
        </div>
        <div className="flex-1 overflow-auto p-4 space-y-2 bg-gray-100">
          {messages.map((m, i)=> (
            <MessageBubble key={i} mine={m.sender===userId} text={m.plaintext ?? '[encrypted]'} time={new Date(m.createdAt||Date.now()).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} />
          ))}
        </div>
        <div className="p-3 bg-white flex gap-2 border-t">
          <input value={text} onChange={e=>setText(e.target.value)} placeholder="Type a quantum-secured message..." className="border flex-1 p-2 rounded" />
          <button onClick={send} className="px-3 py-2 bg-indigo-600 text-white rounded">Send</button>
        </div>
      </div>
      <QKDModal open={showQKD} onClose={()=>setShowQKD(false)} setSessionKey={onKey} eveEnabled={eve} />
    </div>
  );
}


