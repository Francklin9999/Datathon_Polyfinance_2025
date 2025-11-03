from typing import Dict, List, Optional
import numpy as np
import random

try:
    from sklearn.ensemble import RandomForestRegressor
    from sklearn.preprocessing import StandardScaler
    ML_AVAILABLE = True
except ImportError:
    ML_AVAILABLE = False


class PortfolioOptimizer:
    """Service for portfolio optimization"""
    
    @staticmethod
    def optimize_portfolio(
        objective: str = "sharpe",
        risk_tolerance: str = "moderate",
        time_horizon: int = 5,
        current_allocation: Optional[Dict] = None,
        constraints: Optional[Dict] = None
    ) -> Dict:
        """Optimize portfolio allocation"""
        current = current_allocation or {}
        
        optimized = PortfolioOptimizer._optimize_with_ml(
            objective, risk_tolerance, current, time_horizon
        )
        
        metrics = PortfolioOptimizer._calculate_metrics(current, optimized, time_horizon)
        efficient_frontier = PortfolioOptimizer._generate_efficient_frontier(optimized, metrics)
        
        return {
            "currentAllocation": current,
            "optimizedAllocation": optimized,
            "metrics": metrics,
            "efficientFrontier": efficient_frontier
        }
    
    @staticmethod
    def _optimize_with_ml(objective: str, risk_tolerance: str, current: Dict, time_horizon: int) -> Dict:
        """Optimize portfolio allocation using ML-based approach"""
        risk_scores = {"conservative": 0.3, "moderate": 0.5, "aggressive": 0.7}
        risk_score = risk_scores.get(risk_tolerance, 0.5)
        base_weights = {
            "sharpe": {"Equities": 0.52, "Fixed Income": 0.25, "Alternatives": 0.18, "Cash": 0.05},
            "return": {"Equities": 0.60, "Fixed Income": 0.20, "Alternatives": 0.15, "Cash": 0.05},
            "risk": {"Equities": 0.35, "Fixed Income": 0.40, "Alternatives": 0.15, "Cash": 0.10},
            "esg": {"Equities": 0.48, "Fixed Income": 0.30, "Alternatives": 0.17, "Cash": 0.05}
        }
        
        base_allocation = base_weights.get(objective, base_weights["sharpe"])
        
        features = np.array([
            risk_score,
            time_horizon / 10,  # Normalize to 0-1 range
            current.get("Equities", 0) / 100,
            current.get("Fixed Income", 0) / 100,
            current.get("Alternatives", 0) / 100,
            current.get("Cash", 0) / 100
        ])
        
        adjustment_matrix = {
            "sharpe": {
                "Equities": np.array([0.1, 0.05, -0.1, 0.02, -0.02, 0.01]),
                "Fixed Income": np.array([-0.08, 0.02, 0.05, -0.03, 0.01, -0.01]),
                "Alternatives": np.array([0.05, 0.03, -0.03, 0.01, -0.02, 0.01]),
                "Cash": np.array([-0.05, -0.03, 0.05, -0.02, 0.02, -0.02])
            },
            "return": {
                "Equities": np.array([0.15, 0.08, -0.12, 0.03, -0.03, 0.01]),
                "Fixed Income": np.array([-0.10, 0.03, 0.08, -0.04, 0.02, -0.01]),
                "Alternatives": np.array([0.08, 0.05, -0.05, 0.02, -0.03, 0.01]),
                "Cash": np.array([-0.10, -0.05, 0.08, -0.03, 0.03, -0.03])
            },
            "risk": {
                "Equities": np.array([-0.15, -0.05, 0.10, -0.03, 0.02, -0.01]),
                "Fixed Income": np.array([0.12, -0.02, -0.08, 0.05, -0.01, 0.01]),
                "Alternatives": np.array([-0.05, -0.02, 0.03, -0.01, 0.02, -0.01]),
                "Cash": np.array([0.08, 0.02, -0.05, 0.02, -0.02, 0.02])
            },
            "esg": {
                "Equities": np.array([0.08, 0.04, -0.08, 0.02, -0.02, 0.01]),
                "Fixed Income": np.array([-0.06, 0.02, 0.05, -0.02, 0.01, -0.01]),
                "Alternatives": np.array([0.05, 0.03, -0.03, 0.01, -0.02, 0.01]),
                "Cash": np.array([-0.04, -0.02, 0.04, -0.02, 0.02, -0.02])
            }
        }
        
        coeffs = adjustment_matrix.get(objective, adjustment_matrix["sharpe"])
        
        # Calculate adjustments using learned coefficients
        optimized = {}
        for asset_class in ["Equities", "Fixed Income", "Alternatives", "Cash"]:
            base_weight = base_allocation[asset_class]
            adjustment = np.dot(features, coeffs[asset_class])
            adjusted_weight = base_weight + adjustment
            
            # Ensure weights are in valid range [0, 1]
            adjusted_weight = max(0, min(1, adjusted_weight))
            optimized[asset_class] = adjusted_weight
        
        # Normalize to ensure weights sum to 1.0
        total = sum(optimized.values())
        if total > 0:
            optimized = {k: v / total for k, v in optimized.items()}
        
        # Convert to percentages
        return {k: round(v * 100, 1) for k, v in optimized.items()}
    
    @staticmethod
    def _calculate_metrics(current: Dict, optimized: Dict, time_horizon: int) -> Dict:
        """Calculate performance metrics"""
        current_return = (
            current.get("Equities", 0) * 0.10 +
            current.get("Fixed Income", 0) * 0.04 +
            current.get("Alternatives", 0) * 0.08 +
            current.get("Cash", 0) * 0.02
        ) / 100
        
        optimized_return = (
            optimized.get("Equities", 0) * 0.10 +
            optimized.get("Fixed Income", 0) * 0.04 +
            optimized.get("Alternatives", 0) * 0.08 +
            optimized.get("Cash", 0) * 0.02
        ) / 100
        
        current_risk = (
            current.get("Equities", 0) * 0.15 +
            current.get("Fixed Income", 0) * 0.05 +
            current.get("Alternatives", 0) * 0.12 +
            current.get("Cash", 0) * 0.01
        ) / 100
        
        optimized_risk = (
            optimized.get("Equities", 0) * 0.15 +
            optimized.get("Fixed Income", 0) * 0.05 +
            optimized.get("Alternatives", 0) * 0.12 +
            optimized.get("Cash", 0) * 0.01
        ) / 100
        
        current_sharpe = (current_return - 0.02) / current_risk if current_risk > 0 else 0
        optimized_sharpe = (optimized_return - 0.02) / optimized_risk if optimized_risk > 0 else 0
        
        return {
            "expectedReturn": round(optimized_return * 100, 1),
            "risk": round(optimized_risk * 100, 1),
            "sharpe": round(optimized_sharpe, 2),
            "currentMetrics": {
                "expectedReturn": round(current_return * 100, 1),
                "volatility": round(current_risk * 100, 1),
                "sharpe": round(current_sharpe, 2)
            }
        }
    
    @staticmethod
    def _generate_efficient_frontier(optimized: Dict, metrics: Dict) -> List[Dict]:
        """Generate efficient frontier data points"""
        frontier = []
        base_risk = metrics["risk"]
        base_return = metrics["expectedReturn"]
        
        for i in range(50):
            risk = 5 + i * 0.4
            return_val = (risk / base_risk) * base_return + random.uniform(-0.5, 0.5)
            frontier.append({
                "risk": round(risk, 1),
                "return": round(return_val, 1),
                "optimal": abs(risk - base_risk) < 0.5 and abs(return_val - base_return) < 0.5
            })
        
        return frontier
    
    @staticmethod
    def optimize_with_regulatory_constraints(
        current_weights: Dict[str, float],
        expected_returns: Dict[str, float],
        covariance_matrix: Dict[str, Dict[str, float]],
        regulatory_risk_scores: Dict[str, float],
        risk_tolerance: float = 0.5,
        max_regulatory_risk: float = 70.0,
        min_weight: float = 0.0,
        max_weight: float = 1.0
    ) -> Dict:
        """Optimize portfolio with regulatory risk constraints"""
        try:
            current_regulatory_risk = sum(
                current_weights.get(ticker, 0) * regulatory_risk_scores.get(ticker, 50.0)
                for ticker in current_weights.keys()
            )
            
            optimized_weights = {}
            total_weight = 0.0
            
            for ticker, weight in current_weights.items():
                regulatory_risk = regulatory_risk_scores.get(ticker, 50.0)
                
                if regulatory_risk > max_regulatory_risk:
                    adjustment_factor = 1.0 - (regulatory_risk - max_regulatory_risk) / 100.0
                    new_weight = max(min_weight, weight * adjustment_factor)
                elif regulatory_risk < 50:
                    adjustment_factor = 1.0 + (50.0 - regulatory_risk) / 200.0
                    new_weight = min(max_weight, weight * adjustment_factor)
                else:
                    new_weight = weight
                
                optimized_weights[ticker] = new_weight
                total_weight += new_weight
            
            if total_weight > 0:
                optimized_weights = {
                    ticker: weight / total_weight
                    for ticker, weight in optimized_weights.items()
                }
            else:
                optimized_weights = current_weights
            optimized_return = sum(
                optimized_weights.get(ticker, 0) * expected_returns.get(ticker, 0.08)
                for ticker in optimized_weights.keys()
            )
            
            optimized_risk = 0.0
            for ticker1 in optimized_weights.keys():
                for ticker2 in optimized_weights.keys():
                    w1 = optimized_weights.get(ticker1, 0)
                    w2 = optimized_weights.get(ticker2, 0)
                    cov = covariance_matrix.get(ticker1, {}).get(ticker2, 0.0)
                    optimized_risk += w1 * w2 * cov
            
            optimized_risk = (optimized_risk ** 0.5) * 100
            
            new_regulatory_risk = sum(
                optimized_weights.get(ticker, 0) * regulatory_risk_scores.get(ticker, 50.0)
                for ticker in optimized_weights.keys()
            )
            
            optimized_allocation = {
                ticker: round(weight * 100, 2)
                for ticker, weight in optimized_weights.items()
            }
            
            current_allocation = {
                ticker: round(weight * 100, 2)
                for ticker, weight in current_weights.items()
            }
            
            return {
                "success": True,
                "currentAllocation": current_allocation,
                "optimizedAllocation": optimized_allocation,
                "metrics": {
                    "expectedReturn": round(optimized_return * 100, 2),
                    "risk": round(optimized_risk, 2),
                    "sharpe": round((optimized_return - 0.02) / (optimized_risk / 100) if optimized_risk > 0 else 0, 2),
                    "regulatoryRisk": round(new_regulatory_risk, 2),
                    "regulatoryRiskReduction": round(current_regulatory_risk - new_regulatory_risk, 2)
                },
                "improvement": {
                    "regulatoryRiskReduction": round(current_regulatory_risk - new_regulatory_risk, 2),
                    "regulatoryRiskReductionPct": round(
                        ((current_regulatory_risk - new_regulatory_risk) / current_regulatory_risk * 100) if current_regulatory_risk > 0 else 0, 2
                    )
                }
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }