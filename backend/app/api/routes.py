from fastapi import APIRouter, HTTPException
from datetime import datetime
import json
import asyncio
from ..models.schemas import DashboardData
from ...data_aggregator import gather_dashboard_data

router = APIRouter()

@router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "neo-future-api"
    }

@router.get("/data")
async def get_data():
    """Get dashboard data"""
    try:
        data = await gather_dashboard_data()
        return data
    except Exception as e:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] ❌ Error in get_data: {e}")
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        } 