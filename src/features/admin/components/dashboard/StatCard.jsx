import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const colorStyles = {
  brand: 'bg-[var(--text)] text-[var(--surface)] ring-[var(--text)] shadow-[0_4px_12px_rgba(0,0,0,0.08)]',
  accent: 'bg-[var(--accent)] text-white ring-[var(--accent)] shadow-[0_4px_12px_rgba(176,141,74,0.25)]',
  neutral: 'bg-[var(--surface-muted)] text-[var(--sub)] ring-[var(--border)]',
  muted: 'bg-[var(--surface-muted)] text-[var(--muted)] ring-[var(--border)]',
  sub: 'bg-[var(--surface-muted)] text-[var(--sub)] ring-[var(--border)]',
  success: 'bg-[var(--success)] text-white ring-[var(--success)] shadow-[0_4px_12px_rgba(16,185,129,0.25)]',
  warning: 'bg-[var(--warning)] text-white ring-[var(--warning)] shadow-[0_4px_12px_rgba(245,158,11,0.25)]',
  error: 'bg-[var(--error)] text-white ring-[var(--error)] shadow-[0_4px_12px_rgba(239,68,68,0.25)]',
  info: 'bg-[var(--info)] text-white ring-[var(--info)] shadow-[0_4px_12px_rgba(59,130,246,0.25)]',
};

export const StatCard = ({ title, value, subtext, icon: Icon, trend, color = 'brand', loading }) => {
  let resolvedColor = 'brand';
  if (color && typeof color === 'string') {
    if (color.includes('emerald') || color.includes('green')) resolvedColor = 'success';
    else if (color.includes('rose') || color.includes('red')) resolvedColor = 'error';
    else if (color.includes('amber') || color.includes('orange')) resolvedColor = 'warning';
    else if (color.includes('indigo') || color.includes('blue')) resolvedColor = 'brand';
    else if (colorStyles[color]) resolvedColor = color;
  }
  const iconTheme = colorStyles[resolvedColor];
  const isPositiveTrend = trend >= 0;

  return (
    <div className="bg-[var(--surface)] p-4 sm:p-5 rounded-[1.25rem] shadow-[0_2px_12px_rgba(0,0,0,0.02)] ring-1 ring-[var(--border)]/40 hover:ring-[var(--brand)]/30 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group flex flex-col justify-between h-full cursor-default relative overflow-hidden">
      
      {/* Super subtle glass reflection */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>

      <div className="relative z-10 flex-1 flex flex-col">
        {/* Top Header: Icon & Trend */}
        <div className="flex justify-between items-start mb-4 sm:mb-5">
          <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-[0.85rem] flex items-center justify-center ring-1 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110 group-hover:-rotate-3 ${iconTheme}`}>
            {Icon && <Icon className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.5} />}
          </div>

          {trend !== null && trend !== undefined && !isNaN(trend) && (
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-md font-body text-[9px] sm:text-[10px] uppercase tracking-widest font-bold ring-1 transition-all duration-500 shadow-sm ${isPositiveTrend
                ? 'bg-[var(--surface)] text-[var(--success)] ring-[var(--success)]/30 group-hover:bg-[var(--success)]/10'
                : 'bg-[var(--surface)] text-[var(--error)] ring-[var(--error)]/30 group-hover:bg-[var(--error)]/10'
                }`}
            >
              {isPositiveTrend ? <TrendingUp size={12} strokeWidth={2.5} /> : <TrendingDown size={12} strokeWidth={2.5} />}
              <span>{Math.abs(trend).toFixed(1)}%</span>
            </div>
          )}
        </div>

        {/* Title & Value */}
        <div className="mt-auto">
          <p className="font-body text-[9px] sm:text-[10px] uppercase tracking-widest font-bold text-[var(--muted)] mb-1 sm:mb-1.5 transition-colors duration-500 group-hover:text-[var(--brand)] line-clamp-1">
            {title}
          </p>

          {loading ? (
            <div className="h-8 w-24 bg-[var(--surface-muted)] animate-pulse rounded-lg my-1" />
          ) : (
            <h4 className="font-display font-bold text-2xl sm:text-3xl text-[var(--text)] tracking-tight leading-none transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1">
              {value}
            </h4>
          )}
        </div>
      </div>

      {/* Subtext */}
      {subtext && (
        <div className="mt-4 pt-3 border-t border-[var(--border)]/40 relative z-10 transition-colors duration-500 group-hover:border-[var(--brand)]/20 shrink-0">
          <p className="font-body text-[10px] sm:text-[11px] font-medium text-[var(--sub)] leading-snug line-clamp-2">
            {subtext}
          </p>
        </div>
      )}
    </div>
  );
};

export default StatCard;