from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Neo Future Dashboard"
    API_V1_STR: str = "/api"
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001"]
    
    # API Settings
    HYPERLIQUID_WS_URL: str = "wss://api.hyperliquid.xyz/ws"
    HYPERLIQUID_API_URL: str = "https://api.hyperliquid.xyz/info"
    
    # WebSocket Settings
    WS_HEARTBEAT_INTERVAL: int = 30  # seconds
    WS_RECONNECT_INTERVAL: int = 5  # seconds
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    class Config:
        case_sensitive = True

settings = Settings()
