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
    'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 disabled:opacity-60 disabled:pointer-events-none';

  const variants = {
    primary:
      'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 hover:-translate-y-0.5 hover:shadow-indigo-600/40',
    gold:
      'bg-amber-600 text-white shadow-lg shadow-amber-600/20 hover:bg-amber-700 hover:-translate-y-0.5 hover:shadow-amber-600/40',
    outline:
      'border border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700',
    ghost:
      'text-slate-600 hover:bg-slate-100 hover:text-indigo-600',
    white:
      'bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 hover:text-indigo-700',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3.5 text-sm font-bold',
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

