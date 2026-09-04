import api from './client';

export const patientService = {
  list: (q = '') => api.get(`/patients${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  get: (id) => api.get(`/patients/${id}`),
  create: (data) => api.post('/patients', data),
  history: (id) => api.get(`/patients/${id}/history`),
  timeline: (id) => api.get(`/patients/${id}/timeline`),
  renewCard: (id) => api.post(`/patients/${id}/renew-card`),
};
