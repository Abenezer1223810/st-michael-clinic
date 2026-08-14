import api from './client';

export const prescriptionService = {
  list: (patientId) => api.get(`/prescriptions${patientId ? `?patientId=${patientId}` : ''}`),
  get: (id) => api.get(`/prescriptions/${id}`),
  create: (visitId, medicines) => api.post('/prescriptions', { visitId, medicines }),
};
