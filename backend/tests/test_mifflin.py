from app.services.profile_service import profile_service


def test_mifflin_st_jeor_male():
    # Male: 70kg, 175cm, 25yr
    # BMR = (10*70) + (6.25*175) - (5*25) + 5 = 700 + 1093.75 - 125 + 5 = 1673.75 -> 1673.8
    # Moderate activity (1.55) -> 1673.75 * 1.55 = 2594.3 -> ~2594 kcal
    res = profile_service.calculate_mifflin_st_jeor(
        age=25,
        sex="male",
        height_cm=175.0,
        weight_kg=70.0,
        activity_level="moderate",
        goal="maintain"
    )
    assert res["bmr"] == 1673.8
    assert res["calculated_kcal"] == 2594
    assert res["clamped_kcal"] == 2594
    assert not res["is_clamped_by_safety"]
    assert res["protein_g"] > 0
    assert res["fat_g"] > 0
    assert res["carbs_g"] > 0


def test_mifflin_st_jeor_female():
    # Female: 60kg, 160cm, 30yr
    # BMR = (10*60) + (6.25*160) - (5*30) - 161 = 600 + 1000 - 150 - 161 = 1289.0
    # Sedentary (1.2) -> 1289 * 1.2 = 1546.8 -> ~1547 kcal
    res = profile_service.calculate_mifflin_st_jeor(
        age=30,
        sex="female",
        height_cm=160.0,
        weight_kg=60.0,
        activity_level="sedentary",
        goal="maintain"
    )
    assert res["bmr"] == 1289.0
    assert res["calculated_kcal"] == 1547
    assert res["clamped_kcal"] == 1547
    assert not res["is_clamped_by_safety"]


def test_mifflin_safety_guardrail_clamping():
    # Tiny female, older age, aggressive deficit
    # Female: 42kg, 145cm, 65yr
    # BMR = (10*42) + (6.25*145) - (5*65) - 161 = 420 + 906.25 - 325 - 161 = 840.25
    # Sedentary (1.2) = 1008.3
    # Goal: "lose" (-500) -> 508 kcal -> must be clamped to 1200!
    res = profile_service.calculate_mifflin_st_jeor(
        age=65,
        sex="female",
        height_cm=145.0,
        weight_kg=42.0,
        activity_level="sedentary",
        goal="lose"
    )
    assert res["calculated_kcal"] < 1200
    assert res["clamped_kcal"] == 1200
    assert res["is_clamped_by_safety"] is True
    assert "1,200 kcal/day" in res["message"]
