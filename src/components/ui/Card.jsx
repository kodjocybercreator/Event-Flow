import { motion } from 'framer-motion';
import { hoverLift } from './motion';

export function Card({
  children,
  className = '',
  padding = 'p-6 sm:p-8',
  hover = true,
  glow = false,
}) {
  return (
    <motion.div
      whileHover={hover ? hoverLift : undefined}
      className={`overflow-hidden rounded-2xl border border-line bg-raised shadow-sm transition-all duration-300 ${
        glow
          ? 'hover:border-gold/30 hover:shadow-xl hover:shadow-gold/5'
          : 'hover:border-line-bright hover:shadow-lg'
      } ${padding} ${className}`}
    >
      {children}
    </motion.div>
  );
}
