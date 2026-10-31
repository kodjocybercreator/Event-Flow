import { motion } from 'framer-motion';
import { fadeIn } from './motion';

export function FadeIn({ children, className = '', delay = 0 }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

