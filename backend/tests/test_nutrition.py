from app.models.food import Food
from app.services.nutrition_service import nutrition_service


def test_calculate_item_nutrition():
    # Mock Food: 130 kcal, 2.7g protein, 0.3g fat, 28.2g carbs, 0.4g fiber
    rice = Food(
        name="Steamed White Rice",
        kcal_per_100g=130.0,
        protein_per_100g=2.7,
        fat_per_100g=0.3,
        carbs_per_100g=28.2,
        fiber_per_100g=0.4
    )

    # 150 grams of rice
    res = nutrition_service.calculate_item_nutrition(grams=150.0, food=rice, has_extra_oil=False)
    assert res["kcal"] == 195.0
    assert res["protein"] == 4.1  # 2.7 * 1.5 = 4.05 -> round 4.1
    assert res["fat"] == 0.4      # 0.3 * 1.5 = 0.45 -> round 0.5 or 0.4
    assert res["carbs"] == 42.3   # 28.2 * 1.5 = 42.3
    assert res["fiber"] == 0.6    # 0.4 * 1.5 = 0.6


def test_extra_oil_ghee_toggle():
    sambar = Food(
        name="Sambar",
        kcal_per_100g=65.0,
        protein_per_100g=3.2,
        fat_per_100g=1.8,
        carbs_per_100g=9.2,
        fiber_per_100g=2.4
    )

    # Normal 100g
    normal = nutrition_service.calculate_item_nutrition(grams=100.0, food=sambar, has_extra_oil=False)
    # Extra ghee 100g
    extra = nutrition_service.calculate_item_nutrition(grams=100.0, food=sambar, has_extra_oil=True)

    # Fat should increase by 5.0g (1.8 + 5.0 = 6.8g)
    assert extra["fat"] == 6.8
    # Kcal should increase by 45.0 kcal (65.0 + 45.0 = 110.0 kcal)
    assert extra["kcal"] == 110.0


def test_unmatched_food_nutrition():
    res = nutrition_service.calculate_item_nutrition(grams=150.0, food=None)
    assert res["kcal"] == 0.0
    assert res["protein"] == 0.0
    assert res["fat"] == 0.0
    assert res["carbs"] == 0.0
    assert res["fiber"] == 0.0


def test_calculate_meal_totals():
    items = [
        {"kcal": 195.0, "protein": 4.1, "fat": 0.5, "carbs": 42.3, "fiber": 0.6},
        {"kcal": 110.0, "protein": 3.2, "fat": 6.8, "carbs": 9.2, "fiber": 2.4}
    ]
    totals = nutrition_service.calculate_meal_totals(items)
    assert totals["total_kcal"] == 305.0
    assert totals["total_protein"] == 7.3
    assert totals["total_fat"] == 7.3
    assert totals["total_carbs"] == 51.5
    assert totals["total_fiber"] == 3.0
