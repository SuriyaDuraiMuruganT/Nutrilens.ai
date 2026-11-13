import os
import jwt
from datetime import datetime, timedelta
from fastapi import APIRouter

router = APIRouter(prefix="/auth", tags=["Authentication"])

JWT_SECRET = os.getenv("JWT_SECRET", "change-me")
JWT_ALG = "HS256"
EXPIRY_HOURS = 24

@router.post("/guest")
def guest_login():
    """Generate a short‑lived JWT for anonymous guest usage.
    The token contains ``guest: true`` and ``sub: 'guest'``.
    Frontend can store the token like any other auth token.
    """
    payload = {
        "sub": "guest",
        "guest": True,
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(hours=EXPIRY_HOURS),
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)
    return {"access_token": token, "token_type": "bearer"}
