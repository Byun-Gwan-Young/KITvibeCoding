from __future__ import annotations

from sqlalchemy.orm import Session

from ..models import User
from .auth import authenticate_user


def authenticate_frontend_user(db: Session, email: str, password: str) -> User | None:
    return authenticate_user(db, email, password)
