"""
Recommendations router - Hedge and diversification recommendations
"""

from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel

from app.models.types import Portfolio, CompanyRisk
from app.services.recommendations_service import RecommendationsService

router = APIRouter()


class RecommendationsRequest(BaseModel):
    """Request model for recommendations"""
    portfolio: Portfolio
    company_risks: List[dict]  # CompanyRisk dicts
    scenarios: Optional[List[dict]] = None


@router.post("/compute")
async def compute_recommendations(request: RecommendationsRequest):
    """
    Compute hedge menu and diversification suggestions
    
    Returns:
    {
        "hedges": List[HedgeSuggestion],
        "diversification": List[Dict],
        "top_component": str,
        "top_offenders": List[Dict]
    }
    """
    try:
        # Convert dicts to CompanyRisk objects
        company_risks = [
            CompanyRisk(**risk) for risk in request.company_risks
        ]
        
        result = RecommendationsService.compute_recommendations(
            portfolio=request.portfolio,
            company_risks=company_risks,
            scenarios=request.scenarios
        )
        
        # Convert Pydantic models to dicts
        return {
            "hedges": [h.dict() for h in result["hedges"]],
            "diversification": result["diversification"],
            "top_component": result["top_component"],
            "top_offenders": result["top_offenders"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error computing recommendations: {str(e)}")

