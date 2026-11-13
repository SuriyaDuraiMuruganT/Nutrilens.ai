# NutriLens Test Images & Scenarios

This directory contains 5 ready-to-use meal images designed to test the full pipeline in both **Mock Mode** and **Live AI Vision Mode**:

| Image File | Scenario | Detected Items | Nutritional Focus |
|---|---|---|---|
| `thali_plate.jpg` | Traditional South Indian Thali | Steamed Rice, Sambar, Rasam, Cabbage Poriyal, Plain Curd, Papad | Multi-dish plate segmentation, portion estimation, low vs high calorie items |
| `idli_vada_plate.jpg` | South Indian Breakfast Combo | Steamed Idli (2 pcs), Medu Vada (1 pc), Sambar, Coconut Chutney | Fermented grains, deep fried savory snacks, high-fat chutney detection |
| `chicken_biryani.jpg` | Chicken Biryani with Egg | Hyderabadi Chicken Biryani, Boondi Raita, Boiled Egg | Complex spiced rice dish, lean egg protein, dairy raita balance |
| `burger_and_fries.jpg` | Fast Food Combo | Chicken Burger, French Fries | Western/global fast food items, calorie-dense deep fried potatoes |
| `empty_plate.jpg` | Empty Ceramic Plate | None (`is_food=False`) | Non-food / empty plate detection and safety prompt |

### How to Test in the Browser:
1. Click **Log Meal Photo** in NutriLens.
2. Drag and drop any of the 5 files above (or select via file browser).
3. The app will client-side downsample to max 1280px, pass it to the analysis pipeline, segment each dish, match with the 80+ item database, and present the **Review and Edit Screen**.
4. Adjust sliders, toggle **Extra Ghee/Oil**, switch dishes via autocomplete, and click **Confirm & Save Meal** to watch your daily dashboard update in real-time.
