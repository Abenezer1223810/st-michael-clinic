import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { i18n } from '../i18n';

const ToastContext = createContext(null);

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((type, message) => {
    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => remove(id), 4500);
  }, [remove]);

  const toast = useCallback({
    success: (m) => push('success', m),
    error: (m) => push('error', m),
    info: (m) => push('info', m),
  }, [push]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed top-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg ${
              t.type === 'error'
                ? 'border-rose-200 bg-rose-50 text-rose-800'
                : t.type === 'success'
                ? 'border-brand-200 bg-brand-50 text-brand-800'
                : 'border-slate-200 bg-white text-slate-800'
            }`}
          >
            {t.type === 'error' ? (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
            )}
            <span className="flex-1">{typeof t.message === 'string' && t.message ? i18n.t(t.message) : t.message}</span>
            <button onClick={() => remove(t.id)} aria-label={i18n.t('Close')} className="shrink-0 text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
