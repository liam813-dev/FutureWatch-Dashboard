import httpx
from datetime import datetime, timedelta
from typing import List, Dict

async def fetch_daily_net_flows(chain: str = "all") -> List[Dict]:
    """
    Fetch stablecoin net flows from llama.fi API.
    
    Args:
        chain: Chain identifier (default: "all")
        
    Returns:
        List of dictionaries containing date, net flow, and circulating supply
    """
    url = f"https://stablecoins.llama.fi/stablecoincharts/{chain}"
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        response.raise_for_status()
        data = response.json()
        
        # Process the last 30 points
        points = []
        for point in data[-30:]:
            points.append({
                "date": datetime.fromtimestamp(point["date"]).date(),
                "net": float(point["totalCirculating"]["peggedUSD"]),
                "circulating": float(point["totalCirculating"]["peggedUSD"])
            })
            
        return points 