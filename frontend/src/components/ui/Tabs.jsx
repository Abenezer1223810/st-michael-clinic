import { useRef, useEffect, useState } from 'react';

export function Tabs({ tabs, active, onChange, className = '', variant = 'underline' }) {
  const activeRef = useRef(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useEffect(() => {
    if (activeRef.current) {
      const el = activeRef.current;
      setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    }
  }, [active, tabs]);

  if (variant === 'pill') {
    return (
      <div className={`flex flex-wrap gap-1.5 ${className}`}>
        {tabs.map((tab) => {
          const isActive = active === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onChange(tab.key)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/30'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {tab.icon && <tab.icon className="h-3.5 w-3.5" />}
              {tab.label}
              {tab.count !== undefined && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Default: underline variant with sliding indicator
  return (
    <div className={`relative flex flex-wrap gap-0.5 border-b border-slate-200 dark:border-slate-800 ${className}`}>
      {/* Sliding indicator */}
      <span
        className="pointer-events-none absolute bottom-0 h-0.5 rounded-full bg-brand-600 transition-all duration-250 ease-smooth dark:bg-brand-400"
        style={{ left: indicator.left, width: indicator.width }}
        aria-hidden
      />

      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            ref={isActive ? activeRef : null}
            onClick={() => onChange(tab.key)}
            className={`-mb-px inline-flex items-center gap-2 border-b-2 border-transparent px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
              isActive
                ? 'text-brand-700 dark:text-brand-400'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {tab.icon && (
              <tab.icon className={`h-4 w-4 transition-colors duration-200 ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'}`} />
            )}
            {tab.label}
            {tab.count !== undefined && (
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                isActive
                  ? 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
