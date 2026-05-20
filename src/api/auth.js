import apiClient from './client';

export const authAPI = {
  login: (email, password) =>
    apiClient.post('/auth/login', { email, password }),
  
    register: (username, email, password) =>
    apiClient.post('/auth/register', { username, email, password }),    
  
  me: () => apiClient.get('/auth/me'),
  forgotPassword: (email) =>
  apiClient.post('/auth/forgot-password', { email }),

resetPassword: (token, new_password) =>
  apiClient.post('/auth/reset-password', { token, new_password }),
};
