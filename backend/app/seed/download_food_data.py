"""
Bulk Food & Nutrition Data Downloader.
Downloads standardized nutritional data from Open Food Facts & USDA reference datasets
and seeds them directly into NutriLens database.
"""
import json
import logging
import requests
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models.food import Food

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

CATEGORIES_TO_PULL = [
    ("coffee", "Beverages"),
    ("tea", "Beverages"),
    ("juice", "Beverages"),
    ("smoothie", "Beverages"),
    ("salad", "Vegetables"),
    ("soup", "Curries & Soups"),
    ("bread", "Breads"),
    ("pasta", "Grains"),
    ("curry", "Curries & Soups"),
    ("sandwich", "Snacks"),
    ("burger", "Fast Food"),
    ("pizza", "Fast Food"),
    ("yogurt", "Dairy"),
    ("cheese", "Dairy"),
    ("chicken", "Proteins"),
    ("fish", "Proteins"),
    ("nuts", "Nuts & Seeds"),
    ("fruit", "Fruits")
]


def download_open_food_data(limit_per_category: int = 15):
    """Fetches standardized nutritional data directly from Open Food Facts public API."""
    db: Session = SessionLocal()
    total_added = 0

    try:
        headers = {
            "User-Agent": "NutriLens - CalorieNutritionTracker - Version 1.0 (contact@nutrilens.local)"
        }

        for term, category in CATEGORIES_TO_PULL:
            logger.info(f"Downloading {category} entries for query: {term}...")
            url = f"https://world.openfoodfacts.org/cgi/search.pl?search_terms={term}&search_simple=1&action=process&json=1&page_size={limit_per_category}"
            try:
                res = requests.get(url, headers=headers, timeout=10)
                if res.status_code != 200:
                    logger.warning(f"Failed to fetch {term}: status {res.status_code}")
                    continue

                data = res.json()
                products = data.get("products", [])

                for p in products:
                    name = p.get("product_name") or p.get("product_name_en")
                    if not name or len(name.strip()) < 3:
                        continue

                    name = name.strip().title()

                    # Check if already in DB
                    existing = db.query(Food).filter(Food.name == name).first()
                    if existing:
                        continue

                    nutriments = p.get("nutriments", {})
                    kcal = nutriments.get("energy-kcal_100g") or nutriments.get("energy-kcal") or 0.0
                    protein = nutriments.get("proteins_100g") or nutriments.get("proteins") or 0.0
                    fat = nutriments.get("fat_100g") or nutriments.get("fat") or 0.0
                    carbs = nutriments.get("carbohydrates_100g") or nutriments.get("carbohydrates") or 0.0
                    fiber = nutriments.get("fiber_100g") or nutriments.get("fiber") or 0.0
                    sugar = nutriments.get("sugars_100g") or 0.0
                    sodium = (nutriments.get("sodium_100g") or 0.0) * 1000.0

                    if kcal <= 0 and protein <= 0 and carbs <= 0:
                        continue

                    aliases = [term.lower()]
                    generic_name = p.get("generic_name")
                    if generic_name:
                        aliases.append(generic_name.lower())

                    food = Food(
                        name=name,
                        aliases=json.dumps(aliases),
                        category=category,
                        kcal_per_100g=round(float(kcal), 1),
                        protein_per_100g=round(float(protein), 1),
                        fat_per_100g=round(float(fat), 1),
                        carbs_per_100g=round(float(carbs), 1),
                        fiber_per_100g=round(float(fiber), 1),
                        sugar_per_100g=round(float(sugar), 1),
                        sodium_mg_per_100g=round(float(sodium), 1),
                        default_serving_g=100.0,
                        source="Open Food Facts / Standardized"
                    )
                    db.add(food)
                    total_added += 1

                db.commit()

            except Exception as e:
                db.rollback()
                logger.warning(f"Error downloading category {term}: {e}")

        logger.info(f"Successfully downloaded and seeded {total_added} standardized foods into NutriLens database!")

    finally:
        db.close()


if __name__ == "__main__":
    download_open_food_data()
