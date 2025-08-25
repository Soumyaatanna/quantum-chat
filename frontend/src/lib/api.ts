import axios from 'axios';

const envBase = import.meta.env.VITE_API_BASE as string | undefined;
// Fallback to localhost:4000 during dev if not provided
const defaultBase = (typeof window !== 'undefined' && window.location.origin.includes('localhost'))
  ? 'http://localhost:4000'
  : window.location.origin;

export const API_BASE = envBase || defaultBase;

const api = axios.create({ baseURL: API_BASE });

export default api;


