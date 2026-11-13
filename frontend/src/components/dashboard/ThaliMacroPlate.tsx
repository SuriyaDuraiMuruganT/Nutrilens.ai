import React, { useState } from 'react';
import { Egg, Wheat, Droplet, Leaf, PieChart, Rows } from 'lucide-react';
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
  // Toggle between Compact Macro Rows View and Donut View
  const [viewMode, setViewMode] = useState<'rows' | 'donut'>('rows');

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
              onClick={() => setViewMode('rows')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-fresh-surface-alt text-fresh-muted border border-fresh-border hover:text-fresh-text transition"
              title="Switch to Macro Rows View"
            >
              <Rows className="w-3.5 h-3.5" />
              <span>Rows View</span>
            </button>
          }
        />
      </div>
    );
  }

  // Four compact macro items
  const macros = [
    {
      id: 'protein',
      name: 'Protein',
      icon: <Egg className="w-4 h-4" />,
      consumed: protein_g,
      target: targetProtein,
      pct: proteinPct,
      color: 'var(--nutrient-protein)',
    },
    {
      id: 'carbs',
      name: 'Carbs',
      icon: <Wheat className="w-4 h-4" />,
      consumed: carbs_g,
      target: targetCarbs,
      pct: carbsPct,
      color: 'var(--nutrient-carbs)',
    },
    {
      id: 'fat',
      name: 'Fat',
      icon: <Droplet className="w-4 h-4" />,
      consumed: fat_g,
      target: targetFat,
      pct: fatPct,
      color: 'var(--nutrient-fat)',
    },
    {
      id: 'fiber',
      name: 'Fiber',
      icon: <Leaf className="w-4 h-4" />,
      consumed: fiber_g,
      target: targetFiber,
      pct: fiberPct,
      color: 'var(--nutrient-fiber)',
    },
  ];

  return (
    <div className="bg-fresh-surface rounded-card p-6 border border-fresh-border shadow-soft flex flex-col justify-between transition-colors duration-200 h-full">
      {/* Header with View Toggle */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-medium uppercase tracking-wider text-fresh-muted">
          Daily Macronutrients
        </h3>
        <button
          onClick={() => setViewMode('donut')}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-fresh-surface-alt text-fresh-muted border border-fresh-border hover:text-fresh-text transition"
          title="Switch to Donut Chart View"
        >
          <PieChart className="w-3.5 h-3.5" />
          <span>Donut View</span>
        </button>
      </div>

      {/* 4 Compact Rows */}
      <div className="space-y-3 flex-1 flex flex-col justify-center">
        {macros.map((macro) => (
          <div
            key={macro.id}
            className="p-2.5 rounded-btn bg-fresh-surface-alt/50 border border-fresh-border/60 transition-colors"
          >
            {/* Top row: Icon + Name, Grams & Target, Pct */}
            <div className="flex items-center justify-between text-xs mb-1.5">
              <div className="flex items-center gap-1.5 font-medium text-fresh-text">
                <span style={{ color: macro.color }}>{macro.icon}</span>
                <span>{macro.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-display font-medium text-fresh-text tabular-nums text-sm">
                  {Math.round(macro.consumed)}
                  <span className="text-[11px] font-sans text-fresh-muted"> / {macro.target}g</span>
                </span>
                <span className="text-[11px] font-medium text-fresh-muted tabular-nums">
                  ({macro.pct}%)
                </span>
              </div>
            </div>

            {/* Thin Rounded Progress Bar */}
            <div className="w-full h-2 rounded-full bg-fresh-border/50 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300 ease-out"
                style={{
                  width: `${Math.min(100, Math.max(0, macro.pct))}%`,
                  backgroundColor: macro.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Footer subtle summary */}
      <div className="pt-3 mt-1 border-t border-fresh-border flex items-center justify-between text-xs text-fresh-muted">
        <span>Balanced nourishment</span>
        <span>Goal: 40C / 30P / 30F</span>
      </div>
    </div>
  );
};
