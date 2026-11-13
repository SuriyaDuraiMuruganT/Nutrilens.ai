from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.matching_service import matching_service
from app.schemas.food import FoodSearchResult

router = APIRouter(prefix="/api/foods", tags=["Foods"])


@router.get("/search", response_model=List[FoodSearchResult])
def search_foods(
    q: Optional[str] = Query("", alias="q"),
    limit: int = Query(15, ge=1, le=50),
    db: Session = Depends(get_db)
):
    results = matching_service.search_foods(db, q or "", limit=limit)
    response = []
    for food, score in results:
        response.append(
            FoodSearchResult(
                id=food.id,
                name=food.name,
                category=food.category,
                kcal_per_100g=food.kcal_per_100g,
                protein_per_100g=food.protein_per_100g,
                fat_per_100g=food.fat_per_100g,
                carbs_per_100g=food.carbs_per_100g,
                fiber_per_100g=food.fiber_per_100g,
                sugar_per_100g=getattr(food, "sugar_per_100g", 0.0) or 0.0,
                sodium_mg_per_100g=getattr(food, "sodium_mg_per_100g", 0.0) or 0.0,
                default_serving_g=food.default_serving_g,
                source=food.source or "Standard Database",
                match_score=score
            )
        )
    return response
