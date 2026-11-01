export function Badge({
  children,
  variant = 'gold',
  className = '',
  size = 'sm',
}) {
  const variants = {
    gold: 'bg-gold/15 text-gold border border-gold/25',
    emerald: 'bg-emerald/10 text-emerald border border-emerald/20',
    rose: 'bg-rose/10 text-rose border border-rose/20',
    amber: 'bg-amber/10 text-amber border border-amber/20',
    cream: 'bg-cream/10 text-cream border border-cream/15',
    fog: 'bg-fog/10 text-fog border border-fog/20',
  };

  const sizes = {
    sm: 'px-2.5 py-1 text-[10px]',
    md: 'px-3 py-1.5 text-xs',
    lg: 'px-4 py-2 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg font-semibold tracking-[0.08em] uppercase ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
}
