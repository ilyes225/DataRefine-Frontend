import apiClient from './client';

export const correctionsAPI = {
  getAll: (filters = {}) =>
    apiClient.get('/corrections/', { params: filters }),

  approve: (id) =>
    apiClient.put(`/corrections/${id}/approve`),

  reject: (id) =>
    apiClient.put(`/corrections/${id}/reject`),

  updateValue: (id, suggestedValue) =>
    apiClient.put(`/corrections/${id}/update-value`, { suggested_value: suggestedValue }),
};