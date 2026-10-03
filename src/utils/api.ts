import axios from 'axios';

export const TOKEN_KEY = 'adminToken';
export const USER_KEY = 'adminUser';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// An expired or revoked token (401 anywhere except the login call itself) ends the session.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLogin = String(error.config?.url || '').includes('/auth/staff/login');
    if (error.response?.status === 401 && !isLogin) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.dispatchEvent(new Event('auth:expired'));
    }
    return Promise.reject(error);
  }
);

export default api;
