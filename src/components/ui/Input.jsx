import { motion } from 'framer-motion';
import { hoverScale } from './motion';

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
    <div className="mb-4">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-semibold text-ink mb-1"
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
        whileHover={hoverScale}
        className={`w-full rounded-xl border border-slate-200 bg-surface px-4 py-3.5 text-sm outline-none transition placeholder:text-slate-400 ${
          error
            ? 'border-red-200 bg-red-50 text-red-700 focus:border-red-500 focus:ring-4 focus:ring-red-50'
            : 'border-slate-200 text-ink hover:border-slate-300 focus:border-gold focus:ring-4 focus:ring-gold/20'
        } ${className}`}
        {...props}
      />
    </div>
  );
}

