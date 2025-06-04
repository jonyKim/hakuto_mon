import axios from 'axios';
import { API_BASE_URL } from '@/config';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// axios 요청 인터셉터 추가
axiosInstance.interceptors.request.use(request => {
    // 쿠키에서 토큰 가져오기
    const cookies = document.cookie.split(';');
    const authToken = cookies
        .find(cookie => cookie.trim().startsWith('auth-token='))
        ?.split('=')[1];

    if (authToken) {
        request.headers['Authorization'] = `Bearer ${authToken}`;
    }

    console.log('Request headers:', request.headers);
    console.log('Request withCredentials:', request.withCredentials);
    return request;
});

export default axiosInstance; 