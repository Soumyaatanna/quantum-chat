import { useEffect, useState } from 'react';
import axios from 'axios';

type QKDStep = { name: string; detail: string; qber?: number; eveDetected?: boolean };

export default function QKDModal({ open, onClose, setSessionKey, eveEnabled }:{ open:boolean; onClose:()=>void; setSessionKey:(hex:string, qber:number, eve:boolean)=>void; eveEnabled:boolean }) {
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState<QKDStep[]>([]);
  const [keyHex, setKeyHex] = useState('');
  const [qber, setQber] = useState(0);
  const [eveDetected, setEveDetected] = useState(false);

  useEffect(()=>{
    async function run() {
      setLoading(true);
      try {
        const res = await axios.post(`${import.meta.env.VITE_API_BASE}/api/qkd/bb84`, { numPhotons: 128, eve: eveEnabled });
        setSteps(res.data.steps);
        setKeyHex(res.data.keyHex);
        setQber(res.data.qber);
        setEveDetected(res.data.eveDetected);
      } finally {
        setLoading(false);
      }
    }
    if (open) run();
  }, [open, eveEnabled]);

  function accept() {
    setSessionKey(keyHex, qber, eveDetected);
    onClose();
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white max-w-lg w-full rounded shadow p-4 space-y-3">
        <h2 className="text-xl font-semibold">Key Exchange Simulation (BB84)</h2>
        {loading && <div>Simulating…</div>}
        <div className="max-h-64 overflow-auto space-y-2">
          {steps.map((s, i)=>(
            <div key={i} className="border rounded p-2">
              <div className="font-medium">{s.name}</div>
              <div className="text-sm text-gray-700">{s.detail}</div>
              {s.qber!==undefined && <div className="text-sm">QBER: {(s.qber*100).toFixed(2)}%</div>}
              {s.eveDetected!==undefined && <div className="text-sm">Eve detected: {s.eveDetected? 'Yes':'No'}</div>}
            </div>
          ))}
        </div>
        <div className="text-sm break-all">Key (hex): {keyHex || '—'}</div>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-3 py-1 border rounded">Cancel</button>
          <button onClick={accept} disabled={!keyHex} className="px-3 py-1 bg-green-600 text-white rounded">Use Key</button>
        </div>
      </div>
    </div>
  );
}


