import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function submit(e: any) {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE}/api/auth/signup`, { username, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('username', res.data.user.username);
      localStorage.setItem('userId', res.data.user.id);
      navigate('/chat');
    } catch (err: any) {
      setError('Register failed');
    }
  }

  return (
    <div className="h-full flex items-center justify-center p-4">
      <form onSubmit={submit} className="max-w-sm w-full bg-white shadow p-6 rounded space-y-4">
        <h1 className="text-2xl font-semibold">Register</h1>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="Username" className="w-full border p-2 rounded" />
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" className="w-full border p-2 rounded" />
        <button className="w-full bg-blue-600 text-white py-2 rounded">Create Account</button>
        <div className="text-sm">Have an account? <Link className="text-blue-600" to="/login">Login</Link></div>
      </form>
    </div>
  );
}


