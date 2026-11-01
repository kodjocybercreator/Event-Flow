import { motion } from 'framer-motion';
import { hoverLift } from './motion';

export function Input({
  id,
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  required = false,
  error = false,
  className = '',
  ...props
}) {
  return (
    <div className="mb-6">
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-bold uppercase tracking-[0.2em] text-ink mb-2"
        >
          {label}
        </label>
      )}
      <motion.input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        whileHover={hoverLift}
        className={`w-full border-b border-ink bg-transparent px-0 py-3 text-sm font-normal outline-none transition-colors placeholder:text-slate-400 ${
          error
            ? 'border-red-500 focus:border-red-500 focus:ring-0'
            : 'border-ink focus:border-gold focus:ring-0'
        } ${className}`}
        {...props}
      />
    </div>
  );
}


