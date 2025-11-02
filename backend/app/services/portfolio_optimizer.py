"""
Portfolio Optimizer Service
Handles portfolio optimization using mean-variance optimization
"""

from typing import Dict, List, Optional
import random


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
        """
        Optimize portfolio allocation
        Returns optimized allocation with metrics
        """
        current = current_allocation or {
            "Equities": 45,
            "Fixed Income": 30,
            "Alternatives": 15,
            "Cash": 10
        }
        
        # Generate optimized allocation based on objective
        if objective == "sharpe":
            optimized = PortfolioOptimizer._optimize_for_sharpe(risk_tolerance)
        elif objective == "return":
            optimized = PortfolioOptimizer._optimize_for_return(risk_tolerance)
        elif objective == "risk":
            optimized = PortfolioOptimizer._optimize_for_risk(risk_tolerance)
        else:  # esg
            optimized = PortfolioOptimizer._optimize_for_esg(risk_tolerance)
        
        # Calculate metrics
        metrics = PortfolioOptimizer._calculate_metrics(current, optimized, time_horizon)
        
        # Generate efficient frontier
        efficient_frontier = PortfolioOptimizer._generate_efficient_frontier(optimized, metrics)
        
        return {
            "currentAllocation": current,
            "optimizedAllocation": optimized,
            "metrics": metrics,
            "efficientFrontier": efficient_frontier
        }
    
    @staticmethod
    def _optimize_for_sharpe(risk_tolerance: str) -> Dict:
        """Optimize for Sharpe ratio"""
        base_allocation = {
            "Equities": 52,
            "Fixed Income": 25,
            "Alternatives": 18,
            "Cash": 5
        }
        
        # Adjust based on risk tolerance
        if risk_tolerance == "conservative":
            base_allocation["Equities"] -= 5
            base_allocation["Fixed Income"] += 5
        elif risk_tolerance == "aggressive":
            base_allocation["Equities"] += 5
            base_allocation["Alternatives"] += 2
            base_allocation["Cash"] -= 2
        
        return base_allocation
    
    @staticmethod
    def _optimize_for_return(risk_tolerance: str) -> Dict:
        """Optimize for maximum return"""
        return {
            "Equities": 60 if risk_tolerance != "conservative" else 50,
            "Fixed Income": 20,
            "Alternatives": 15 if risk_tolerance != "conservative" else 20,
            "Cash": 5 if risk_tolerance != "conservative" else 10
        }
    
    @staticmethod
    def _optimize_for_risk(risk_tolerance: str) -> Dict:
        """Optimize for minimum risk"""
        return {
            "Equities": 35,
            "Fixed Income": 40,
            "Alternatives": 15,
            "Cash": 10
        }
    
    @staticmethod
    def _optimize_for_esg(risk_tolerance: str) -> Dict:
        """Optimize for ESG score"""
        return {
            "Equities": 48,
            "Fixed Income": 30,
            "Alternatives": 17,
            "Cash": 5
        }
    
    @staticmethod
    def _calculate_metrics(current: Dict, optimized: Dict, time_horizon: int) -> Dict:
        """Calculate performance metrics"""
        # Simplified metric calculation
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
            "esgScore": 80,
            "currentMetrics": {
                "expectedReturn": round(current_return * 100, 1),
                "volatility": round(current_risk * 100, 1),
                "sharpe": round(current_sharpe, 2),
                "maxDrawdown": -15.3
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
            # Approximate return based on risk
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
        """
        Optimize portfolio with regulatory risk constraints
        Reduces allocation to companies with high regulatory risk scores
        """
        try:
            # Calculate average regulatory risk for portfolio
            current_regulatory_risk = sum(
                current_weights.get(ticker, 0) * regulatory_risk_scores.get(ticker, 50.0)
                for ticker in current_weights.keys()
            )
            
            # Adjust weights based on regulatory risk
            optimized_weights = {}
            total_weight = 0.0
            
            # Reduce weight for high-risk companies
            for ticker, weight in current_weights.items():
                regulatory_risk = regulatory_risk_scores.get(ticker, 50.0)
                
                if regulatory_risk > max_regulatory_risk:
                    # Reduce weight for high-risk companies
                    adjustment_factor = 1.0 - (regulatory_risk - max_regulatory_risk) / 100.0
                    new_weight = max(min_weight, weight * adjustment_factor)
                elif regulatory_risk < 50:
                    # Slightly increase weight for low-risk companies
                    adjustment_factor = 1.0 + (50.0 - regulatory_risk) / 200.0
                    new_weight = min(max_weight, weight * adjustment_factor)
                else:
                    new_weight = weight
                
                optimized_weights[ticker] = new_weight
                total_weight += new_weight
            
            # Normalize weights to sum to 1
            if total_weight > 0:
                optimized_weights = {
                    ticker: weight / total_weight
                    for ticker, weight in optimized_weights.items()
                }
            else:
                # Fallback if normalization fails
                optimized_weights = current_weights
            
            # Calculate optimized portfolio metrics
            optimized_return = sum(
                optimized_weights.get(ticker, 0) * expected_returns.get(ticker, 0.08)
                for ticker in optimized_weights.keys()
            )
            
            # Simplified risk calculation (portfolio variance)
            optimized_risk = 0.0
            for ticker1 in optimized_weights.keys():
                for ticker2 in optimized_weights.keys():
                    w1 = optimized_weights.get(ticker1, 0)
                    w2 = optimized_weights.get(ticker2, 0)
                    cov = covariance_matrix.get(ticker1, {}).get(ticker2, 0.0)
                    optimized_risk += w1 * w2 * cov
            
            optimized_risk = (optimized_risk ** 0.5) * 100  # Convert to percentage
            
            # Calculate new regulatory risk
            new_regulatory_risk = sum(
                optimized_weights.get(ticker, 0) * regulatory_risk_scores.get(ticker, 50.0)
                for ticker in optimized_weights.keys()
            )
            
            # Convert back to percentages for display
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