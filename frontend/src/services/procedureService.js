import api from './client';

export const procedureService = {
  list: (status) => api.get(`/procedures${status ? `?status=${status}` : ''}`),
  get: (id) => api.get(`/procedures/${id}`),
  create: (visitId, procedureType, notes) => api.post('/procedures', { visitId, procedureType, notes }),
  updateStatus: (id, status) => api.patch(`/procedures/${id}/status`, { status }),
  record: (id, data) => api.post(`/procedures/${id}/record`, data),
};
