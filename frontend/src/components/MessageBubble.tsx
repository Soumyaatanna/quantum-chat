export default function MessageBubble({ mine, text, time }:{ mine:boolean; text:string; time:string }) {
  return (
    <div className={`max-w-lg p-2 rounded ${mine ? 'bg-indigo-600 text-white ml-auto':'bg-gray-100 text-gray-900'}`}>
      <div>{text}</div>
      <div className={`text-[10px] mt-1 ${mine ? 'text-indigo-100':'text-gray-500'}`}>{time} • AES-256</div>
    </div>
  );
}


