import { motion } from 'framer-motion';
import { hoverScale, tap } from './motion';

export function Card({
  children,
  className = '',
  padding = 'p-6 sm:p-8',
  hover = true,
}) {
  return (
    <motion.div
      whileHover={hover ? hoverLift : undefined}
      whileTap={tap}
      className={`overflow-hidden rounded-[2rem] border border-slate-200 bg-surface shadow-sm ${padding} ${className}`}
    >
      {children}
    </motion.div>
  );
}

