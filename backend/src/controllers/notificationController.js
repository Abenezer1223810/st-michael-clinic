import { db } from '../db/index.js';

export const listNotifications = async (req, res) => {
  try {
    const unreadOnly = req.query.unread === 'true';
    const notifications = await db.listNotifications(req.user, unreadOnly);
    const unreadCount = notifications.filter((n) => !n.read).length;
    res.json({ notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const notification = await db.markNotificationAsRead(req.params.id, req.user);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found.' });
    }
    res.json({ notification, message: 'Notification marked as read.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const count = await db.markAllNotificationsAsRead(req.user);
    res.json({ count, message: 'All notifications marked as read.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const clearNotifications = async (req, res) => {
  try {
    await db.clearNotifications(req.user);
    res.json({ message: 'Notifications cleared.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
