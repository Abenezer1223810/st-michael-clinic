export function Tabs({ tabs, active, onChange, className = '' }) {
  return (
    <div className={`flex flex-wrap gap-1 border-b border-slate-200 dark:border-slate-800 ${className}`}>
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition ${
              isActive
                ? 'border-brand-600 text-brand-700 dark:border-brand-400 dark:text-brand-400'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-200'
            }`}
          >
            {tab.icon && <tab.icon className="h-4 w-4" />}
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                  isActive ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
