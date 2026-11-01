import { motion } from 'framer-motion';

export function Select({
  id,
  label,
  value,
  onChange,
  options,
  required = false,
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
      <motion.select
        id={id}
        value={value}
        onChange={onChange}
        required={required}
        className={`w-full border-b border-ink bg-transparent px-0 py-3 text-sm font-normal outline-none transition-colors ${
          error
            ? 'border-red-500 focus:border-red-500 focus:ring-0'
            : 'border-ink focus:border-gold focus:ring-0'
        } ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </motion.select>
    </div>
  );
}


