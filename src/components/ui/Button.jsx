import { motion } from 'framer-motion';
import { hoverScale, tap } from './motion';

export function Button({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  asChild = false,
  ...props
}) {
  const base =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-300 disabled:opacity-60 disabled:pointer-events-none';

  const variants = {
    primary: 'bg-ink text-white shadow-lg shadow-ink/15 hover:bg-slate-900 hover:-translate-y-0.5 hover:shadow-gold/20',
    gold: 'bg-gold text-white shadow-lg shadow-gold/15 hover:bg-amber-700 hover:-translate-y-0.5 hover:shadow-gold/30',
    outline: 'border border-slate-200 bg-surface text-ink hover:border-gold hover:bg-gold-soft hover:text-gold',
    ghost: 'text-slate hover:bg-slate-100 hover:text-gold',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-7 py-3.5 text-sm font-bold',
    lg: 'px-8 py-4 text-base font-bold',
  };

  const Comp = asChild ? motion.span : motion.button;

  return (
    <Comp
      whileHover={!disabled ? hoverScale : undefined}
      whileTap={!disabled ? tap : undefined}
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </Comp>
  );
}

