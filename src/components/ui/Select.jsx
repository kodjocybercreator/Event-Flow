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
    <div className="mb-4">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-semibold text-slate-700 mb-1"
        >
          {label}
        </label>
      )}
      <motion.select
        id={id}
        value={value}
        onChange={onChange}
        required={required}
        className={`w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm outline-none transition hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 ${className}`}
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

