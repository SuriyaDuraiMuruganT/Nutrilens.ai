import os
import json
import logging
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, Header, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models.food import Food
from app.services.storage_service import storage_service
from app.services.vision_service import get_vision_provider
from app.services.matching_service import matching_service
from app.services.nutrition_service import nutrition_service
from app.schemas.meal import AnalyzedMealResponse, MealItemResponse
from app.schemas.food import FoodResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Analysis"])


class SetApiKeyPayload(BaseModel):
    gemini_api_key: str


def get_default_meal_type() -> str:
    current_hour = datetime.now().hour
    if 5 <= current_hour < 11:
        return "breakfast"
    elif 11 <= current_hour < 16:
        return "lunch"
    elif 16 <= current_hour < 19:
        return "snack"
    else:
        return "dinner"


@router.get("/config/ai-status")
def get_ai_status():
    has_key = bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip())
    active_provider = "gemini" if has_key and settings.VISION_PROVIDER == "gemini" else "mock"
    return {
        "provider": active_provider,
        "has_gemini_key": has_key,
        "model": "gemini-2.5-flash",
        "env": settings.ENV,
        "masked_key": f"{settings.GEMINI_API_KEY[:6]}...{settings.GEMINI_API_KEY[-4:]}" if has_key and len(settings.GEMINI_API_KEY) > 10 else None
    }


@router.post("/config/gemini-key")
def set_gemini_key(payload: SetApiKeyPayload):
    key = payload.gemini_api_key.strip()
    if not key:
        # Revert to mock mode
        settings.GEMINI_API_KEY = ""
        settings.VISION_PROVIDER = "mock"
        return {"status": "success", "provider": "mock", "message": "Reverted to Mock Vision mode."}

    # Set in memory
    settings.GEMINI_API_KEY = key
    settings.VISION_PROVIDER = "gemini"

    # Persist in backend/.env file if possible
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
    if os.path.exists(env_path):
        try:
            with open(env_path, "r", encoding="utf-8") as f:
                lines = f.readlines()
            new_lines = []
            found_key = False
            found_provider = False
            for line in lines:
                if line.startswith("GEMINI_API_KEY="):
                    new_lines.append(f"GEMINI_API_KEY={key}\n")
                    found_key = True
                elif line.startswith("VISION_PROVIDER="):
                    new_lines.append("VISION_PROVIDER=gemini\n")
                    found_provider = True
                else:
                    new_lines.append(line)
            if not found_key:
                new_lines.append(f"GEMINI_API_KEY={key}\n")
            if not found_provider:
                new_lines.append("VISION_PROVIDER=gemini\n")
            with open(env_path, "w", encoding="utf-8") as f:
                f.writelines(new_lines)
        except Exception:
            pass

    return {
        "status": "success",
        "provider": "gemini",
        "message": "Gemini API key successfully saved and activated for real meal image analysis!"
    }


