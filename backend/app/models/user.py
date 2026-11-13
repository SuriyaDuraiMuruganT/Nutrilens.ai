from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(150), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255), nullable=True)
    name = Column(String(100), nullable=False, default="Default User")
    age = Column(Integer, nullable=False, default=28)
    sex = Column(String(10), nullable=False, default="male")  # male, female
    height_cm = Column(Float, nullable=False, default=172.0)
    weight_kg = Column(Float, nullable=False, default=68.0)
    activity_level = Column(String(30), nullable=False, default="sedentary")  # sedentary, light, moderate, active, very_active
    goal = Column(String(20), nullable=False, default="maintain")  # lose, maintain, gain
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    goals = relationship("Goal", back_populates="user", cascade="all, delete-orphan", uselist=False)
    meals = relationship("Meal", back_populates="user", cascade="all, delete-orphan")


class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    kcal_target = Column(Integer, nullable=False, default=2000)
    protein_g = Column(Float, nullable=False, default=120.0)
    fat_g = Column(Float, nullable=False, default=65.0)
    carbs_g = Column(Float, nullable=False, default=220.0)
    fiber_g = Column(Float, nullable=False, default=30.0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="goals")
