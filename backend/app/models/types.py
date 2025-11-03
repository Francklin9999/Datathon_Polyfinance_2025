"""
Data models for portfolio-first, document-driven risk analysis
"""

from typing import Optional, List, Dict, Literal, Union
from pydantic import BaseModel, Field
from datetime import datetime


class EvidenceSpan(BaseModel):
    """Evidence snippet from a source document"""
    source: Literal["10K", "10Q", "RegDoc", "News", "Tweet", "Reddit", "Lawsuit"]
    uri: Optional[str] = None
    section: Optional[str] = None
    snippet: str = Field(..., max_length=280, description="280 chars max, highlighted terms")
    timestamp: Optional[str] = None


class RiskComponent(BaseModel):
    """Normalized risk component (0..100 with uncertainty)"""
    name: Literal["SupplyChain", "GeoExposure", "MeasureMatch", "SentimentRisk"]
    score: float = Field(..., ge=0, le=100, description="Point estimate")
    ucb95: Optional[float] = Field(None, ge=0, le=100, description="Optional uncertainty band")
    evidence: Optional[List[EvidenceSpan]] = None


class CompanyRisk(BaseModel):
    """Risk assessment for a single company"""
    ticker: str
    total_score: float = Field(..., ge=0, le=100)
    components: List[RiskComponent]
    price_impact_bps: Optional[float] = Field(None, description="Modeled ΔP in basis points under document")


class Portfolio(BaseModel):
    """Portfolio definition"""
    asof: str = Field(..., description="ISO date")
    holdings: Dict[str, float] = Field(..., description="Record of Ticker -> Weight (0..1)")
    meta: Optional[Dict[str, Union[str, int, float]]] = Field(
        None,
        description="Metadata: source, num_holdings, etc."
    )


class PortfolioImpact(BaseModel):
    """Portfolio-level impact assessment"""
    delta_return_bps: float = Field(..., description="Expected return change in basis points")
    delta_vol_bps: Optional[float] = Field(None, description="Volatility change in basis points")
    worst_offenders: List[Dict[str, Union[str, float]]] = Field(
        ...,
        description="Top-N offenders with ticker and score"
    )
    evidences: Optional[Dict[str, List[EvidenceSpan]]] = Field(
        None,
        description="Evidence spans per ticker (only for top-N)"
    )
    p5: Optional[float] = Field(None, description="5th percentile impact")
    p50: Optional[float] = Field(None, description="50th percentile (median) impact")
    p95: Optional[float] = Field(None, description="95th percentile impact")


class CalibrationMetadata(BaseModel):
    """Calibration weights and statistics"""
    calibrated_weights: Dict[str, float]
    r_squared: float = Field(..., ge=0, le=1)
    n_samples: int = Field(..., ge=1)
    confidence: Literal["high", "medium", "low"] = "low"


class Scenario(BaseModel):
    """Scenario definition for simulation"""
    name: str
    scenario_type: Literal[
        "tariff", "sanction", "ban", "subsidy_removal",
        "carbon_tax", "fx_shock", "supply_chain_disruption",
        "litigation", "regulatory_delay"
    ]
    severity: float = Field(..., ge=0, le=1, description="Severity multiplier")
    duration_days: Optional[int] = Field(None, ge=1)
    parameters: Optional[Dict[str, Union[str, float, List[str]]]] = Field(
        None,
        description="Scenario-specific parameters (rate %, target sector/region, etc.)"
    )


class ScenarioResult(BaseModel):
    """Result of scenario simulation"""
    scenario: Scenario
    p5: float
    p50: float
    p95: float
    portfolio_impact: PortfolioImpact
    affected_tickers: List[str]


class HedgeSuggestion(BaseModel):
    """Hedge recommendation"""
    hedge_type: Literal["equity_pair", "options_overlay", "etf_overlay", "macro_hedge"]
    description: str
    estimated_risk_reduction: float = Field(..., description="Estimated ↓RegRisk in points")
    estimated_cost_bps: float = Field(..., description="Estimated cost in bps/month (carry)")
    confidence: Literal["high", "medium", "low"] = "medium"
    target_component: Optional[Literal["SupplyChain", "GeoExposure", "MeasureMatch", "SentimentRisk"]] = None
    details: Optional[Dict[str, Union[str, float, List[str]]]] = None

