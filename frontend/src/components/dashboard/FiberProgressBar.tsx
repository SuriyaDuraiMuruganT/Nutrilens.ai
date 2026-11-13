import React from 'react';
import { Wheat, CheckCircle2 } from 'lucide-react';

interface FiberProgressBarProps {
  consumed_g: number;
  target_g: number;
}

export const FiberProgressBar: React.FC<FiberProgressBarProps> = ({
  consumed_g,
  target_g,
}) => {
  const percentage = Math.min(100, Math.round((consumed_g / Math.max(1, target_g)) * 100));
  const isGoalReached = consumed_g >= target_g;

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Wheat className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">Dietary Fiber</h4>
            <p className="text-[10px] text-slate-400">Essential for gut health & glycemic control</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-sm font-black text-slate-900">{consumed_g}g</span>
          <span className="text-xs text-slate-400 font-medium"> / {target_g}g</span>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden mt-3 relative">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            isGoalReached ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-emerald-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px]">
        <span className="text-slate-500">{percentage}% completed</span>
        {isGoalReached ? (
          <span className="font-bold text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Goal Achieved!
          </span>
        ) : (
          <span className="text-slate-400 font-medium">
            {(target_g - consumed_g).toFixed(1)}g to go
          </span>
        )}
      </div>
    </div>
  );
};
