import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Egg, Wheat, Droplet } from 'lucide-react';

interface MacroDonutProps {
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  targetProtein?: number;
  targetFat?: number;
  targetCarbs?: number;
  headerAction?: React.ReactNode;
}

export const MacroDonut: React.FC<MacroDonutProps> = ({
  protein_g,
  fat_g,
  carbs_g,
  targetProtein = 120,
  targetFat = 65,
  targetCarbs = 220,
  headerAction,
}) => {
  const proteinKcal = protein_g * 4;
  const fatKcal = fat_g * 9;
  const carbsKcal = carbs_g * 4;
  const totalMacroKcal = proteinKcal + fatKcal + carbsKcal || 1;

  const proteinPct = Math.round((proteinKcal / totalMacroKcal) * 100);
  const fatPct = Math.round((fatKcal / totalMacroKcal) * 100);
  const carbsPct = Math.round((carbsKcal / totalMacroKcal) * 100);

  // Exact nutrient color variables from Fresh Table design tokens
  const data = [
    { name: 'Protein', value: protein_g, color: 'var(--nutrient-protein)', pct: proteinPct, icon: <Egg className="w-3 h-3" /> },
    { name: 'Carbs', value: carbs_g, color: 'var(--nutrient-carbs)', pct: carbsPct, icon: <Wheat className="w-3 h-3" /> },
    { name: 'Fat', value: fat_g, color: 'var(--nutrient-fat)', pct: fatPct, icon: <Droplet className="w-3 h-3" /> },
  ];

  return (
    <div className="bg-fresh-surface rounded-card p-6 border border-fresh-border shadow-soft flex flex-col justify-between transition-colors duration-200 h-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-medium uppercase tracking-wider text-fresh-muted">
          Macro Calorie Ratio
        </h3>
        {headerAction ? (
          headerAction
        ) : (
          <span className="text-xs font-medium text-fresh-muted">Energy Ratio</span>
        )}
      </div>

      <div className="h-44 w-full relative flex items-center justify-center my-1">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={50}
              outerRadius={70}
              paddingAngle={4}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: any, name: any) => [`${value}g`, name]}
              contentStyle={{
                backgroundColor: 'rgb(var(--color-surface))',
                borderColor: 'rgb(var(--color-border))',
                borderRadius: '12px',
                color: 'rgb(var(--color-text))',
                fontSize: '12px',
                boxShadow: '0 2px 8px rgba(60, 45, 30, 0.08)',
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[11px] font-medium text-fresh-muted uppercase tracking-wider">Macros</span>
          <span className="font-display font-semibold text-xl text-fresh-text tabular-nums">
            {Math.round(protein_g + carbs_g + fat_g)}<span className="text-xs font-sans font-medium text-fresh-muted">g</span>
          </span>
        </div>
      </div>

      {/* Macro Legend Cards with paired icon, color, and text */}
      <div className="grid grid-cols-3 gap-2 mt-2 pt-3 border-t border-fresh-border text-center">
        {/* Protein */}
        <div className="p-2.5 rounded-btn bg-fresh-surface-alt/60 border border-fresh-border/80">
          <p className="text-[10px] font-medium uppercase flex items-center justify-center gap-1" style={{ color: 'var(--nutrient-protein)' }}>
            <Egg className="w-3 h-3" /> Protein
          </p>
          <p className="font-display font-medium text-sm text-fresh-text mt-0.5 tabular-nums">{protein_g}g</p>
          <p className="text-[10px] text-fresh-muted font-medium tabular-nums">{proteinPct}% / {targetProtein}g</p>
        </div>

        {/* Carbs */}
        <div className="p-2.5 rounded-btn bg-fresh-surface-alt/60 border border-fresh-border/80">
          <p className="text-[10px] font-medium uppercase flex items-center justify-center gap-1" style={{ color: 'var(--nutrient-carbs)' }}>
            <Wheat className="w-3 h-3" /> Carbs
          </p>
          <p className="font-display font-medium text-sm text-fresh-text mt-0.5 tabular-nums">{carbs_g}g</p>
          <p className="text-[10px] text-fresh-muted font-medium tabular-nums">{carbsPct}% / {targetCarbs}g</p>
        </div>

        {/* Fat */}
        <div className="p-2.5 rounded-btn bg-fresh-surface-alt/60 border border-fresh-border/80">
          <p className="text-[10px] font-medium uppercase flex items-center justify-center gap-1" style={{ color: 'var(--nutrient-fat)' }}>
            <Droplet className="w-3 h-3" /> Fat
          </p>
          <p className="font-display font-medium text-sm text-fresh-text mt-0.5 tabular-nums">{fat_g}g</p>
          <p className="text-[10px] text-fresh-muted font-medium tabular-nums">{fatPct}% / {targetFat}g</p>
        </div>
      </div>
    </div>
  );
};
