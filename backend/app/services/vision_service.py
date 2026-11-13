import io
import os
import json
import logging
from abc import ABC, abstractmethod
from typing import Optional, List
from PIL import Image
from app.config import settings
from app.schemas.vision import VisionAnalysisResult, DetectedDishItem

logger = logging.getLogger(__name__)


def analyze_image_colors(image_bytes: bytes) -> str:
    """Heuristic visual analysis of dominant colors to classify meal categories in mock mode."""
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img.thumbnail((120, 120))
        pixels = list(img.getdata())
        n = len(pixels)
        if n == 0:
            return "balanced"

        avg_r = sum(p[0] for p in pixels) / n
        avg_g = sum(p[1] for p in pixels) / n
        avg_b = sum(p[2] for p in pixels) / n

        # Check for dark / empty / non-food plate
        if avg_r < 40 and avg_g < 40 and avg_b < 40:
            return "empty"
        if max(avg_r, avg_g, avg_b) - min(avg_r, avg_g, avg_b) < 15 and avg_r > 235:
            return "empty"

        # Fresh greens (salad, greens)
        if avg_g > avg_r * 1.1 and avg_g > avg_b * 1.1:
            return "salad"

        # Red / deep orange gravies (paneer butter masala, chicken curry, tomato curries)
        if avg_r > 150 and avg_r > avg_g * 1.25 and avg_r > avg_b * 1.4:
            return "curry"

        # Golden yellow / fried / biryani / breads
        if avg_r > 160 and avg_g > 130 and avg_b < 110:
            return "biryani"

        # Light / fermented / rice / idli
        if avg_r > 185 and avg_g > 185 and avg_b > 185:
            return "idli"

        # Fast food / burgers (brown + red tones)
        if avg_r > 130 and avg_g > 90 and avg_b < 80:
            return "burger"

    except Exception as e:
        logger.warning(f"Image visual color analysis failed: {e}")

    return "balanced"


class VisionProvider(ABC):
    @abstractmethod
    async def analyze_image(
        self,
        image_bytes: bytes,
        filename: Optional[str] = None,
        hint: Optional[str] = None
    ) -> VisionAnalysisResult:
        """Analyzes an image and returns structured food item segmentation."""
        pass


