import { motion } from 'framer-motion';
import { fadeInUp } from './motion';

export function MotionWrapper({ children, className = '', delay = 0 }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUp}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

