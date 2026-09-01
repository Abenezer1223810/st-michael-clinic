import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Spinner } from './States';

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  tone = 'danger', // 'danger' | 'warning' | 'brand'
  loading = false,
}) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape' && !loading) onClose?.();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose, loading]);

  if (!open) return null;

  const tones = {
    danger: {
      iconBg: 'bg-rose-100 dark:bg-rose-950/60',
      iconColor: 'text-rose-600 dark:text-rose-400',
      btn: 'btn-primary !bg-rose-600 hover:!bg-rose-700 shadow-rose-600/30',
    },
    warning: {
      iconBg: 'bg-amber-100 dark:bg-amber-950/60',
      iconColor: 'text-amber-600 dark:text-amber-400',
      btn: 'btn-primary !bg-amber-600 hover:!bg-amber-700 shadow-amber-600/30',
    },
    brand: {
      iconBg: 'bg-brand-100 dark:bg-brand-950/60',
      iconColor: 'text-brand-600 dark:text-brand-400',
      btn: 'btn-primary',
    },
  };

  const currentTone = tones[tone] || tones.danger;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 dark:ring-1 dark:ring-slate-800"
        role="alertdialog"
        aria-modal="true"
      >
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${currentTone.iconBg}`}>
            {tone === 'danger' ? (
              <Trash2 className={`h-6 w-6 ${currentTone.iconColor}`} />
            ) : (
              <AlertTriangle className={`h-6 w-6 ${currentTone.iconColor}`} />
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {title || t('Are you sure?')}
            </h3>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {message || t('This action cannot be undone. Are you sure you want to proceed?')}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            aria-label={t('Close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText || t('Cancel')}
          </button>
          <button
            type="button"
            className={currentTone.btn}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <Spinner /> : confirmText || t('Yes, Delete')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
