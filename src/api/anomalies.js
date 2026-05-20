import apiClient from './client';

export const anomaliesAPI = {
  // Analyser un dataset
  analyzeDataset: (datasetId, config) =>
    apiClient.post(`/anomalies/analyze/dataset/${datasetId}`, config),

  // Analyser des records directs
  analyze: (records, config) =>
    apiClient.post('/anomalies/analyze', { records, config }),

  // Lister les anomalies avec pagination + filtres
  getAll: (filters = {}) =>
    apiClient.get('/anomalies/', { params: filters }),

  // Totaux par type pour les stats cards
  getCounts: (filters = {}) =>
    apiClient.get('/anomalies/counts', { params: filters }),

  // Détails d'une anomalie
  getById: (id) =>
    apiClient.get(`/anomalies/${id}`),

  // Changer le statut
  updateStatus: (id, status) =>
    apiClient.put(`/anomalies/${id}/status`, { status }),
};