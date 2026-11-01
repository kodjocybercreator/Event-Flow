export function Badge({
  children,
  variant = 'ink',
  className = '',
  size = 'sm',
}) {
  const variants = {
    ink: 'bg-ink text-paper border border-ink',
    gold: 'bg-gold text-paper border border-gold',
    slate: 'bg-slate-50 text-slate-700 border border-slate-200',
  };

  const sizes = {
    sm: 'px-2.5 py-1 text-[10px]',
    md: 'px-3 py-1.5 text-xs',
    lg: 'px-4 py-2 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-none border font-medium tracking-[0.1em] uppercase ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
}


