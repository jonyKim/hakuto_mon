import axiosInstance from '../axios';

export const login = async (email: string, password: string) => {
  try {
    const { data } = await axiosInstance.post('/api/admin/auth/login', {
      email,
      password
    });
    return data;
  } catch (error) {
    console.error('로그인 API 에러:', error);
    throw error;
  }
};

export const logout = async () => {
  try {
    const { data } = await axiosInstance.post('/api/admin/auth/logout');
    return data;
  } catch (error) {
    console.error('로그아웃 API 에러:', error);
    throw error;
  }
};

export const checkSession = async () => {
  try {
    const { data } = await axiosInstance.get('/api/admin/auth/session');
    return data;
  } catch (error) {
    console.error('세션 체크 API 에러:', error);
    throw error;
  }
}; 