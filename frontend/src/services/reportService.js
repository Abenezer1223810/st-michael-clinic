import api from './client';

export const reportService = {
  dashboard: () => api.get('/dashboard'),
  dailyPatients: (date) => api.get(`/reports/daily-patients${date ? `?date=${date}` : ''}`),
  opd: (date) => api.get(`/reports/opd${date ? `?date=${date}` : ''}`),
  laboratory: (date) => api.get(`/reports/laboratory${date ? `?date=${date}` : ''}`),
  procedures: (date) => api.get(`/reports/procedures${date ? `?date=${date}` : ''}`),
  prescriptions: (date) => api.get(`/reports/prescriptions${date ? `?date=${date}` : ''}`),
  revenue: (date) => api.get(`/reports/revenue${date ? `?date=${date}` : ''}`),
  labWorkload: (date) => api.get(`/reports/lab-workload${date ? `?date=${date}` : ''}`),
  patientHistory: (patientId) => api.get(`/reports/patient-history/${patientId}`),
  visitSummary: (visitId) => api.get(`/reports/visit-summary/${visitId}`),
};
