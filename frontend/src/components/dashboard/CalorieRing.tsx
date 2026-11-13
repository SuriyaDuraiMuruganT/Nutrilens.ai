import React from 'react';
import { Flame } from 'lucide-react';

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
  const radius = 62;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;

  return (
    <div className="bg-fresh-surface rounded-card p-6 border border-fresh-border shadow-soft flex flex-col items-center justify-between relative transition-colors duration-200 h-full">
      {/* Top Header */}
      <div className="flex items-center justify-between w-full mb-1">
        <div className="flex items-center gap-1.5">
          <Flame className={`w-4 h-4 ${isOver ? 'text-fresh-warning' : 'text-nutrient-calories'}`} />
          <h3 className="text-xs font-medium uppercase tracking-wider text-fresh-muted">
            Daily Calories
          </h3>
        </div>
        <span
          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border tabular-nums ${
            isOver
              ? 'bg-fresh-warning-soft text-fresh-warning border-fresh-warning/20'
              : 'bg-fresh-surface-alt text-fresh-muted border-fresh-border'
          }`}
        >
          {percentage}%
        </span>
      </div>

      {/* Plate-Shaped Calorie Ring */}
      <div className="relative w-48 h-48 flex items-center justify-center my-2">
        {/* Plate Outer Contour & Subtle Inner Rim */}
        <div className="absolute inset-1 rounded-full border border-fresh-border bg-fresh-surface-alt/40 pointer-events-none" />
        <div className="absolute inset-3.5 rounded-full border border-fresh-border/60 pointer-events-none" />

        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
          <defs>
            {/* Apricot Calorie Gradient */}
            <linearGradient id="apricotCalorieGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--nutrient-calories-from)" />
              <stop offset="100%" stopColor="var(--nutrient-calories-to)" />
            </linearGradient>
          </defs>

          {/* Track Background */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="rgb(var(--color-border))"
            strokeWidth={strokeWidth}
            fill="transparent"
            opacity="0.4"
          />

          {/* Thin Apricot Ring (or soft tomato when over target) */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke={isOver ? 'rgb(var(--color-warning))' : 'url(#apricotCalorieGradient)'}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-300 ease-out"
          />
        </svg>

        {/* Center Plate Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none px-4">
          <span className="font-display font-semibold text-3xl tracking-tight text-fresh-text tabular-nums leading-none">
            {Math.round(consumed)}
          </span>
          <span className="text-xs font-sans text-fresh-muted mt-1 tabular-nums">
            of {Math.round(target)} kcal
          </span>
        </div>
      </div>

      {/* Gentle, non-judgmental status footer */}
      <div className="w-full pt-3 border-t border-fresh-border flex items-center justify-between text-xs">
        {isOver ? (
          <span className="text-fresh-warning font-medium flex items-center gap-1.5">
            <span>+{Math.round(consumed - target)} kcal over goal</span>
            <span className="text-fresh-muted text-[11px]">· Energy balances over time</span>
          </span>
        ) : (
          <>
            <span className="text-fresh-muted font-medium">Remaining to goal:</span>
            <span className="font-display font-medium text-fresh-text text-sm tabular-nums">
              {Math.round(remaining)} <span className="text-xs font-sans text-fresh-muted">kcal</span>
            </span>
          </>
        )}
      </div>
    </div>
  );
};
