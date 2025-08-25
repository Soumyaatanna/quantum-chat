import { Conversation } from './Sidebar';

export default function ConversationItem({ c, onClick }:{ c:Conversation; onClick:()=>void }) {
  return (
    <button onClick={onClick} className="w-full text-left px-3 py-3 border-b hover:bg-gray-50">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${c.secure?'bg-green-500':'bg-gray-300'}`}></span>
        <div className="font-medium truncate">{c.title}</div>
      </div>
      <div className="text-xs text-gray-500 mt-1">{c.secure ? 'Quantum secured':'Not secured'}</div>
    </button>
  );
}


