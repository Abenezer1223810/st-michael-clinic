import api from './client';

export const catalogService = {
  // Catalogs
  catalog: () => api.get('/admin/catalog'),
  medicines: () => api.get('/medicines'),
  procedureTypes: () => api.get('/procedure-types'),
  departments: () => api.get('/departments'),
  labTests: () => api.get('/admin/catalog/lab-tests'),

  // Lab tests management
  createLabTest: (data) => api.post('/admin/catalog/lab-tests', data),
  updateLabTest: (id, data) => api.patch(`/admin/catalog/lab-tests/${id}`, data),
  deleteLabTest: (id) => api.delete(`/admin/catalog/lab-tests/${id}`),

  // Medicines management
  createMedicine: (data) => api.post('/admin/catalog/medicines', data),
  updateMedicine: (id, data) => api.patch(`/admin/catalog/medicines/${id}`, data),
  deleteMedicine: (id) => api.delete(`/admin/catalog/medicines/${id}`),

  // Procedure types management
  createProcedureType: (data) => api.post('/admin/catalog/procedure-types', data),
  updateProcedureType: (id, data) => api.patch(`/admin/catalog/procedure-types/${id}`, data),
  deleteProcedureType: (id) => api.delete(`/admin/catalog/procedure-types/${id}`),

  // Departments management
  createDepartment: (name) => api.post('/admin/catalog/departments', { name }),
  deleteDepartment: (name) => api.delete(`/admin/catalog/departments/${encodeURIComponent(name)}`),

  // Users & Staff
  users: () => api.get('/admin/users'),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.patch(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),

  // Audit Logs
  auditLogs: (limit = 100) => api.get(`/admin/audit-logs?limit=${limit}`),

  // Recycle Bin
  recycleBin: () => api.get('/admin/recycle-bin'),
  restoreRecycleItem: (id) => api.post(`/admin/recycle-bin/${id}/restore`),
  purgeRecycleItem: (id) => api.delete(`/admin/recycle-bin/${id}`),
  emptyRecycleBin: () => api.delete('/admin/recycle-bin'),
};
