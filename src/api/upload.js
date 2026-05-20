import apiClient from './client';

export const uploadAPI = {
  uploadCSV: (file, sourceName) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('source_name', sourceName);
    return apiClient.post('/upload/csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  uploadXML: (file, sourceName) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('source_name', sourceName);
    return apiClient.post('/upload/xml', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  uploadExcel: (file, sourceName, sheetName = 0) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('source_name', sourceName);
    formData.append('sheet_name', sheetName);
    return apiClient.post('/upload/excel', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};