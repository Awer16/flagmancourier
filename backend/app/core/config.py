from pydantic_settings import BaseSettings
from functools import lru_cache
import os
from pathlib import Path

# Определяем директорию проекта (где лежит этот файл)
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DB_PATH = BASE_DIR / "delivery.db"


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = f"sqlite+aiosqlite:///{DB_PATH}"
    DATABASE_URL_SYNC: str = f"sqlite:///{DB_PATH}"

    # JWT
    JWT_SECRET_KEY: str = "super-secret-key-for-delivery-aggregator-2024-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # App
    APP_NAME: str = "Delivery Aggregator API"
    DEBUG: bool = True
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001"]

    class Config:
        env_file = ".env.local"
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
