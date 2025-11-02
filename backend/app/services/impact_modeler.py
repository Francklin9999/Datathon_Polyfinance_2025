"""
Impact Modeler Service
Calculates regulatory impact on companies based on supply chain, geography, and business model
"""

import re
from typing import Dict, List, Optional


class ImpactModeler:
    """Service for modeling regulatory impact on companies"""
    
    @staticmethod
    def calculate_company_impact(
        regulation_data: Dict,
        company_data: Dict,
        stock_data: Optional[Dict] = None
    ) -> Dict:
        """
        Calculate comprehensive impact score for a company
        Returns: Impact assessment with risk score (0-100), exposure, reasoning, etc.
        """
        # Extract regulation details
        regulation_type = regulation_data.get("regulation_type", "other")
        affected_countries = regulation_data.get("entities", {}).get("countries", [])
        affected_sectors = regulation_data.get("entities", {}).get("sectors", [])
        measures = regulation_data.get("measures", [])
        supply_chain_impact = regulation_data.get("supply_chain_impact", {})
        
        # Get company data
        company_ticker = company_data.get("ticker", "")
        company_name = company_data.get("company_name", f"{company_ticker} Inc.")
        key_suppliers = company_data.get("key_suppliers", [])
        geographic_revenue = company_data.get("geographic_revenue", [])
        product_lines = company_data.get("product_lines", [])
        business_description = company_data.get("business_description_full", "")
        
        # Calculate component scores
        supply_chain_risk = ImpactModeler._calculate_supply_chain_risk(
            regulation_data, company_data, supply_chain_impact
        )
        
        geographic_exposure = ImpactModeler._calculate_geographic_exposure(
            affected_countries, geographic_revenue
        )
        
        sector_match_score = ImpactModeler._calculate_sector_match(
            affected_sectors, company_data, business_description
        )
        
        measure_impact = ImpactModeler._calculate_measure_impact(
            measures, company_data, business_description
        )
        
        # Calculate overall risk score (weighted average)
        risk_score = (
            supply_chain_risk * 0.35 +
            geographic_exposure * 0.30 +
            sector_match_score * 0.20 +
            measure_impact * 0.15
        )
        
        # Determine exposure level
        if risk_score >= 70:
            exposure = "High"
        elif risk_score >= 40:
            exposure = "Medium"
        else:
            exposure = "Low"
        
        # Generate reasoning
        reasoning = ImpactModeler._generate_reasoning(
            risk_score, supply_chain_risk, geographic_exposure,
            sector_match_score, company_data, regulation_data
        )
        
        # Calculate revenue impact estimate
        revenue_impact_pct = ImpactModeler._estimate_revenue_impact(
            risk_score, geographic_exposure, measure_impact
        )
        
        # Generate mitigation strategies
        mitigation_strategies = ImpactModeler._generate_mitigation_strategies(
            risk_score, supply_chain_risk, geographic_exposure, regulation_data
        )
        
        return {
            "ticker": company_ticker,
            "company_name": company_name,
            "risk_score": round(risk_score, 1),
            "exposure": exposure,
            "reasoning": reasoning,
            "supply_chain_risk": round(supply_chain_risk, 1),
            "geographic_exposure": round(geographic_exposure, 1),
            "sector_match_score": round(sector_match_score, 1),
            "measure_impact": round(measure_impact, 1),
            "revenue_impact_pct": round(revenue_impact_pct, 2),
            "mitigation_strategies": mitigation_strategies,
            "affected_suppliers_count": len([s for s in key_suppliers if ImpactModeler._is_supplier_affected(s, regulation_data)]),
            "affected_regions_count": len([r for r in geographic_revenue if ImpactModeler._is_region_affected(r, affected_countries)])
        }
    
    @staticmethod
    def _calculate_supply_chain_risk(
        regulation_data: Dict,
        company_data: Dict,
        supply_chain_impact: Dict
    ) -> float:
        """Calculate supply chain risk score (0-100)"""
        key_suppliers = company_data.get("key_suppliers", [])
        affected_components = supply_chain_impact.get("affected_components", [])
        affected_suppliers = supply_chain_impact.get("affected_suppliers", [])
        affected_countries = regulation_data.get("entities", {}).get("countries", [])
        
        if not key_suppliers:
            # No supplier data - return medium risk
            return 50.0
        
        risk_score = 0.0
        total_suppliers = len(key_suppliers)
        
        if total_suppliers == 0:
            return 50.0
        
        for supplier in key_suppliers:
            supplier_country = supplier.get("country", "").lower()
            supplier_name = supplier.get("name", "").lower()
            dependency = supplier.get("dependency", "Medium").lower()
            
            # Check if supplier country is affected
            country_affected = any(
                country.lower() in supplier_country or supplier_country in country.lower()
                for country in affected_countries
            )
            
            # Check if supplier name matches affected suppliers
            name_affected = any(
                affected.lower() in supplier_name or supplier_name in affected.lower()
                for affected in affected_suppliers
            )
            
            if country_affected or name_affected:
                # Calculate impact based on dependency
                if dependency == "high":
                    risk_score += 100
                elif dependency == "medium":
                    risk_score += 70
                else:
                    risk_score += 40
            elif dependency == "high":
                # High dependency but not directly affected - still some risk
                risk_score += 20
        
        return min(100.0, risk_score / total_suppliers)
    
    @staticmethod
    def _calculate_geographic_exposure(
        affected_countries: List[str],
        geographic_revenue: List[Dict]
    ) -> float:
        """Calculate geographic exposure score (0-100)"""
        if not geographic_revenue:
            return 50.0  # Unknown - medium risk
        
        total_exposure = 0.0
        total_revenue_pct = 0.0
        
        affected_countries_lower = [c.lower() for c in affected_countries]
        
        for region in geographic_revenue:
            region_name = region.get("region", "").lower()
            revenue_pct = region.get("revenue_percent", 0.0)
            total_revenue_pct += revenue_pct
            
            # Check if region matches affected countries
            is_affected = any(
                country in region_name or region_name in country
                for country in affected_countries_lower
            )
            
            if is_affected:
                total_exposure += revenue_pct
        
        if total_revenue_pct == 0:
            return 50.0
        
        # Score based on percentage of revenue in affected regions
        exposure_pct = (total_exposure / total_revenue_pct) * 100
        
        return min(100.0, exposure_pct)
    
    @staticmethod
    def _calculate_sector_match(
        affected_sectors: List[str],
        company_data: Dict,
        business_description: str
    ) -> float:
        """Calculate sector match score (0-100)"""
        if not affected_sectors:
            return 50.0  # No sector targeting - medium risk
        
        business_lower = business_description.lower()
        
        # Check if company's business description matches affected sectors
        matches = sum(
            1 for sector in affected_sectors
            if sector.lower() in business_lower
        )
        
        if matches > 0:
            # Higher score if more sectors match
            return min(100.0, 60 + (matches * 15))
        else:
            return 30.0  # Low risk if no sector match
    
    @staticmethod
    def _calculate_measure_impact(
        measures: List[Dict],
        company_data: Dict,
        business_description: str
    ) -> float:
        """Calculate impact from specific measures (0-100)"""
        if not measures:
            return 50.0
        
        business_lower = business_description.lower()
        
        # Check if measures target company's business
        relevant_measures = 0
        total_impact = 0.0
        
        for measure in measures:
            target = measure.get("target", "").lower()
            rate_pct = measure.get("rate_pct", 0)
            
            # Check if measure targets company's business
            if target in business_lower or any(
                word in business_lower for word in target.split()
                if len(word) > 4
            ):
                relevant_measures += 1
                # Impact based on rate percentage
                if rate_pct:
                    total_impact += min(100.0, rate_pct / 10)  # Scale down large percentages
                else:
                    total_impact += 50.0
        
        if relevant_measures == 0:
            return 30.0  # Low impact if no relevant measures
        
        return min(100.0, total_impact / relevant_measures) if relevant_measures > 0 else 50.0
    
    @staticmethod
    def _generate_reasoning(
        risk_score: float,
        supply_chain_risk: float,
        geographic_exposure: float,
        sector_match_score: float,
        company_data: Dict,
        regulation_data: Dict
    ) -> str:
        """Generate human-readable reasoning for the risk score"""
        reasons = []
        
        if supply_chain_risk >= 70:
            reasons.append("High supply chain risk due to dependencies on affected suppliers or regions")
        elif supply_chain_risk >= 40:
            reasons.append("Moderate supply chain exposure")
        
        if geographic_exposure >= 70:
            reasons.append("Significant revenue exposure to affected geographic regions")
        elif geographic_exposure >= 40:
            reasons.append("Some revenue exposure to affected regions")
        
        if sector_match_score >= 70:
            reasons.append("Business model aligns with directly affected sectors")
        
        regulation_type = regulation_data.get("regulation_type", "regulation")
        if not reasons:
            reasons.append(f"Limited direct exposure to {regulation_type} based on available data")
        
        return ". ".join(reasons) + "."
    
    @staticmethod
    def _estimate_revenue_impact(
        risk_score: float,
        geographic_exposure: float,
        measure_impact: float
    ) -> float:
        """Estimate percentage revenue impact"""
        # Simple estimation based on risk factors
        base_impact = (risk_score / 100) * 10  # Up to 10% impact at max risk
        
        # Adjust based on geographic exposure
        geo_adjustment = (geographic_exposure / 100) * 5
        
        # Adjust based on measure impact
        measure_adjustment = (measure_impact / 100) * 3
        
        total_impact = base_impact + geo_adjustment + measure_adjustment
        
        return min(15.0, total_impact)  # Cap at 15%
    
    @staticmethod
    def _generate_mitigation_strategies(
        risk_score: float,
        supply_chain_risk: float,
        geographic_exposure: float,
        regulation_data: Dict
    ) -> List[str]:
        """Generate mitigation strategies based on risk factors"""
        strategies = []
        
        if supply_chain_risk >= 60:
            strategies.append("Diversify supply chain to reduce dependency on affected regions")
            strategies.append("Identify alternative suppliers in non-affected countries")
        
        if geographic_exposure >= 60:
            strategies.append("Consider geographic revenue diversification")
            strategies.append("Explore opportunities in non-affected markets")
        
        if risk_score >= 70:
            strategies.append("Engage with regulatory compliance team immediately")
            strategies.append("Develop contingency plans for supply chain disruptions")
        
        if not strategies:
            strategies.append("Monitor regulatory developments closely")
            strategies.append("Maintain flexibility in operations")
        
        return strategies[:5]  # Limit to 5 strategies
    
    @staticmethod
    def _is_supplier_affected(supplier: Dict, regulation_data: Dict) -> bool:
        """Check if a supplier is affected by the regulation"""
        supplier_country = supplier.get("country", "").lower()
        affected_countries = regulation_data.get("entities", {}).get("countries", [])
        
        return any(
            country.lower() in supplier_country or supplier_country in country.lower()
            for country in affected_countries
        )
    
    @staticmethod
    def _is_region_affected(region: Dict, affected_countries: List[str]) -> bool:
        """Check if a geographic revenue region is affected"""
        region_name = region.get("region", "").lower()
        affected_countries_lower = [c.lower() for c in affected_countries]
        
        return any(
            country in region_name or region_name in country
            for country in affected_countries_lower
        )