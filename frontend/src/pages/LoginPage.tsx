import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { API_BASE } from '../lib/api';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function submit(e: any) {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      console.log('[Login] Attempting login for:', username);
      const res = await api.post(`/api/auth/login`, { username, password });
      console.log('[Login] Success, token received');
      
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('username', res.data.user.username);
      localStorage.setItem('userId', res.data.user.id);
      
      console.log('[Login] Stored in localStorage, navigating to /dashboard');
      // Force a page reload to ensure App component picks up the new token
      window.location.href = '/dashboard';
    } catch (err: any) {
      console.error('[Login] Error:', err);
      const status = err?.response?.status;
      const detail = err?.response?.data?.error || err?.message || 'Login failed';
      setError(`Login failed (${status}): ${detail}\nBase: ${API_BASE}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-full flex items-center justify-center p-4">
      <form onSubmit={submit} className="max-w-sm w-full bg-white shadow p-6 rounded space-y-4">
        <h1 className="text-2xl font-semibold">Login</h1>
        {error && <div className="text-red-600 text-sm whitespace-pre-wrap">{error}</div>}
        <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="Username" className="w-full border p-2 rounded" />
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" className="w-full border p-2 rounded" />
        <button disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50">
          {loading ? 'Logging in...' : 'Login'}
        </button>
        <div className="text-sm">No account? <Link className="text-blue-600" to="/register">Register</Link></div>
      </form>
    </div>
  );
}


