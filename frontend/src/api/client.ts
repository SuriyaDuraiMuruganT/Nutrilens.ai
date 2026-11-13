import axios from 'axios';
import { Capacitor } from '@capacitor/core';

// In native mobile app, point directly to your backend host; in browser, use relative URL or env
export const getBaseUrl = () => {
  const customUrl = localStorage.getItem('nutrilens_server_url');
  if (customUrl && customUrl.trim()) return customUrl.trim();
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (Capacitor.isNativePlatform()) {
    return 'https://nutrilens-app-production.up.railway.app';
  }
  return '';
};

export const apiClient = axios.create({
  baseURL: getBaseUrl(),
  timeout: 180000,
});

apiClient.interceptors.request.use((config) => {
  config.baseURL = getBaseUrl();
  const token = localStorage.getItem('nutrilens_token');
  const userStr = localStorage.getItem('nutrilens_user');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user && user.id) {
        config.headers['X-User-Id'] = String(user.id);
      }
    } catch (e) {
      // Ignore JSON parse errors
    }
  }
  return config;
});

