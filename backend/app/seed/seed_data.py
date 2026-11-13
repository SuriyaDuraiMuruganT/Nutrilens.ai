import json
import os
from sqlalchemy.orm import Session, sessionmaker
from app.database import engine, Base, SessionLocal
from app.models.user import User, Goal
from app.models.food import Food


def seed_database(bind_engine=None, db_session=None):
    target_engine = bind_engine or engine
    Base.metadata.create_all(bind=target_engine)

    close_session = False
    if db_session:
        db = db_session
    else:
        SessionMaker = sessionmaker(autocommit=False, autoflush=False, bind=target_engine)
        db = SessionMaker()
        close_session = True

    try:
        # 1. Seed Default User if not exists
        user = db.query(User).filter(User.id == 1).first()
        if not user:
            print("Seeding default user...")
            user = User(
                id=1,
                name="Testing User",
                age=28,
                sex="male",
                height_cm=175.0,
                weight_kg=72.0,
                activity_level="moderate",
                goal="maintain"
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            # Seed default goal based on Mifflin-St Jeor
            # BMR = (10 * 72) + (6.25 * 175) - (5 * 28) + 5 = 720 + 1093.75 - 140 + 5 = 1678.75
            # TDEE = 1678.75 * 1.55 = 2602 -> kcal_target = 2600
            # Default split: 130g protein (520 kcal), 70g fat (630 kcal), 362g carbs (1450 kcal), 35g fiber
            default_goal = Goal(
                user_id=user.id,
                kcal_target=2200,
                protein_g=130.0,
                fat_g=65.0,
                carbs_g=275.0,
                fiber_g=35.0
            )
            db.add(default_goal)
            db.commit()

        # 2. Seed Foods from foods_seed.json
        seed_path = os.path.join(os.path.dirname(__file__), "foods_seed.json")
        if os.path.exists(seed_path):
            with open(seed_path, "r", encoding="utf-8") as f:
                foods_data = json.load(f)

            count = 0
            for item in foods_data:
                existing = db.query(Food).filter(Food.name == item["name"]).first()
                if not existing:
                    aliases_json = json.dumps(item.get("aliases", []))
                    food = Food(
                        name=item["name"],
                        aliases=aliases_json,
                        category=item["category"],
                        kcal_per_100g=item["kcal_per_100g"],
                        protein_per_100g=item["protein_per_100g"],
                        fat_per_100g=item["fat_per_100g"],
                        carbs_per_100g=item["carbs_per_100g"],
                        fiber_per_100g=item["fiber_per_100g"],
                        sugar_per_100g=item.get("sugar_per_100g", 0.0),
                        sodium_mg_per_100g=item.get("sodium_mg_per_100g", 0.0),
                        default_serving_g=item.get("default_serving_g", 100.0),
                        source=item["source"]
                    )
                    db.add(food)
                    count += 1
            db.commit()
            print(f"Successfully seeded {count} new food items into database.")
        else:
            print(f"Warning: Seed file not found at {seed_path}")

    finally:
        if close_session:
            db.close()


if __name__ == "__main__":
    seed_database()
