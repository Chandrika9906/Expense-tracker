import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const profileService = {
  getProfile: () => api.get('/profile'),
  getCurrentSession: () => api.get('/profile/sessions/current'),
  
  updateProfile: (data) => api.put('/profile', data),
  
  changePassword: (data) => api.put('/profile/password', data),
  
  uploadImage: (formData) => api.post('/profile/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  toggle2FA: (enabled) => api.put('/profile/2fa', { enabled })
};

export default profileService;