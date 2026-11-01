import { motion } from 'framer-motion';
import { hoverLift } from './motion';

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
    'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none rounded-xl';

  const variants = {
    primary:
      'bg-gold text-ink hover:bg-gold-dim hover:shadow-lg hover:shadow-gold/20 focus:ring-2 focus:ring-gold/50 focus:ring-offset-2 focus:ring-offset-ink',
    gold:
      'bg-gold text-ink hover:bg-gold-dim hover:shadow-lg hover:shadow-gold/20 focus:ring-2 focus:ring-gold/50 focus:ring-offset-2 focus:ring-offset-ink',
    outline:
      'border border-line-bright bg-transparent text-cream hover:border-gold hover:bg-gold/10 hover:text-gold focus:ring-2 focus:ring-gold/50 focus:ring-offset-2 focus:ring-offset-ink',
    ghost:
      'text-mist hover:bg-raised hover:text-cream',
    danger:
      'bg-rose/10 text-rose border border-rose/20 hover:bg-rose/20',
  };

  const sizes = {
    sm: 'px-4 py-2.5 text-[11px]',
    md: 'px-6 py-3 text-xs',
    lg: 'px-8 py-4 text-sm',
  };

  const Comp = asChild ? motion.span : motion.button;

  return (
    <Comp
      whileHover={!disabled ? hoverLift : undefined}
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </Comp>
  );
}
