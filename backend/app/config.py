"""
Configuration and Environment Settings for Nepal CEE Result Checker Backend.
"""

import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "CEE Result Checker Nepal"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Supabase Configuration
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://xyzcompany.supabase.co")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "dummy-supabase-anon-key-for-local-dev")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "dummy-service-role-key")

    # Security & JWT
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super-secret-nepal-cee-2024-token-key-change-in-prod-xyz123")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Admin Credentials (Initial seed / fallback)
    DEFAULT_ADMIN_USERNAME: str = os.getenv("DEFAULT_ADMIN_USERNAME", "admin")
    DEFAULT_ADMIN_PASSWORD: str = os.getenv("DEFAULT_ADMIN_PASSWORD", "Admin@CEE2024")

    # Storage & Uploads
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads"))
    MAX_UPLOAD_SIZE_MB: int = 50

    # Rate Limiting
    SEARCH_RATE_LIMIT_PER_MINUTE: int = 60

    # OCR Configuration
    TESSERACT_CMD: str = os.getenv("TESSERACT_CMD", r"C:\Program Files\Tesseract-OCR\tesseract.exe")

    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        "https://cee-result-nepal.vercel.app",
        "*"
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="allow"
    )


settings = Settings()
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
