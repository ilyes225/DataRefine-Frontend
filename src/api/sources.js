import apiClient from './client';

export const sourcesAPI = {
  getAll: () => apiClient.get('/sources/'),
  getById: (id) => apiClient.get(`/sources/${id}`),
  create: (data) => apiClient.post('/sources/', data),
  delete: (id) => apiClient.delete(`/sources/${id}`),
  analyzeSource: (id) => apiClient.post(`/sources/${id}/analyze`),
};