from app.services.matching_service import matching_service
from app.models.food import Food


def test_matching_service_exact_and_alias(db_session):
    # Test 1: Exact match
    food, score = matching_service.match_food(db_session, "Sambar")
    assert food is not None
    assert food.name == "Sambar"
    assert score >= 95.0

    # Test 2: Alias match (chawal -> Steamed White Rice)
    food_alias, score_alias = matching_service.match_food(db_session, "chawal")
    assert food_alias is not None
    assert food_alias.name == "Steamed White Rice"
    assert score_alias >= 90.0

    # Test 3: Regional alias match (thayir sadam -> Curd Rice)
    food_curd, score_curd = matching_service.match_food(db_session, "thayir sadam")
    assert food_curd is not None
    assert food_curd.name == "Curd Rice"

    # Test 4: Fuzzy typo match ("medu vadai" -> Medu Vada)
    food_vada, score_vada = matching_service.match_food(db_session, "crispy medu vadai")
    assert food_vada is not None
    assert food_vada.name == "Medu Vada"

    # Test 5: Unmatched food
    food_none, score_none = matching_service.match_food(db_session, "XyloPlankton Martian Moss")
    assert food_none is None
    assert score_none < 65.0
