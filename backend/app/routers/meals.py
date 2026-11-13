from datetime import datetime, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.models.meal import Meal, MealItem
from app.models.food import Food
from app.schemas.meal import MealCreate, MealUpdate, MealResponse, MealItemResponse
from app.services.nutrition_service import nutrition_service
from app.services.storage_service import storage_service
from app.routers.auth import get_current_user_id

router = APIRouter(prefix="/api/meals", tags=["Meals"])


@router.post("", response_model=MealResponse, status_code=201)
def create_meal(
    payload: MealCreate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    effective_user_id = payload.user_id or user_id or settings.DEFAULT_USER_ID
    eaten_at = payload.eaten_at or datetime.utcnow()

    # Create parent meal
    meal = Meal(
        user_id=effective_user_id,
        meal_type=payload.meal_type,
        eaten_at=eaten_at,
        image_path=payload.image_path,
        total_kcal=0.0,
        total_protein=0.0,
        total_fat=0.0,
        total_carbs=0.0,
        total_fiber=0.0
    )
    db.add(meal)
    db.flush()

    items_to_add = []
    item_nutrients = []

    for it in payload.items:
        food = None
        if it.food_id:
            food = db.query(Food).filter(Food.id == it.food_id).first()

        if food:
            nutrients = nutrition_service.calculate_item_nutrition(
                grams=it.grams,
                food=food,
                has_extra_oil=it.has_extra_oil
            )
            if it.sugar is not None and it.sugar > 0 and nutrients["sugar"] == 0.0:
                nutrients["sugar"] = round(it.sugar, 1)
            if it.sodium is not None and it.sodium > 0 and nutrients["sodium"] == 0.0:
                nutrients["sodium"] = round(it.sodium, 1)
        else:
            nutrients = {
                "kcal": round(float(it.kcal or 0.0), 1),
                "protein": round(float(it.protein or 0.0), 1),
                "fat": round(float(it.fat or 0.0), 1),
                "carbs": round(float(it.carbs or 0.0), 1),
                "fiber": round(float(it.fiber or 0.0), 1),
                "sugar": round(float(it.sugar or 0.0), 1),
                "sodium": round(float(it.sodium or 0.0), 1),
            }
        item_nutrients.append(nutrients)

        meal_item = MealItem(
            meal_id=meal.id,
            food_id=it.food_id,
            detected_name=it.detected_name,
            grams=it.grams,
            serving_description=it.serving_description,
            confidence=it.confidence,
            user_edited=it.user_edited,
            has_extra_oil=it.has_extra_oil,
            kcal=nutrients["kcal"],
            protein=nutrients["protein"],
            fat=nutrients["fat"],
            carbs=nutrients["carbs"],
            fiber=nutrients["fiber"],
            sugar=nutrients["sugar"],
            sodium=nutrients["sodium"]
        )
        items_to_add.append(meal_item)

    db.add_all(items_to_add)

    totals = nutrition_service.calculate_meal_totals(item_nutrients)
    meal.total_kcal = totals["total_kcal"]
    meal.total_protein = totals["total_protein"]
    meal.total_fat = totals["total_fat"]
    meal.total_carbs = totals["total_carbs"]
    meal.total_fiber = totals["total_fiber"]
    meal.total_sugar = totals["total_sugar"]
    meal.total_sodium = totals["total_sodium"]

    db.commit()
    db.refresh(meal)
    return meal


@router.get("", response_model=List[MealResponse])
def get_meals(
    target_date: Optional[str] = Query(None, alias="date"),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    query = db.query(Meal).filter(Meal.user_id == user_id)
    if target_date:
        try:
            d = date.fromisoformat(target_date)
            start_dt = datetime.combine(d, datetime.min.time())
            end_dt = datetime.combine(d, datetime.max.time())
            query = query.filter(Meal.eaten_at >= start_dt, Meal.eaten_at <= end_dt)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")

    meals = query.order_by(Meal.eaten_at.asc()).all()
    return meals


@router.get("/{meal_id}", response_model=MealResponse)
def get_meal(meal_id: int, db: Session = Depends(get_db)):
    meal = db.query(Meal).filter(Meal.id == meal_id).first()
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found.")
    return meal


@router.put("/{meal_id}", response_model=MealResponse)
def update_meal(meal_id: int, payload: MealUpdate, db: Session = Depends(get_db)):
    meal = db.query(Meal).filter(Meal.id == meal_id).first()
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found.")

    if payload.meal_type:
        meal.meal_type = payload.meal_type
    if payload.eaten_at:
        meal.eaten_at = payload.eaten_at

    # Delete existing items and replace with updated ones
    db.query(MealItem).filter(MealItem.meal_id == meal.id).delete()

    item_nutrients = []
    new_items = []
    for it in payload.items:
        food = None
        if it.food_id:
            food = db.query(Food).filter(Food.id == it.food_id).first()

        if food:
            nutrients = nutrition_service.calculate_item_nutrition(
                grams=it.grams,
                food=food,
                has_extra_oil=it.has_extra_oil
            )
            if it.sugar is not None and it.sugar > 0 and nutrients["sugar"] == 0.0:
                nutrients["sugar"] = round(it.sugar, 1)
            if it.sodium is not None and it.sodium > 0 and nutrients["sodium"] == 0.0:
                nutrients["sodium"] = round(it.sodium, 1)
        else:
            nutrients = {
                "kcal": round(float(it.kcal or 0.0), 1),
                "protein": round(float(it.protein or 0.0), 1),
                "fat": round(float(it.fat or 0.0), 1),
                "carbs": round(float(it.carbs or 0.0), 1),
                "fiber": round(float(it.fiber or 0.0), 1),
                "sugar": round(float(it.sugar or 0.0), 1),
                "sodium": round(float(it.sodium or 0.0), 1),
            }
        item_nutrients.append(nutrients)

        meal_item = MealItem(
            meal_id=meal.id,
            food_id=it.food_id,
            detected_name=it.detected_name,
            grams=it.grams,
            serving_description=it.serving_description,
            confidence=it.confidence,
            user_edited=True,
            has_extra_oil=it.has_extra_oil,
            kcal=nutrients["kcal"],
            protein=nutrients["protein"],
            fat=nutrients["fat"],
            carbs=nutrients["carbs"],
            fiber=nutrients["fiber"],
            sugar=nutrients["sugar"],
            sodium=nutrients["sodium"]
        )
        new_items.append(meal_item)

    db.add_all(new_items)

    totals = nutrition_service.calculate_meal_totals(item_nutrients)
    meal.total_kcal = totals["total_kcal"]
    meal.total_protein = totals["total_protein"]
    meal.total_fat = totals["total_fat"]
    meal.total_carbs = totals["total_carbs"]
    meal.total_fiber = totals["total_fiber"]
    meal.total_sugar = totals["total_sugar"]
    meal.total_sodium = totals["total_sodium"]

    db.commit()
    db.refresh(meal)
    return meal


@router.delete("/{meal_id}", status_code=204)
def delete_meal(meal_id: int, db: Session = Depends(get_db)):
    meal = db.query(Meal).filter(Meal.id == meal_id).first()
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found.")

    if meal.image_path:
        storage_service.delete_image(meal.image_path)

    db.delete(meal)
    db.commit()
    return None
