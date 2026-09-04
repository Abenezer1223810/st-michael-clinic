import api from './client';

export const sickLeaveService = {
  list: (patientId = '') => api.get(`/sick-leaves${patientId ? `?patientId=${patientId}` : ''}`),
  get: (id) => api.get(`/sick-leaves/${id}`),
  create: (data) => api.post('/sick-leaves', data),
};
