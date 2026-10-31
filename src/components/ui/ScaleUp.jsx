import { motion } from 'framer-motion';
import { scaleUp, hoverScale, tap } from './motion';

export function ScaleUp({
  children,
  className = '',
  whileHover = hoverScale,
  whileTap = tap,
}) {
  return (
    <motion.div
      whileHover={whileHover}
      whileTap={whileTap}
      variants={scaleUp}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
}

