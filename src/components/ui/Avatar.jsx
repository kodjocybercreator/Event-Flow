export function Avatar({ src, label = 'User', className = '', size = 'md' }) {
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  };

  if (src) {
    return (
      <img
        src={src}
        alt={label}
        className={`shrink-0 border border-slate-200 object-cover ${sizes[size]} ${className}`}
      />
    );
  }

  const initials = label
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-ink text-white font-bold shadow-lg ${sizes[size]} ${className}`}
    >
      {initials}
    </div>
  );
}


