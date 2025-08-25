export default function ChatHeader({ title, secure, qber, eveDetected }:{ title:string; secure:boolean; qber:number; eveDetected:boolean }) {
  return (
    <div className="px-4 py-3 bg-white border-b flex items-center gap-3">
      <div className="text-lg font-semibold">{title}</div>
      <div className="ml-auto flex items-center gap-2 text-sm">
        <span className={`h-2 w-2 rounded-full ${secure ? 'bg-green-500':'bg-gray-300'}`}></span>
        <span>{secure ? 'Online • Quantum Secured':'Offline'}</span>
      </div>
      {secure && (
        <div className="w-full absolute left-0 right-0 top-14 flex justify-center pointer-events-none">
          <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs shadow">
            Quantum key established – Chat is now secure{Number.isFinite(qber) ? ` • QBER ${(qber*100).toFixed(1)}%` : ''}{eveDetected ? ' • Eve detected':''}
          </div>
        </div>
      )}
    </div>
  );
}


