"""
Request models for API endpoints
"""

from typing import Optional, List, Literal
from pydantic import BaseModel


class LLMRequest(BaseModel):
    prompt: str
    add_context_from_internet: bool = False
    response_json_schema: Optional[dict] = None
    model: Optional[str] = None  # Model name like "claude-3-haiku", "claude-3-opus", etc.


class PortfolioOptimizeRequest(BaseModel):
    objective: Literal["sharpe", "return", "risk", "esg"] = "sharpe"
    riskTolerance: Literal["conservative", "moderate", "aggressive"] = "moderate"
    timeHorizon: int = 5  # years
    constraints: Optional[dict] = None
    currentAllocation: Optional[dict] = None


class RegulatoryAnalysisRequest(BaseModel):
    documentText: Optional[str] = None
    fileUrl: Optional[str] = None
    docId: Optional[str] = None


class RiskMetricsRequest(BaseModel):
    positions: List[dict]
    stressScenario: Optional[str] = "baseline"


class PortfolioAdjustmentsRequest(BaseModel):
    """Request model for portfolio adjustments based on document analysis"""
    portfolio: dict  # Portfolio object with holdings
    documentAnalysisResult: dict  # Full document analysis result from /documents/analyze

