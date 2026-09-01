import { useTranslation } from 'react-i18next';

const tones = {
  success: {
    pill: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-900/20 dark:text-emerald-300 dark:ring-emerald-500/20',
    dot: 'bg-emerald-500',
    pulse: false,
  },
  warning: {
    pill: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-900/20 dark:text-amber-300 dark:ring-amber-500/20',
    dot: 'bg-amber-500',
    pulse: true,
  },
  danger: {
    pill: 'bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-900/20 dark:text-rose-300 dark:ring-rose-500/20',
    dot: 'bg-rose-500',
    pulse: false,
  },
  info: {
    pill: 'bg-sky-50 text-sky-700 ring-sky-600/20 dark:bg-sky-900/20 dark:text-sky-300 dark:ring-sky-500/20',
    dot: 'bg-sky-500',
    pulse: true,
  },
  neutral: {
    pill: 'bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-500/20',
    dot: 'bg-slate-400',
    pulse: false,
  },
  brand: {
    pill: 'bg-teal-50 text-teal-700 ring-teal-600/20 dark:bg-teal-900/20 dark:text-teal-300 dark:ring-teal-500/20',
    dot: 'bg-teal-500',
    pulse: true,
  },
  violet: {
    pill: 'bg-violet-50 text-violet-700 ring-violet-600/20 dark:bg-violet-900/20 dark:text-violet-300 dark:ring-violet-500/20',
    dot: 'bg-violet-500',
    pulse: false,
  },
  purple: {
    pill: 'bg-purple-50 text-purple-700 ring-purple-600/20 dark:bg-purple-900/20 dark:text-purple-300 dark:ring-purple-500/20',
    dot: 'bg-purple-500',
    pulse: false,
  },
};

// Status → tone mapping
const STATUS_MAP = {
  waiting:         'warning',
  called:          'info',
  in_consultation: 'brand',
  in_progress:     'info',
  completed:       'success',
  verified:        'success',
  released:        'success',
  pending:         'warning',
  requested:       'info',
  entered:         'info',
  active:          'brand',
  new:             'brand',
  returning:       'info',
  male:            'info',
  female:          'violet',
  paid:            'success',
  partial:         'warning',
  unpaid:          'danger',
  cancelled:       'neutral',
  discharged:      'neutral',
  awaiting_payment:'warning',
  payment_verified:'success',
  ready_for_lab:   'info',
  specimen_collected:'brand',
  result_received: 'brand',
  result_verified: 'success',
  administered:    'success',
  dispensed:       'success',
};

function titleCase(value) {
  return String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function StatusBadge({ status, tone, children, dot = true }) {
  const { t } = useTranslation();
  const resolved = tone || STATUS_MAP[String(status || '').toLowerCase()] || 'neutral';
  const cfg = tones[resolved] || tones.neutral;

  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${cfg.pill}`}>
      {dot && (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          {cfg.pulse && (
            <span className={`absolute inline-flex h-full w-full animate-ping-slow rounded-full opacity-75 ${cfg.dot}`} />
          )}
          <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
        </span>
      )}
      {children || t(titleCase(status))}
    </span>
  );
}
