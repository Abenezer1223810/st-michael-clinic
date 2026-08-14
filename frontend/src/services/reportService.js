import api from './client';

export const reportService = {
  dashboard: () => api.get('/dashboard'),
  dailyPatients: (date) => api.get(`/reports/daily-patients${date ? `?date=${date}` : ''}`),
  opd: (date) => api.get(`/reports/opd${date ? `?date=${date}` : ''}`),
  laboratory: (date) => api.get(`/reports/laboratory${date ? `?date=${date}` : ''}`),
  procedures: (date) => api.get(`/reports/procedures${date ? `?date=${date}` : ''}`),
  prescriptions: (date) => api.get(`/reports/prescriptions${date ? `?date=${date}` : ''}`),
  resetDemo: () => api.post('/dev/reset'),
};
