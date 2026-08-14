const tones = {
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  warning: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  danger: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  info: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  neutral: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  brand: 'bg-brand-50 text-brand-700 ring-brand-600/20',
  violet: 'bg-violet-50 text-violet-700 ring-violet-600/20',
};

const STATUS_MAP = {
  waiting: 'warning',
  called: 'info',
  in_consultation: 'brand',
  in_progress: 'info',
  completed: 'success',
  pending: 'warning',
  requested: 'info',
  entered: 'info',
  verified: 'success',
  active: 'brand',
  new: 'brand',
  returning: 'info',
  male: 'info',
  female: 'violet',
};

function titleCase(value) {
  return String(value || '')
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function StatusBadge({ status, tone, children }) {
  const t = tone || STATUS_MAP[String(status || '').toLowerCase()] || 'neutral';
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${tones[t]}`}
    >
      {children || titleCase(status)}
    </span>
  );
}
