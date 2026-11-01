import { motion } from 'framer-motion';
import { hoverLift } from './motion';

export function Card({
  children,
  className = '',
  padding = 'p-8 sm:p-10',
  hover = true,
}) {
  return (
    <motion.div
      whileHover={hover ? hoverLift : undefined}
      className={`overflow-hidden border border-slate-200 bg-paper shadow-sm ${padding} ${className}`}
    >
      {children}
    </motion.div>
  );
}


