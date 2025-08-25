import { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import QKDModal from '../components/QKDModal';

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

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 bg-white shadow flex items-center gap-2">
        <div className="font-semibold">Quantum Secure Chat</div>
        <div className="ml-auto flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={eve} onChange={e=>setEve(e.target.checked)} />Eve attack</label>
          {keyHex && <div className="text-sm">QBER: {(qber*100).toFixed(1)}% {eveDetected && <span className="text-red-600">(Eve detected)</span>}</div>}
        </div>
      </div>

      <div className="p-3 flex gap-2 bg-gray-100">
        <input value={peerId} onChange={e=>setPeerId(e.target.value)} placeholder="Peer userId" className="border p-2 rounded w-64" />
        <button onClick={()=> setShowQKD(true)} className="px-3 py-2 bg-green-600 text-white rounded">Start QKD</button>
        <button onClick={loadHistory} className="px-3 py-2 border rounded">Load History</button>
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-2">
        {messages.map((m, i)=> (
          <div key={i} className={`max-w-lg p-2 rounded ${m.sender===userId ? 'bg-blue-100 ml-auto':'bg-white'}`}>
            <div className="text-xs text-gray-500">{m.sender===userId? 'You':'Peer'}</div>
            <div>{m.plaintext ?? '[encrypted]'}</div>
          </div>
        ))}
      </div>

      <div className="p-3 bg-white flex gap-2">
        <input value={text} onChange={e=>setText(e.target.value)} placeholder="Type a message" className="border flex-1 p-2 rounded" />
        <button onClick={send} className="px-3 py-2 bg-blue-600 text-white rounded">Send</button>
      </div>

      <QKDModal open={showQKD} onClose={()=>setShowQKD(false)} setSessionKey={onKey} eveEnabled={eve} />
    </div>
  );
}


