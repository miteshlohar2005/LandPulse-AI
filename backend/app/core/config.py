import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(case_sensitive=True)

    PROJECT_NAME: str = "LandGuard AI"
    TAGLINE: str = "Predict delays. Prevent bottlenecks. Accelerate infrastructure."
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "landguard-ai-sih2026-super-secure-jwt-key-dolr-gov-in")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours for demo ease
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./landguard.db")
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ]
    
    # Project Root is /Users/himanshu/LandGuard
    PROJECT_ROOT: str = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    MODEL_DIR: str = os.path.join(PROJECT_ROOT, "ml", "saved_models")
    DATA_DIR: str = os.path.join(PROJECT_ROOT, "ml", "data")
    UPLOAD_DIR: str = os.path.join(PROJECT_ROOT, "uploads")

settings = Settings()
