import api from './client';

export const opdService = {
  queue: () => api.get('/opd/queue'),
  getConsultation: (id) => api.get(`/consultations/${id}`),
  startConsultation: (visitId, vitals = {}) => api.post('/consultations', { visitId, vitals }),
  saveConsultation: (id, data) => api.patch(`/consultations/${id}`, data),
  completeConsultation: (id) => api.post(`/consultations/${id}/complete`),
  consultationsByPatient: (patientId) => api.get(`/consultations/patient/${patientId}`),
};
