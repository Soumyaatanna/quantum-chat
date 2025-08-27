import React, { useEffect, useState } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import DashboardPage from './DashboardPage';
import HomePage from './HomePage';
import DirectMessaging from '../components/DirectMessaging';

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
      <Route path="/dashboard" element={token ? <DashboardPage /> : <Navigate to="/login" />} />
      <Route path="/direct" element={token ? <DirectMessaging /> : <Navigate to="/login" />} />
      <Route path="*" element={<Navigate to={token ? '/dashboard' : '/'} />} />
    </Routes>
  );
}

export default App;


