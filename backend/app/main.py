import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.config import settings
from app.database import engine, Base
from app.seed.seed_data import seed_database
from app.routers import health, analyze, meals, dashboard, foods, profile, auth


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables and seed database
    os.makedirs(settings.STORAGE_DIR, exist_ok=True)
    Base.metadata.create_all(bind=engine)
    seed_database()
    yield
    # Shutdown logic (if any)


app = FastAPI(
    title=f"{settings.APP_NAME} API",
    description="AI-powered calorie and nutrition tracker API with deterministic IFCT & USDA nutrition engine.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.ENV == "development" else settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded meal images
os.makedirs(settings.STORAGE_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.STORAGE_DIR), name="uploads")

# Include API Routers
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(analyze.router)
app.include_router(meals.router)
app.include_router(dashboard.router)
app.include_router(foods.router)
app.include_router(profile.router)


# Production static frontend (SPA) serving
STATIC_DIR = os.getenv("STATIC_DIR")
if not STATIC_DIR:
    potential_paths = [
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend_dist")),
        os.path.abspath("frontend_dist"),
        os.path.abspath("dist"),
    ]
    for p in potential_paths:
        if os.path.exists(p) and os.path.exists(os.path.join(p, "index.html")):
            STATIC_DIR = p
            break

if STATIC_DIR and os.path.exists(STATIC_DIR):
    assets_dir = os.path.join(STATIC_DIR, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = os.path.join(STATIC_DIR, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))
else:
    @app.get("/")
    def root():
        return {
            "message": f"Welcome to {settings.APP_NAME} API",
            "docs": "/docs",
            "vision_provider": settings.VISION_PROVIDER
        }
