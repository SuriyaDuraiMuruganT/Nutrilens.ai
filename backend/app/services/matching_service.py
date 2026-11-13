import json
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from rapidfuzz import fuzz
from app.models.food import Food


class MatchingService:
    @staticmethod
    def match_food(db: Session, query_name: str, threshold: float = 65.0) -> Tuple[Optional[Food], float]:
        """
        Matches a detected food item string against the foods database.
        Steps:
        1. Exact case-insensitive match on food.name
        2. Exact alias match in food.aliases
        3. Fuzzy match across names and aliases using RapidFuzz
        """
        if not query_name or not query_name.strip():
            return None, 0.0

        normalized_query = query_name.strip().lower()

        # Step 1: Direct exact match
        direct = db.query(Food).filter(Food.name.ilike(normalized_query)).first()
        if direct:
            return direct, 100.0

        all_foods: List[Food] = db.query(Food).all()

        # Step 2: Exact alias match
        for food in all_foods:
            if food.aliases:
                try:
                    aliases = json.loads(food.aliases) if isinstance(food.aliases, str) else food.aliases
                    for alias in aliases:
                        if alias.lower() == normalized_query:
                            return food, 98.0
                except Exception:
                    pass

        # Step 3: Fuzzy matching using RapidFuzz
        best_food: Optional[Food] = None
        best_score = 0.0

        for food in all_foods:
            # Check main name similarity
            name_score = fuzz.token_set_ratio(normalized_query, food.name.lower())
            sort_score = fuzz.token_sort_ratio(normalized_query, food.name.lower())
            current_max = max(name_score, sort_score)

            # Check aliases
            if food.aliases:
                try:
                    aliases = json.loads(food.aliases) if isinstance(food.aliases, str) else food.aliases
                    for alias in aliases:
                        alias_token = fuzz.token_set_ratio(normalized_query, alias.lower())
                        alias_sort = fuzz.token_sort_ratio(normalized_query, alias.lower())
                        current_max = max(current_max, alias_token, alias_sort)
                except Exception:
                    pass

            if current_max > best_score:
                best_score = current_max
                best_food = food

        if best_score >= threshold:
            return best_food, round(best_score, 1)

        return None, round(best_score, 1)

    @staticmethod
    def search_foods(db: Session, query: str, limit: int = 15) -> List[Tuple[Food, float]]:
        """Search foods for autocomplete dropdown in review and edit screen."""
        if not query or not query.strip():
            foods = db.query(Food).limit(limit).all()
            return [(f, 100.0) for f in foods]

        normalized_query = query.strip().lower()
        all_foods: List[Food] = db.query(Food).all()
        scored_foods = []

        for food in all_foods:
            score = fuzz.token_set_ratio(normalized_query, food.name.lower())
            if food.aliases:
                try:
                    aliases = json.loads(food.aliases) if isinstance(food.aliases, str) else food.aliases
                    for alias in aliases:
                        score = max(score, fuzz.token_set_ratio(normalized_query, alias.lower()))
                except Exception:
                    pass

            if score > 35.0 or normalized_query in food.name.lower():
                # Boost prefix matches
                if food.name.lower().startswith(normalized_query):
                    score += 15.0
                scored_foods.append((food, min(100.0, score)))

        scored_foods.sort(key=lambda x: x[1], reverse=True)
        return scored_foods[:limit]


matching_service = MatchingService()
