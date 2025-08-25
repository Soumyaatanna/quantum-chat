import ConversationItem from './ConversationItem';

export type Conversation = { peerId: string; title: string; secure: boolean };

export default function Sidebar({ conversations, onSelect, onNew }:{ conversations:Conversation[]; onSelect:(c:Conversation)=>void; onNew:()=>void }) {
  return (
    <div className="w-72 border-r bg-white flex flex-col">
      <div className="p-3 font-semibold text-lg text-indigo-700">QuantumChat</div>
      <div className="px-3 pb-2">
        <input 
          placeholder="Search conversations..." 
          className="w-full border rounded px-3 py-2 text-sm" 
        />
      </div>
      <div className="flex-1 overflow-auto">
        {conversations.length === 0 ? (
          <div className="text-center text-gray-500 mt-8 px-4">
            <p>No users available</p>
            <p className="text-sm mt-1">Users will appear here once they register</p>
          </div>
        ) : (
          conversations.map(c => (
            <ConversationItem key={c.peerId} c={c} onClick={()=>onSelect(c)} />
          ))
        )}
      </div>
      <div className="p-3 border-t">
        <button onClick={onNew} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded font-medium">
          New Quantum Chat
        </button>
      </div>
    </div>
  );
}


