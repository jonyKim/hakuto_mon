import axios from 'axios';
import { getAuthCookie } from '@/lib/auth';

export const apiClient = axios.create({
  baseURL: process.env.API_BASE_URL || 'http://localhost:3001',
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  const token = getAuthCookie();
  if (token) {
    console.log('token', token);
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}); 