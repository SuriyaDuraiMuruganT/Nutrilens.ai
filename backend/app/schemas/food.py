import json
from typing import List, Optional, Union
from pydantic import BaseModel, ConfigDict, field_validator


class FoodBase(BaseModel):
    name: str
    category: str
    kcal_per_100g: float
    protein_per_100g: float
    fat_per_100g: float
    carbs_per_100g: float
    fiber_per_100g: float
    sugar_per_100g: float = 0.0
    sodium_mg_per_100g: float = 0.0
    default_serving_g: float = 100.0
    source: str


class FoodResponse(FoodBase):
    id: int
    aliases: Optional[List[str]] = None

    model_config = ConfigDict(from_attributes=True)

    @field_validator("aliases", mode="before")
    @classmethod
    def parse_aliases(cls, v: Union[str, List[str], None]) -> Optional[List[str]]:
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return parsed
            except Exception:
                return [a.strip() for a in v.split(",") if a.strip()]
        return v


class FoodSearchResult(BaseModel):
    id: int
    name: str
    category: str
    kcal_per_100g: float
    protein_per_100g: float
    fat_per_100g: float
    carbs_per_100g: float
    fiber_per_100g: float
    sugar_per_100g: float = 0.0
    sodium_mg_per_100g: float = 0.0
    default_serving_g: float
    source: Optional[str] = "Standard Database"
    match_score: Optional[float] = None
