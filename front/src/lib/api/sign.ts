import axiosInstance from '@/lib/axios';

export const login = async (email: string, password: string) => {
  const response = await axiosInstance.post('/api/admin/auth/login', 
    { email, password },
    { withCredentials: true }
  );
  return response.data;
};

export const logout = async () => {
  const response = await axiosInstance.post('/api/admin/auth/logout', 
    {},
    { withCredentials: true }
  );
  return response.data;
};

export const checkSession = async () => {
  const response = await axiosInstance.get('/api/admin/auth/session', 
    { withCredentials: true }
  );
  return response.data;
};