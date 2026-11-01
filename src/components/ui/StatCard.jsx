import { motion } from 'framer-motion';
import { hoverScale } from './motion';

export function StatCard({
  value,
  label,
  icon,
  detail,
  className = '',
  valueClassName = 'text-2xl font-bold text-ink',
}) {
  return (
    <div
      className={`rounded-[2rem] border border-slate-200 bg-surface p-6 shadow-sm ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          {icon && (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold-soft text-lg font-bold text-gold mb-3">
              {icon}
            </div>
          )}
          <p className={valueClassName}>{value}</p>
          <p className="mt-1 text-sm font-semibold text-slate">{label}</p>
          {detail && (
            <p className="mt-0.5 text-xs text-slate-400">{detail}</p>
          )}
        </div>
      </div>
    </div>
  );
}