class MockVisionProvider(VisionProvider):
    """
    Simulates AI vision segmentation using filename keywords, meal hints,
    and visual color heuristics when running offline without an API key.
    """
    def __init__(self):
        self.scenarios = {
            "thali": VisionAnalysisResult(
                is_food=True,
                quality_feedback="Good top-down view of multi-dish Indian meal.",
                items=[
                    DetectedDishItem(name="Steamed White Rice", category="Grains", estimated_grams=150.0, serving_description="1 cup mound", confidence=0.96),
                    DetectedDishItem(name="Sambar", category="Curries & Soups", estimated_grams=120.0, serving_description="1 standard katori", confidence=0.93),
                    DetectedDishItem(name="Rasam", category="Curries & Soups", estimated_grams=100.0, serving_description="1 small katori", confidence=0.90),
                    DetectedDishItem(name="Cabbage Poriyal", category="Vegetables", estimated_grams=80.0, serving_description="1 dry vegetable cup", confidence=0.88),
                    DetectedDishItem(name="Plain Curd", category="Dairy", estimated_grams=100.0, serving_description="1 katori curd", confidence=0.95),
                    DetectedDishItem(name="Papad", category="Snacks", estimated_grams=15.0, serving_description="1 crisp appalam", confidence=0.97)
                ]
            ),
            "roti_curry": VisionAnalysisResult(
                is_food=True,
                quality_feedback="North Indian flatbread and rich curry plate.",
                items=[
                    DetectedDishItem(name="Chapati", category="Breads", estimated_grams=80.0, serving_description="2 whole wheat rotis", confidence=0.96),
                    DetectedDishItem(name="Paneer Butter Masala", category="Curries & Soups", estimated_grams=160.0, serving_description="1 bowl cottage cheese curry", confidence=0.94),
                    DetectedDishItem(name="Dal Tadka", category="Curries & Soups", estimated_grams=150.0, serving_description="1 bowl yellow dal", confidence=0.92),
                    DetectedDishItem(name="Cucumber Raita", category="Condiments", estimated_grams=80.0, serving_description="1 small raita cup", confidence=0.90)
                ]
            ),
            "idli": VisionAnalysisResult(
                is_food=True,
                quality_feedback="South Indian breakfast combo recognized.",
                items=[
                    DetectedDishItem(name="Idli", category="Breakfast", estimated_grams=160.0, serving_description="2 steamed idlis", confidence=0.98),
                    DetectedDishItem(name="Medu Vada", category="Snacks", estimated_grams=50.0, serving_description="1 crispy medu vada", confidence=0.94),
                    DetectedDishItem(name="Sambar", category="Curries & Soups", estimated_grams=100.0, serving_description="1 bowl dip", confidence=0.92),
                    DetectedDishItem(name="Coconut Chutney", category="Condiments", estimated_grams=40.0, serving_description="2 tablespoons chutney", confidence=0.91)
                ]
            ),
            "dosa": VisionAnalysisResult(
                is_food=True,
                quality_feedback="Crisp golden dosa with accompaniments.",
                items=[
                    DetectedDishItem(name="Masala Dosa", category="Breakfast", estimated_grams=150.0, serving_description="1 potato-stuffed dosa", confidence=0.96),
                    DetectedDishItem(name="Sambar", category="Curries & Soups", estimated_grams=100.0, serving_description="1 bowl sambar", confidence=0.92),
                    DetectedDishItem(name="Coconut Chutney", category="Condiments", estimated_grams=40.0, serving_description="white chutney", confidence=0.94),
                    DetectedDishItem(name="Tomato Chutney", category="Condiments", estimated_grams=35.0, serving_description="red spicy chutney", confidence=0.91)
                ]
            ),
            "biryani": VisionAnalysisResult(
                is_food=True,
                quality_feedback="Aromatic chicken biryani plate detected.",
                items=[
                    DetectedDishItem(name="Chicken Biryani", category="Main Course", estimated_grams=250.0, serving_description="1 plate spiced basmati rice with chicken", confidence=0.95),
                    DetectedDishItem(name="Boondi Raita", category="Condiments", estimated_grams=80.0, serving_description="1 side bowl raita", confidence=0.89),
                    DetectedDishItem(name="Boiled Egg", category="Proteins", estimated_grams=50.0, serving_description="1 whole boiled egg", confidence=0.96)
                ]
            ),
            "burger": VisionAnalysisResult(
                is_food=True,
                quality_feedback="Fast food burger and fries combo recognized.",
                items=[
                    DetectedDishItem(name="Chicken Burger", category="Fast Food", estimated_grams=180.0, serving_description="1 chicken burger with bun and patty", confidence=0.95),
                    DetectedDishItem(name="French Fries", category="Snacks", estimated_grams=100.0, serving_description="1 medium portion fries", confidence=0.94)
                ]
            ),
            "salad": VisionAnalysisResult(
                is_food=True,
                quality_feedback="Lean protein & fresh vegetables plate detected.",
                items=[
                    DetectedDishItem(name="Grilled Chicken Breast", category="Proteins", estimated_grams=120.0, serving_description="1 grilled fillet portion", confidence=0.95),
                    DetectedDishItem(name="Mixed Green Salad", category="Vegetables", estimated_grams=100.0, serving_description="1 bowl mixed leaves & cucumber", confidence=0.93),
                    DetectedDishItem(name="Whole Wheat Bread", category="Breads", estimated_grams=35.0, serving_description="1 slice brown bread", confidence=0.90)
                ]
            ),
            "empty": VisionAnalysisResult(
                is_food=False,
                quality_feedback="No edible food detected on the plate. Please center your meal in the frame and retake.",
                items=[]
            )
        }

    async def analyze_image(
        self,
        image_bytes: bytes,
        filename: Optional[str] = None,
        hint: Optional[str] = None
    ) -> VisionAnalysisResult:
        query = f"{filename or ''} {hint or ''}".lower()

        # 1. Check explicit hints or keywords
        if "empty" in query or "non_food" in query or "blank" in query:
            return self.scenarios["empty"]
        if "biryani" in query or "pulao" in query:
            return self.scenarios["biryani"]
        if "dosa" in query:
            return self.scenarios["dosa"]
        if "idli" in query or "vada" in query:
            return self.scenarios["idli"]
        if "roti" in query or "chapati" in query or "paneer" in query or "dal" in query:
            return self.scenarios["roti_curry"]
        if "burger" in query or "fries" in query or "pizza" in query:
            return self.scenarios["burger"]
        if "salad" in query or "chicken" in query or "diet" in query or "egg" in query:
            return self.scenarios["salad"]
        if "thali" in query or "meals" in query:
            return self.scenarios["thali"]

        # 2. Dynamic visual color classification
        detected_color_class = analyze_image_colors(image_bytes)
        if detected_color_class == "empty":
            return self.scenarios["empty"]
        elif detected_color_class == "salad":
            return self.scenarios["salad"]
        elif detected_color_class == "curry":
            return self.scenarios["roti_curry"]
        elif detected_color_class == "biryani":
            return self.scenarios["biryani"]
        elif detected_color_class == "idli":
            return self.scenarios["idli"]
        elif detected_color_class == "burger":
            return self.scenarios["burger"]

        # Default fallback: Roti & Curry meal
        return self.scenarios["roti_curry"]


