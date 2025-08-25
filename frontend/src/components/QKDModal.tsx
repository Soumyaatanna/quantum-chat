import React, { useEffect, useState } from 'react';
import api, { API_BASE } from '../lib/api';

type QKDStep = { name: string; detail: string; qber?: number; eveDetected?: boolean };

export default function QKDModal({ open, onClose, setSessionKey, eveEnabled }: { 
  open: boolean; 
  onClose: () => void; 
  setSessionKey: (hex: string, qber: number, eve: boolean) => void; 
  eveEnabled: boolean 
}) {
  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState<QKDStep[]>([]);
  const [keyHex, setKeyHex] = useState('');
  const [qber, setQber] = useState(0);
  const [eveDetected, setEveDetected] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function run() {
      if (!open) return;
      
      setLoading(true);
      setError('');
      try {
        console.log('[QKDModal] Starting BB84 simulation, Eve enabled:', eveEnabled);
        const res = await api.post(`/api/qkd/bb84`, { numPhotons: 128, eve: eveEnabled });
        console.log('[QKDModal] BB84 simulation completed:', res.data);
        
        setSteps(res.data.steps);
        setKeyHex(res.data.keyHex);
        setQber(res.data.qber);
        setEveDetected(res.data.eveDetected);
      } catch (err: any) {
        console.error('[QKDModal] BB84 simulation failed:', err);
        setError(`QKD simulation failed: ${err?.response?.data?.error || err?.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    }
    
    run();
  }, [open, eveEnabled]);

  function accept() {
    console.log('[QKDModal] Accepting key:', keyHex.substring(0, 16) + '...');
    setSessionKey(keyHex, qber, eveDetected);
    onClose();
  }

  if (!open) return null;
  
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white max-w-lg w-full rounded shadow p-4 space-y-3">
        <h2 className="text-xl font-semibold">Key Exchange Simulation (BB84)</h2>
        
        {error && (
          <div className="text-red-600 text-sm p-2 bg-red-50 rounded border">
            {error}
          </div>
        )}
        
        {loading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <div className="mt-2 text-sm text-gray-600">Simulating quantum key exchange...</div>
          </div>
        )}
        
        <div className="max-h-64 overflow-auto space-y-2">
          {steps.map((s, i) => (
            <div key={i} className="border rounded p-2">
              <div className="font-medium">{s.name}</div>
              <div className="text-sm text-gray-700">{s.detail}</div>
              {s.qber !== undefined && (
                <div className="text-sm text-blue-600">QBER: {(s.qber * 100).toFixed(2)}%</div>
              )}
              {s.eveDetected !== undefined && (
                <div className={`text-sm ${s.eveDetected ? 'text-red-600' : 'text-green-600'}`}>
                  Eve detected: {s.eveDetected ? 'Yes' : 'No'}
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="text-sm break-all bg-gray-50 p-2 rounded">
          <div className="font-medium">Generated Key:</div>
          <div className="font-mono text-xs">{keyHex || '—'}</div>
        </div>
        
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-3 py-1 border rounded hover:bg-gray-50">
            Cancel
          </button>
          <button 
            onClick={accept} 
            disabled={!keyHex || loading} 
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            Use Key
          </button>
        </div>
      </div>
    </div>
  );
}


