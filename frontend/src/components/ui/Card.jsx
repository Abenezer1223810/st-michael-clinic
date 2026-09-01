export function Card({ className = '', children, hover = false, ...props }) {
  return (
    <div
      className={`card ${hover ? 'card-hover' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, icon: Icon, accent }) {
  const accents = {
    brand: 'from-brand-500 to-cyan-500',
    sky: 'from-sky-500 to-blue-500',
    amber: 'from-amber-500 to-orange-500',
    emerald: 'from-emerald-500 to-green-500',
    rose: 'from-rose-500 to-pink-500',
    violet: 'from-violet-500 to-purple-500',
  };
  const gradient = accents[accent] || accents.brand;

  return (
    <div className="relative flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
      {/* Subtle left accent line */}
      <div className={`absolute left-0 top-4 bottom-4 w-0.5 rounded-full bg-gradient-to-b ${gradient} opacity-60`} />

      <div className="flex items-center gap-3 pl-3">
        {Icon && (
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md ${gradient} shadow-brand-500/20`}>
            <Icon className="h-4 w-4" />
          </div>
        )}
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
          {subtitle && (
            <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardBody({ className = '', children }) {
  return <div className={`px-5 py-4 ${className}`}>{children}</div>;
}

export function CardSection({ label, children, className = '' }) {
  return (
    <div className={`border-t border-slate-100 px-5 py-4 dark:border-slate-800 ${className}`}>
      {label && (
        <p className="label mb-3">{label}</p>
      )}
      {children}
    </div>
  );
}
