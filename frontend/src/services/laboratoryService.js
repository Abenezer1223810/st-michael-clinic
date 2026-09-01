import api from './client';

export const laboratoryService = {
  getTests: () => api.get('/laboratory/tests'),
  listRequests: (status) => api.get(`/laboratory/requests${status ? `?status=${status}` : ''}`),
  getRequest: (id) => api.get(`/laboratory/requests/${id}`),
  createRequest: (visitId, testIds) => api.post('/laboratory/requests', { visitId, testIds }),
  collectSample: (id, data) => api.post(`/laboratory/requests/${id}/sample`, data),
  getSample: (id) => api.get(`/laboratory/samples/${id}`),
  listSamples: (requestId) => api.get(`/laboratory/samples${requestId ? `?requestId=${requestId}` : ''}`),
  getResult: (id) => api.get(`/laboratory/requests/${id}/result`),
  enterResults: (id, results) => api.post(`/laboratory/requests/${id}/results`, { results }),
  verifyResult: (id) => api.post(`/laboratory/requests/${id}/verify`),
  releaseResult: (id) => api.post(`/laboratory/requests/${id}/release`),
  completeRequest: (id) => api.post(`/laboratory/requests/${id}/complete`),
  
  // Analyzer Devices & Simulator
  listDevices: () => api.get('/laboratory/devices'),
  getDevice: (id) => api.get(`/laboratory/devices/${id}`),
  createDevice: (data) => api.post('/laboratory/devices', data),
  updateDevice: (id, data) => api.patch(`/laboratory/devices/${id}`, data),
  deleteDevice: (id) => api.delete(`/laboratory/devices/${id}`),
  ingestAnalyzerResults: (rawPayload) => api.post('/laboratory/devices/ingest', rawPayload),
  runSimulator: (data) => api.post('/laboratory/simulator/run', data),
};
