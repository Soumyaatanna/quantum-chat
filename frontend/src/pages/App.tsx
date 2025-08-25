import { Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import ChatPage from './ChatPage';
import HomePage from './HomePage';

function App() {
  const token = localStorage.getItem('token');
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


