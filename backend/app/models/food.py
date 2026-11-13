from sqlalchemy import Column, Integer, String, Float, Text
from sqlalchemy.orm import relationship
from app.database import Base


class Food(Base):
    __tablename__ = "foods"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(150), unique=True, nullable=False, index=True)
    aliases = Column(Text, nullable=True)  # JSON-encoded array of aliases
    category = Column(String(50), nullable=False, index=True)
    kcal_per_100g = Column(Float, nullable=False)
    protein_per_100g = Column(Float, nullable=False)
    fat_per_100g = Column(Float, nullable=False)
    carbs_per_100g = Column(Float, nullable=False)
    fiber_per_100g = Column(Float, nullable=False)
    sugar_per_100g = Column(Float, nullable=False, default=0.0)
    sodium_mg_per_100g = Column(Float, nullable=False, default=0.0)
    default_serving_g = Column(Float, nullable=False, default=100.0)
    source = Column(String(100), nullable=False)  # IFCT 2017, USDA FoodData Central, Approximation

    meal_items = relationship("MealItem", back_populates="food")
