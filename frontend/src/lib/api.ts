import axios from 'axios';

const envBase = import.meta.env.VITE_API_BASE as string | undefined;
// Fallback to localhost:4000 during dev if not provided
const defaultBase = (typeof window !== 'undefined' && window.location.origin.includes('localhost'))
  ? 'http://localhost:4000'
  : 'https://quantum-chat-uoq8.onrender.com';

export const API_BASE = envBase || defaultBase;

const api = axios.create({ baseURL: API_BASE });

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear invalid token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;


