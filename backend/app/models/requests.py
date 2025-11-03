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


class VideoGenerationRequest(BaseModel):
    """Request model for video generation"""
    prompt: str  # Text description of the video to generate
    duration: Optional[Literal["5s", "10s"]] = "5s"  # Video duration
    resolution: Optional[Literal["540p", "720p", "1080p"]] = "540p"  # Video resolution
    aspect_ratio: Optional[Literal["16:9", "9:16", "1:1"]] = "16:9"  # Aspect ratio
    s3_output_prefix: Optional[str] = None  # Optional S3 prefix for output

