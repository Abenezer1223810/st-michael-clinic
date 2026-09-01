import { StethoscopePattern } from './StethoscopePattern';

export function PageHeader({ title, subtitle, icon: Icon, actions, image, badge }) {
  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl shadow-lifted">
      {/* Background gradient or image */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-600 via-cyan-600 to-blue-700" />
      {image && (
        <>
          <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-teal-900/70 to-cyan-800/40" />
        </>
      )}

      {/* Stethoscope pattern overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.08]">
        <StethoscopePattern stroke="white" opacity={1} id="page-header-pattern" />
      </div>

      {/* Decorative glows */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-cyan-300/15 blur-3xl" />
      <div className="pointer-events-none absolute right-1/4 top-0 h-32 w-32 rounded-full bg-teal-300/10 blur-2xl" />

      {/* Content */}
      <div className="relative flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex items-center gap-4">
          {Icon && (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-white shadow-xl backdrop-blur-sm ring-1 ring-white/10">
              <Icon className="h-6 w-6" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white drop-shadow">{title}</h1>
              {badge && (
                <span className="rounded-full border border-white/30 bg-white/15 px-2.5 py-0.5 text-xs font-semibold text-white/90 backdrop-blur-sm">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="mt-1 text-sm text-white/80 drop-shadow-sm">{subtitle}</p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 backdrop-blur-sm">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
