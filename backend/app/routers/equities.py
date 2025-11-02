"""
Equities router - index data, sector analysis, technical indicators
"""

from fastapi import APIRouter
from typing import Optional, List
import random

router = APIRouter()


@router.get("/index/{region}")
async def get_index_overview(region: str):
    """
    Get index overview for a region
    """
    indices = {
        "US": {
            "symbol": "SPX",
            "name": "S&P 500",
            "price": 4500 + random.uniform(-50, 50),
            "chg1D": random.uniform(-2, 2),
            "chg5D": random.uniform(-5, 5),
            "ytd": random.uniform(-10, 15)
        },
        "EU": {
            "symbol": "STOXX50",
            "name": "Euro STOXX 50",
            "price": 4000 + random.uniform(-50, 50),
            "chg1D": random.uniform(-2, 2),
            "chg5D": random.uniform(-5, 5),
            "ytd": random.uniform(-10, 15)
        },
        "ASIA": {
            "symbol": "N225",
            "name": "Nikkei 225",
            "price": 30000 + random.uniform(-500, 500),
            "chg1D": random.uniform(-2, 2),
            "chg5D": random.uniform(-5, 5),
            "ytd": random.uniform(-10, 15)
        }
    }
    
    index_data = indices.get(region.upper(), indices["US"])
    
    return {
        "region": region,
        "indices": [index_data],
        "risk": {
            "volatility20d": random.uniform(10, 30),
            "vix": random.uniform(15, 35)
        }
    }


@router.get("/sectors")
async def get_sector_analysis(region: Optional[str] = "US"):
    """
    Get sector performance analysis
    """
    sectors = [
        "Technology", "Healthcare", "Financials", "Consumer Discretionary",
        "Communication Services", "Industrials", "Consumer Staples",
        "Energy", "Utilities", "Real Estate", "Materials"
    ]
    
    sector_data = []
    for sector in sectors:
        sector_data.append({
            "name": sector,
            "weight": random.uniform(5, 15),
            "return_1d": random.uniform(-3, 3),
            "return_ytd": random.uniform(-15, 25),
            "volatility": random.uniform(15, 35)
        })
    
    return {
        "region": region,
        "sectors": sector_data,
        "timestamp": "2024-01-01T12:00:00Z"
    }


@router.get("/technical/{symbol}")
async def get_technical_indicators(symbol: str):
    """
    Get technical indicators for a symbol
    """
    return {
        "symbol": symbol,
        "indicators": {
            "rsi": random.uniform(30, 70),
            "macd": {
                "value": random.uniform(-2, 2),
                "signal": random.uniform(-2, 2),
                "histogram": random.uniform(-1, 1)
            },
            "bollinger_bands": {
                "upper": 105,
                "middle": 100,
                "lower": 95
            },
            "moving_averages": {
                "sma_20": 100,
                "sma_50": 98,
                "ema_20": 100.5
            }
        }
    }

