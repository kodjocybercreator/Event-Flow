import { motion } from 'framer-motion';
import { hoverScale, tap } from './motion';

export function Card({
  children,
  className = '',
  padding = 'p-6 sm:p-8',
  hover = true,
  border = 'border-slate-200',
  bg = 'bg-white',
}) {
  return (
    <motion.div
      whileHover={hover ? hoverScale : undefined}
      whileTap={tap}
      className={`overflow-hidden rounded-3xl ${border} ${bg} shadow-sm ${padding} ${className}`}
    >
      {children}
    </motion.div>
  );
}

