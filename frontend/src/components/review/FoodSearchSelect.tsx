import React, { useState, useEffect, useRef } from 'react';
import { Search, Check, Sparkles } from 'lucide-react';
import { foodsApi, FoodSearchResultItem } from '../../api/foodsApi';

interface FoodSearchSelectProps {
  currentFoodName: string;
  onSelectFood: (food: FoodSearchResultItem) => void;
  onClose: () => void;
}

export const FoodSearchSelect: React.FC<FoodSearchSelectProps> = ({
  currentFoodName,
  onSelectFood,
  onClose,
}) => {
  const [query, setQuery] = useState(currentFoodName || '');
  const [results, setResults] = useState<FoodSearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    const fetchFoods = async () => {
      setIsLoading(true);
      try {
        const data = await foodsApi.search(query, 12);
        if (active) setResults(data);
      } catch (e) {
        console.error(e);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    const timer = setTimeout(fetchFoods, 200);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={containerRef}
      className="absolute top-full left-0 right-0 mt-2 z-50 bg-fresh-surface rounded-card shadow-soft-lg border border-fresh-border overflow-hidden transition-colors duration-200"
    >
      {/* Search Input Bar */}
      <div className="p-3 border-b border-fresh-border flex items-center gap-2 bg-fresh-surface-alt">
        <Search className="w-4 h-4 text-fresh-muted shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search verified food items..."
          autoFocus
          className="w-full bg-transparent text-sm font-medium text-fresh-text placeholder:text-fresh-muted outline-none"
        />
        {isLoading && <span className="text-[11px] text-fresh-muted animate-pulse">Searching...</span>}
      </div>

      {/* Results List */}
      <div className="max-h-64 overflow-y-auto divide-y divide-fresh-border">
        {results.length === 0 && !isLoading ? (
          <div className="p-4 text-center text-xs text-fresh-muted">
            No exact database match. Try a common food name (e.g. "Rice", "Salad", "Oatmeal", "Soup").
          </div>
        ) : (
          results.map((food) => (
            <button
              key={food.id}
              onClick={() => {
                onSelectFood(food);
                onClose();
              }}
              className="w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-fresh-surface-alt transition group"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-medium text-sm text-fresh-text group-hover:text-fresh-primary">
                    {food.name}
                  </span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-fresh-surface-alt border border-fresh-border text-fresh-muted">
                    {food.category}
                  </span>
                  {food.match_score && food.match_score > 90 && (
                    <span className="text-[10px] font-medium text-fresh-primary flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" /> High Match
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-fresh-muted mt-0.5 tabular-nums">
                  <span className="text-[var(--nutrient-calories-from)] font-semibold">{food.kcal_per_100g} kcal</span> ·{' '}
                  <span className="text-[var(--nutrient-protein)]">{food.protein_per_100g}g P</span> ·{' '}
                  <span className="text-[var(--nutrient-carbs)]">{food.carbs_per_100g}g C</span> ·{' '}
                  <span className="text-[var(--nutrient-fat)]">{food.fat_per_100g}g F</span> ·{' '}
                  <span className="text-[var(--nutrient-fiber)]">{food.fiber_per_100g}g Fiber</span> per 100g
                </p>
              </div>
              <Check className="w-4 h-4 text-fresh-primary opacity-0 group-hover:opacity-100 transition" />
            </button>
          ))
        )}
      </div>
    </div>
  );
};

