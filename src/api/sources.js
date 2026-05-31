import apiClient from './client';

export const sourcesAPI = {
  getAll: (projectId = null) => apiClient.get('/sources/', { params: projectId ? { project_id: projectId } : {} }),
  getById: (id) => apiClient.get(`/sources/${id}`),
  create: (data) => apiClient.post('/sources/', data),
  delete: (id) => apiClient.delete(`/sources/${id}`),
  analyzeSource: (id) => apiClient.post(`/sources/${id}/analyze`),
  getSourcesByUser: (userId) => apiClient.get(`/sources/user/${userId}`),
  adminDeleteSource: (sourceId) => apiClient.delete(`/sources/admin/${sourceId}`),
  adminPreviewSource: (sourceId) => apiClient.get(`/sources/admin/${sourceId}/preview`),
};