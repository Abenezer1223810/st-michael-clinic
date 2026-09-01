import api from './client';

export const prescriptionService = {
  list: (patientId, status) => {
    const params = new URLSearchParams();
    if (patientId) params.append('patientId', patientId);
    if (status) params.append('status', status);
    const qs = params.toString();
    return api.get(`/prescriptions${qs ? `?${qs}` : ''}`);
  },
  get: (id) => api.get(`/prescriptions/${id}`),
  create: (visitId, medicines) => api.post('/prescriptions', { visitId, medicines }),
  dispense: (id, { items, notes }) => api.post(`/prescriptions/${id}/dispense`, { items, notes }),
};
