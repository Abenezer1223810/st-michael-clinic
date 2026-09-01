import api from './client';

export const injectionService = {
  list: (patientId, status) => {
    const params = new URLSearchParams();
    if (patientId) params.append('patientId', patientId);
    if (status) params.append('status', status);
    const qs = params.toString();
    return api.get(`/injections${qs ? `?${qs}` : ''}`);
  },
  get: (id) => api.get(`/injections/${id}`),
  create: (data) => api.post('/injections', data),
  administer: (id, adminData) => api.post(`/injections/${id}/administer`, adminData),
};

