from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database import Base


class Meal(Base):
    __tablename__ = "meals"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    meal_type = Column(String(20), nullable=False)  # breakfast, lunch, snack, dinner
    eaten_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    image_path = Column(String(255), nullable=True)
    total_kcal = Column(Float, nullable=False, default=0.0)
    total_protein = Column(Float, nullable=False, default=0.0)
    total_fat = Column(Float, nullable=False, default=0.0)
    total_carbs = Column(Float, nullable=False, default=0.0)
    total_fiber = Column(Float, nullable=False, default=0.0)
    total_sugar = Column(Float, nullable=False, default=0.0)
    total_sodium = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="meals")
    items = relationship("MealItem", back_populates="meal", cascade="all, delete-orphan")


class MealItem(Base):
    __tablename__ = "meal_items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    meal_id = Column(Integer, ForeignKey("meals.id", ondelete="CASCADE"), nullable=False, index=True)
    food_id = Column(Integer, ForeignKey("foods.id", ondelete="SET NULL"), nullable=True)
    detected_name = Column(String(150), nullable=False)
    grams = Column(Float, nullable=False)
    serving_description = Column(String(100), nullable=True)
    confidence = Column(Float, nullable=False, default=1.0)
    user_edited = Column(Boolean, nullable=False, default=False)
    has_extra_oil = Column(Boolean, nullable=False, default=False)
    kcal = Column(Float, nullable=False)
    protein = Column(Float, nullable=False)
    fat = Column(Float, nullable=False)
    carbs = Column(Float, nullable=False)
    fiber = Column(Float, nullable=False)
    sugar = Column(Float, nullable=False, default=0.0)
    sodium = Column(Float, nullable=False, default=0.0)

    meal = relationship("Meal", back_populates="items")
    food = relationship("Food", back_populates="meal_items")
