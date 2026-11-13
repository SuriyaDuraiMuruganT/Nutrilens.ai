import httpx
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

base_url = 'http://127.0.0.1:8000/api'
client = httpx.Client(timeout=10.0)

print("=== 1. HEALTH CHECK ===")
res = client.get(f"{base_url}/health")
print("Health:", res.status_code, res.json())

test_images = [
    ("Thali", r"z:\xz\backend\test_images\thali_plate.jpg"),
    ("Idli Combo", r"z:\xz\backend\test_images\idli_vada_plate.jpg"),
    ("Biryani", r"z:\xz\backend\test_images\chicken_biryani.jpg"),
    ("Burger & Fries", r"z:\xz\backend\test_images\burger_and_fries.jpg"),
    ("Empty Plate", r"z:\xz\backend\test_images\empty_plate.jpg"),
]

print("\n=== 2. ANALYZING ALL 5 TEST SCENARIOS ===")
saved_analysis = None
for name, img_path in test_images:
    with open(img_path, "rb") as f:
        r = client.post(f"{base_url}/analyze", files={"file": (img_path.split("\\")[-1], f, "image/jpeg")})
    data = r.json()
    print(f"Scenario [{name}]: is_food={data['is_food']}, items={len(data['items'])}, kcal={data['total_kcal']}")
    for it in data['items']:
        matched_str = f"-> Matched: {it['food']['name']}" if it.get("food") else "-> UNMATCHED"
        print(f"   - {it['detected_name']} ({it['grams']}g): {it['kcal']} kcal, P:{it['protein']}g, C:{it['carbs']}g, F:{it['fat']}g {matched_str}")
    if name == "Thali":
        saved_analysis = data

print("\n=== 3. SAVING MEAL TO DATABASE WITH PORTION EDIT & GHEE TOGGLE ===")
# Modify portion: 1.5x Rice (225g) and toggle extra ghee on Sambar
edited_items = []
for it in saved_analysis['items']:
    grams = it['grams'] * 1.5 if "Rice" in it['detected_name'] else it['grams']
    has_ghee = "Sambar" in it['detected_name']
    item_dict = {
        "food_id": it["food_id"],
        "detected_name": it["detected_name"],
        "grams": grams,
        "serving_description": it["serving_description"],
        "confidence": it["confidence"],
        "user_edited": "Rice" in it["detected_name"],
        "has_extra_oil": has_ghee
    }
    edited_items.append(item_dict)

meal_res = client.post(f"{base_url}/meals", json={
    "meal_type": "lunch",
    "image_path": saved_analysis["image_path"],
    "items": edited_items
})
saved_meal = meal_res.json()
print("Meal saved successfully! ID:", saved_meal["id"], "Total Kcal:", saved_meal["total_kcal"], "Protein:", saved_meal["total_protein"], "Fat:", saved_meal["total_fat"])

print("\n=== 4. DAILY DASHBOARD UPDATE ===")
dash = client.get(f"{base_url}/dashboard/daily").json()
print("Consumed:", dash["consumed"])
print("Remaining:", dash["remaining"])
print("Percentage of Goal:", dash["percentage"], "%")
print("Logged Meals Count:", len(dash["meals"]))
print("Insights Generated:", dash["insights"])

print("\n=== 5. PROFILE & MIFFLIN-ST JEOR CALCULATION ===")
mifflin = client.post(f"{base_url}/profile/calculate-targets", json={
    "name": "Testing User",
    "age": 28,
    "sex": "male",
    "height_cm": 175.0,
    "weight_kg": 72.0,
    "activity_level": "moderate",
    "goal": "maintain"
}).json()
print(f"BMR: {mifflin['bmr']} kcal | TDEE: {mifflin['tdee']} kcal | Daily Target: {mifflin['clamped_kcal']} kcal")
print(f"Target Macros: Protein {mifflin['protein_g']}g, Carbs {mifflin['carbs_g']}g, Fat {mifflin['fat_g']}g, Fiber {mifflin['fiber_g']}g")

print("\n=== 6. SAFETY GUARDRAIL TEST (CLAMPS TO 1200 KCAL) ===")
clamped = client.post(f"{base_url}/profile/calculate-targets", json={
    "name": "Testing User",
    "age": 70,
    "sex": "female",
    "height_cm": 140.0,
    "weight_kg": 38.0,
    "activity_level": "sedentary",
    "goal": "lose"
}).json()
print(f"Unclamped calculated: {clamped['calculated_kcal']} kcal -> Clamped Target: {clamped['clamped_kcal']} kcal (is_clamped={clamped['is_clamped_by_safety']})")
print("Safety Advisory Message:", clamped["message"])
