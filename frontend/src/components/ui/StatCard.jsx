export function StatCard({ icon: Icon, label, value, sub, tone = 'brand' }) {
  const tones = {
    brand: 'from-teal-500 to-cyan-600 shadow-teal-500/30',
    sky: 'from-sky-500 to-blue-600 shadow-sky-500/30',
    amber: 'from-amber-500 to-orange-500 shadow-amber-500/30',
    emerald: 'from-emerald-500 to-green-600 shadow-emerald-500/30',
    rose: 'from-rose-500 to-pink-600 shadow-rose-500/30',
    violet: 'from-violet-500 to-purple-600 shadow-violet-500/30',
    slate: 'from-slate-500 to-slate-700 shadow-slate-500/30',
  };
  return (
    <div className="card group p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-center gap-4">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg transition-transform duration-200 group-hover:scale-110 ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
          {sub && <p className="truncate text-xs text-slate-400 dark:text-slate-500">{sub}</p>}
        </div>
      </div>
    </div>
  );
}
