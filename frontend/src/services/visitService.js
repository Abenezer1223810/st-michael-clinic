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
  getClosureCheck: (id) => api.get(`/visits/${id}/closure-check`),
  close: (id, data) => api.post(`/visits/${id}/close`, data),
  getSummary: (id) => api.get(`/visits/${id}/summary`),
  timeline: (id) => api.get(`/visits/${id}/timeline`),
};
