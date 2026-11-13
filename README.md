# NutriLens — AI-Powered Visual Nutrition & Calorie Tracker

NutriLens is an AI-assisted calorie and nutrition tracking platform. In **Phase 1 (Testing Build)**, users upload meal photos from their device (file picker or drag-and-drop). The AI vision pipeline segments each distinct dish on the plate, estimates portions in grams, and matches them to a deterministic nutrition engine backed by **IFCT 2017 & USDA FoodData Central**.

---

## 🏛️ Architecture Overview

```mermaid
flowchart TD
    subgraph Client ["Frontend (React + Vite + TypeScript + Tailwind)"]
        UI_Upload["ImageInput Component<br/>(Dropzone, Client Resize <= 1280px)"]
        UI_Review["Review & Edit Screen<br/>(Live Macro Recalc, Sliders, Multipliers)"]
        UI_Dash["Daily & Weekly Dashboard<br/>(Recharts Rings, Donut, Timeline)"]
        UI_Profile["Profile & Goals<br/>(Mifflin-St Jeor, 1200 kcal Floor)"]
    end

    subgraph API ["Backend API (FastAPI)"]
        Router_Analyze["POST /api/analyze"]
        Router_Meals["/api/meals (CRUD)"]
        Router_Dash["/api/dashboard (Daily/Weekly)"]
        Router_Foods["GET /api/foods/search"]
        Router_Profile["/api/profile & /api/goals"]
    end

    subgraph CoreServices ["Backend Services"]
        VS["VisionService (Protocol)<br/>- GeminiVisionProvider (Strict JSON Schema)<br/>- MockVisionProvider (5 Scenarios)"]
        MS["MatchingService<br/>- RapidFuzz Normalized Token Sort & Set Ratio<br/>- Regional Alias Index"]
        NS["NutritionService<br/>- Deterministic IFCT/USDA Math<br/>- Extra Oil/Ghee Modifier (+45 kcal)"]
        SS["StorageService<br/>- LocalFileStorage (uploads/)"]
    end

    subgraph DataStore ["Database & Storage"]
        DB[(SQLite / PostgreSQL Compatible<br/>SQLAlchemy + 84 Seeded Foods)]
        Uploads[Local Uploads Directory]
    end

    UI_Upload -->|Multipart Form + Resized Image| Router_Analyze
    Router_Analyze --> SS
    SS --> Uploads
    Router_Analyze --> VS
    VS -->|Detected Items + Grams| MS
    MS -->|Fuzzy Match against DB| DB
    MS --> NS
    NS -->|Calculated Kcal & Macros| Router_Analyze
    Router_Analyze --> UI_Review

    UI_Review -->|Save Confirmed Meal| Router_Meals
    Router_Meals --> DB
    UI_Dash --> Router_Dash
    Router_Dash --> DB
    UI_Profile --> Router_Profile
    Router_Profile --> DB
```

---

## 🚀 Quickstart (Running Locally)

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Backend Setup
```powershell
cd z:\xz\backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt

# Run database seeder (seeds 84 foods + default user/goals)
python -m app.seed.seed_data

# Start backend server on http://localhost:8000
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontend Setup
```powershell
cd z:\xz\frontend
npm install
npm run dev
```
Open **http://localhost:5173** in your browser.

---

## ⚙️ Configuration & Vision Recognition

NutriLens supports two vision recognition modes:

### 1. Real AI Vision with Gemini (Recommended for Any Meal Photo)
NutriLens connects to **Google Gemini 2.5 Flash** to visually analyze the raw pixels of ANY uploaded meal photo, accurately recognizing every separate food on the plate (e.g. Pizza, Dosa, Chapati, Chicken Curry, Biryani, Pasta, Noodles, Salads):
- **Option A (Via Web UI)**: Click the **"Connect Gemini Key"** badge in the top navigation bar, paste your free Gemini API key, and click **"Activate Real AI Vision"**.
- **Option B (Via .env)**: In `backend/.env`, set:
  ```env
  VISION_PROVIDER=gemini
  GEMINI_API_KEY=your_gemini_api_key_here
  ```
Get a free Gemini API key at: [Google AI Studio](https://aistudio.google.com/apikey).

### 2. Smart Mock Mode (100% Offline Testing)
If running without an API key, NutriLens does not blindly force the same dishes. It utilizes:
- **Visual Color & Texture Heuristics**: Analyzes dominant RGB channels (e.g., golden-yellow $\to$ Biryani/Fried, red/orange $\to$ Curries, white $\to$ Idli/Rice, green $\to$ Fresh Salads).
- **Meal Hint Presets**: In the upload modal, you can select quick presets (e.g. *Dosa Combo, Biryani Platter, Roti & Paneer Curry, Burger & Fries, Healthy Salad*) or type any custom dish name.
- **Review & Search**: On the review screen, tap the search icon on any dish to switch it to any of the 84 verified database foods with live calorie recalculation.

---

## 🧪 5 Test Scenarios & Sample Images

Sample images with clear visual representations are provided in `backend/test_images/`:

| Scenario File | Description | Detection Results |
|---|---|---|
| `thali_plate.jpg` | Traditional South Indian Thali | Rice (150g), Sambar (120g), Rasam (100g), Cabbage Poriyal (80g), Curd (100g), Papad (15g) |
| `idli_vada_plate.jpg` | South Indian Breakfast | Idli (160g, 2 pcs), Medu Vada (50g, 1 pc), Sambar (100g), Coconut Chutney (40g) |
| `chicken_biryani.jpg` | Biryani Platter | Chicken Biryani (250g), Boondi Raita (80g), Boiled Egg (50g) |
| `burger_and_fries.jpg` | Fast Food Combo | Chicken Burger (180g), French Fries (100g) |
| `empty_plate.jpg` | Non-food / Empty Plate | `is_food=False` with guidance feedback to center meal |

---

## 🛡️ Medical Disclaimer & Guardrails
- **Honesty Note**: *"Calorie values are estimates from photos and may be off by 10-20%. Edit items for better accuracy."*
- **Safety Guardrail**: Mifflin-St Jeor daily calorie targets are strictly floored at **1,200 kcal/day**. Any calculated deficit lower than 1,200 is clamped and accompanied by clinical advisory to consult a healthcare professional.

---

## 🐳 Docker Deployment
```bash
docker-compose up --build
```
Access the application at `http://localhost:5173`.
