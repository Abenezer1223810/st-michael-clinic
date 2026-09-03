import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  FlaskConical,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  Trash2,
  ExternalLink,
  Clock,
  Info,
} from 'lucide-react';
import { notificationService } from '../../services/notificationService';
import { formatDateTime } from '../../utils/format';

export function NotificationBell() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const popoverRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (_) {
      // Background poll failure
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (_) {}
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (_) {}
  };

  const handleClearAll = async () => {
    try {
      await notificationService.clearAll();
      setNotifications([]);
      setUnreadCount(0);
    } catch (_) {}
  };

  const handleItemClick = async (notif) => {
    if (!notif.read) {
      await handleMarkAsRead(notif.id);
    }
    setOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'LAB_ORDER_CREATED':
        return <FlaskConical className="h-4 w-4 text-brand-600 dark:text-brand-400" />;
      case 'LAB_RESULTS_RELEASED':
        return <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
      case 'LAB_COMMUNICATION':
        return <MessageSquare className="h-4 w-4 text-purple-600 dark:text-purple-400" />;
      case 'ALERT':
        return <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" />;
      default:
        return <Info className="h-4 w-4 text-sky-600 dark:text-sky-400" />;
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t('Notifications')}
        title={t('Notifications')}
        className={`relative flex h-9 w-9 items-center justify-center rounded-xl border shadow-sm transition ${
          open
            ? 'border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-500 dark:bg-brand-950/50 dark:text-brand-300'
            : 'border-slate-200 bg-white text-slate-500 hover:border-brand-300 hover:text-brand-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-brand-500 dark:hover:text-brand-400'
        }`}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-extrabold text-white shadow-sm ring-2 ring-white dark:ring-slate-900 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 p-3.5 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-50 dark:bg-brand-950/40">
                <Bell className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
              </span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {t('Notifications')}
              </h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-extrabold text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                  {unreadCount} {t('new')}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="rounded-lg px-2 py-1 text-[11px] font-semibold text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-950/40"
                >
                  {t('Mark all read')}
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                  title={t('Clear all')}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 text-xs dark:divide-slate-800">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Bell className="mx-auto mb-2 h-7 w-7 text-slate-300 dark:text-slate-600" />
                <p className="font-semibold">{t('No notifications yet')}</p>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {t('Lab requests and diagnostic updates will appear here live.')}
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  className={`group relative flex cursor-pointer items-start gap-3 p-3.5 transition ${
                    !notif.read
                      ? 'bg-brand-50/40 dark:bg-brand-950/20 hover:bg-brand-50/70 dark:hover:bg-brand-950/30'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl shadow-2xs ${
                      notif.type === 'LAB_RESULTS_RELEASED'
                        ? 'bg-emerald-100 dark:bg-emerald-950/60'
                        : notif.type === 'LAB_ORDER_CREATED'
                        ? 'bg-brand-100 dark:bg-brand-950/60'
                        : notif.type === 'LAB_COMMUNICATION'
                        ? 'bg-purple-100 dark:bg-purple-950/60'
                        : 'bg-slate-100 dark:bg-slate-800'
                    }`}
                  >
                    {getIcon(notif.type)}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-1">
                      <p
                        className={`truncate font-bold ${
                          !notif.read
                            ? 'text-slate-900 dark:text-white'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {notif.title}
                      </p>
                      {!notif.read && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-brand-600 ring-2 ring-brand-200 dark:ring-brand-900" />
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-600 line-clamp-2 dark:text-slate-400 leading-relaxed">
                      {notif.message}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="h-3 w-3" />
                        {formatDateTime(notif.createdAt)}
                      </span>
                      {notif.link && (
                        <span className="inline-flex items-center gap-0.5 font-semibold text-brand-600 group-hover:underline dark:text-brand-400">
                          {t('Open')} <ExternalLink className="h-2.5 w-2.5" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 bg-slate-50/50 p-2 text-center text-[11px] text-slate-400 dark:border-slate-800 dark:bg-slate-900/50">
            {t('Real-time clinical routing · St. Michael Clinic')}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;