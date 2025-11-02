"""
Options trading router - pricing, Greeks, volatility surface, strategies
"""

from fastapi import APIRouter
from typing import Optional
import math
import random

router = APIRouter()


@router.post("/price")
async def calculate_option_price(request: dict):
    """
    Calculate option price using Black-Scholes or binomial model
    """
    spot = request.get("spot", 100.0)
    strike = request.get("strike", 100.0)
    time_to_expiry = request.get("timeToExpiry", 0.25)  # years
    volatility = request.get("volatility", 0.20)
    risk_free_rate = request.get("riskFreeRate", 0.05)
    option_type = request.get("type", "call")  # call or put
    model = request.get("model", "black-scholes")  # black-scholes or binomial
    
    # Mock Black-Scholes calculation (simplified)
    d1 = (math.log(spot / strike) + (risk_free_rate + 0.5 * volatility ** 2) * time_to_expiry) / (volatility * math.sqrt(time_to_expiry))
    d2 = d1 - volatility * math.sqrt(time_to_expiry)
    
    if option_type == "call":
        price = spot * 0.5 * (1 + math.erf(d1 / math.sqrt(2))) - strike * math.exp(-risk_free_rate * time_to_expiry) * 0.5 * (1 + math.erf(d2 / math.sqrt(2)))
    else:
        price = strike * math.exp(-risk_free_rate * time_to_expiry) * 0.5 * (1 + math.erf(-d2 / math.sqrt(2))) - spot * 0.5 * (1 + math.erf(-d1 / math.sqrt(2)))
    
    return {
        "price": max(price, 0.01),
        "model": model,
        "parameters": {
            "spot": spot,
            "strike": strike,
            "timeToExpiry": time_to_expiry,
            "volatility": volatility,
            "riskFreeRate": risk_free_rate,
            "type": option_type
        }
    }


@router.post("/greeks")
async def calculate_greeks(request: dict):
    """
    Calculate option Greeks (Delta, Gamma, Theta, Vega, Rho)
    """
    spot = request.get("spot", 100.0)
    strike = request.get("strike", 100.0)
    time_to_expiry = request.get("timeToExpiry", 0.25)
    volatility = request.get("volatility", 0.20)
    risk_free_rate = request.get("riskFreeRate", 0.05)
    option_type = request.get("type", "call")
    
    # Mock Greeks calculation
    return {
        "delta": 0.52 if option_type == "call" else -0.48,
        "gamma": 0.045,
        "theta": -0.025,
        "vega": 0.18,
        "rho": 0.12 if option_type == "call" else -0.08,
        "intrinsicValue": max(spot - strike if option_type == "call" else strike - spot, 0),
        "timeValue": random.uniform(2.5, 5.0)
    }


@router.get("/vol-surface")
async def get_volatility_surface(
    symbol: str = "SPX",
    expiration_dates: Optional[str] = None
):
    """
    Get implied volatility surface
    """
    # Generate mock volatility surface data
    strikes = [80, 90, 95, 100, 105, 110, 120]
    expirations = [0.083, 0.25, 0.5, 1.0]  # 1 month, 3 months, 6 months, 1 year
    
    vol_surface = []
    for expiry in expirations:
        for strike in strikes:
            # Mock volatility smile
            moneyness = strike / 100.0
            vol = 0.20 + 0.05 * (moneyness - 1.0) ** 2 + random.uniform(-0.02, 0.02)
            vol_surface.append({
                "strike": strike,
                "expiration": expiry,
                "impliedVolatility": max(0.10, min(0.50, vol))
            })
    
    return {
        "symbol": symbol,
        "data": vol_surface,
        "timestamp": "2024-01-01T12:00:00Z"
    }


@router.get("/strategies")
async def get_option_strategies():
    """
    Get popular option strategies
    """
    return {
        "strategies": [
            {
                "name": "Covered Call",
                "description": "Long stock + short call",
                "maxProfit": 1000,
                "maxLoss": -5000,
                "breakeven": 95,
                "greeks": {"delta": 0.5, "gamma": 0.02, "theta": -0.01, "vega": -0.05}
            },
            {
                "name": "Protective Put",
                "description": "Long stock + long put",
                "maxProfit": float("inf"),
                "maxLoss": -200,
                "breakeven": 102,
                "greeks": {"delta": 0.45, "gamma": 0.03, "theta": -0.02, "vega": 0.15}
            },
            {
                "name": "Straddle",
                "description": "Long call + long put (same strike)",
                "maxProfit": float("inf"),
                "maxLoss": -500,
                "breakeven": [95, 105],
                "greeks": {"delta": 0.0, "gamma": 0.06, "theta": -0.04, "vega": 0.30}
            }
        ]
    }

