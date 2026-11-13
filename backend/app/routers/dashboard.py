from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.services.dashboard_service import dashboard_service
from app.schemas.dashboard import DailyDashboardResponse, WeeklyDashboardResponse
from app.routers.auth import get_current_user_id

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/daily", response_model=DailyDashboardResponse)
def get_daily_dashboard(
    target_date_str: Optional[str] = Query(None, alias="date"),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    if target_date_str:
        try:
            target_date = date.fromisoformat(target_date_str)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")
    else:
        target_date = date.today()

    return dashboard_service.get_daily_dashboard(db, user_id, target_date)


@router.get("/weekly", response_model=WeeklyDashboardResponse)
def get_weekly_dashboard(
    end_date_str: Optional[str] = Query(None, alias="date"),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    if end_date_str:
        try:
            end_date = date.fromisoformat(end_date_str)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")
    else:
        end_date = date.today()

    return dashboard_service.get_weekly_dashboard(db, user_id, end_date)
