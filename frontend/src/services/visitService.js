import api from './client';

export const visitService = {
  list: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) qs.set(k, v);
    });
    const s = qs.toString();
    return api.get(`/visits${s ? `?${s}` : ''}`);
  },
  get: (id) => api.get(`/visits/${id}`),
  create: (data) => api.post('/visits', data),
};
