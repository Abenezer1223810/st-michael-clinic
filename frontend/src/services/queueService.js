import api from './client';

export const queueService = {
  list: (status) => api.get(`/queue${status ? `?status=${status}` : ''}`),
  add: (visitId) => api.post('/queue', { visitId }),
  updateStatus: (id, status) => api.patch(`/queue/${id}/status`, { status }),
};