@router.post("/analyze", response_model=AnalyzedMealResponse)
async def analyze_meal_image(
    file: UploadFile = File(...),
    hint: Optional[str] = Form(None),
    x_gemini_key: Optional[str] = Header(None, alias="X-Gemini-Key"),
    db: Session = Depends(get_db)
):
    # 1. Validate content type and size
    valid_types = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
    if file.content_type and file.content_type.lower() not in valid_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format ({file.content_type}). Please upload a JPG, PNG, or WEBP image."
        )

    # Read image contents into memory
    image_bytes = await file.read()
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image size exceeds maximum limit of 10 MB.")
    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # 2. Save image locally
    saved_filename = await storage_service.save_image_bytes(image_bytes, file.filename or "meal.jpg")

    # 3. Dynamic Vision Service provider selection
    effective_api_key = x_gemini_key or settings.GEMINI_API_KEY
    active_vision = get_vision_provider(api_key=effective_api_key)

    analysis = await active_vision.analyze_image(
        image_bytes=image_bytes,
        filename=file.filename,
        hint=hint
    )

    meal_type = get_default_meal_type()

    if not analysis.is_food or not analysis.items:
        return AnalyzedMealResponse(
            image_path=saved_filename,
            meal_type=meal_type,
            is_food=False,
            quality_feedback=analysis.quality_feedback or "No recognizable food items detected on the plate.",
            items=[],
            total_kcal=0.0,
            total_protein=0.0,
            total_fat=0.0,
            total_carbs=0.0,
            total_fiber=0.0
        )

    # 4. Use AI directly to verify nutrition and predict food properties
    analyzed_items = []
    item_nutrients_list = []

    for item in analysis.items:
        # Sanitize item name
        dish_name = str(item.name).strip() if item.name else "Food Item"

        # Sanitize grams
        try:
            raw_grams = float(item.estimated_grams) if item.estimated_grams is not None else 100.0
            grams = max(1.0, raw_grams)
        except Exception:
            grams = 100.0

        # Sanitize confidence
        try:
            raw_conf = float(item.confidence) if item.confidence is not None else 0.95
            conf = round(min(1.0, max(0.0, raw_conf)), 2)
        except Exception:
            conf = 0.95

        # Format serving description and AI health properties
        serving_desc = str(item.serving_description).strip() if item.serving_description else "1 serving"
        if getattr(item, "health_notes", None):
            notes = str(item.health_notes).strip()
            if notes and notes.lower() not in serving_desc.lower():
                serving_desc = f"{serving_desc} · {notes}"

        # 1. AI Direct Nutritional Values Prediction
        ratio = grams / 100.0

        # Calories
        if getattr(item, "kcal", None) is not None and float(item.kcal) > 0:
            kcal = float(item.kcal)
            kcal_per_100g = float(getattr(item, "kcal_per_100g", None) or (kcal / ratio))
        elif getattr(item, "kcal_per_100g", None) is not None and float(item.kcal_per_100g) > 0:
            kcal_per_100g = float(item.kcal_per_100g)
            kcal = kcal_per_100g * ratio
        else:
            kcal_per_100g = 120.0
            kcal = kcal_per_100g * ratio

        # Protein
        if getattr(item, "protein", None) is not None:
            protein = float(item.protein)
            protein_per_100g = float(getattr(item, "protein_per_100g", None) or (protein / ratio))
        elif getattr(item, "protein_per_100g", None) is not None:
            protein_per_100g = float(item.protein_per_100g)
            protein = protein_per_100g * ratio
        else:
            protein_per_100g = 4.0
            protein = protein_per_100g * ratio

        # Fat
        if getattr(item, "fat", None) is not None:
            fat = float(item.fat)
            fat_per_100g = float(getattr(item, "fat_per_100g", None) or (fat / ratio))
        elif getattr(item, "fat_per_100g", None) is not None:
            fat_per_100g = float(item.fat_per_100g)
            fat = fat_per_100g * ratio
        else:
            fat_per_100g = 3.0
            fat = fat_per_100g * ratio

        # Carbs
        if getattr(item, "carbs", None) is not None:
            carbs = float(item.carbs)
            carbs_per_100g = float(getattr(item, "carbs_per_100g", None) or (carbs / ratio))
        elif getattr(item, "carbs_per_100g", None) is not None:
            carbs_per_100g = float(item.carbs_per_100g)
            carbs = carbs_per_100g * ratio
        else:
            carbs_per_100g = 15.0
            carbs = carbs_per_100g * ratio

        # Fiber
        if getattr(item, "fiber", None) is not None:
            fiber = float(item.fiber)
            fiber_per_100g = float(getattr(item, "fiber_per_100g", None) or (fiber / ratio))
        elif getattr(item, "fiber_per_100g", None) is not None:
            fiber_per_100g = float(item.fiber_per_100g)
            fiber = fiber_per_100g * ratio
        else:
            fiber_per_100g = 1.0
            fiber = fiber_per_100g * ratio

        # Sugar
        if getattr(item, "sugar", None) is not None:
            sugar = float(item.sugar)
            sugar_per_100g = float(getattr(item, "sugar_per_100g", None) or (sugar / ratio))
        elif getattr(item, "sugar_per_100g", None) is not None:
            sugar_per_100g = float(item.sugar_per_100g)
            sugar = sugar_per_100g * ratio
        else:
            sugar_per_100g = 1.0
            sugar = sugar_per_100g * ratio

        # Sodium
        if getattr(item, "sodium", None) is not None:
            sodium = float(item.sodium)
            sodium_mg_per_100g = float(getattr(item, "sodium_mg_per_100g", None) or (sodium / ratio))
        elif getattr(item, "sodium_mg_per_100g", None) is not None:
            sodium_mg_per_100g = float(item.sodium_mg_per_100g)
            sodium = sodium_mg_per_100g * ratio
        else:
            sodium_mg_per_100g = 50.0
            sodium = sodium_mg_per_100g * ratio

        nutrients = {
            "kcal": round(max(0.0, kcal), 1),
            "protein": round(max(0.0, protein), 1),
            "fat": round(max(0.0, fat), 1),
            "carbs": round(max(0.0, carbs), 1),
            "fiber": round(max(0.0, fiber), 1),
            "sugar": round(max(0.0, sugar), 1),
            "sodium": round(max(0.0, sodium), 1),
        }
        item_nutrients_list.append(nutrients)

        # 2. Dynamically persist or update AI food entity with source="Gemini AI Vision"
        matched_food = None
        try:
            matched_food = db.query(Food).filter(Food.name.ilike(dish_name)).first()
            if not matched_food:
                cat = item.category if item.category and item.category != "Dish" else (
                    "Beverages" if any(w in dish_name.lower() for w in ["coffee", "tea", "cappuccino", "latte", "chai", "drink", "juice", "shake"]) else "Dish"
                )
                matched_food = Food(
                    name=dish_name,
                    aliases=json.dumps([dish_name.lower()]),
                    category=cat,
                    kcal_per_100g=round(max(0.0, kcal_per_100g), 1),
                    protein_per_100g=round(max(0.0, protein_per_100g), 1),
                    fat_per_100g=round(max(0.0, fat_per_100g), 1),
                    carbs_per_100g=round(max(0.0, carbs_per_100g), 1),
                    fiber_per_100g=round(max(0.0, fiber_per_100g), 1),
                    sugar_per_100g=round(max(0.0, sugar_per_100g), 1),
                    sodium_mg_per_100g=round(max(0.0, sodium_mg_per_100g), 1),
                    default_serving_g=grams,
                    source="Gemini AI Vision Knowledge"
                )
                db.add(matched_food)
                db.commit()
                db.refresh(matched_food)
            else:
                # Update with latest AI verified properties if empty
                if matched_food.sugar_per_100g == 0 and sugar_per_100g > 0:
                    matched_food.sugar_per_100g = round(sugar_per_100g, 1)
                if matched_food.sodium_mg_per_100g == 0 and sodium_mg_per_100g > 0:
                    matched_food.sodium_mg_per_100g = round(sodium_mg_per_100g, 1)
                db.commit()
        except Exception as e:
            db.rollback()
            logger.warning(f"Database food registration note for {dish_name}: {e}")

        food_resp = None
        if matched_food:
            try:
                food_resp = FoodResponse.model_validate(matched_food)
            except Exception:
                pass

        analyzed_items.append(
            MealItemResponse(
                food_id=matched_food.id if matched_food else None,
                detected_name=dish_name,
                grams=grams,
                serving_description=serving_desc,
                confidence=conf,
                user_edited=False,
                has_extra_oil=False,
                kcal=nutrients["kcal"],
                protein=nutrients["protein"],
                fat=nutrients["fat"],
                carbs=nutrients["carbs"],
                fiber=nutrients["fiber"],
                sugar=nutrients["sugar"],
                sodium=nutrients["sodium"],
                food=food_resp
            )
        )

    # 5. Calculate overall meal totals
    totals = nutrition_service.calculate_meal_totals(item_nutrients_list)

    return AnalyzedMealResponse(
        image_path=saved_filename,
        meal_type=meal_type,
        is_food=True,
        quality_feedback=analysis.quality_feedback,
        items=analyzed_items,
        total_kcal=totals["total_kcal"],
        total_protein=totals["total_protein"],
        total_fat=totals["total_fat"],
        total_carbs=totals["total_carbs"],
        total_fiber=totals["total_fiber"],
        total_sugar=totals["total_sugar"],
        total_sodium=totals["total_sodium"]
    )
