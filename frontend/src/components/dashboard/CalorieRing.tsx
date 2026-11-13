import React from 'react';
import { Flame, Sparkles, TrendingUp } from 'lucide-react';

interface CalorieRingProps {
  consumed: number;
  target: number;
  remaining: number;
  percentage: number;
}

export const CalorieRing: React.FC<CalorieRingProps> = ({
  consumed,
  target,
  remaining,
  percentage,
}) => {
  const isOver = consumed > target;
  const radius = 68;
  const strokeWidth = 11;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;

  return (
    <div className="bg-gradient-to-b from-fresh-surface to-fresh-surface-alt/40 rounded-card p-6 border border-fresh-border shadow-soft flex flex-col items-center justify-between relative transition-all duration-300 h-full hover:shadow-soft-lg group">
      {/* Top Header */}
      <div className="flex items-center justify-between w-full mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
            isOver ? 'bg-fresh-warning-soft text-fresh-warning' : 'bg-amber-500/10 text-amber-500 dark:text-amber-400'
          }`}>
            <Flame className="w-4 h-4 fill-current" />
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-fresh-muted">
              Energy Balance
            </h3>
            <p className="text-[11px] text-fresh-muted/80">Daily target progress</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-fresh-surface border border-fresh-border shadow-sm text-xs font-semibold tabular-nums text-fresh-text">
          <TrendingUp className="w-3.5 h-3.5 text-fresh-primary" />
          <span>{percentage}%</span>
        </div>
      </div>

      {/* Hero Circular Progress Ring (Styled after modern Calo AI glass dials) */}
      <div className="relative w-52 h-52 flex items-center justify-center my-3">
        {/* Soft atmospheric ambient glow */}
        <div className="absolute inset-4 rounded-full bg-amber-500/5 blur-xl pointer-events-none" />

        {/* Outer and Inner Decorative Rims */}
        <div className="absolute inset-1 rounded-full border border-fresh-border/80 bg-fresh-surface/60 backdrop-blur-sm pointer-events-none" />
        <div className="absolute inset-3.5 rounded-full border border-dashed border-fresh-border/50 pointer-events-none" />

        <svg className="w-full h-full transform -rotate-90 relative z-10" viewBox="0 0 170 170">
          <defs>
            <linearGradient id="caloCalorieGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F97316" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
            <linearGradient id="overCalorieGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="100%" stopColor="#DC2626" />
            </linearGradient>
          </defs>

          {/* Background Track */}
          <circle
            cx="85"
            cy="85"
            r={radius}
            stroke="rgb(var(--color-border))"
            strokeWidth={strokeWidth}
            fill="transparent"
            opacity="0.35"
          />

          {/* Active Gradient Meter */}
          <circle
            cx="85"
            cy="85"
            r={radius}
            stroke={isOver ? 'url(#overCalorieGradient)' : 'url(#caloCalorieGradient)'}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Plate Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none px-4 z-20">
          <span className="text-[11px] font-medium text-fresh-muted uppercase tracking-wider">
            {isOver ? 'Exceeded' : 'Remaining'}
          </span>
          <span className="font-display font-semibold text-4xl tracking-tight text-fresh-text tabular-nums leading-tight">
            {Math.abs(Math.round(remaining))}
          </span>
          <span className="text-xs font-medium text-fresh-muted mt-0.5 tabular-nums">
            kcal to {Math.round(target)}
          </span>
        </div>
      </div>

      {/* Modern Status Footer with quick stats pill */}
      <div className="w-full pt-3 border-t border-fresh-border flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-fresh-muted">
          <span>Logged:</span>
          <strong className="text-fresh-text font-semibold tabular-nums">{Math.round(consumed)} kcal</strong>
        </div>
        <div className="flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-fresh-primary-soft text-fresh-primary border border-fresh-primary/20 font-medium">
          <Sparkles className="w-3 h-3" />
          <span>Active Day</span>
        </div>
      </div>
    </div>
  );
};
