import api from './client';

export const catalogService = {
  medicines: () => api.get('/medicines'),
  procedureTypes: () => api.get('/procedure-types'),
  departments: () => api.get('/departments'),
  users: () => api.get('/users'),
};
