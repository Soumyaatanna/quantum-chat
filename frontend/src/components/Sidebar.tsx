import React from 'react';

export interface Conversation {
  peerId: string;
  title: string;
  secure: boolean;
  unreadCount: number;
  lastMessage?: string;
  lastMessageTime?: string;
}

export default function Sidebar({ 
  conversations, 
  onSelect, 
  onNew 
}: { 
  conversations: Conversation[]; 
  onSelect: (c: Conversation) => void; 
  onNew: () => void; 
}) {
  if (conversations.length === 0) {
    return (
      <div className="w-80 bg-white border-r flex flex-col">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-800">Chats</h2>
        </div>
        <div className="flex-1 p-8 text-center text-gray-500">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-lg font-medium mb-2">No chats yet</p>
          <p className="text-sm">Register another user to start chatting</p>
        </div>
        <div className="p-4 border-t bg-gray-50">
          <button 
            onClick={onNew} 
            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            New Chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-r flex flex-col">
      <div className="p-4 border-b bg-gray-50">
        <h2 className="text-xl font-semibold text-gray-800">Chats</h2>
      </div>
      <div className="flex-1 overflow-auto">
        {conversations.map((conversation) => (
          <div
            key={conversation.peerId}
            onClick={() => onSelect(conversation)}
            className="p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                    {conversation.title.charAt(0).toUpperCase()}
                  </div>
                  
                  {/* Contact Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{conversation.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      {conversation.secure ? (
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
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Unread Badge */}
              {conversation.unreadCount > 0 && (
                <div className="ml-3">
                  <div className="bg-green-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                    {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t bg-gray-50">
        <button 
          onClick={onNew} 
          className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          New Chat
        </button>
      </div>
    </div>
  );
}


