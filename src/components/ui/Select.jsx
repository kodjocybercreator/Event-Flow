export function Select({
  id,
  label,
  value,
  onChange,
  options,
  required = false,
  error = false,
  className = '',
  ...props
}) {
  return (
    <div className="mb-5">
      {label && (
        <label
          htmlFor={id}
          className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-mist"
        >
          {label}
        </label>
      )}
      <select
        id={id}
        value={value}
        onChange={onChange}
        required={required}
        className={`w-full rounded-xl border bg-elevated px-4 py-3.5 text-sm text-cream outline-none transition-all duration-200 focus:ring-2 ${
          error
            ? 'border-rose/50 focus:border-rose focus:ring-rose/20'
            : 'border-line focus:border-gold focus:ring-gold/20'
        } ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-raised text-cream">
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
