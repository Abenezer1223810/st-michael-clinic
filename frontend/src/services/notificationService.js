import { api } from './client';

export const notificationService = {
  async getNotifications(unreadOnly = false) {
    const res = await api.get('/notifications', {
      params: unreadOnly ? { unread: 'true' } : {},
    });
    return res.data;
  },

  async markAsRead(id) {
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data;
  },

  async markAllAsRead() {
    const res = await api.post('/notifications/read-all');
    return res.data;
  },

  async clearAll() {
    const res = await api.delete('/notifications/clear');
    return res.data;
  },
};

export default notificationService;
