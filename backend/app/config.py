import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "TRACKMEDS Health Supply Chain Command Center"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./trackmeds.db")
    
    # Gemini AI API Key
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # OpenWeather API Key
    WEATHER_API_KEY: str = os.getenv("WEATHER_API_KEY", "")
    
    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    # Resource Risk Thresholds (Configurable)
    BED_WARNING_THRESHOLD: float = 75.0  # Occupancy % above 75% -> WARNING
    BED_CRITICAL_THRESHOLD: float = 90.0 # Occupancy % above 90% -> CRITICAL

    STAFF_WARNING_THRESHOLD: float = 85.0  # Staffing % below 85% -> WARNING
    STAFF_CRITICAL_THRESHOLD: float = 70.0 # Staffing % below 70% -> CRITICAL

    class Config:
        case_sensitive = True

settings = Settings()
