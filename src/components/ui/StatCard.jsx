export function StatCard({
  value,
  label,
  icon,
  detail,
  className = '',
  valueClassName = 'text-3xl font-bold text-cream',
}) {
  return (
    <div
      className={`rounded-2xl border border-line bg-raised p-6 shadow-sm transition-all duration-300 hover:border-gold/20 hover:shadow-lg hover:shadow-gold/5 ${className}`}
    >
      {icon && (
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gold/15 text-lg text-gold">
          {icon}
        </div>
      )}
      <p className={valueClassName}>{value}</p>
      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.15em] text-mist">
        {label}
      </p>
      {detail && (
        <p className="mt-1 text-xs text-fog">{detail}</p>
      )}
    </div>
  );
}
