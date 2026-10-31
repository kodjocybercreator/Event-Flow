export function Avatar({ src, label = 'User', className = '', size = 'md' }) {
  const sizes = {
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-xl',
    lg: 'h-12 w-12 text-2xl',
  };

  if (src) {
    return (
      <img
        src={src}
        alt={label}
        className={`shrink-0 rounded-full border border-slate-200 bg-white object-cover ${sizes[size]} ${className}`}
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
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold shadow-lg ${sizes[size]} ${className}`}
    >
      {initials}
    </div>
  );
}

