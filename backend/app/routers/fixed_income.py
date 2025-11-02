"""
Fixed Income router - yield curves, duration, credit spreads
"""

from fastapi import APIRouter
from typing import List, Optional
import random

router = APIRouter()


@router.get("/yield-curve")
async def get_yield_curve(
    region: Optional[str] = "US",
    date: Optional[str] = None
):
    """
    Get yield curve data
    """
    # Generate mock yield curve
    tenors = [1, 3, 6, 12, 24, 36, 60, 84, 120, 180, 240, 360]  # months
    yields = []
    
    base_yield = 4.5 if region == "US" else 3.2
    
    for tenor in tenors:
        # Normal upward sloping curve with some randomness
        yield_val = base_yield + (tenor / 12) * 0.5 + random.uniform(-0.1, 0.1)
        yields.append({
            "tenor_months": tenor,
            "yield": round(yield_val, 3),
            "type": "government" if tenor <= 120 else "corporate"
        })
    
    return {
        "region": region,
        "date": date or "2024-01-01",
        "data": yields,
        "spread": {
            "2s10s": 0.45,  # 2-year vs 10-year spread
            "2s30s": 0.65,
            "10s30s": 0.20
        }
    }


@router.get("/duration")
async def calculate_duration(
    bond_type: str = "government",
    maturity_years: float = 10.0,
    coupon_rate: float = 4.0,
    yield_to_maturity: float = 4.5
):
    """
    Calculate bond duration and convexity
    """
    # Simplified duration calculation
    # Modified duration approximation
    mod_duration = maturity_years / (1 + yield_to_maturity / 100)
    convexity = maturity_years ** 2 / 100
    
    return {
        "macaulay_duration": maturity_years,
        "modified_duration": round(mod_duration, 2),
        "convexity": round(convexity, 2),
        "duration_dollar_value": round(mod_duration * 0.01, 4),  # DV01
        "parameters": {
            "maturity_years": maturity_years,
            "coupon_rate": coupon_rate,
            "yield_to_maturity": yield_to_maturity
        }
    }


@router.get("/credit-spreads")
async def get_credit_spreads(
    region: str = "US",
    rating: Optional[str] = None
):
    """
    Get credit spreads by rating
    """
    ratings = ["AAA", "AA", "A", "BBB", "BB", "B", "CCC"]
    spreads = {
        "AAA": 0.50,
        "AA": 0.75,
        "A": 1.00,
        "BBB": 1.50,
        "BB": 2.50,
        "B": 4.00,
        "CCC": 7.00
    }
    
    if rating:
        return {
            "rating": rating,
            "spread": spreads.get(rating, 1.0),
            "region": region
        }
    
    return {
        "region": region,
        "spreads": [
            {"rating": r, "spread": spreads[r] + random.uniform(-0.1, 0.1)} 
            for r in ratings
        ]
    }

