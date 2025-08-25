import ConversationItem from './ConversationItem';

export type Conversation = { peerId: string; title: string; secure: boolean };

export default function Sidebar({ conversations, onSelect, onNew }:{ conversations:Conversation[]; onSelect:(c:Conversation)=>void; onNew:()=>void }) {
  return (
    <div className="w-72 border-r bg-white flex flex-col">
      <div className="p-3 font-semibold">QuantumChat</div>
      <div className="px-3 pb-2"><input placeholder="Search conversations..." className="w-full border rounded px-3 py-2" /></div>
      <div className="flex-1 overflow-auto">
        {conversations.map(c => (
          <ConversationItem key={c.peerId} c={c} onClick={()=>onSelect(c)} />
        ))}
      </div>
      <div className="p-3">
        <button onClick={onNew} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded">New Quantum Chat</button>
      </div>
    </div>
  );
}


