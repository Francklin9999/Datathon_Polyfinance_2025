"""
Portfolio optimization router
"""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Optional
import random
import json
import logging

from app.models.requests import PortfolioOptimizeRequest, PortfolioAdjustmentsRequest
from app.models.types import Portfolio
from app.services.portfolio_optimizer import PortfolioOptimizer
from app.services.portfolio_service import PortfolioService
from app.services.portfolio_risk_service import PortfolioRiskService
from app.services.aws_bedrock_service import BedrockService
from app.services.aws_config import is_aws_configured

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/optimize")
async def optimize_portfolio(request: PortfolioOptimizeRequest):
    """
    Optimize portfolio using mean-variance optimization
    Supports regulatory constraints if provided
    """
    objective = request.objective
    risk_tolerance = request.riskTolerance
    time_horizon = request.timeHorizon
    regulatory_risk_scores = request.constraints.get("regulatoryRiskScores", {}) if request.constraints else {}
    max_regulatory_risk = request.constraints.get("maxRegulatoryRisk") if request.constraints else None
    
    # Check if regulatory optimization requested with real data
    if regulatory_risk_scores and max_regulatory_risk and request.currentAllocation:
        try:
            # Use real portfolio optimizer with regulatory constraints
            expected_returns = request.constraints.get("expectedReturns", {})
            covariance_matrix = request.constraints.get("covarianceMatrix", {})
            
            # Build expected returns and covariance from provided data or use defaults
            current_weights = {k: v / 100.0 for k, v in request.currentAllocation.items()}  # Convert to decimals
            
            # If not provided, use mock data
            if not expected_returns:
                expected_returns = {ticker: 0.08 + random.uniform(-0.02, 0.02) for ticker in current_weights.keys()}
            
            if not covariance_matrix:
                # Create simple covariance matrix
                tickers = list(current_weights.keys())
                covariance_matrix = {
                    t1: {t2: (0.15 if t1 == t2 else 0.05) * 0.15 * 0.15 for t2 in tickers}
                    for t1 in tickers
                }
            
            result = PortfolioOptimizer.optimize_with_regulatory_constraints(
                current_weights=current_weights,
                expected_returns=expected_returns,
                covariance_matrix=covariance_matrix,
                regulatory_risk_scores=regulatory_risk_scores,
                risk_tolerance=0.5 if risk_tolerance == "moderate" else (0.7 if risk_tolerance == "aggressive" else 0.3),
                max_regulatory_risk=max_regulatory_risk,
                min_weight=0.0,
                max_weight=1.0
            )
            
            if result.get("success"):
                return result
        except Exception as e:
            # If optimization fails, fall through to mock optimization
            pass
    
    # Mock optimization results (in production, use actual optimization library)
    current_allocation = request.currentAllocation or {
        "Equities": 45,
        "Fixed Income": 30,
        "Alternatives": 15,
        "Cash": 10
    }
    
    # Generate optimized allocation based on objective
    if objective == "sharpe":
        optimized_allocation = {
            "Equities": 52,
            "Fixed Income": 25,
            "Alternatives": 18,
            "Cash": 5
        }
        expected_return = 9.8
        risk = 11.2
        sharpe = 0.88
    elif objective == "return":
        optimized_allocation = {
            "Equities": 60,
            "Fixed Income": 20,
            "Alternatives": 15,
            "Cash": 5
        }
        expected_return = 11.2
        risk = 13.5
        sharpe = 0.83
    elif objective == "risk":
        optimized_allocation = {
            "Equities": 35,
            "Fixed Income": 40,
            "Alternatives": 15,
            "Cash": 10
        }
        expected_return = 6.5
        risk = 8.2
        sharpe = 0.79
    else:  # esg
        optimized_allocation = {
            "Equities": 48,
            "Fixed Income": 30,
            "Alternatives": 17,
            "Cash": 5
        }
        expected_return = 8.5
        risk = 10.8
        sharpe = 0.79
    
    # Generate efficient frontier data
    efficient_frontier = []
    for i in range(50):
        risk_val = 5 + i * 0.4
        return_val = (risk_val / 5) ** 0.5 + 3 + random.uniform(-0.3, 0.3)
        efficient_frontier.append({
            "risk": risk_val,
            "return": return_val,
            "optimal": abs(risk_val - risk) < 0.5 and abs(return_val - expected_return) < 0.3
        })
    
    # Sector exposure
    sector_exposure = [
        {"sector": "Technology", "current": 28, "optimized": 32, "max": 35},
        {"sector": "Healthcare", "current": 15, "optimized": 18, "max": 25},
        {"sector": "Financials", "current": 12, "optimized": 14, "max": 20},
        {"sector": "Consumer", "current": 18, "optimized": 16, "max": 25},
        {"sector": "Energy", "current": 8, "optimized": 6, "max": 15},
        {"sector": "Industrials", "current": 10, "optimized": 9, "max": 20},
        {"sector": "Other", "current": 9, "optimized": 5, "max": 15}
    ]
    
    # Risk contribution
    risk_contribution = [
        {"asset": "Equities", "contribution": 65},
        {"asset": "Fixed Income", "contribution": 15},
        {"asset": "Alternatives", "contribution": 18},
        {"asset": "Cash", "contribution": 2}
    ]
    
    # Performance comparison
    current_metrics = {
        "expected_return": 7.2,
        "volatility": 12.5,
        "sharpe": 0.58,
        "max_drawdown": -15.3
    }
    
    return {
        "currentAllocation": current_allocation,
        "optimizedAllocation": optimized_allocation,
        "metrics": {
            "expectedReturn": expected_return,
            "risk": risk,
            "sharpe": sharpe,
            "esgScore": 80,
            "currentMetrics": current_metrics
        },
        "efficientFrontier": efficient_frontier,
        "sectorExposure": sector_exposure,
        "riskContribution": risk_contribution,
        "improvement": {
            "return": expected_return - current_metrics["expected_return"],
            "risk": current_metrics["volatility"] - risk,
            "sharpe": sharpe - current_metrics["sharpe"]
        }
    }


