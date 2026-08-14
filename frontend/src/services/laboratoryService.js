import api from './client';

export const laboratoryService = {
  getTests: () => api.get('/laboratory/tests'),
  listRequests: (status) => api.get(`/laboratory/requests${status ? `?status=${status}` : ''}`),
  getRequest: (id) => api.get(`/laboratory/requests/${id}`),
  createRequest: (visitId, testIds) => api.post('/laboratory/requests', { visitId, testIds }),
  getResult: (id) => api.get(`/laboratory/requests/${id}/result`),
  enterResults: (id, results) => api.post(`/laboratory/requests/${id}/results`, { results }),
  verifyResult: (id) => api.post(`/laboratory/requests/${id}/verify`),
  completeRequest: (id) => api.post(`/laboratory/requests/${id}/complete`),
};
