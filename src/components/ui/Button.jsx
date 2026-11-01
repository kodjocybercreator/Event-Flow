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
    'inline-flex items-center gap-2 font-bold uppercase tracking-[0.15em] transition-colors duration-200 disabled:opacity-50 disabled:pointer-events-none';

  const variants = {
    primary:
      'bg-ink text-paper px-8 py-4 text-xs hover:bg-gold focus:outline-none',
    gold:
      'bg-gold text-paper px-8 py-4 text-xs hover:bg-ink focus:outline-none',
    outline:
      'border border-ink bg-transparent text-ink px-8 py-4 text-xs hover:bg-ink hover:text-paper focus:outline-none',
    ghost:
      'text-slate hover:bg-slate-100 hover:text-ink',
  };

  const sizes = {
    sm: 'px-6 py-3 text-[10px]',
    md: 'px-8 py-4 text-xs',
    lg: 'px-10 py-5 text-sm',
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


