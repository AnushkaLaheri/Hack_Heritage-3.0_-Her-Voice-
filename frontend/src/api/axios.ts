import axios from 'axios';

// Centralized Axios instance with baseURL
const api = axios.create({
  baseURL: 'http://127.0.0.1:5000',
});

// Attach JWT from localStorage, if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
