import React, { useState } from 'react';
import {
  X,
  Flame,
  Plus,
  Sparkles,
  AlertCircle,
  Save,
  Egg,
  Wheat,
  Droplet,
  Leaf,
  Info,
} from 'lucide-react';
import { DishItemCard } from './DishItemCard';
import { mealsApi } from '../../api/mealsApi';
import { AnalyzedMealResponse, MealItem } from '../../types';

interface MealReviewModalProps {
  initialAnalysis: AnalyzedMealResponse;
  previewUrl: string;
  onSaveSuccess: () => void;
  onClose: () => void;
}

export const MealReviewModal: React.FC<MealReviewModalProps> = ({
  initialAnalysis,
  previewUrl,
  onSaveSuccess,
  onClose,
}) => {
  const [items, setItems] = useState<MealItem[]>(initialAnalysis.items || []);
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'snack' | 'dinner'>(
    initialAnalysis.meal_type || 'lunch'
  );
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Compute live totals with tabular numbers
  const totalKcal = Math.round(items.reduce((sum, it) => sum + (it.kcal || 0), 0) * 10) / 10;
  const totalProtein = Math.round(items.reduce((sum, it) => sum + (it.protein || 0), 0) * 10) / 10;
  const totalFat = Math.round(items.reduce((sum, it) => sum + (it.fat || 0), 0) * 10) / 10;
  const totalCarbs = Math.round(items.reduce((sum, it) => sum + (it.carbs || 0), 0) * 10) / 10;
  const totalFiber = Math.round(items.reduce((sum, it) => sum + (it.fiber || 0), 0) * 10) / 10;
  const totalSugar = Math.round(items.reduce((sum, it) => sum + (it.sugar || 0), 0) * 10) / 10;
  const totalSodium = Math.round(items.reduce((sum, it) => sum + (it.sodium || 0), 0));

  const handleUpdateItem = (index: number, updated: MealItem) => {
    const updatedItems = [...items];
    updatedItems[index] = updated;
    setItems(updatedItems);
  };

  const handleDeleteItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleAddMissingItem = () => {
    const newItem: MealItem = {
      food_id: null,
      detected_name: 'Custom Dish',
      grams: 100,
      serving_description: '1 standard serving',
      confidence: 1.0,
      user_edited: true,
      has_extra_oil: false,
      kcal: 120,
      protein: 4,
      fat: 3,
      carbs: 15,
      fiber: 1,
      sugar: 1,
      sodium: 50,
    };
    setItems([...items, newItem]);
  };

  const handleSaveMeal = async () => {
    if (items.length === 0) {
      setErrorMsg('Please add at least one dish item before saving.');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMsg(null);

      await mealsApi.createMeal({
        meal_type: mealType,
        image_path: initialAnalysis.image_path,
        eaten_at: new Date().toISOString(),
        items: items.map((it) => ({
          food_id: it.food_id,
          detected_name: it.detected_name,
          grams: it.grams,
          serving_description: it.serving_description,
          confidence: it.confidence,
          user_edited: it.user_edited,
          has_extra_oil: it.has_extra_oil,
          kcal: it.kcal,
          protein: it.protein,
          fat: it.fat,
          carbs: it.carbs,
          fiber: it.fiber,
          sugar: it.sugar || 0,
          sodium: it.sodium || 0,
        })),
      });

      setIsSaving(false);
      onSaveSuccess();
    } catch (e: any) {
      setIsSaving(false);
      setErrorMsg(e.response?.data?.detail || e.message || 'Failed to save meal.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-fresh-text/50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-fresh-surface text-fresh-text rounded-card shadow-soft-lg border border-fresh-border w-full max-w-5xl my-auto overflow-hidden flex flex-col max-h-[92vh] transition-colors duration-200">
        {/* Top Modal Header */}
        <div className="px-6 py-4 border-b border-fresh-border flex items-center justify-between bg-fresh-surface-alt">
          <div>
            <h2 className="font-display font-medium text-lg text-fresh-text flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-fresh-primary" />
              Review Dishes & Portions
            </h2>
            <p className="text-xs text-fresh-muted mt-0.5">
              Refine detected dishes and adjust portion sliders to match your plate
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-fresh-muted hover:text-fresh-text hover:bg-fresh-surface rounded-btn border border-fresh-border transition"
            title="Close review"
            aria-label="Close review"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: 2 columns on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto divide-y lg:divide-y-0 lg:divide-x divide-fresh-border">
          {/* Left Column: Image preview, Meal Type & Totals (lg:col-span-5) */}
          <div className="lg:col-span-5 p-6 space-y-5 bg-fresh-surface-alt/40">
            {/* Plate Photo Preview */}
            <div className="relative rounded-card overflow-hidden border border-fresh-border bg-fresh-surface aspect-video shadow-soft">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Meal preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-fresh-muted">
                  No meal photo available
                </div>
              )}
            </div>

            {/* Meal Type Selector (pill chips) */}
            <div>
              <label className="block text-xs font-medium text-fresh-muted mb-1.5 uppercase tracking-wider">
                Meal Category
              </label>
              <div className="grid grid-cols-4 gap-1.5 p-1 bg-fresh-surface rounded-full border border-fresh-border">
                {(['breakfast', 'lunch', 'snack', 'dinner'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setMealType(type)}
                    className={`py-1.5 text-xs font-medium rounded-full capitalize transition ${
                      mealType === type
                        ? 'bg-fresh-primary text-fresh-on-primary shadow-soft'
                        : 'text-fresh-muted hover:text-fresh-text'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Recalculated Totals Panel */}
            <div className="p-4 rounded-card bg-fresh-surface border border-fresh-border shadow-soft space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-fresh-muted uppercase tracking-wider">
                  Total Energy
                </span>
                <span className="font-display font-medium text-xl text-[var(--nutrient-calories-from)] flex items-center gap-1.5 tabular-nums">
                  <Flame className="w-5 h-5 text-[var(--nutrient-calories-from)]" />
                  {totalKcal} kcal
                </span>
              </div>

              {/* Nutrient Breakdown Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-fresh-border text-center">
                {/* Protein */}
                <div className="p-2 rounded-btn border border-[var(--nutrient-protein)]/30 bg-[var(--nutrient-protein)]/10">
                  <p className="text-[10px] font-medium uppercase flex items-center justify-center gap-1 text-[var(--nutrient-protein)]">
                    <Egg className="w-3 h-3" /> Protein
                  </p>
                  <p className="font-display font-medium text-sm text-fresh-text tabular-nums">{totalProtein}g</p>
                </div>

                {/* Carbs */}
                <div className="p-2 rounded-btn border border-[var(--nutrient-carbs)]/30 bg-[var(--nutrient-carbs)]/10">
                  <p className="text-[10px] font-medium uppercase flex items-center justify-center gap-1 text-[var(--nutrient-carbs)]">
                    <Wheat className="w-3 h-3" /> Carbs
                  </p>
                  <p className="font-display font-medium text-sm text-fresh-text tabular-nums">{totalCarbs}g</p>
                </div>

                {/* Fat */}
                <div className="p-2 rounded-btn border border-[var(--nutrient-fat)]/30 bg-[var(--nutrient-fat)]/10">
                  <p className="text-[10px] font-medium uppercase flex items-center justify-center gap-1 text-[var(--nutrient-fat)]">
                    <Droplet className="w-3 h-3" /> Fat
                  </p>
                  <p className="font-display font-medium text-sm text-fresh-text tabular-nums">{totalFat}g</p>
                </div>

                {/* Fiber */}
                <div className="p-2 rounded-btn border border-[var(--nutrient-fiber)]/30 bg-[var(--nutrient-fiber)]/10">
                  <p className="text-[10px] font-medium uppercase flex items-center justify-center gap-1 text-[var(--nutrient-fiber)]">
                    <Leaf className="w-3 h-3" /> Fiber
                  </p>
                  <p className="font-display font-medium text-sm text-fresh-text tabular-nums">{totalFiber}g</p>
                </div>
              </div>
            </div>


          </div>

          {/* Right Column: Dish Items List (lg:col-span-7) */}
          <div className="lg:col-span-7 p-6 flex flex-col space-y-4 bg-fresh-surface">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-medium text-sm text-fresh-text">
                Detected Dishes ({items.length})
              </h3>
              <button
                onClick={handleAddMissingItem}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-btn text-xs font-medium bg-fresh-primary-soft text-fresh-primary border border-fresh-primary/20 hover:opacity-90 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-fresh-warning-soft border border-fresh-warning/30 rounded-card text-xs text-fresh-warning font-medium">
                {errorMsg}
              </div>
            )}

            {/* List of Dish Items */}
            <div className="space-y-3.5 flex-1 overflow-y-auto pr-1">
              {items.map((dishItem, index) => (
                <DishItemCard
                  key={index}
                  item={dishItem}
                  onUpdate={(updated) => handleUpdateItem(index, updated)}
                  onDelete={() => handleDeleteItem(index)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-fresh-border flex items-center justify-between bg-fresh-surface-alt">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-btn text-xs font-medium text-fresh-muted hover:text-fresh-text border border-fresh-border bg-fresh-surface hover:bg-fresh-surface-alt transition"
          >
            Cancel
          </button>

          <button
            onClick={handleSaveMeal}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-btn bg-fresh-primary hover:opacity-90 active:scale-[0.98] disabled:opacity-50 text-fresh-on-primary font-medium text-sm shadow-soft transition"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Confirm & Save Meal'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

