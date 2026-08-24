import api from './client';

export const demoService = {
  start: () => api.post('/demo/start'),
  reset: () => api.post('/demo/reset'),
};