class GeminiVisionProvider(VisionProvider):
    """
    Google Gemini Vision Provider.
    Inspects actual image pixels and outputs structured food detection.
    """
    def __init__(self, api_key: str):
        self.api_key = api_key

    async def analyze_image(
        self,
        image_bytes: bytes,
        filename: Optional[str] = None,
        hint: Optional[str] = None
    ) -> VisionAnalysisResult:
        if not self.api_key or not self.api_key.strip():
            logger.warning("Gemini API key is empty. Using MockVisionProvider.")
            mock = MockVisionProvider()
            return await mock.analyze_image(image_bytes, filename, hint)

        from google import genai
        from google.genai import types
        import time

        client = genai.Client(api_key=self.api_key.strip())

        # Always downsample high-resolution mobile photos to max 800px for lightning-fast Gemini inference
        try:
            with Image.open(io.BytesIO(image_bytes)) as pil_img:
                pil_img = pil_img.convert("RGB")
                pil_img.thumbnail((800, 800), Image.Resampling.LANCZOS)
                compressed_buf = io.BytesIO()
                pil_img.save(compressed_buf, format="JPEG", quality=82)
                image_bytes = compressed_buf.getvalue()
                mime_type = "image/jpeg"
        except Exception as e:
            logger.warning(f"Image preprocessing warning: {e}")
            mime_type = "image/jpeg"

        prompt = (
            "You are an expert AI clinical nutritionist and culinary biochemist with comprehensive global food and beverage intelligence. "
            "Examine this food/meal/beverage image in detail and analyze everything based on your extensive knowledge: "
            "1. Detect EVERY separate food dish, beverage, drink, bread, curry, gravy, side, snack, fruit, or item visible in the image. "
            "2. Identify specific food/drink names accurately (e.g. 'Cappuccino', 'Filter Coffee', 'Avocado Toast with Poached Egg', 'Chicken Biryani', 'Margherita Pizza Slice', 'Greek Yogurt with Berries', 'Dal Tadka', 'Chapati'). "
            "3. Accurately estimate portion quantity in grams/milliliters by analyzing visible vessels, cups, plates, and depth (e.g., coffee cup ~200ml, mug ~300ml, standard plate ~350g, bowl ~150-180g, slice ~100g) and write a descriptive serving description. "
            "4. Calculate and predict the exact nutritional values for this specific estimated portion: kcal (calories), protein (g), fat (g), carbs (g), fiber (g), sugar (g), and sodium (mg). "
            "5. Provide the reference nutritional properties per 100g for this item: kcal_per_100g, protein_per_100g, fat_per_100g, carbs_per_100g, fiber_per_100g, sugar_per_100g, and sodium_mg_per_100g. "
            "6. In health_notes, provide key dietary and biochemical properties (e.g. 'Rich in polyphenols and moderate lactose', 'High lean protein, low glycemic index', 'High dietary fiber, complex carbs'). "
            "7. Assign a confidence score between 0.0 and 1.0 for each detected item. "
            "8. If the image contains absolutely NO food or beverage whatsoever (e.g. vehicle, furniture, blank screen, animal), set is_food to false with empty items list. Otherwise, set is_food to true."
        )

        # Active supported models for Gemini API (fastest, most reliable first)
        models_to_try = [
            "gemini-3-flash-preview",
            "gemini-3.1-flash-lite",
            "gemini-3.5-flash",
            "gemini-3.5-flash-lite",
        ]
        last_error = None

        import asyncio

        for model_name in models_to_try:
            try:
                logger.info(f"Analyzing image with Gemini model: {model_name}...")

                def _generate(m=model_name):
                    return client.models.generate_content(
                        model=m,
                        contents=[
                            types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                            prompt
                        ],
                        config=types.GenerateContentConfig(
                            response_mime_type="application/json",
                            response_schema=VisionAnalysisResult,
                            temperature=0.1
                        )
                    )

                response = await asyncio.wait_for(asyncio.to_thread(_generate), timeout=60.0)

                if response.text:
                    parsed_json = json.loads(response.text)
                    validated = VisionAnalysisResult.model_validate(parsed_json)
                    logger.info(f"Gemini analysis successful ({model_name}): {len(validated.items)} items detected.")
                    return validated
            except asyncio.TimeoutError:
                logger.warning(f"Gemini model {model_name} timed out after 60s. Trying next candidate...")
                last_error = TimeoutError(f"Model {model_name} timed out after 60s")
            except Exception as e:
                logger.warning(f"Gemini model {model_name} failed: {e}")
                last_error = e

        # If strict Gemini mode is active and Gemini failed, raise error with details
        logger.error(f"All Gemini models failed ({last_error}).")
        if settings.VISION_PROVIDER == "gemini":
            raise RuntimeError(f"Gemini Vision recognition error: {last_error}")

        # Fallback to mock only if configured
        mock = MockVisionProvider()
        return await mock.analyze_image(image_bytes, filename, hint)


def get_vision_provider(api_key: Optional[str] = None) -> VisionProvider:
    key = api_key or settings.GEMINI_API_KEY
    if key and key.strip():
        return GeminiVisionProvider(api_key=key.strip())
    return MockVisionProvider()
