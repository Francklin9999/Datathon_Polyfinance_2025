"""
Advanced scenario simulation engine
Simulates regulatory impact across multiple scenarios
"""

from typing import Dict, List, Optional, Tuple
import numpy as np
from datetime import datetime, timedelta


class ScenarioSimulator:
    """Simulate regulatory scenarios and their portfolio impacts"""
    
    @staticmethod
    def simulate_scenarios(
        base_portfolio: Dict[str, float],  # {ticker: weight}
        company_impacts: List[Dict],  # From impact modeler
        scenarios: List[Dict],
        time_horizon_days: int = 90
    ) -> Dict:
        """
        Simulate multiple regulatory scenarios
        
        Args:
            base_portfolio: Current portfolio weights
            company_impacts: Impact assessments for companies
            scenarios: List of scenario definitions
            time_horizon_days: Simulation time horizon
        
        Returns:
            Scenario simulation results
        """
        # Build impact map
        impact_map = {
            impact["ticker"]: impact
            for impact in company_impacts
        }
        
        results = {
            "base_portfolio": base_portfolio,
            "scenarios": [],
            "summary": {
                "best_case": None,
                "worst_case": None,
                "expected_case": None
            }
        }
        
        scenario_results = []
        
        for scenario in scenarios:
            scenario_result = ScenarioSimulator._simulate_single_scenario(
                base_portfolio=base_portfolio,
                impact_map=impact_map,
                scenario=scenario,
                time_horizon_days=time_horizon_days
            )
            scenario_results.append(scenario_result)
        
        # Sort scenarios by impact
        scenario_results.sort(key=lambda x: x.get("portfolio_impact_pct", 0))
        
        results["scenarios"] = scenario_results
        
        if scenario_results:
            results["summary"]["worst_case"] = scenario_results[-1]
            results["summary"]["best_case"] = scenario_results[0]
            results["summary"]["expected_case"] = scenario_results[len(scenario_results) // 2]
        
        return results
    
    @staticmethod
    def _simulate_single_scenario(
        base_portfolio: Dict[str, float],
        impact_map: Dict[str, Dict],
        scenario: Dict,
        time_horizon_days: int
    ) -> Dict:
        """Simulate a single scenario"""
        scenario_name = scenario.get("name", "Scenario")
        severity = scenario.get("severity", 1.0)  # Multiplier for impact
        probability = scenario.get("probability", 0.5)  # Probability of scenario
        
        # Calculate portfolio impact
        total_impact = 0.0
        total_weight = 0.0
        affected_positions = []
        
        for ticker, weight in base_portfolio.items():
            if ticker in impact_map:
                impact_data = impact_map[ticker]
                risk_score = impact_data.get("risk_score", 50.0)
                revenue_impact = impact_data.get("revenue_impact_pct", 0.0)
                
                # Apply scenario severity
                adjusted_impact = revenue_impact * severity
                position_impact = weight * adjusted_impact
                
                total_impact += position_impact
                total_weight += weight
                
                if adjusted_impact > 0.1:  # Significant impact
                    affected_positions.append({
                        "ticker": ticker,
                        "weight": round(weight * 100, 2),
                        "impact_pct": round(adjusted_impact, 2),
                        "contribution_to_portfolio_impact": round(position_impact, 3)
                    })
        
        # Calculate time-weighted impact
        daily_impact = total_impact / 100  # Convert to percentage
        cumulative_impact = daily_impact * (time_horizon_days / 365) * 100  # Annualized
        
        # Estimate price impact (simplified model)
        # Higher risk score -> higher price impact
        price_impact = total_impact * 0.7  # Assume 70% of revenue impact translates to price
        
        return {
            "scenario_name": scenario_name,
            "severity": severity,
            "probability": probability,
            "expected_portfolio_impact_pct": round(total_impact, 2),
            "expected_price_impact_pct": round(price_impact, 2),
            "cumulative_impact_annualized_pct": round(cumulative_impact, 2),
            "affected_positions": affected_positions,
            "affected_positions_count": len(affected_positions),
            "time_horizon_days": time_horizon_days,
            "estimated_value_at_risk": round(total_impact * 0.01, 4),  # VaR estimate
            "risk_rating": ScenarioSimulator._calculate_risk_rating(total_impact)
        }
    
    @staticmethod
    def _calculate_risk_rating(impact_pct: float) -> str:
        """Calculate risk rating from impact"""
        if impact_pct > 10:
            return "Critical"
        elif impact_pct > 5:
            return "High"
        elif impact_pct > 2:
            return "Medium"
        elif impact_pct > 0:
            return "Low"
        else:
            return "Minimal"
    
    @staticmethod
    def generate_monte_carlo_scenarios(
        base_impacts: List[Dict],
        num_simulations: int = 1000,
        confidence_level: float = 0.95
    ) -> Dict:
        """Generate Monte Carlo simulation results"""
        # Extract impact values
        impacts = [impact.get("revenue_impact_pct", 0) for impact in base_impacts]
        
        if not impacts:
            return {
                "mean_impact": 0.0,
                "std_impact": 0.0,
                "percentiles": {},
                "confidence_interval": (0.0, 0.0)
            }
        
        # Run Monte Carlo simulation
        np.random.seed(42)  # For reproducibility
        simulated_impacts = []
        
        for _ in range(num_simulations):
            # Sample from impact distribution
            portfolio_impact = np.random.choice(impacts, size=min(10, len(impacts)), replace=True)
            simulated_impacts.append(np.mean(portfolio_impact))
        
        simulated_impacts = np.array(simulated_impacts)
        
        mean_impact = np.mean(simulated_impacts)
        std_impact = np.std(simulated_impacts)
        
        # Calculate percentiles
        percentiles = {
            "5th": float(np.percentile(simulated_impacts, 5)),
            "25th": float(np.percentile(simulated_impacts, 25)),
            "50th": float(np.percentile(simulated_impacts, 50)),
            "75th": float(np.percentile(simulated_impacts, 75)),
            "95th": float(np.percentile(simulated_impacts, 95))
        }
        
        # Confidence interval
        alpha = 1 - confidence_level
        lower = float(np.percentile(simulated_impacts, (alpha / 2) * 100))
        upper = float(np.percentile(simulated_impacts, (1 - alpha / 2) * 100))
        
        return {
            "mean_impact": round(mean_impact, 2),
            "std_impact": round(std_impact, 2),
            "percentiles": {k: round(v, 2) for k, v in percentiles.items()},
            "confidence_interval": (round(lower, 2), round(upper, 2)),
            "confidence_level": confidence_level,
            "num_simulations": num_simulations
        }

