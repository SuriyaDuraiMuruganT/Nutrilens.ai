from pydantic import BaseModel, Field
from typing import Optional
from app.schemas.profile import UserProfileResponse, GoalResponse


class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=5, max_length=150)
    password: str = Field(..., min_length=6, max_length=100)
    age: Optional[int] = Field(default=28, ge=12, le=120)
    sex: Optional[str] = Field(default="male")
    height_cm: Optional[float] = Field(default=172.0, ge=80.0, le=250.0)
    weight_kg: Optional[float] = Field(default=68.0, ge=30.0, le=300.0)
    activity_level: Optional[str] = Field(default="sedentary")
    goal: Optional[str] = Field(default="maintain")


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=150)
    password: str = Field(..., min_length=1)


class AuthResponse(BaseModel):
    user: UserProfileResponse
    goals: Optional[GoalResponse] = None
    token: str
    message: str
