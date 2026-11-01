export function StatCard({
  value,
  label,
  icon,
  detail,
  className = '',
  valueClassName = 'text-3xl font-bold text-ink',
}) {
  return (
    <div
      className={`border border-slate-200 bg-paper p-8 shadow-sm ${className}`}
    >
      <div className="flex items-start justify-between gap-6">
        <div>
          {icon && (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm bg-gold-soft text-lg font-bold text-gold mb-4">
              {icon}
            </div>
          )}
          <p className={valueClassName}>{value}</p>
          <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-slate">
            {label}
          </p>
          {detail && (
            <p className="mt-1 text-xs text-slate-400">{detail}</p>
          )}
        </div>
      </div>
    </div>
  );
}


