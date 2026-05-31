import client from './client';

export const notificationsAPI = {
  getAll:       ()   => client.get('/notifications/'),
  markAsRead:   (id) => client.put(`/notifications/${id}/read`),
  markAllRead:  ()   => client.put('/notifications/read-all'),
  delete:       (id) => client.delete(`/notifications/${id}`),
  clearAll:     ()   => client.delete('/notifications/'),
};