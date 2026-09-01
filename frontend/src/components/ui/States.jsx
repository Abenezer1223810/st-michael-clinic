import { Loader2, Inbox, AlertTriangle, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function LoadingState({ label = 'Loading…' }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-slate-400 dark:text-slate-500">
      <div className="relative">
        <div className="absolute inset-0 animate-ping-slow rounded-full bg-brand-400/20" />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-900/20">
          <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
        </div>
      </div>
      <p className="text-sm font-medium">{t(label)}</p>
    </div>
  );
}

export function Spinner({ className = 'h-4 w-4' }) {
  return <Loader2 className={`animate-spin ${className}`} />;
}

export function EmptyState({ title = 'Nothing here yet', description, icon: Icon = Inbox, action }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-20 text-center animate-fade-up animation-fill-both">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-slate-100 dark:bg-slate-800 blur-lg opacity-80" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-300 shadow-soft dark:border-slate-700 dark:bg-slate-800 dark:text-slate-600">
          <Icon className="h-8 w-8" />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t(title)}</p>
        {description && (
          <p className="max-w-xs text-sm text-slate-400 dark:text-slate-500">{t(description)}</p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorState({ message = 'Something went wrong while loading this data.', onRetry }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-20 text-center animate-fade-up animation-fill-both">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-rose-100 dark:bg-rose-900/20 blur-lg opacity-80" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-400 shadow-soft dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-500">
          <AlertTriangle className="h-8 w-8" />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-rose-700 dark:text-rose-400">{t('Something went wrong')}</p>
        <p className="max-w-xs text-sm text-slate-500 dark:text-slate-400">{t(message)}</p>
      </div>
      {onRetry && (
        <button className="btn-secondary gap-2" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" />
          {t('Try again')}
        </button>
      )}
    </div>
  );
}
