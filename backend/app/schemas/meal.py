from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.food import FoodResponse


class MealItemBase(BaseModel):
    food_id: Optional[int] = None
    detected_name: str = "Unknown Food"
    grams: float = Field(default=100.0, ge=0.0)
    serving_description: Optional[str] = "1 serving"
    confidence: float = Field(default=0.9, ge=0.0, le=1.0)
    user_edited: bool = False
    has_extra_oil: bool = False


class MealItemCreate(MealItemBase):
    kcal: Optional[float] = None
    protein: Optional[float] = None
    fat: Optional[float] = None
    carbs: Optional[float] = None
    fiber: Optional[float] = None
    sugar: Optional[float] = 0.0
    sodium: Optional[float] = 0.0


class MealItemResponse(MealItemBase):
    id: Optional[int] = None
    meal_id: Optional[int] = None
    kcal: float
    protein: float
    fat: float
    carbs: float
    fiber: float
    sugar: float = 0.0
    sodium: float = 0.0
    food: Optional[FoodResponse] = None

    model_config = ConfigDict(from_attributes=True)


class MealCreate(BaseModel):
    user_id: Optional[int] = 1
    meal_type: str = Field(..., description="breakfast, lunch, snack, dinner")
    eaten_at: Optional[datetime] = None
    image_path: Optional[str] = None
    items: List[MealItemCreate]


class MealUpdate(BaseModel):
    meal_type: Optional[str] = None
    eaten_at: Optional[datetime] = None
    items: List[MealItemCreate]


class MealResponse(BaseModel):
    id: int
    user_id: int
    meal_type: str
    eaten_at: datetime
    image_path: Optional[str] = None
    total_kcal: float
    total_protein: float
    total_fat: float
    total_carbs: float
    total_fiber: float
    total_sugar: float = 0.0
    total_sodium: float = 0.0
    items: List[MealItemResponse] = []
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AnalyzedMealResponse(BaseModel):
    image_path: Optional[str] = None
    meal_type: str
    is_food: bool
    quality_feedback: Optional[str] = None
    items: List[MealItemResponse]
    total_kcal: float
    total_protein: float
    total_fat: float
    total_carbs: float
    total_fiber: float
    total_sugar: float = 0.0
    total_sodium: float = 0.0
    disclaimer: str = "Calorie values are estimates from photos and may be off by 10-20%. Edit items for better accuracy."
