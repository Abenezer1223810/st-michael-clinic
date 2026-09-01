import api from './client';

export const queueService = {
  list: (status) => api.get(`/queue${status ? `?status=${status}` : ''}`),
  add: (visitId, priority = 'NORMAL') => api.post('/queue', { visitId, priority }),
  updateStatus: (id, status) => api.patch(`/queue/${id}/status`, { status }),
};
