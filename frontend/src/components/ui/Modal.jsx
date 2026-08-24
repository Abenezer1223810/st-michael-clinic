import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

export function Modal({ open, onClose, title, subtitle, children, size = 'md', footer }) {
  const { t } = useTranslation();
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm sm:items-center">
      <div
        className={`my-4 w-full ${sizes[size]} rounded-2xl bg-white shadow-2xl dark:bg-slate-900 dark:ring-1 dark:ring-slate-800 ${size === 'xl' ? 'max-h-[90vh]' : ''}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div>
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
            {subtitle && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label={t('Close')} title={t('Close')} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className={`px-6 py-5 ${size === 'xl' ? 'max-h-[calc(90vh-120px)] overflow-y-auto' : ''}`}>{children}</div>
        {footer && <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4 dark:border-slate-800">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
