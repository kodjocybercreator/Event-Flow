export function StatCard({
  value,
  label,
  icon,
  detail,
  className = '',
  valueClassName = 'text-2xl font-bold text-slate-950',
}) {
  return (
    <div
      className={`rounded-3xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          {icon && (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-lg font-bold text-indigo-600 mb-3">
              {icon}
            </div>
          )}
          <p className={valueClassName}>{value}</p>
          <p className="mt-1 text-sm font-semibold text-slate-600">{label}</p>
          {detail && (
            <p className="mt-0.5 text-xs text-slate-400">{detail}</p>
          )}
        </div>
      </div>
    </div>
  );
}

