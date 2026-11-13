from datetime import datetime, date, timedelta
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.user import User, Goal
from app.models.meal import Meal, MealItem
from app.schemas.dashboard import (
    DailyDashboardResponse,
    MacroSummary,
    WeeklyDashboardResponse,
    WeeklyDayTrend
)
from app.schemas.meal import MealResponse, MealItemResponse


class DashboardService:
    @staticmethod
    def get_daily_dashboard(db: Session, user_id: int, target_date: date) -> DailyDashboardResponse:
        start_dt = datetime.combine(target_date, datetime.min.time())
        end_dt = datetime.combine(target_date, datetime.max.time())

        # 1. Fetch user goals
        goal = db.query(Goal).filter(Goal.user_id == user_id).first()
        if not goal:
            kcal_target = 2000
            protein_g = 120.0
            fat_g = 65.0
            carbs_g = 220.0
            fiber_g = 30.0
        else:
            kcal_target = goal.kcal_target
            protein_g = goal.protein_g
            fat_g = goal.fat_g
            carbs_g = goal.carbs_g
            fiber_g = goal.fiber_g

        target_summary = MacroSummary(
            kcal=float(kcal_target),
            protein_g=float(protein_g),
            fat_g=float(fat_g),
            carbs_g=float(carbs_g),
            fiber_g=float(fiber_g),
            sugar_g=36.0,  # Recommended healthy upper limit (WHO guideline: <36g/day)
            sodium_mg=2300.0  # Recommended healthy upper limit (AHA guideline: <2,300mg/day)
        )

        # 2. Query meals for the day
        meals = (
            db.query(Meal)
            .filter(Meal.user_id == user_id, Meal.eaten_at >= start_dt, Meal.eaten_at <= end_dt)
            .order_by(Meal.eaten_at.asc())
            .all()
        )

        consumed_kcal = sum(m.total_kcal for m in meals)
        consumed_protein = sum(m.total_protein for m in meals)
        consumed_fat = sum(m.total_fat for m in meals)
        consumed_carbs = sum(m.total_carbs for m in meals)
        consumed_fiber = sum(m.total_fiber for m in meals)
        consumed_sugar = sum(getattr(m, "total_sugar", 0.0) or 0.0 for m in meals)
        consumed_sodium = sum(getattr(m, "total_sodium", 0.0) or 0.0 for m in meals)

        consumed_summary = MacroSummary(
            kcal=round(consumed_kcal, 1),
            protein_g=round(consumed_protein, 1),
            fat_g=round(consumed_fat, 1),
            carbs_g=round(consumed_carbs, 1),
            fiber_g=round(consumed_fiber, 1),
            sugar_g=round(consumed_sugar, 1),
            sodium_mg=round(consumed_sodium, 1)
        )

        remaining_summary = MacroSummary(
            kcal=round(max(0.0, float(kcal_target) - consumed_kcal), 1),
            protein_g=round(max(0.0, float(protein_g) - consumed_protein), 1),
            fat_g=round(max(0.0, float(fat_g) - consumed_fat), 1),
            carbs_g=round(max(0.0, float(carbs_g) - consumed_carbs), 1),
            fiber_g=round(max(0.0, float(fiber_g) - consumed_fiber), 1),
            sugar_g=round(max(0.0, 36.0 - consumed_sugar), 1),
            sodium_mg=round(max(0.0, 2300.0 - consumed_sodium), 1)
        )

        percentage = round((consumed_kcal / max(1.0, float(kcal_target))) * 100.0, 1)

        # 3. Build Rule-based Insights
        insights: List[str] = []
        if not meals:
            insights.append("No meals logged yet today. Snap or upload a photo of your breakfast, lunch, or snack to begin tracking!")
        else:
            if consumed_protein >= protein_g:
                insights.append(f"💪 Excellent! You reached your daily protein goal ({consumed_protein:.0f}g / {protein_g:.0f}g).")
            elif consumed_protein < (protein_g * 0.5):
                insights.append("🥗 Protein is currently low today. Consider adding eggs, dal, paneer, or chicken to your next meal.")

            if consumed_fiber >= fiber_g:
                insights.append(f"🌾 Fiber goal achieved ({consumed_fiber:.0f}g / {fiber_g:.0f}g)! Great for digestion and satiety.")
            elif consumed_fiber < (fiber_g * 0.4):
                insights.append("🥦 Tip: Boost your daily fiber with vegetables, poriyal, whole wheat chapati, or fruit.")

            if consumed_sugar > 36.0:
                insights.append(f"⚠️ Sugar intake is {consumed_sugar:.1f}g today (above 36g limit). Favor fresh fruit or unsweetened tea.")
            elif consumed_sugar > 0:
                insights.append(f"🍃 Sugar intake is well managed ({consumed_sugar:.1f}g / 36g daily limit).")

            if consumed_sodium > 2300.0:
                insights.append(f"⚠️ Sodium intake is high ({consumed_sodium:.0f}mg / 2,300mg max). Drink plenty of water.")

            if percentage >= 90.0 and percentage <= 110.0:
                insights.append("🎯 Calorie balance is right on target today!")
            elif percentage > 115.0:
                insights.append(f"⚠️ Calorie intake is {percentage:.0f}% of your target. Enjoy some light hydration or herbal tea.")
            elif percentage < 50.0 and len(meals) >= 2:
                insights.append("🌱 Light eating recorded today. Make sure to nourish yourself adequately.")

        return DailyDashboardResponse(
            date=target_date.isoformat(),
            target=target_summary,
            consumed=consumed_summary,
            remaining=remaining_summary,
            percentage=percentage,
            meals=[MealResponse.model_validate(m) for m in meals],
            insights=insights
        )

    @staticmethod
    def get_weekly_dashboard(db: Session, user_id: int, end_date: date) -> WeeklyDashboardResponse:
        goal = db.query(Goal).filter(Goal.user_id == user_id).first()
        target_kcal = float(goal.kcal_target if goal else 2000)

        days_list: List[WeeklyDayTrend] = []
        total_cal = 0.0
        total_prot = 0.0

        for i in range(6, -1, -1):
            cur_date = end_date - timedelta(days=i)
            start_dt = datetime.combine(cur_date, datetime.min.time())
            end_dt = datetime.combine(cur_date, datetime.max.time())

            meals = (
                db.query(Meal)
                .filter(Meal.user_id == user_id, Meal.eaten_at >= start_dt, Meal.eaten_at <= end_dt)
                .all()
            )

            day_cal = sum(m.total_kcal for m in meals)
            day_prot = sum(m.total_protein for m in meals)
            total_cal += day_cal
            total_prot += day_prot

            days_list.append(WeeklyDayTrend(
                date=cur_date.isoformat(),
                day_name=cur_date.strftime("%a"),
                calories=round(day_cal, 1),
                protein_g=round(day_prot, 1),
                target_calories=target_kcal
            ))

        avg_cal = round(total_cal / 7.0, 1)
        avg_prot = round(total_prot / 7.0, 1)

        return WeeklyDashboardResponse(
            days=days_list,
            avg_calories=avg_cal,
            avg_protein_g=avg_prot
        )


dashboard_service = DashboardService()
