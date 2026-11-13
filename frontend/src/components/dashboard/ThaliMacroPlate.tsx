import React, { useState } from 'react';
import { Egg, Wheat, Droplet, Leaf, PieChart, LayoutGrid } from 'lucide-react';
import { MacroDonut } from './MacroDonut';

interface MacroDisplayProps {
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  fiber_g?: number;
  targetProtein: number;
  targetFat: number;
  targetCarbs: number;
  targetFiber?: number;
}

export const ThaliMacroPlate: React.FC<MacroDisplayProps> = ({
  protein_g,
  fat_g,
  carbs_g,
  fiber_g = 0,
  targetProtein = 120,
  targetFat = 65,
  targetCarbs = 220,
  targetFiber = 30,
}) => {
  const [viewMode, setViewMode] = useState<'cards' | 'donut'>('cards');

  const proteinPct = Math.round((protein_g / Math.max(1, targetProtein)) * 100);
  const carbsPct = Math.round((carbs_g / Math.max(1, targetCarbs)) * 100);
  const fatPct = Math.round((fat_g / Math.max(1, targetFat)) * 100);
  const fiberPct = Math.round((fiber_g / Math.max(1, targetFiber)) * 100);

  if (viewMode === 'donut') {
    return (
      <div className="relative h-full">
        <MacroDonut
          protein_g={protein_g}
          fat_g={fat_g}
          carbs_g={carbs_g}
          targetProtein={targetProtein}
          targetFat={targetFat}
          targetCarbs={targetCarbs}
          headerAction={
            <button
              onClick={() => setViewMode('cards')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-fresh-surface-alt text-fresh-muted border border-fresh-border hover:text-fresh-text transition"
              title="Switch to Macro Cards View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards View</span>
            </button>
          }
        />
      </div>
    );
  }

  // 3 Hero Macro Cards (Calo AI style: Protein, Carbs, Fat) with mini circular progress dials
  const macroCards = [
    {
      id: 'protein',
      name: 'Protein',
      iconEmoji: '🍗',
      consumed: protein_g,
      target: targetProtein,
      pct: proteinPct,
      strokeColor: '#EF4444',
      bgGlow: 'rgba(239, 68, 68, 0.08)',
    },
    {
      id: 'carbs',
      name: 'Carbs',
      iconEmoji: '🌽',
      consumed: carbs_g,
      target: targetCarbs,
      pct: carbsPct,
      strokeColor: '#F59E0B',
      bgGlow: 'rgba(245, 158, 11, 0.08)',
    },
    {
      id: 'fat',
      name: 'Fat',
      iconEmoji: '🧈',
      consumed: fat_g,
      target: targetFat,
      pct: fatPct,
      strokeColor: '#0EA5E9',
      bgGlow: 'rgba(14, 165, 233, 0.08)',
    },
  ];

  return (
    <div className="bg-gradient-to-b from-fresh-surface to-fresh-surface-alt/40 rounded-card p-6 border border-fresh-border shadow-soft flex flex-col justify-between transition-all duration-300 h-full hover:shadow-soft-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-fresh-muted">
            Target Nutrients
          </h3>
          <p className="text-[11px] text-fresh-muted/80">Macros distribution</p>
        </div>
        <button
          onClick={() => setViewMode('donut')}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-fresh-surface text-fresh-muted border border-fresh-border hover:text-fresh-text shadow-sm transition"
          title="Switch to Donut View"
        >
          <PieChart className="w-3.5 h-3.5 text-fresh-primary" />
          <span>Donut</span>
        </button>
      </div>

      {/* 3 Macro Cards (Inspired by modern Calo AI dashboard cards) */}
      <div className="grid grid-cols-3 gap-2.5 my-2">
        {macroCards.map((macro) => {
          const dialRadius = 24;
          const dialCirc = 2 * Math.PI * dialRadius;
          const dialOffset = dialCirc - (Math.min(100, Math.max(0, macro.pct)) / 100) * dialCirc;

          return (
            <div
              key={macro.id}
              className="p-3 rounded-2xl bg-fresh-surface border border-fresh-border/80 shadow-sm flex flex-col items-center justify-between text-center relative overflow-hidden transition-all hover:scale-[1.02]"
              style={{ backgroundColor: macro.bgGlow }}
            >
              {/* Header emoji & title */}
              <div className="w-full flex items-center justify-between text-[11px] font-medium text-fresh-muted mb-1">
                <span className="text-base select-none">{macro.iconEmoji}</span>
                <span className="font-semibold text-fresh-text">{macro.name}</span>
              </div>

              {/* Circular Dial */}
              <div className="relative w-16 h-16 flex items-center justify-center my-1">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 60 60">
                  <circle
                    cx="30"
                    cy="30"
                    r={dialRadius}
                    stroke="rgb(var(--color-border))"
                    strokeWidth="5"
                    fill="transparent"
                    opacity="0.3"
                  />
                  <circle
                    cx="30"
                    cy="30"
                    r={dialRadius}
                    stroke={macro.strokeColor}
                    strokeWidth="5"
                    strokeDasharray={dialCirc}
                    strokeDashoffset={dialOffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-500 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-display font-semibold text-xs text-fresh-text tabular-nums">
                  {macro.pct}%
                </div>
              </div>

              {/* Bottom values */}
              <div className="mt-1">
                <div className="font-display font-medium text-xs text-fresh-text tabular-nums">
                  {Math.round(macro.consumed)}g
                </div>
                <div className="text-[10px] text-fresh-muted tabular-nums">
                  of {macro.target}g
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dietary Fiber horizontal status pill */}
      <div className="mt-2 pt-2.5 border-t border-fresh-border flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-fresh-muted">
          <Leaf className="w-3.5 h-3.5 text-emerald-500" />
          <span>Dietary Fiber:</span>
        </div>
        <span className="font-display font-medium text-fresh-text tabular-nums text-xs">
          {Math.round(fiber_g)}g <span className="text-[10px] text-fresh-muted">/ {targetFiber}g ({fiberPct}%)</span>
        </span>
      </div>
    </div>
  );
};
