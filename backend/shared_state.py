from typing import Optional
from app.models.schemas import MacroData

# Global cache for macro data fetched on startup
macro_data_cache: Optional[MacroData] = None 