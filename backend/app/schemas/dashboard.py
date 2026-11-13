from datetime import date
from typing import List
from pydantic import BaseModel
from app.schemas.meal import MealResponse


class MacroSummary(BaseModel):
    kcal: float = 0.0
    protein_g: float = 0.0
    fat_g: float = 0.0
    carbs_g: float = 0.0
    fiber_g: float = 0.0
    sugar_g: float = 0.0
    sodium_mg: float = 0.0


class DailyDashboardResponse(BaseModel):
    date: str
    target: MacroSummary
    consumed: MacroSummary
    remaining: MacroSummary
    percentage: float
    meals: List[MealResponse]
    insights: List[str]


class WeeklyDayTrend(BaseModel):
    date: str
    day_name: str
    calories: float
    protein_g: float
    target_calories: float


class WeeklyDashboardResponse(BaseModel):
    days: List[WeeklyDayTrend]
    avg_calories: float
    avg_protein_g: float
