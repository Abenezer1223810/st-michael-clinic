const TONE_MAP = {
  brand:   { icon: 'from-teal-500 to-cyan-600 shadow-teal-500/30',     border: 'from-teal-400/30 to-cyan-400/20',   bg: 'bg-teal-50 dark:bg-teal-900/10' },
  sky:     { icon: 'from-sky-500 to-blue-600 shadow-sky-500/30',       border: 'from-sky-400/30 to-blue-400/20',    bg: 'bg-sky-50 dark:bg-sky-900/10' },
  amber:   { icon: 'from-amber-500 to-orange-500 shadow-amber-500/30', border: 'from-amber-400/30 to-orange-400/20',bg: 'bg-amber-50 dark:bg-amber-900/10' },
  emerald: { icon: 'from-emerald-500 to-green-600 shadow-emerald-500/30',border:'from-emerald-400/30 to-green-400/20',bg:'bg-emerald-50 dark:bg-emerald-900/10'},
  rose:    { icon: 'from-rose-500 to-pink-600 shadow-rose-500/30',     border: 'from-rose-400/30 to-pink-400/20',   bg: 'bg-rose-50 dark:bg-rose-900/10' },
  violet:  { icon: 'from-violet-500 to-purple-600 shadow-violet-500/30',border:'from-violet-400/30 to-purple-400/20',bg:'bg-violet-50 dark:bg-violet-900/10'},
  slate:   { icon: 'from-slate-500 to-slate-700 shadow-slate-500/30',  border: 'from-slate-400/20 to-slate-400/10', bg: 'bg-slate-50 dark:bg-slate-900/10' },
  teal:    { icon: 'from-teal-500 to-cyan-600 shadow-teal-500/30',     border: 'from-teal-400/30 to-cyan-400/20',   bg: 'bg-teal-50 dark:bg-teal-900/10' },
  blue:    { icon: 'from-blue-500 to-indigo-600 shadow-blue-500/30',   border: 'from-blue-400/30 to-indigo-400/20', bg: 'bg-blue-50 dark:bg-blue-900/10' },
  purple:  { icon: 'from-purple-500 to-violet-600 shadow-purple-500/30',border:'from-purple-400/30 to-violet-400/20',bg:'bg-purple-50 dark:bg-purple-900/10'},
};

function TrendArrow({ trend }) {
  if (!trend) return null;
  const up = trend > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${up ? 'text-emerald-600' : 'text-rose-500'}`}>
      <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
        {up
          ? <path d="M6 10V2M6 2L2.5 5.5M6 2L9.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          : <path d="M6 2v8M6 10L2.5 6.5M6 10L9.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        }
      </svg>
      {Math.abs(trend)}%
    </span>
  );
}

export function StatCard({ icon: Icon, label, value, sub, tone = 'brand', trend, title }) {
  const t = TONE_MAP[tone] || TONE_MAP.brand;
  const displayLabel = label || title;
  return (
    <div className={`card card-hover group relative overflow-hidden p-5 animate-fade-up animation-fill-both`}>
      {/* Subtle gradient top border */}
      <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${t.border}`} />

      {/* Background tint */}
      <div className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full ${t.bg} blur-2xl opacity-60`} />

      <div className="relative flex items-start gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${t.icon}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="label mb-0.5 truncate">{displayLabel}</p>
          <div className="flex items-end gap-2">
            <p className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 animate-count-up animation-fill-both">
              {value ?? '—'}
            </p>
            <TrendArrow trend={trend} />
          </div>
          {sub && <p className="mt-0.5 truncate text-xs text-slate-400 dark:text-slate-500">{sub}</p>}
        </div>
      </div>
    </div>
  );
}
