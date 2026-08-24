import { StethoscopePattern } from './StethoscopePattern';

export function PageHeader({ title, subtitle, icon: Icon, actions, image }) {
  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500 via-cyan-600 to-blue-700 shadow-lg shadow-cyan-500/20">
      {image && <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />}
      {image && (
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/85 via-cyan-900/65 to-teal-500/40" />
      )}

      {/* Stethoscope pattern */}
      <div className="pointer-events-none absolute inset-0">
        <StethoscopePattern stroke="white" opacity={0.12} id="page-header-pattern" />
      </div>

      {/* Decorative glows */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-20 left-1/3 h-44 w-44 rounded-full bg-cyan-300/20 blur-3xl" />

      <div className="relative flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <div className="flex items-center gap-4">
          {Icon && (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white shadow-lg ring-1 ring-white/25 backdrop-blur-sm">
              <Icon className="h-6 w-6" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-white drop-shadow-sm">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-white/85">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
