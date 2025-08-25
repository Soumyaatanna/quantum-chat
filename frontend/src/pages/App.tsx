import React, { useEffect, useState } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import ChatPage from './ChatPage';
import HomePage from './HomePage';

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  useEffect(() => {
    console.log('[App] Component mounted, token:', token ? 'present' : 'null');
    const handleStorageChange = () => {
      const newToken = localStorage.getItem('token');
      console.log('[App] Token changed:', newToken ? 'present' : 'null');
      setToken(newToken);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/chat" element={token ? <ChatPage /> : <Navigate to="/login" />} />
      <Route path="*" element={<Navigate to={token ? '/chat' : '/'} />} />
    </Routes>
  );
}

export default App;


