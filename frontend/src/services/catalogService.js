import api from './client';

export const catalogService = {
  medicines: () => api.get('/medicines'),
  procedureTypes: () => api.get('/procedure-types'),
  departments: () => api.get('/departments'),
  users: () => api.get('/admin/users'),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.patch(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
};
