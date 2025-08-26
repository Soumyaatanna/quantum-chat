import React from 'react';

export default function ChatHeader({ title, secure, qber, eveDetected }: { 
  title: string; 
  secure: boolean; 
  qber: number; 
  eveDetected: boolean; 
}) {
  return (
    <div className="px-6 py-4 bg-white border-b flex items-center justify-between">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
          {title.charAt(0).toUpperCase()}
        </div>
        
        {/* Contact Info */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <div className="flex items-center gap-2 mt-1">
            {secure ? (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Secure
              </span>
            ) : (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full flex items-center gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                Insecure
              </span>
            )}
            
            {secure && qber > 0 && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                QBER: {(qber * 100).toFixed(1)}%
              </span>
            )}
            
            {eveDetected && (
              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full flex items-center gap-1">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                Eve Detected!
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Status */}
      <div className="text-sm text-gray-500">
        {secure ? '🔒 Quantum Secured' : '🔓 Not Secured'}
      </div>
    </div>
  );
}


