from typing import Dict, List, Optional
from app.models.food import Food


class NutritionService:
    @staticmethod
    def calculate_item_nutrition(
        grams: float,
        food: Optional[Food] = None,
        has_extra_oil: bool = False
    ) -> Dict[str, float]:
        """
        Calculates nutritional values for a given portion in grams.
        Formula: nutrient = per_100g_value * grams / 100.0
        If has_extra_oil is True: adds 5g fat & 45 kcal per 100g.
        """
        grams = max(0.0, float(grams))
        ratio = grams / 100.0

        if not food:
            return {
                "kcal": 0.0,
                "protein": 0.0,
                "fat": 0.0,
                "carbs": 0.0,
                "fiber": 0.0,
                "sugar": 0.0,
                "sodium": 0.0,
            }

        kcal = food.kcal_per_100g * ratio
        protein = food.protein_per_100g * ratio
        fat = food.fat_per_100g * ratio
        carbs = food.carbs_per_100g * ratio
        fiber = food.fiber_per_100g * ratio
        sugar = (getattr(food, "sugar_per_100g", 0.0) or 0.0) * ratio
        sodium = (getattr(food, "sodium_mg_per_100g", 0.0) or 0.0) * ratio

        if has_extra_oil:
            added_fat = 5.0 * ratio
            added_kcal = added_fat * 9.0
            fat += added_fat
            kcal += added_kcal

        return {
            "kcal": round(kcal, 1),
            "protein": round(protein, 1),
            "fat": round(fat, 1),
            "carbs": round(carbs, 1),
            "fiber": round(fiber, 1),
            "sugar": round(sugar, 1),
            "sodium": round(sodium, 1),
        }

    @staticmethod
    def calculate_meal_totals(items: List[Dict[str, float]]) -> Dict[str, float]:
        """Sums totals for all items in a meal."""
        totals = {
            "total_kcal": 0.0,
            "total_protein": 0.0,
            "total_fat": 0.0,
            "total_carbs": 0.0,
            "total_fiber": 0.0,
            "total_sugar": 0.0,
            "total_sodium": 0.0,
        }
        for it in items:
            totals["total_kcal"] += it.get("kcal", 0.0)
            totals["total_protein"] += it.get("protein", 0.0)
            totals["total_fat"] += it.get("fat", 0.0)
            totals["total_carbs"] += it.get("carbs", 0.0)
            totals["total_fiber"] += it.get("fiber", 0.0)
            totals["total_sugar"] += it.get("sugar", 0.0)
            totals["total_sodium"] += it.get("sodium", 0.0)

        return {k: round(v, 1) for k, v in totals.items()}


nutrition_service = NutritionService()
