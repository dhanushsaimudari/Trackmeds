import os
from dotenv import load_dotenv

# Load environment variables from both backend directory and project root
load_dotenv()
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "..", ".env"))

from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )

    PROJECT_NAME: str = "TRACKMEDS Health Supply Chain Command Center"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'trackmeds.db')}"
    )
    
    # Gemini AI API Key
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # OpenWeather API Key
    WEATHER_API_KEY: str = os.getenv("WEATHER_API_KEY", "")
    
    # Environment & Security
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "trackmeds-production-health-key-2026")
    
    # Firebase Configuration
    FIREBASE_PROJECT_ID: str = os.getenv("FIREBASE_PROJECT_ID", "trackmeds-health")
    FIREBASE_SERVICE_ACCOUNT_PATH: str = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "")
    FIREBASE_SERVICE_ACCOUNT_JSON: str = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON", "")
    
    # CORS
    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "")

    # Resource Risk Thresholds (Configurable)
    BED_WARNING_THRESHOLD: float = 75.0  # Occupancy % above 75% -> WARNING
    BED_CRITICAL_THRESHOLD: float = 90.0 # Occupancy % above 90% -> CRITICAL

    STAFF_WARNING_THRESHOLD: float = 85.0  # Staffing % below 85% -> WARNING
    STAFF_CRITICAL_THRESHOLD: float = 70.0 # Staffing % below 70% -> CRITICAL

settings = Settings()
