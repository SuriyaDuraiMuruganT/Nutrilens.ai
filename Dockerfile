# ==========================================
# Multi-Stage Build: NutriLens Full-Stack App
# Runs backend + frontend together on 1 port
# ==========================================

# Stage 1: Build Frontend (React + Vite + Tailwind)
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Production Python Backend + Embedded Frontend
FROM python:3.12-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy Backend application
COPY backend/ ./app_backend/

# Copy built frontend into container
COPY --from=frontend-builder /app/frontend/dist ./frontend_dist/

# Set environment variables
ENV PYTHONPATH=/app/app_backend
ENV STATIC_DIR=/app/frontend_dist
ENV STORAGE_DIR=/app/uploads
ENV DATABASE_URL=sqlite:////app/nutrilens.db
ENV ENV=production
ENV PORT=8000

# Expose port (overridden dynamically by cloud platforms via $PORT)
EXPOSE 8000

# Seed database and start single combined server
CMD ["sh", "-c", "python -m app.seed.seed_data && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]