@router.get("/metrics")
async def get_portfolio_metrics():
    """
    Get portfolio performance metrics
    """
    return {
        "totalPnL": 125000.0,
        "unrealizedPnL": 85000.0,
        "realizedPnL": 40000.0,
        "totalExposure": 50000000.0,
        "totalMarketValue": 50125000.0,
        "numPositions": 45,
        "longCount": 28,
        "shortCount": 17
    }


@router.post("/init-equal-weight")
async def init_equal_weight_universe(
    universe_cutoff_months: int = 18
):
    """
    Build equal-weight portfolio from tickers with recent filings (10-K/10-Q)
    in the last N months.
    
    Args:
        universe_cutoff_months: Number of months to look back for recent filings (default: 18)
        
    Returns:
        Portfolio with equal weights for all tickers with recent filings
    """
    try:
        portfolio = PortfolioService.init_equal_weight_universe(
            universe_cutoff_months=universe_cutoff_months
        )
        
        stats = PortfolioService.get_portfolio_stats(portfolio)
        
        return {
            "portfolio": portfolio.dict(),
            "stats": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error initializing portfolio: {str(e)}")


@router.get("/risk-dashboard")
async def get_portfolio_risk_dashboard():
    """
    Get portfolio risk dashboard metrics from cache
    
    Returns:
        Dictionary with all portfolio risk metrics including:
        - portfolioRiskSummary: Total exposure, weighted risk score, high risk count, risk trend
        - sectorBreakdown: Sector weights, average risk scores, exposure
        - geographicRisk: Geographic exposure and risk scores
        - highRiskCompanies: Top 5 highest risk companies
        - riskTrend: 12-month portfolio risk trend
        - portfolioComposition: Portfolio composition details
        
    Note:
        Metrics are computed at startup (see initialize_portfolio_risk_cache in main.py).
        Use --new flag when starting server to force recompute.
    """
    try:
        metrics = PortfolioRiskService.get_portfolio_risk_metrics()
        return metrics
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error getting portfolio risk metrics: {str(e)}")


@router.post("/get-adjustments")
async def get_portfolio_adjustments(request: PortfolioAdjustmentsRequest):
    """
    Get portfolio weight adjustments based on document interpretation
    
    Takes document interpretation and adjusts portfolio weights based on:
    - Sector-level impacts from the document
    - Geographic exposures
    - Market trends and risk assessment
    - General portfolio recommendations
    
    NO individual company analysis - uses general market insights only.
    
    Args:
        request: PortfolioAdjustmentsRequest with portfolio and documentAnalysisResult (interpretation)
        
    Returns:
        Dictionary with:
        - currentWeights: Current portfolio weights
        - adjustedWeights: Adjusted portfolio weights based on general market interpretation
        - adjustments: List of adjustments made
        - suggestions: NLP-based strategic suggestions
        - summary: Summary of adjustments
    """
    try:
        portfolio = request.portfolio
        holdings = portfolio.get("holdings", {})
        document_result = request.documentAnalysisResult
        
        if not holdings:
            raise HTTPException(status_code=400, detail="Portfolio must have holdings")
        
        # Get interpretation (should contain general market insights)
        interpretation = document_result.get("interpretation") if document_result else None
        
        if not interpretation:
            raise HTTPException(
                status_code=400, 
                detail="Document interpretation required. Please provide document interpretation."
            )
        
        # Extract sector impacts and market insights from interpretation
        sectors_mentioned = interpretation.get("sectors_mentioned", [])
        sector_impacts = interpretation.get("sector_impacts", {})
        risk_assessment = interpretation.get("risk_assessment", "Medium")
        market_trends = interpretation.get("market_trends", "")
        
        # Map risk assessment to numeric value for calculations
        risk_score_map = {
            "low": 30.0,
            "medium": 50.0,
            "high": 70.0
        }
        risk_score = risk_score_map.get(risk_assessment.lower().split()[0] if risk_assessment else "medium", 50.0)
        
        total_weight = sum(holdings.values())
        if total_weight == 0:
            raise HTTPException(status_code=400, detail="Portfolio weights must sum to > 0")
        
        # Normalize weights
        normalized_holdings = {ticker: weight / total_weight for ticker, weight in holdings.items()}
        
        # Map sectors to adjustment factors based on interpretation
        # Positive impact = increase weight, negative = decrease
        sector_adjustment_factors = {}
        
        # Analyze sector impacts to determine adjustment direction
        for sector, impact_desc in sector_impacts.items():
            impact_lower = impact_desc.lower()
            if any(word in impact_lower for word in ["positive", "favorable", "benefit", "opportunity", "growth"]):
                sector_adjustment_factors[sector] = 1.1  # Increase weight by 10%
            elif any(word in impact_lower for word in ["negative", "risk", "challenge", "concern", "threat", "decline"]):
                sector_adjustment_factors[sector] = 0.9  # Decrease weight by 10%
            else:
                sector_adjustment_factors[sector] = 1.0  # No change
        
        # Simple sector mapping - would use real sector data in production
        # For now, we'll use general market risk assessment
        adjusted_weights = {}
        adjustments = []
        
        # If high risk, reduce overall exposure; if low risk, maintain or slightly increase
        overall_adjustment_factor = 0.95 if risk_score >= 65.0 else (1.05 if risk_score <= 35.0 else 1.0)
        
        for ticker, weight in normalized_holdings.items():
            # Use overall market risk for general adjustment
            # In production, would map ticker to sector and use sector-specific adjustments
            new_weight = weight * overall_adjustment_factor
            adjustment = new_weight - weight
            
            if abs(adjustment * 100) > 0.01:  # Only record significant adjustments
                adjustments.append({
                    "ticker": ticker,
                    "currentWeight": round(weight * 100, 2),
                    "adjustedWeight": round(new_weight * 100, 2),
                    "adjustment": round(adjustment * 100, 2),
                    "reason": f"Based on general market {risk_assessment.lower()} assessment"
                })
            
            adjusted_weights[ticker] = new_weight
        
        # Normalize adjusted weights to sum to 1
        total_adjusted = sum(adjusted_weights.values())
        if total_adjusted > 0:
            adjusted_weights = {ticker: weight / total_adjusted for ticker, weight in adjusted_weights.items()}
        else:
            adjusted_weights = normalized_holdings
        
        # Convert to percentages for display
        current_weights_pct = {
            ticker: round(weight * 100, 2)
            for ticker, weight in normalized_holdings.items()
        }
        
        adjusted_weights_pct = {
            ticker: round(weight * 100, 2)
            for ticker, weight in adjusted_weights.items()
        }
        
        # Sort adjustments by absolute adjustment size
        adjustments.sort(key=lambda x: abs(x["adjustment"]), reverse=True)
        
        # Generate NLP-based suggestions using document interpretation (NOT company analysis)
        suggestions = []
        try:
            top_adjustments = adjustments[:10]  # Top 10 adjustments
            
            nlp_prompt = f"""Based on the global market document interpretation and portfolio adjustments, provide strategic portfolio suggestions.

Market Interpretation Summary:
{interpretation.get('summary', 'N/A')}

Key Themes:
{', '.join(interpretation.get('key_themes', [])[:3])}

Portfolio Implications:
{interpretation.get('portfolio_implications', 'N/A')}

Risk Assessment: {risk_assessment}

Sectors Mentioned:
{', '.join(sectors_mentioned[:5]) if sectors_mentioned else 'Various sectors'}

Market Trends:
{market_trends if market_trends else 'General market trends identified'}

Current Portfolio:
- Total Companies: {len(holdings)}
- Current average weight per position: {round(100.0 / len(holdings), 2) if holdings else 0}%
- Portfolio size: {len(holdings)} positions

Proposed Adjustments Summary:
- Overall market risk: {risk_assessment}
- Adjustment strategy: {"Reduce exposure" if overall_adjustment_factor < 1.0 else "Maintain or increase exposure" if overall_adjustment_factor > 1.0 else "Maintain current allocation"}
- Number of positions adjusted: {len(adjustments)}

Provide 3-5 strategic portfolio suggestions in JSON format based on GLOBAL MARKET trends (NOT individual companies):
{{
  "suggestions": [
    "General portfolio strategy suggestion based on market trends",
    "Sector allocation recommendation (no company names)",
    "Risk management strategy based on interpretation"
  ],
  "rationale": "Brief explanation of why these adjustments are recommended based on market interpretation",
  "next_steps": ["Portfolio action step 1", "Portfolio action step 2"]
}}

IMPORTANT: 
- Focus on SECTOR-LEVEL and MARKET-LEVEL strategies
- NO individual company names or tickers
- Provide general portfolio allocation guidance
- Be specific about sectors and market trends"""
            
            if is_aws_configured():
                nlp_response = BedrockService.invoke_model(
                    prompt=nlp_prompt,
                    max_tokens=1024,
                    temperature=0.6
                )
                response_text = nlp_response.get("text", "")
                
                # Parse JSON response
                try:
                    if "```json" in response_text:
                        json_start = response_text.find("```json") + 7
                        json_end = response_text.find("```", json_start)
                        if json_end > json_start:
                            suggestions_data = json.loads(response_text[json_start:json_end].strip())
                            suggestions = suggestions_data.get("suggestions", [])
                    elif "{" in response_text and "}" in response_text:
                        # Try to find JSON object in text
                        json_start = response_text.find("{")
                        json_end = response_text.rfind("}") + 1
                        if json_end > json_start:
                            suggestions_data = json.loads(response_text[json_start:json_end])
                            suggestions = suggestions_data.get("suggestions", [])
                except (json.JSONDecodeError, ValueError):
                    # Fallback: use interpretation recommendations
                    suggestions = interpretation.get("recommendations", [])[:5] if interpretation else []
            else:
                # Fallback: use interpretation recommendations
                suggestions = interpretation.get("recommendations", [])[:5] if interpretation else []
        except Exception as e:
            import traceback
            traceback.print_exc()
            logger.warning(f"Error generating NLP suggestions: {str(e)}")
            # Fallback: use interpretation recommendations
            suggestions = interpretation.get("recommendations", [])[:5] if interpretation else []
        
        # Calculate summary metrics based on market interpretation
        risk_reduction = (risk_score - risk_score * 0.95) if overall_adjustment_factor < 1.0 else 0
        
        return {
            "currentWeights": current_weights_pct,
            "adjustedWeights": adjusted_weights_pct,
            "adjustments": adjustments[:20],  # Limit to top 20 adjustments
            "suggestions": suggestions,
            "summary": {
                "marketRiskAssessment": risk_assessment,
                "marketRiskScore": round(risk_score, 2),
                "numAdjustments": len([a for a in adjustments if abs(a["adjustment"]) > 0.01]),
                "adjustmentStrategy": "Reduce exposure" if overall_adjustment_factor < 1.0 else "Increase exposure" if overall_adjustment_factor > 1.0 else "Maintain allocation",
                "sectorsAffected": sectors_mentioned[:5] if sectors_mentioned else [],
                "portfolioImplications": interpretation.get("portfolio_implications", "")
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error calculating portfolio adjustments: {str(e)}")
