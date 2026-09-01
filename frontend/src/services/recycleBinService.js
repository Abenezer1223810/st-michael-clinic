import api from './client';

export const recycleBinService = {
  list: (params = {}) => api.get('/recycle-bin', { params }),
  restore: (id) => api.post(`/recycle-bin/${id}/restore`),
  purge: (id) => api.delete(`/recycle-bin/${id}`),
  empty: () => api.delete('/recycle-bin/empty'),
};
