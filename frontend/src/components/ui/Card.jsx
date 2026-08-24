export function Card({ className = '', children, ...props }) {
  return (
    <div className={`card ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, icon: Icon }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-cyan-600 text-white shadow-md shadow-brand-500/20">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function CardBody({ className = '', children }) {
  return <div className={`px-5 py-4 ${className}`}>{children}</div>;
}
