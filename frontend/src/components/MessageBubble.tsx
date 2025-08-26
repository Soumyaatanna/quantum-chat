import React from 'react';

export default function MessageBubble({ mine, text, time, sender }:{ mine:boolean; text:string; time:string; sender?:string }) {
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-md ${mine ? 'ml-auto' : 'mr-auto'}`}>
        {/* Sender name for incoming messages */}
        {!mine && sender && (
          <div className="text-xs text-gray-600 mb-1 ml-1 font-medium">{sender}</div>
        )}
        
        {/* Message bubble */}
        <div className={`px-4 py-2 rounded-2xl ${
          mine 
            ? 'bg-green-500 text-white rounded-br-md' 
            : 'bg-white text-gray-800 border rounded-bl-md shadow-sm'
        }`}>
          <div className="text-sm leading-relaxed">{text}</div>
        </div>
        
        {/* Time and encryption info */}
        <div className={`text-xs mt-1 px-1 ${
          mine ? 'text-gray-500 text-right' : 'text-gray-500'
        }`}>
          {time} • AES-256-GCM
        </div>
      </div>
    </div>
  );
}


