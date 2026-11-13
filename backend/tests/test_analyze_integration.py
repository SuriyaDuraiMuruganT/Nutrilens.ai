import io
from PIL import Image


def create_dummy_image(name="meal.jpg") -> io.BytesIO:
    img = Image.new("RGB", (300, 300), color=(200, 150, 100))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)
    return buf


def test_analyze_integration_thali(client):
    img_buf = create_dummy_image("thali_meal.jpg")
    response = client.post(
        "/api/analyze",
        files={"file": ("thali_meal.jpg", img_buf, "image/jpeg")}
    )
    assert response.status_code == 200
    data = response.json()

    assert data["is_food"] is True
    assert len(data["items"]) > 0
    assert data["total_kcal"] > 0
    assert data["total_protein"] > 0
    assert "10-20%" in data["disclaimer"]

    # Verify at least Rice, Sambar, and Curd were detected and mapped
    detected_names = [it["detected_name"] for it in data["items"]]
    assert any("Rice" in n for n in detected_names)
    assert any("Sambar" in n for n in detected_names)


def test_analyze_integration_empty_plate(client):
    img_buf = create_dummy_image("empty_plate.jpg")
    response = client.post(
        "/api/analyze",
        files={"file": ("empty_plate.jpg", img_buf, "image/jpeg")}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["is_food"] is False
    assert len(data["items"]) == 0
    assert data["total_kcal"] == 0.0


def test_full_meal_logging_and_dashboard_lifecycle(client):
    # 1. Analyze image
    img_buf = create_dummy_image("idli_breakfast.jpg")
    analyze_res = client.post(
        "/api/analyze",
        files={"file": ("idli_breakfast.jpg", img_buf, "image/jpeg")}
    )
    assert analyze_res.status_code == 200
    analysis = analyze_res.json()

    # 2. Save meal
    meal_payload = {
        "meal_type": "breakfast",
        "image_path": analysis["image_path"],
        "items": [
            {
                "food_id": it["food_id"],
                "detected_name": it["detected_name"],
                "grams": it["grams"],
                "serving_description": it["serving_description"],
                "confidence": it["confidence"],
                "user_edited": False,
                "has_extra_oil": False
            }
            for it in analysis["items"]
        ]
    }
    save_res = client.post("/api/meals", json=meal_payload)
    assert save_res.status_code == 201
    meal_data = save_res.json()
    meal_id = meal_data["id"]
    assert meal_data["total_kcal"] > 0

    # 3. Check daily dashboard
    dash_res = client.get("/api/dashboard/daily")
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    assert dash_data["consumed"]["kcal"] >= meal_data["total_kcal"]
    assert len(dash_data["meals"]) >= 1

    # 4. Clean up meal
    del_res = client.delete(f"/api/meals/{meal_id}")
    assert del_res.status_code == 204
