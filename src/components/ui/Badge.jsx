export function Badge({
  children,
  variant = 'ink',
  className = '',
  size = 'sm',
}) {
  const variants = {
    ink: 'bg-ink-50 text-ink border border-ink-100',
    gold: 'bg-gold-50 text-gold border border-gold-100',
    emerald: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    red: 'bg-red-50 text-red-700 border border-red-100',
    slate: 'bg-slate-50 text-slate-700 border border-slate-100',
  };

  const sizes = {
    sm: 'px-2.5 py-1 text-[10px]',
    md: 'px-3 py-1.5 text-xs',
    lg: 'px-4 py-2 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
}

