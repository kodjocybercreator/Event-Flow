import { motion } from 'framer-motion';
import { slideInUp } from './motion';

export function MotionWrapper({ children, className = '', delay = 0 }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={slideInUp}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}


