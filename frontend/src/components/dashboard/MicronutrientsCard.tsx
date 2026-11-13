import React from 'react';
import { Leaf, Candy, Waves, CheckCircle2, AlertCircle } from 'lucide-react';

interface MicronutrientsCardProps {
  fiber_g: number;
  fiber_target: number;
  sugar_g: number;
  sugar_target?: number;
  sodium_mg: number;
  sodium_target?: number;
}

export const MicronutrientsCard: React.FC<MicronutrientsCardProps> = ({
  fiber_g,
  fiber_target = 30,
  sugar_g = 0,
  sugar_target = 36,
  sodium_mg = 0,
  sodium_target = 2300,
}) => {
  const fiberPct = Math.min(100, Math.round((fiber_g / Math.max(1, fiber_target)) * 100));
  const fiberReached = fiber_g >= fiber_target;

  const sugarPct = Math.min(100, Math.round((sugar_g / Math.max(1, sugar_target)) * 100));
  const sugarOver = sugar_g > sugar_target;

  const sodiumPct = Math.min(100, Math.round((sodium_mg / Math.max(1, sodium_target)) * 100));
  const sodiumOver = sodium_mg > sodium_target;

  return (
    <div className="bg-fresh-surface rounded-card p-5 border border-fresh-border shadow-soft space-y-4 transition-colors duration-200">
      <div className="flex items-center justify-between border-b border-fresh-border pb-2">
        <h3 className="text-xs font-medium uppercase tracking-wider text-fresh-muted">
          Micronutrients & Daily Balance
        </h3>
        <span className="text-[10px] text-fresh-muted font-medium">Standard Guidelines</span>
      </div>

      {/* 1. Dietary Fiber */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-medium" style={{ color: 'var(--nutrient-fiber)' }}>
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: 'var(--nutrient-fiber)' }}>
              <Leaf className="w-3 h-3" />
            </div>
            <span className="text-fresh-text">Dietary Fiber</span>
          </div>
          <div className="text-right">
            <span className="font-display font-medium text-sm text-fresh-text tabular-nums">{fiber_g}g</span>
            <span className="text-[11px] text-fresh-muted font-normal tabular-nums"> / {fiber_target}g goal</span>
          </div>
        </div>
        <div className="w-full bg-fresh-surface-alt rounded-full h-2 overflow-hidden border border-fresh-border/50">
          <div
            className="h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${fiberPct}%`, backgroundColor: 'var(--nutrient-fiber)' }}
          />
        </div>
      </div>

      {/* 2. Sugar Content */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-medium" style={{ color: 'var(--nutrient-sugar)' }}>
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: 'var(--nutrient-sugar)' }}>
              <Candy className="w-3 h-3" />
            </div>
            <span className="text-fresh-text">Sugar Content</span>
          </div>
          <div className="text-right">
            <span className={`font-display font-medium text-sm tabular-nums ${sugarOver ? 'text-fresh-warning' : 'text-fresh-text'}`}>
              {sugar_g}g
            </span>
            <span className="text-[11px] text-fresh-muted font-normal tabular-nums"> / {sugar_target}g max</span>
          </div>
        </div>
        <div className="w-full bg-fresh-surface-alt rounded-full h-2 overflow-hidden border border-fresh-border/50">
          <div
            className="h-full rounded-full transition-all duration-300 ease-out"
            style={{
              width: `${sugarPct}%`,
              backgroundColor: sugarOver ? 'rgb(var(--color-warning))' : 'var(--nutrient-sugar)',
            }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-fresh-muted">
          <span>{sugarOver ? 'Above guideline' : `${Math.max(0, Math.round((sugar_target - sugar_g) * 10) / 10)}g remaining`}</span>
          {sugarOver ? (
            <span className="text-fresh-warning font-medium flex items-center gap-0.5">
              <AlertCircle className="w-3 h-3" /> Elevated
            </span>
          ) : (
            <span className="text-fresh-primary font-medium flex items-center gap-0.5">
              <CheckCircle2 className="w-3 h-3" /> Balanced
            </span>
          )}
        </div>
      </div>

      {/* 3. Sodium Content */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-medium" style={{ color: 'var(--nutrient-sodium)' }}>
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: 'var(--nutrient-sodium)' }}>
              <Waves className="w-3 h-3" />
            </div>
            <span className="text-fresh-text">Sodium</span>
          </div>
          <div className="text-right">
            <span className={`font-display font-medium text-sm tabular-nums ${sodiumOver ? 'text-fresh-warning' : 'text-fresh-text'}`}>
              {Math.round(sodium_mg)}mg
            </span>
            <span className="text-[11px] text-fresh-muted font-normal tabular-nums"> / {sodium_target}mg max</span>
          </div>
        </div>
        <div className="w-full bg-fresh-surface-alt rounded-full h-2 overflow-hidden border border-fresh-border/50">
          <div
            className="h-full rounded-full transition-all duration-300 ease-out"
            style={{
              width: `${sodiumPct}%`,
              backgroundColor: sodiumOver ? 'rgb(var(--color-warning))' : 'var(--nutrient-sodium)',
            }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-fresh-muted">
          <span>{sodiumOver ? 'Above guideline' : `${Math.max(0, Math.round(sodium_target - sodium_mg))}mg allowance left`}</span>
          {sodiumOver ? (
            <span className="text-fresh-warning font-medium flex items-center gap-0.5">
              <AlertCircle className="w-3 h-3" /> Elevated
            </span>
          ) : (
            <span className="text-fresh-primary font-medium flex items-center gap-0.5">
              <CheckCircle2 className="w-3 h-3" /> Balanced
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
