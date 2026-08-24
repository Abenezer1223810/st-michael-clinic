import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { formatTime, waitingMinutes } from '../../utils/format';

export function QueueWidget({
  items = [],
  max = 6,
  emptyTitle = 'No patients waiting right now',
  emptyMessage = 'Queue is clear!',
  linkTo = '/queue',
  linkLabel,
}) {
  const { t } = useTranslation();
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-5 py-16">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
          <CheckCircle2 className="h-8 w-8 text-slate-400 dark:text-slate-500" />
        </div>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{t(emptyTitle)}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">{t(emptyMessage)}</p>
      </div>
    );
  }

  return (
    <>
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {items.slice(0, max).map((q, index) => (
          <li
            key={q.id}
            className="group flex items-center justify-between gap-4 px-4 py-4 transition hover:bg-slate-50 dark:hover:bg-slate-800"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-sm font-bold text-white shadow-md">
                  #{q.queueNumber}
                </span>
                {q.status === 'waiting' && (
                  <span className="absolute -right-1 -top-1 flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500" />
                  </span>
                )}
              </div>
              <div>
                <Link
                  to={`/patients/${q.patientId}`}
                  className="mb-1 block text-sm font-semibold text-slate-800 transition hover:text-brand-600 hover:underline dark:text-slate-100 dark:hover:text-brand-400"
                >
                  {q.patientName}
                </Link>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="rounded bg-slate-100 px-2 py-0.5 font-medium dark:bg-slate-800">{q.patientId}</span>
                  <span>·</span>
                  <span className="font-medium text-brand-600 dark:text-brand-400">{q.service}</span>
                  <span>·</span>
                  <span>{formatTime(q.time)}</span>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                    {waitingMinutes(q.time)}m {t('waiting')}
                  </span>
                </div>
              </div>
            </div>
            <StatusBadge status={q.status} />
          </li>
        ))}
      </ul>
      {items.length > max && (
        <div className="border-t border-slate-100 p-4 text-center dark:border-slate-800">
          <Link
            to={linkTo}
            className="group inline-flex items-center gap-2 text-sm font-medium text-brand-700 transition hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-300"
          >
            {linkLabel ? t(linkLabel) : t('View all {{count}} patients in queue', { count: items.length })}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      )}
    </>
  );
}
