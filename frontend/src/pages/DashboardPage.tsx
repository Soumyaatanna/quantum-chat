import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, MessageCircle, BookOpen, LogOut, User } from 'lucide-react';
import QKDSimulation from '../components/QKDSimulation';
import SecureMessaging from '../components/SecureMessaging';
import InteractiveLearning from '../components/InteractiveLearning';

const tabs = [
  {
    id: 'qkd',
    name: 'Quantum Key Distribution',
    icon: Shield,
    description: 'Simulate BB84 protocol for secure key exchange using quantum mechanics principles.'
  },
  {
    id: 'messaging',
    name: 'Secure Messaging',
    icon: MessageCircle,
    description: 'Real-time chat with messages encrypted using quantum-derived AES keys.'
  },
  {
    id: 'learning',
    name: 'Interactive Learning',
    icon: BookOpen,
    description: 'Step-by-step visualization of quantum cryptography concepts.'
  }
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('qkd');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    window.location.href = '/login';
  };

  const username = localStorage.getItem('username') || 'User';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/10 backdrop-blur-md border-b border-white/20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">Quantum Secure Chat</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-white/80">
                <User className="w-4 h-4" />
                <span>{username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Feature Cards */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          {tabs.map((tab, index) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <motion.div
                key={tab.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 + index * 0.1 }}
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative cursor-pointer bg-white rounded-xl p-6 shadow-lg transition-all duration-300
                  ${isActive 
                    ? 'ring-2 ring-purple-500 bg-gradient-to-br from-purple-50 to-blue-50' 
                    : 'hover:shadow-xl hover:bg-gray-50'
                  }
                `}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`
                    w-10 h-10 rounded-lg flex items-center justify-center
                    ${isActive 
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500' 
                      : 'bg-gray-100'
                    }
                  `}>
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-600'}`} />
                  </div>
                  <h3 className={`font-semibold ${isActive ? 'text-purple-700' : 'text-gray-800'}`}>
                    {tab.name}
                  </h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {tab.description}
                </p>
                
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-b-xl"
                  />
                )}
              </motion.div>
            );
          })}
        </motion.div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl shadow-lg overflow-hidden"
        >
          <AnimatePresence mode="wait">
            {activeTab === 'qkd' && <QKDSimulation key="qkd" />}
            {activeTab === 'messaging' && <SecureMessaging key="messaging" />}
            {activeTab === 'learning' && <InteractiveLearning key="learning" />}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

