"""
Recommendations Service - Hedge menu and diversification suggestions
"""

from typing import Dict, List, Optional
from app.models.types import Portfolio, CompanyRisk, HedgeSuggestion


class RecommendationsService:
    """Service for generating hedge and diversification recommendations"""
    
    @staticmethod
    def compute_recommendations(
        portfolio: Portfolio,
        company_risks: List[CompanyRisk],
        scenarios: Optional[List[Dict]] = None
    ) -> Dict:
        """
        Compute hedge menu and diversification suggestions
        
        Returns:
        {
            "hedges": List[HedgeSuggestion],
            "diversification": List[Dict],
            "explanation": Dict
        }
        """
        # Identify top risk component
        top_component = RecommendationsService._identify_top_component(company_risks)
        top_offenders = RecommendationsService._get_top_offenders(company_risks, n=5)
        
        # Generate hedge menu based on top component
        hedges = RecommendationsService._generate_hedge_menu(
            top_component=top_component,
            top_offenders=top_offenders,
            portfolio=portfolio
        )
        
        # Generate diversification suggestions
        diversification = RecommendationsService._generate_diversification(
            portfolio=portfolio,
            company_risks=company_risks,
            top_offenders=top_offenders
        )
        
        return {
            "hedges": hedges,
            "diversification": diversification,
            "top_component": top_component,
            "top_offenders": [{"ticker": r.ticker, "score": r.total_score} for r in top_offenders]
        }
    
    @staticmethod
    def _identify_top_component(company_risks: List[CompanyRisk]) -> str:
        """Identify the dominant risk component across portfolio"""
        component_totals = {
            "SupplyChain": 0.0,
            "GeoExposure": 0.0,
            "MeasureMatch": 0.0,
            "SentimentRisk": 0.0
        }
        
        for risk in company_risks:
            for component in risk.components:
                component_totals[component.name] += component.score
        
        # Return component with highest total
        return max(component_totals.items(), key=lambda x: x[1])[0]
    
    @staticmethod
    def _get_top_offenders(company_risks: List[CompanyRisk], n: int = 5) -> List[CompanyRisk]:
        """Get top N offenders by total score"""
        sorted_risks = sorted(company_risks, key=lambda x: x.total_score, reverse=True)
        return sorted_risks[:n]
    
    @staticmethod
    def _generate_hedge_menu(
        top_component: str,
        top_offenders: List[CompanyRisk],
        portfolio: Portfolio
    ) -> List[HedgeSuggestion]:
        """Generate hedge menu based on top risk component"""
        hedges = []
        
        if top_component == "GeoExposure":
            # Regional ETF tilt + pairs within sector
            hedges.append(HedgeSuggestion(
                hedge_type="etf_overlay",
                description="Regional ETF tilt to offset geographic exposure",
                estimated_risk_reduction=-5.0,
                estimated_cost_bps=-2.0,
                confidence="medium",
                target_component="GeoExposure",
                details={
                    "etf_type": "regional",
                    "example": "Overweight EFA (ex-US developed) or VXUS"
                }
            ))
            
            hedges.append(HedgeSuggestion(
                hedge_type="equity_pair",
                description=f"Pairs trade: underweight top-2 offenders, overweight low-risk peers",
                estimated_risk_reduction=-3.2,
                estimated_cost_bps=-1.5,
                confidence="medium",
                target_component="GeoExposure",
                details={
                    "short": [r.ticker for r in top_offenders[:2]],
                    "long": "low_geo_exposure_peers"
                }
            ))
        
        elif top_component == "MeasureMatch":
            # Put spread on top-1, collar on top-2
            if top_offenders:
                hedges.append(HedgeSuggestion(
                    hedge_type="options_overlay",
                    description=f"Put spread on {top_offenders[0].ticker} to hedge tariff/measure risk",
                    estimated_risk_reduction=-4.5,
                    estimated_cost_bps=-8.0,
                    confidence="medium",
                    target_component="MeasureMatch",
                    details={
                        "target_ticker": top_offenders[0].ticker,
                        "strategy": "put_spread",
                        "strike_range": "ATM ±10%"
                    }
                ))
                
                if len(top_offenders) > 1:
                    hedges.append(HedgeSuggestion(
                        hedge_type="options_overlay",
                        description=f"Collar on {top_offenders[1].ticker}",
                        estimated_risk_reduction=-3.0,
                        estimated_cost_bps=-5.0,
                        confidence="medium",
                        target_component="MeasureMatch",
                        details={
                            "target_ticker": top_offenders[1].ticker,
                            "strategy": "collar"
                        }
                    ))
            
            hedges.append(HedgeSuggestion(
                hedge_type="equity_pair",
                description="Overweight low-X-dependency peers in same sector",
                estimated_risk_reduction=-2.8,
                estimated_cost_bps=-1.0,
                confidence="low",
                target_component="MeasureMatch"
            ))
        
        elif top_component == "SupplyChain":
            # Supplier-diversified peers + macro hedge
            hedges.append(HedgeSuggestion(
                hedge_type="equity_pair",
                description="Overweight supplier-diversified peers",
                estimated_risk_reduction=-3.5,
                estimated_cost_bps=-1.2,
                confidence="medium",
                target_component="SupplyChain"
            ))
            
            hedges.append(HedgeSuggestion(
                hedge_type="macro_hedge",
                description="Commodity ETF or FX hedge depending on supply chain location",
                estimated_risk_reduction=-2.5,
                estimated_cost_bps=-3.0,
                confidence="low",
                target_component="SupplyChain",
                details={
                    "example": "DXY if US suppliers, commodity ETF if commodity-dependent"
                }
            ))
        
        elif top_component == "SentimentRisk":
            # Short-term options overlay with tight budget
            if top_offenders:
                hedges.append(HedgeSuggestion(
                    hedge_type="options_overlay",
                    description=f"Short-term protective puts on {top_offenders[0].ticker} (30-day expiry)",
                    estimated_risk_reduction=-6.0,
                    estimated_cost_bps=-12.0,
                    confidence="high",
                    target_component="SentimentRisk",
                    details={
                        "target_ticker": top_offenders[0].ticker,
                        "strategy": "protective_puts",
                        "expiry": "30_days"
                    }
                ))
        
        # Always add a general diversification hedge
        hedges.append(HedgeSuggestion(
            hedge_type="etf_overlay",
            description="Broad market tilt to reduce concentration risk",
            estimated_risk_reduction=-2.0,
            estimated_cost_bps=-1.5,
            confidence="low",
            target_component=None,
            details={
                "example": "SPY or QQQ overlay"
            }
        ))
        
        return hedges
    
    @staticmethod
    def _generate_diversification(
        portfolio: Portfolio,
        company_risks: List[CompanyRisk],
        top_offenders: List[CompanyRisk]
    ) -> List[Dict]:
        """Generate diversification suggestions"""
        suggestions = []
        
        # Reduce/neutralize top offender weights
        for risk in top_offenders[:3]:  # Top 3
            current_weight = portfolio.holdings.get(risk.ticker, 0.0)
            if current_weight > 0:
                suggestions.append({
                    "action": "reduce_weight",
                    "ticker": risk.ticker,
                    "current_weight": current_weight,
                    "suggested_weight": current_weight * 0.5,  # Reduce by 50%
                    "reason": f"High regulatory risk score: {risk.total_score:.1f}"
                })
        
        # Add sector/region counterweights
        suggestions.append({
            "action": "add_counterweights",
            "description": "Overweight names with low MeasureMatch in same sectors",
            "sectors": "auto-detect",
            "rationale": "Diversify within universe while maintaining sector exposure"
        })
        
        return suggestions

