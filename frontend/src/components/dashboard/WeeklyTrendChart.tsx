import React from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Flame, Egg } from 'lucide-react';
import { WeeklyDayTrend } from '../../types';

interface WeeklyTrendChartProps {
  days: WeeklyDayTrend[];
  targetCalories?: number;
}

export const WeeklyTrendChart: React.FC<WeeklyTrendChartProps> = ({
  days,
  targetCalories = 2000,
}) => {
  return (
    <div className="bg-fresh-surface rounded-card p-6 border border-fresh-border shadow-soft space-y-4 transition-colors duration-200">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-display font-medium text-base text-fresh-text">
            Weekly Intake Trend
          </h3>
          <p className="text-xs text-fresh-muted">Daily calories (bars) vs. protein intake (line)</p>
        </div>
        <div className="flex items-center gap-3 text-xs font-medium">
          <span className="flex items-center gap-1.5 text-fresh-muted">
            <Flame className="w-3.5 h-3.5 text-[var(--nutrient-calories-from)]" />
            Calories (kcal)
          </span>
          <span className="flex items-center gap-1.5 text-fresh-muted">
            <Egg className="w-3.5 h-3.5 text-[var(--nutrient-protein)]" />
            Protein (g)
          </span>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="freshCalorieBarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--nutrient-calories-from)" />
                <stop offset="100%" stopColor="var(--nutrient-calories-to)" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.6} />
            <XAxis
              dataKey="day_name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--color-muted)', fontSize: 12, fontWeight: 500 }}
            />
            {/* Left Y Axis for Calories */}
            <YAxis
              yAxisId="left"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--color-muted)', fontSize: 11 }}
            />
            {/* Right Y Axis for Protein */}
            <YAxis
              yAxisId="right"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--nutrient-protein)', fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
                borderRadius: '12px',
                color: 'var(--color-text)',
                fontSize: '12px',
                boxShadow: 'var(--shadow-soft)',
              }}
              formatter={(value: any, name: any) => [
                name === 'calories' ? `${value} kcal` : `${value}g`,
                name === 'calories' ? 'Calories' : 'Protein',
              ]}
            />
            {/* Light dotted target line */}
            <ReferenceLine
              yAxisId="left"
              y={targetCalories}
              stroke="var(--color-primary)"
              strokeDasharray="3 3"
              opacity={0.8}
              label={{
                value: `Goal: ${targetCalories} kcal`,
                fill: 'var(--color-muted)',
                fontSize: 10,
                position: 'insideTopRight',
              }}
            />
            <Bar
              yAxisId="left"
              dataKey="calories"
              fill="url(#freshCalorieBarGrad)"
              radius={[6, 6, 0, 0]}
              barSize={24}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="protein_g"
              stroke="var(--nutrient-protein)"
              strokeWidth={2.5}
              dot={{ r: 3.5, fill: 'var(--nutrient-protein)', strokeWidth: 0 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

