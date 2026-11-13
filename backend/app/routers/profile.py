from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.models.user import User, Goal
from app.schemas.profile import (
    UserProfileResponse,
    UserProfileUpdate,
    GoalResponse,
    GoalUpdate,
    TargetCalculationResponse
)
from app.services.profile_service import profile_service

from app.routers.auth import get_current_user_id

router = APIRouter(prefix="/api", tags=["Profile & Goals"])


@router.get("/profile", response_model=UserProfileResponse)
def get_user_profile(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        # Fallback to default user if custom user not found
        user = db.query(User).filter(User.id == settings.DEFAULT_USER_ID).first()
    if not user:
        raise HTTPException(status_code=404, detail="User profile not found.")
    return user


@router.put("/profile", response_model=UserProfileResponse)
def update_user_profile(
    payload: UserProfileUpdate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        user = db.query(User).filter(User.id == settings.DEFAULT_USER_ID).first()
    if not user:
        raise HTTPException(status_code=404, detail="User profile not found.")

    user.name = payload.name
    if payload.email:
        user.email = payload.email.lower().strip()
    user.age = payload.age
    user.sex = payload.sex
    user.height_cm = payload.height_cm
    user.weight_kg = payload.weight_kg
    user.activity_level = payload.activity_level
    user.goal = payload.goal

    db.commit()
    db.refresh(user)
    return user


@router.get("/goals", response_model=GoalResponse)
def get_user_goals(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    goal = db.query(Goal).filter(Goal.user_id == user_id).first()
    if not goal:
        # Create default goal if not exists for this user
        goal = Goal(
            user_id=user_id,
            kcal_target=2000,
            protein_g=120.0,
            fat_g=65.0,
            carbs_g=220.0,
            fiber_g=30.0
        )
        db.add(goal)
        db.commit()
        db.refresh(goal)
    return goal


@router.put("/goals", response_model=GoalResponse)
def update_user_goals(
    payload: GoalUpdate,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    if payload.kcal_target < 1200:
        raise HTTPException(
            status_code=400,
            detail="Safety Guardrail: Calorie target cannot be set below 1,200 kcal/day."
        )

    goal = db.query(Goal).filter(Goal.user_id == user_id).first()
    if not goal:
        goal = Goal(user_id=user_id)
        db.add(goal)

    goal.kcal_target = payload.kcal_target
    goal.protein_g = payload.protein_g
    goal.fat_g = payload.fat_g
    goal.carbs_g = payload.carbs_g
    goal.fiber_g = payload.fiber_g

    db.commit()
    db.refresh(goal)
    return goal


@router.post("/profile/calculate-targets", response_model=TargetCalculationResponse)
def calculate_targets(payload: UserProfileUpdate):
    results = profile_service.calculate_mifflin_st_jeor(
        age=payload.age,
        sex=payload.sex,
        height_cm=payload.height_cm,
        weight_kg=payload.weight_kg,
        activity_level=payload.activity_level,
        goal=payload.goal
    )
    return results
