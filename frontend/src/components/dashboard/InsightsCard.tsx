import React from 'react';
import { Lightbulb } from 'lucide-react';

interface InsightsCardProps {
  insights: string[];
}

export const InsightsCard: React.FC<InsightsCardProps> = ({ insights }) => {
  if (!insights || insights.length === 0) return null;

  return (
    <div className="bg-fresh-surface rounded-card p-5 border border-fresh-border shadow-soft space-y-3 transition-colors duration-200">
      <div className="flex items-center gap-2 text-xs font-medium text-fresh-primary uppercase tracking-wider">
        <Lightbulb className="w-4 h-4 text-fresh-primary" />
        <span>Nutrition Insights</span>
      </div>

      <div className="space-y-2">
        {insights.map((insight, idx) => (
          <div
            key={idx}
            className="flex items-start gap-2.5 text-xs text-fresh-text bg-fresh-surface-alt/70 p-3 rounded-btn border border-fresh-border transition-colors"
          >
            <span className="leading-relaxed font-normal">{insight}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
