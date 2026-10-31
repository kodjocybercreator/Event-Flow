import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from './motion';

export function StaggeredList({ children, className = '' }) {
  return (
    <motion.ul
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className={className}
    >
      {children.map((child, i) => (
        <motion.li
          key={child.key || i}
          initial="hidden"
          animate="visible"
          variants={staggerItem}
          className="mb-0"
        >
          {child.element}
        </motion.li>
      ))}
    </motion.ul>
  );
}

