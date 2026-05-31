import apiClient from './client';

export const correctionsAPI = {
  getAll: (filters = {}) =>
    apiClient.get('/corrections/', { params: filters }),

  approve: (id, comment = null) =>
    apiClient.put(`/corrections/${id}/approve`, { comment }),

  reject: (id, comment = null) =>
    apiClient.put(`/corrections/${id}/reject`, { comment }),

  updateValue: (id, suggestedValue) =>
    apiClient.put(`/corrections/${id}/update-value`, { suggested_value: suggestedValue }),
};