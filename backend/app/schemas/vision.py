from typing import List, Optional
from pydantic import BaseModel, Field


class DetectedDishItem(BaseModel):
    name: str = Field(..., description="Name of the individual dish, beverage, or item on the plate")
    category: str = Field(default="Dish", description="Culinary category: Beverages, Grains, Curries, Breads, Proteins, Vegetables, Snacks, Condiments, Desserts")
    estimated_grams: float = Field(default=100.0, description="Estimated portion weight or volume in grams or ml")
    serving_description: str = Field(default="1 serving", description="Visual serving description, e.g. '1 cup (200ml)', '1 standard plate', '2 slices'")
    confidence: float = Field(default=0.95, description="AI confidence score between 0.0 and 1.0")
    
    # Direct portion nutrition predicted by AI
    kcal: Optional[float] = Field(default=None, description="Predicted calories (kcal) for this specific portion")
    protein: Optional[float] = Field(default=None, description="Predicted protein (g) for this portion")
    fat: Optional[float] = Field(default=None, description="Predicted fat (g) for this portion")
    carbs: Optional[float] = Field(default=None, description="Predicted carbohydrates (g) for this portion")
    fiber: Optional[float] = Field(default=0.0, description="Predicted dietary fiber (g) for this portion")
    sugar: Optional[float] = Field(default=0.0, description="Predicted sugar (g) for this portion")
    sodium: Optional[float] = Field(default=0.0, description="Predicted sodium (mg) for this portion")
    
    # Reference values per 100g predicted by AI
    kcal_per_100g: Optional[float] = Field(default=None, description="Nutritional calories per 100g based on AI knowledge")
    protein_per_100g: Optional[float] = Field(default=None, description="Protein (g) per 100g")
    fat_per_100g: Optional[float] = Field(default=None, description="Fat (g) per 100g")
    carbs_per_100g: Optional[float] = Field(default=None, description="Carbohydrates (g) per 100g")
    fiber_per_100g: Optional[float] = Field(default=0.0, description="Dietary fiber (g) per 100g")
    sugar_per_100g: Optional[float] = Field(default=0.0, description="Sugar (g) per 100g")
    sodium_mg_per_100g: Optional[float] = Field(default=0.0, description="Sodium (mg) per 100g")
    
    # Food properties and dietary characteristics
    health_notes: Optional[str] = Field(default=None, description="Short food properties e.g. 'Low glycemic index, rich in antioxidants'")


class VisionAnalysisResult(BaseModel):
    is_food: bool = Field(..., description="True if the image contains edible food or meals")
    items: List[DetectedDishItem] = Field(default_factory=list, description="List of detected separate dishes/items")
    quality_feedback: Optional[str] = Field(default=None, description="Image quality feedback or dietary summary from AI")

