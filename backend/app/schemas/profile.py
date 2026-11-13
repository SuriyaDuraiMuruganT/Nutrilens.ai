from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class UserProfileBase(BaseModel):
    name: str = "Default User"
    email: Optional[str] = None
    age: int = Field(default=28, ge=12, le=120)
    sex: str = Field(default="male", description="male | female")
    height_cm: float = Field(default=172.0, ge=80.0, le=250.0)
    weight_kg: float = Field(default=70.0, ge=30.0, le=300.0)
    activity_level: str = Field(
        default="sedentary",
        description="sedentary | light | moderate | active | very_active"
    )
    goal: str = Field(default="maintain", description="lose | maintain | gain")


class UserProfileUpdate(UserProfileBase):
    pass


class UserProfileResponse(UserProfileBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class GoalBase(BaseModel):
    kcal_target: int = Field(default=2000, ge=1200)
    protein_g: float = Field(default=120.0, ge=20.0)
    fat_g: float = Field(default=65.0, ge=10.0)
    carbs_g: float = Field(default=220.0, ge=30.0)
    fiber_g: float = Field(default=30.0, ge=5.0)


class GoalUpdate(GoalBase):
    pass


class GoalResponse(GoalBase):
    id: int
    user_id: int

    model_config = ConfigDict(from_attributes=True)


class TargetCalculationResponse(BaseModel):
    bmr: float
    tdee: float
    calculated_kcal: int
    clamped_kcal: int
    is_clamped_by_safety: bool
    protein_g: float
    fat_g: float
    carbs_g: float
    fiber_g: float
    message: Optional[str] = None
