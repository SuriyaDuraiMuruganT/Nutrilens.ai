import React, { useState } from 'react';
import { Trash2, Search, Flame, Droplet, Sparkles, Egg, Wheat, Leaf } from 'lucide-react';
import { MealItem, FoodItem } from '../../types';
import { FoodSearchSelect } from './FoodSearchSelect';
import { FoodSearchResultItem } from '../../api/foodsApi';

import { triggerHaptic } from '../../utils/nativeDevice';

interface DishItemCardProps {
  item: MealItem;
  onUpdate: (updatedItem: MealItem) => void;
  onDelete: () => void;
}

export const DishItemCard: React.FC<DishItemCardProps> = ({ item, onUpdate, onDelete }) => {
  const [isSearching, setIsSearching] = useState(false);

  // Quick multipliers
  const baseGrams = item.food?.default_serving_g || 100;

  const handleMultiplier = (factor: number) => {
    triggerHaptic();
    const newGrams = Math.round(baseGrams * factor);
    recalculateNutrients(newGrams, item.food, item.has_extra_oil);
  };

  const handleGramsChange = (newGrams: number) => {
    const validGrams = Math.max(5, Math.min(1000, newGrams || 0));
    recalculateNutrients(validGrams, item.food, item.has_extra_oil);
  };

  const handleOilToggle = () => {
    triggerHaptic();
    const newOil = !item.has_extra_oil;
    recalculateNutrients(item.grams, item.food, newOil);
  };

  const handleFoodSelect = (food: FoodSearchResultItem) => {
    recalculateNutrients(item.grams, food, item.has_extra_oil, food.name);
  };

  const recalculateNutrients = (
    grams: number,
    food?: FoodItem | null,
    has_extra_oil: boolean = false,
    newName?: string
  ) => {
    const ratio = grams / 100.0;
    const baseGrams = item.grams || 100.0;
    const scaleFactor = grams / baseGrams;

    let kcal = food?.kcal_per_100g ? food.kcal_per_100g * ratio : (item.kcal || 0) * scaleFactor;
    let protein = food?.protein_per_100g ? food.protein_per_100g * ratio : (item.protein || 0) * scaleFactor;
    let fat = food?.fat_per_100g ? food.fat_per_100g * ratio : (item.fat || 0) * scaleFactor;
    let carbs = food?.carbs_per_100g ? food.carbs_per_100g * ratio : (item.carbs || 0) * scaleFactor;
    let fiber = food?.fiber_per_100g ? food.fiber_per_100g * ratio : (item.fiber || 0) * scaleFactor;
    let sugar = food?.sugar_per_100g !== undefined ? food.sugar_per_100g * ratio : (item.sugar || 0) * scaleFactor;
    let sodium = food?.sodium_mg_per_100g !== undefined ? food.sodium_mg_per_100g * ratio : (item.sodium || 0) * scaleFactor;

    if (has_extra_oil) {
      const addedFat = 5.0 * ratio;
      fat += addedFat;
      kcal += addedFat * 9.0;
    }

    onUpdate({
      ...item,
      detected_name: newName || item.detected_name,
      food_id: food ? food.id : item.food_id,
      food: food !== undefined ? food : item.food,
      grams,
      has_extra_oil,
      user_edited: true,
      kcal: Math.round(kcal * 10) / 10,
      protein: Math.round(protein * 10) / 10,
      fat: Math.round(fat * 10) / 10,
      carbs: Math.round(carbs * 10) / 10,
      fiber: Math.round(fiber * 10) / 10,
      sugar: Math.round(sugar * 10) / 10,
      sodium: Math.round(sodium * 10) / 10,
    });
  };

  // Confidence tiers per theme principles: high = sage, medium = wheat, low = tomato
  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.75) {
      return {
        label: 'High confidence',
        className: 'bg-fresh-primary-soft text-fresh-primary border-fresh-primary/20',
      };
    } else if (confidence >= 0.5) {
      return {
        label: 'Medium confidence',
        className: 'bg-[var(--nutrient-carbs)]/15 text-[var(--nutrient-carbs)] border-[var(--nutrient-carbs)]/30',
      };
    } else {
      return {
        label: 'Low confidence',
        className: 'bg-fresh-warning-soft text-fresh-warning border-fresh-warning/30',
      };
    }
  };

  const badge = getConfidenceBadge(item.confidence);

  return (
    <div className="p-4 rounded-card border border-fresh-border hover:border-fresh-primary/40 shadow-soft text-fresh-text bg-fresh-surface transition-all duration-200 relative">
      {/* Top row: Name, Confidence badge, Delete button */}
      <div className="flex items-start justify-between gap-3 relative">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-display font-medium text-sm text-fresh-text">{item.detected_name}</h4>

            {/* Confidence Badge */}
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${badge.className}`}>
              <Sparkles className="w-3 h-3" />
              {badge.label} · {Math.round(item.confidence * 100)}%
            </span>

            {item.serving_description && (
              <span className="text-[11px] text-fresh-muted">({item.serving_description})</span>
            )}
          </div>

          {/* Reference Indicator or Swap Button */}
          <div className="mt-1 flex items-center gap-2">
            <button
              onClick={() => setIsSearching(!isSearching)}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-fresh-primary hover:opacity-80 bg-fresh-primary-soft px-2.5 py-1 rounded-btn border border-fresh-primary/20 transition"
            >
              <Search className="w-3 h-3" />
              <span>{item.food ? `${item.food.name} (${item.food.source})` : 'Swap or Adjust Reference Food'}</span>
            </button>
          </div>
        </div>

        <button
          onClick={onDelete}
          className="p-1.5 text-fresh-muted hover:text-fresh-warning hover:bg-fresh-warning-soft rounded-btn transition"
          title="Remove dish"
          aria-label="Remove dish"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        {/* Autocomplete dropdown */}
        {isSearching && (
          <FoodSearchSelect
            currentFoodName={item.detected_name}
            onSelectFood={handleFoodSelect}
            onClose={() => setIsSearching(false)}
          />
        )}
      </div>

      {/* Portion Controls: Slider, Number input, Multiplier buttons */}
      <div className="mt-4 pt-3 border-t border-fresh-border space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            <div className="flex justify-between text-xs font-medium text-fresh-text mb-1">
              <span>Portion Weight</span>
              <span className="font-display font-medium tabular-nums text-fresh-primary">{item.grams} g</span>
            </div>
            <input
              type="range"
              min="10"
              max="600"
              step="5"
              value={item.grams}
              onChange={(e) => handleGramsChange(Number(e.target.value))}
              className="w-full accent-[var(--color-primary)] h-1.5 bg-fresh-surface-alt rounded-lg cursor-pointer"
            />
          </div>

          <div className="w-20">
            <div className="relative">
              <input
                type="number"
                min="5"
                max="1000"
                value={item.grams}
                onChange={(e) => handleGramsChange(Number(e.target.value))}
                className="w-full px-2.5 py-1 text-center font-medium text-xs bg-fresh-surface-alt border border-fresh-border rounded-btn text-fresh-text focus:border-fresh-primary outline-none tabular-nums"
              />
              <span className="absolute right-2 top-1 text-[10px] text-fresh-muted pointer-events-none">g</span>
            </div>
          </div>
        </div>

        {/* Quick multipliers and extra oil toggle */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
          <div className="flex items-center gap-1">
            {[0.5, 1, 1.5, 2].map((factor) => (
              <button
                key={factor}
                onClick={() => handleMultiplier(factor)}
                className="px-2.5 py-0.5 rounded-btn text-[11px] font-medium bg-fresh-surface-alt hover:bg-fresh-border border border-fresh-border text-fresh-text transition"
              >
                {factor}x
              </button>
            ))}
          </div>

          {/* Extra Oil Toggle */}
          <button
            onClick={handleOilToggle}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-btn text-[11px] font-medium transition border ${
              item.has_extra_oil
                ? 'bg-fresh-accent/20 text-fresh-text border-fresh-accent'
                : 'bg-fresh-surface-alt text-fresh-muted hover:text-fresh-text border-fresh-border'
            }`}
          >
            <Droplet className="w-3.5 h-3.5 text-[var(--nutrient-fat)]" />
            <span>Extra oil (+45 kcal)</span>
          </button>
        </div>
      </div>

      {/* Calculated Nutrient totals pill */}
      <div className="mt-3 pt-2.5 border-t border-fresh-border flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 font-display font-medium text-[var(--nutrient-calories-from)] tabular-nums">
          <Flame className="w-3.5 h-3.5 text-[var(--nutrient-calories-from)]" />
          <span>{item.kcal} kcal</span>
        </div>
        <div className="flex items-center gap-2.5 text-[11px] font-medium flex-wrap justify-end">
          <span className="flex items-center gap-1 text-[var(--nutrient-protein)]">
            <Egg className="w-3 h-3" />
            <strong className="font-semibold tabular-nums">{item.protein}g</strong> Protein
          </span>
          <span className="text-fresh-border">·</span>
          <span className="flex items-center gap-1 text-[var(--nutrient-carbs)]">
            <Wheat className="w-3 h-3" />
            <strong className="font-semibold tabular-nums">{item.carbs}g</strong> Carbs
          </span>
          <span className="text-fresh-border">·</span>
          <span className="flex items-center gap-1 text-[var(--nutrient-fat)]">
            <Droplet className="w-3 h-3" />
            <strong className="font-semibold tabular-nums">{item.fat}g</strong> Fat
          </span>
          {item.fiber > 0 && (
            <>
              <span className="text-fresh-border">·</span>
              <span className="flex items-center gap-1 text-[var(--nutrient-fiber)]">
                <Leaf className="w-3 h-3" />
                <strong className="font-semibold tabular-nums">{item.fiber}g</strong> Fiber
              </span>
            </>
          )}
        </div>
      </div>

      {/* Food-Specific Nutrition Facts (Only displays facts this food actually contains) */}
      {((item.sugar && item.sugar > 0) ||
        (item.added_sugars && item.added_sugars > 0) ||
        (item.saturated_fat && item.saturated_fat > 0) ||
        (item.trans_fat && item.trans_fat > 0) ||
        (item.cholesterol && item.cholesterol > 0) ||
        (item.sodium && item.sodium > 0)) && (
        <div className="mt-2.5 pt-2 border-t border-dashed border-fresh-border/80 flex items-center flex-wrap gap-1.5 text-[10px]">
          <span className="text-fresh-muted uppercase tracking-wider font-semibold mr-1">Food Facts:</span>
          {item.sugar !== undefined && item.sugar > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-fresh-surface-alt border border-fresh-border text-fresh-text">
              Sugar: <strong className="font-medium text-fresh-primary">{item.sugar}g</strong>
            </span>
          )}
          {item.added_sugars !== undefined && item.added_sugars !== null && item.added_sugars > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400">
              Added Sugars: <strong className="font-medium">{item.added_sugars}g</strong>
            </span>
          )}
          {item.saturated_fat !== undefined && item.saturated_fat !== null && item.saturated_fat > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-600 dark:text-orange-400">
              Sat Fat: <strong className="font-medium">{item.saturated_fat}g</strong>
            </span>
          )}
          {item.trans_fat !== undefined && item.trans_fat !== null && item.trans_fat > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400">
              Trans Fat: <strong className="font-medium">{item.trans_fat}g</strong>
            </span>
          )}
          {item.cholesterol !== undefined && item.cholesterol !== null && item.cholesterol > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400">
              Cholesterol: <strong className="font-medium">{item.cholesterol}mg</strong>
            </span>
          )}
          {item.sodium !== undefined && item.sodium > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-fresh-surface-alt border border-fresh-border text-fresh-text">
              Sodium: <strong className="font-medium">{item.sodium}mg</strong>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

