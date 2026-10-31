export function Skeleton({ className = '', h = 'h-4', w = 'w-full' }) {
  return (
    <div
      className={`animate-pulse rounded-full bg-slate-200 ${h} ${w} ${className}`}
    />
  );
}

Skeleton.line = ({ className = '', h = 'h-4', w = 'w-3/4' }) => (
  <div className={`animate-pulse rounded-full bg-slate-200 ${h} ${w} ${className}`} />
);

Skeleton.circle = ({ className = '', size = 'h-12 w-12' }) => (
  <div className={`animate-pulse rounded-full bg-slate-200 ${size} ${className}`} />
);

Skeleton.text = ({ className = '', lines = 3, h = 'h-4' }) => (
  <div className="space-y-3">
    {[...Array(lines)].map((_, i) => (
      <div
        key={i}
        className={`animate-pulse rounded-full bg-slate-200 ${h} ${
          i === lines - 1 ? 'w-2/3' : 'w-full'
        } ${className}`}
      />
    ))}
  </div>
);

