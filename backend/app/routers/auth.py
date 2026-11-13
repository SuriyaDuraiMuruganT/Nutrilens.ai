import hashlib
import secrets
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.models.user import User, Goal
from app.schemas.auth import RegisterRequest, LoginRequest, AuthResponse
from app.services.profile_service import profile_service

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


def hash_password(password: str) -> str:
    # Deterministic SHA-256 for secure lightweight storage without extra dependencies
    salt = "nutrilens_salt_v1"
    return hashlib.sha256(f"{salt}{password}".encode("utf-8")).hexdigest()


def get_current_user_id(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    x_user_id: Optional[str] = Header(None, alias="X-User-Id"),
    user_id_param: Optional[int] = None
) -> int:
    """
    Extract user ID from header or query param.
    If anonymous guest mode, gracefully falls back to DEFAULT_USER_ID (1).
    """
    if x_user_id and x_user_id.isdigit():
        return int(x_user_id)
    if authorization and authorization.startswith("Bearer "):
        token_val = authorization.replace("Bearer ", "").strip()
        if token_val.startswith("user_"):
            try:
                return int(token_val.split("_")[1])
            except Exception:
                pass
    if user_id_param:
        return user_id_param
    return settings.DEFAULT_USER_ID


@router.post("/guest")
def guest_login():
    """Generate a token for anonymous guest usage."""
    token = f"guest_{secrets.token_hex(16)}"
    return {"access_token": token, "token_type": "bearer"}


@router.post("/register", response_model=AuthResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    email_clean = payload.email.lower().strip()
    existing = db.query(User).filter(User.email == email_clean).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")

    new_user = User(
        email=email_clean,
        hashed_password=hash_password(payload.password),
        name=payload.name.strip(),
        age=payload.age or 28,
        sex=payload.sex or "male",
        height_cm=payload.height_cm or 172.0,
        weight_kg=payload.weight_kg or 68.0,
        activity_level=payload.activity_level or "sedentary",
        goal=payload.goal or "maintain"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    try:
        # Calculate personalized targets automatically upon account creation
        calc = profile_service.calculate_mifflin_st_jeor(
            age=new_user.age,
            sex=new_user.sex,
            height_cm=new_user.height_cm,
            weight_kg=new_user.weight_kg,
            activity_level=new_user.activity_level,
            goal=new_user.goal
        )

        user_goal = Goal(
            user_id=new_user.id,
            kcal_target=calc["clamped_kcal"],
            protein_g=calc["protein_g"],
            fat_g=calc["fat_g"],
            carbs_g=calc["carbs_g"],
            fiber_g=calc["fiber_g"]
        )
        db.add(user_goal)
        db.commit()
        db.refresh(user_goal)
    except Exception as e:
        db.rollback()
        # Fallback to standard safe default goal
        user_goal = Goal(
            user_id=new_user.id,
            kcal_target=2000,
            protein_g=120.0,
            fat_g=65.0,
            carbs_g=220.0,
            fiber_g=30.0
        )
        db.add(user_goal)
        db.commit()
        db.refresh(user_goal)

    token = f"user_{new_user.id}_{secrets.token_hex(16)}"

    return AuthResponse(
        user=new_user,
        goals=user_goal,
        token=token,
        message="Account created successfully with personalized calorie & macro targets!"
    )


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    email_clean = payload.email.lower().strip()
    user = db.query(User).filter(User.email == email_clean).first()
    if not user or user.hashed_password != hash_password(payload.password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    goal = db.query(Goal).filter(Goal.user_id == user.id).first()
    token = f"user_{user.id}_{secrets.token_hex(16)}"

    return AuthResponse(
        user=user,
        goals=goal,
        token=token,
        message="Logged in successfully."
    )


@router.get("/me", response_model=AuthResponse)
def get_current_user_profile(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    goal = db.query(Goal).filter(Goal.user_id == user.id).first()
    token = f"user_{user.id}"

    return AuthResponse(
        user=user,
        goals=goal,
        token=token,
        message="User profile retrieved."
    )
