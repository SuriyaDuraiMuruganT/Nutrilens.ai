from typing import Dict, Any


class ProfileService:
    @staticmethod
    def calculate_mifflin_st_jeor(
        age: int,
        sex: str,
        height_cm: float,
        weight_kg: float,
        activity_level: str = "sedentary",
        goal: str = "maintain"
    ) -> Dict[str, Any]:
        """
        Calculates BMR and TDEE using the Mifflin-St Jeor equation.
        Enforces a strict 1200 kcal/day floor guardrail.
        """
        # 1. BMR Calculation
        if sex.lower() == "female":
            bmr = (10.0 * weight_kg) + (6.25 * height_cm) - (5.0 * age) - 161.0
        else:  # default to male
            bmr = (10.0 * weight_kg) + (6.25 * height_cm) - (5.0 * age) + 5.0

        # 2. Activity Multiplier
        multipliers = {
            "sedentary": 1.2,
            "light": 1.375,
            "moderate": 1.55,
            "active": 1.725,
            "very_active": 1.9
        }
        activity_factor = multipliers.get(activity_level.lower(), 1.2)
        tdee = bmr * activity_factor

        # 3. Goal Adjustment
        adjustments = {
            "lose": -500,
            "maintain": 0,
            "gain": 400
        }
        calculated_target = int(round(tdee + adjustments.get(goal.lower(), 0)))

        # 4. Safety Guardrail: 1200 kcal/day minimum
        is_clamped = False
        message = None
        if calculated_target < 1200:
            clamped_target = 1200
            is_clamped = True
            message = "Calorie target has been set to the safe minimum of 1,200 kcal/day. For very low calorie medical diets, please consult a healthcare professional."
        else:
            clamped_target = calculated_target

        # 5. Default Macro Targets
        # Protein: 1.8g per kg or ~25% of calories
        protein_g = round(max(weight_kg * 1.8, (clamped_target * 0.25) / 4.0), 1)
        # Fat: ~25% of calories
        fat_g = round((clamped_target * 0.25) / 9.0, 1)
        # Fiber: ~14g per 1000 kcal (min 25g)
        fiber_g = round(max(25.0, (clamped_target / 1000.0) * 14.0), 1)
        # Carbs: Remaining calories
        protein_kcal = protein_g * 4.0
        fat_kcal = fat_g * 9.0
        remaining_kcal = max(0.0, clamped_target - (protein_kcal + fat_kcal))
        carbs_g = round(remaining_kcal / 4.0, 1)

        return {
            "bmr": round(bmr, 1),
            "tdee": round(tdee, 1),
            "calculated_kcal": calculated_target,
            "clamped_kcal": clamped_target,
            "is_clamped_by_safety": is_clamped,
            "protein_g": protein_g,
            "fat_g": fat_g,
            "carbs_g": carbs_g,
            "fiber_g": fiber_g,
            "message": message
        }


profile_service = ProfileService()
