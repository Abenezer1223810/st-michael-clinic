import { Loader2 } from 'lucide-react';
import { Inbox } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function LoadingState({ label = 'Loading…' }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400 dark:text-slate-500">
      <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      <p className="text-sm">{t(label)}</p>
    </div>
  );
}

export function Spinner({ className = 'h-4 w-4' }) {
  return <Loader2 className={`animate-spin ${className}`} />;
}

export function EmptyState({ title = 'Nothing here yet', description, icon: Icon = Inbox, action }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
        <Icon className="h-7 w-7" />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t(title)}</p>
        {description && <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{t(description)}</p>}
      </div>
      {action}
    </div>
  );
}

export function ErrorState({ message = 'Something went wrong while loading this data.', onRetry }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{t(message)}</p>
      {onRetry && (
        <button className="btn-secondary" onClick={onRetry}>
          {t('Try again')}
        </button>
      )}
    </div>
  );
}
