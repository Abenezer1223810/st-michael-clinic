export function PageHeader({ title, subtitle, icon: Icon, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-brand-600 shadow-card ring-1 ring-slate-200">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div>
          <h1 className="text-lg font-bold text-slate-800">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
