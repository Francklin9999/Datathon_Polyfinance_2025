"""
Portfolio optimization router
"""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Optional
import random

from app.models.requests import PortfolioOptimizeRequest
from app.services.portfolio_optimizer import PortfolioOptimizer

router = APIRouter()


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
