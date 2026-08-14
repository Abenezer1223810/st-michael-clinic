export function Field({ label, required, error, hint, children, className = '' }) {
  return (
    <div className={className}>
      <label className="label">
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-xs text-rose-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
}
