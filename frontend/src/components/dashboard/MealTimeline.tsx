import React from 'react';
import { Clock, Trash2, Plus, Flame, Check, AlertCircle } from 'lucide-react';
import { Meal } from '../../types';

interface MealTimelineProps {
  meals: Meal[];
  onSelectMeal: (meal: Meal) => void;
  onDeleteMeal: (mealId: number) => void;
  onOpenUpload: () => void;
}

export const MealTimeline: React.FC<MealTimelineProps> = ({
  meals,
  onSelectMeal,
  onDeleteMeal,
  onOpenUpload,
}) => {
  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const getMealBadgeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'breakfast':
        return 'bg-fresh-surface-alt text-fresh-text border-fresh-border';
      case 'lunch':
        return 'bg-fresh-primary-soft text-fresh-primary border-fresh-primary/20';
      case 'snack':
        return 'bg-fresh-surface-alt text-fresh-muted border-fresh-border';
      case 'dinner':
        return 'bg-fresh-surface-alt text-fresh-text border-fresh-border';
      default:
        return 'bg-fresh-surface-alt text-fresh-muted border-fresh-border';
    }
  };

  // Confidence badges: high = sage, medium = wheat, low = tomato, each with a text label
  const getConfidenceBadge = (items: Meal['items']) => {
    if (!items || items.length === 0) return null;
    const avg = items.reduce((acc, it) => acc + (it.confidence ?? 0.9), 0) / items.length;

    if (avg >= 0.85) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-fresh-primary-soft text-fresh-primary border border-fresh-primary/20">
          <Check className="w-3 h-3 text-fresh-primary" />
          High Confidence
        </span>
      );
    }
    if (avg >= 0.6) {
      return (
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border"
          style={{
            backgroundColor: 'rgba(229, 185, 106, 0.15)',
            borderColor: 'rgba(229, 185, 106, 0.4)',
            color: 'rgb(var(--color-text))',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--nutrient-carbs)' }} />
          Medium Confidence
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-fresh-warning-soft text-fresh-warning border border-fresh-warning/20">
        <AlertCircle className="w-3 h-3 text-fresh-warning" />
        Low Confidence
      </span>
    );
  };

  if (meals.length === 0) {
    return (
      <div className="bg-fresh-surface rounded-card p-8 border border-fresh-border shadow-soft text-center transition-colors duration-200">
        {/* Simple line illustration of plate with fork and spoon */}
        <div className="w-20 h-20 mx-auto mb-3 flex items-center justify-center text-fresh-primary">
          <svg viewBox="0 0 80 80" className="w-full h-full stroke-current" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            {/* Plate outer circle */}
            <circle cx="40" cy="40" r="30" />
            {/* Plate inner rim */}
            <circle cx="40" cy="40" r="21" strokeDasharray="2 3" opacity="0.6" />
            {/* Fork on left */}
            <path d="M22 28v14M20 28v7a2 2 0 002 2h0a2 2 0 002-2v-7M22 42v12" />
            {/* Spoon on right */}
            <path d="M58 28c-3 0-5 3.5-5 7s2 7 5 7 5-3.5 5-7-2-7-5-7zM58 42v12" />
          </svg>
        </div>
        <h3 className="font-display font-medium text-base text-fresh-text mb-1">
          Your plate is empty today
        </h3>
        <p className="text-xs text-fresh-muted max-w-sm mx-auto mb-5 leading-relaxed">
          Add your first meal by capturing or uploading a photo. NutriLens will estimate dishes and nutrients quietly.
        </p>
        <button
          onClick={onOpenUpload}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-btn bg-fresh-primary hover:opacity-90 active:scale-95 text-fresh-on-primary font-medium text-xs shadow-soft transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add First Meal</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-fresh-surface rounded-card p-6 border border-fresh-border shadow-soft transition-colors duration-200">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-fresh-border">
        <div>
          <h2 className="font-display font-medium text-base text-fresh-text">
            Today's Logged Meals
          </h2>
          <p className="text-xs text-fresh-muted">
            {meals.length} {meals.length === 1 ? 'meal' : 'meals'} recorded today
          </p>
        </div>
        <button
          onClick={onOpenUpload}
          className="inline-flex items-center gap-1 text-xs font-medium text-fresh-primary hover:opacity-90 bg-fresh-primary-soft px-3 py-1.5 rounded-btn border border-fresh-primary/20 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Meal</span>
        </button>
      </div>

      <div className="divide-y divide-fresh-border">
        {meals.map((meal) => {
          const totalMacroGrams =
            (meal.total_protein || 0) + (meal.total_carbs || 0) + (meal.total_fat || 0) + (meal.total_fiber || 0) || 1;
          const pWidth = ((meal.total_protein || 0) / totalMacroGrams) * 100;
          const cWidth = ((meal.total_carbs || 0) / totalMacroGrams) * 100;
          const fWidth = ((meal.total_fat || 0) / totalMacroGrams) * 100;
          const fibWidth = ((meal.total_fiber || 0) / totalMacroGrams) * 100;

          return (
            <div
              key={meal.id}
              className="py-3.5 first:pt-1 last:pb-1 flex items-center justify-between gap-4 group hover:bg-fresh-surface-alt/50 p-2.5 rounded-btn transition-colors cursor-pointer"
              onClick={() => onSelectMeal(meal)}
            >
              {/* Left: Circular Thumbnail & Details */}
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                {/* Circular photo thumbnail */}
                <div className="w-12 h-12 rounded-full overflow-hidden bg-fresh-surface-alt border border-fresh-border shrink-0 relative">
                  {meal.image_path ? (
                    <img
                      src={`/uploads/${meal.image_path}`}
                      alt={`Photo of ${meal.meal_type}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-fresh-muted text-xs">
                      Meal
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider border ${getMealBadgeColor(
                        meal.meal_type
                      )}`}
                    >
                      {meal.meal_type}
                    </span>
                    <span className="text-xs text-fresh-muted flex items-center gap-1 font-normal tabular-nums">
                      <Clock className="w-3 h-3 text-fresh-muted" />
                      {formatTime(meal.eaten_at)}
                    </span>
                    {getConfidenceBadge(meal.items)}
                  </div>

                  {/* Dish Chips (Pill-shaped, surface-alt background) */}
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {meal.items.map((it, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center text-[11px] font-normal px-2.5 py-0.5 rounded-full bg-fresh-surface-alt border border-fresh-border text-fresh-text"
                      >
                        {it.detected_name} <span className="text-fresh-muted ml-1 tabular-nums">({it.grams}g)</span>
                      </span>
                    ))}
                  </div>

                  {/* Tiny Macro Bars */}
                  <div className="w-full max-w-xs bg-fresh-surface-alt rounded-full h-1.5 overflow-hidden flex border border-fresh-border/50 mt-1">
                    <div style={{ width: `${pWidth}%`, backgroundColor: 'var(--nutrient-protein)' }} title={`Protein: ${meal.total_protein}g`} />
                    <div style={{ width: `${cWidth}%`, backgroundColor: 'var(--nutrient-carbs)' }} title={`Carbs: ${meal.total_carbs}g`} />
                    <div style={{ width: `${fWidth}%`, backgroundColor: 'var(--nutrient-fat)' }} title={`Fat: ${meal.total_fat}g`} />
                    <div style={{ width: `${fibWidth}%`, backgroundColor: 'var(--nutrient-fiber)' }} title={`Fiber: ${meal.total_fiber}g`} />
                  </div>

                  {/* Nutrient Text with Colors */}
                  <div className="text-[11px] text-fresh-muted font-normal flex flex-wrap gap-x-2 pt-0.5">
                    <span className="tabular-nums" style={{ color: 'var(--nutrient-protein)' }}>{meal.total_protein}g Protein</span>
                    <span>·</span>
                    <span className="tabular-nums" style={{ color: 'var(--nutrient-carbs)' }}>{meal.total_carbs}g Carbs</span>
                    <span>·</span>
                    <span className="tabular-nums" style={{ color: 'var(--nutrient-fat)' }}>{meal.total_fat}g Fat</span>
                    <span>·</span>
                    <span className="tabular-nums" style={{ color: 'var(--nutrient-fiber)' }}>{meal.total_fiber}g Fiber</span>
                  </div>
                </div>
              </div>

              {/* Right: Calories & Action Buttons */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <span className="text-base font-display font-medium text-fresh-text flex items-center justify-end gap-1 tabular-nums">
                    <Flame className="w-3.5 h-3.5 text-nutrient-calories" />
                    {Math.round(meal.total_kcal)}
                  </span>
                  <span className="text-[10px] text-fresh-muted font-medium uppercase tracking-wider">kcal</span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteMeal(meal.id);
                  }}
                  className="p-1.5 text-fresh-muted hover:text-fresh-warning hover:bg-fresh-warning-soft rounded-full transition"
                  title="Remove this meal"
                  aria-label="Remove this meal"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
