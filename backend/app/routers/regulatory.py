"""
Regulatory analysis router - Enhanced with real document parsing and AI analysis
"""

from fastapi import APIRouter, HTTPException
from typing import Optional
import json
import os
import csv
from pathlib import Path

from app.models.requests import RegulatoryAnalysisRequest
from app.services.document_parser import DocumentParser
from app.services.regulatory_analyzer import RegulatoryAnalyzer
from app.services.impact_modeler import ImpactModeler
from app.services.scenario_simulator import ScenarioSimulator

router = APIRouter()

# Path to jeu_de_donnees folder
DATASET_DIR = Path(__file__).parent.parent.parent.parent / "jeu_de_donnees"


@router.post("/analyze-document")
async def analyze_regulatory_document(request: RegulatoryAnalysisRequest):
    """
    Analyze regulatory document using AI and NLP
    Extracts entities, measures, provisions, and supply chain impact
    """
    document_text = request.documentText
    file_url = request.fileUrl
    doc_id = request.docId
    
    if not document_text and not file_url:
        raise HTTPException(status_code=400, detail="Either documentText or fileUrl must be provided")
    
    # Parse file if URL provided
    if file_url:
        try:
            # Handle relative paths from uploads directory
            if file_url.startswith('/uploads/'):
                file_path = os.path.join('uploads', os.path.basename(file_url))
            else:
                file_path = file_url
            
            if os.path.exists(file_path):
                document_text, file_format = DocumentParser.parse_file(file_path)
            else:
                # Fallback: try to find in common locations
                possible_paths = [
                    file_path,
                    os.path.join('directives', os.path.basename(file_url)),
                    os.path.join('backend', 'uploads', os.path.basename(file_url))
                ]
                
                found = False
                for path in possible_paths:
                    if os.path.exists(path):
                        document_text, file_format = DocumentParser.parse_file(path)
                        found = True
                        break
                
                if not found:
                    raise HTTPException(status_code=404, detail=f"File not found: {file_url}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error parsing file: {str(e)}")
    
    if not document_text:
        raise HTTPException(status_code=400, detail="Could not extract text from document")
    
    # Analyze document using regulatory analyzer
    try:
        analysis_result = RegulatoryAnalyzer.analyze_document(document_text)
        analysis_result["docId"] = doc_id or "DOC-001"
        analysis_result["document_length"] = len(document_text)
        
        # Extract structure if HTML/XML
        try:
            structure = DocumentParser.extract_structure(document_text, "html" if file_url and ".html" in file_url else "xml")
            analysis_result["document_structure"] = {
                "sections_count": len(structure.get("sections", [])),
                "paragraphs_count": len(structure.get("paragraphs", [])),
                "titles": structure.get("titles", [])[:5]
            }
        except:
            pass
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing document: {str(e)}")
    
    # Generate regulation name from document if not set
    regulation_name = analysis_result.get("regulation_name", "Regulatory Document")
    if not regulation_name or regulation_name == "Regulatory Document":
        # Try to extract from document structure or entities
        entities = analysis_result.get("entities", {})
        countries = entities.get("countries", [])
        if countries:
            regulation_name = f"Regulation from {countries[0]}"
    
    analysis_result["regulation_name"] = regulation_name
    
    return analysis_result


@router.post("/company-impact")
async def assess_company_impact(request: dict):
    """
    Assess impact of regulation on companies using advanced impact modeling
    Calculate risk scores for S&P 500 companies based on supply chain, geography, and business model
    """
    regulation_data = request.get("regulation")
    companies = request.get("companies", [])
    company_data_map = request.get("companyData", {})  # Optional: pre-parsed 10-K data
    
    if not regulation_data:
        raise HTTPException(status_code=400, detail="Regulation data is required")
    
    # If no companies specified, assess all if company_data_map provided
    if not companies:
        companies = list(company_data_map.keys()) if company_data_map else []
    
    if not companies:
        raise HTTPException(status_code=400, detail="At least one company must be specified")
    
    company_impacts = []
    
    for company_ticker in companies:
        # Get company data (from pre-parsed or mock)
        company_data = company_data_map.get(company_ticker, {
            "ticker": company_ticker,
            "company_name": f"{company_ticker} Inc.",
            "key_suppliers": [],
            "geographic_revenue": [],
            "product_lines": [],
            "business_description_full": "",
            "supply_chain_risk_score": 50.0,
            "geographic_concentration_score": 50.0
        })
        
        # Calculate impact using impact modeler
        try:
            impact = ImpactModeler.calculate_company_impact(
                regulation_data=regulation_data,
                company_data=company_data,
                stock_data=request.get("stockData", {}).get(company_ticker)
            )
            company_impacts.append(impact)
        except Exception as e:
            # Fallback to basic scoring if error
            company_impacts.append({
                "ticker": company_ticker,
                "company_name": company_data.get("company_name", f"{company_ticker} Inc."),
                "risk_score": 50.0,
                "exposure": "Medium",
                "reasoning": f"Error calculating impact: {str(e)}",
                "supply_chain_risk": 50.0,
                "revenue_impact_pct": 0.0,
                "mitigation_strategies": ["Review manually"]
            })
    
    # Sort by risk score (highest first)
    company_impacts.sort(key=lambda x: x.get("risk_score", 0), reverse=True)
    
    return {
        "companies": company_impacts,
        "total_assessed": len(company_impacts),
        "high_risk_count": len([c for c in company_impacts if c.get("risk_score", 0) > 70]),
        "medium_risk_count": len([c for c in company_impacts if 40 < c.get("risk_score", 0) <= 70]),
        "low_risk_count": len([c for c in company_impacts if c.get("risk_score", 0) <= 40]),
        "average_risk_score": round(sum(c.get("risk_score", 0) for c in company_impacts) / len(company_impacts), 2) if company_impacts else 0
    }


@router.post("/simulate-scenarios")
async def simulate_regulatory_scenarios(request: dict):
    """
    Simulate multiple regulatory scenarios and their portfolio impacts
    """
    portfolio = request.get("portfolio", {})  # {ticker: weight}
    company_impacts = request.get("companyImpacts", [])
    scenarios = request.get("scenarios", [])
    time_horizon_days = request.get("timeHorizonDays", 90)
    
    if not portfolio:
        raise HTTPException(status_code=400, detail="Portfolio is required")
    
    if not company_impacts:
        raise HTTPException(status_code=400, detail="Company impacts are required")
    
    if not scenarios:
        # Generate default scenarios
        scenarios = [
            {"name": "Baseline", "severity": 1.0, "probability": 1.0},
            {"name": "Moderate Impact", "severity": 1.2, "probability": 0.7},
            {"name": "Severe Impact", "severity": 1.5, "probability": 0.5},
            {"name": "Extreme Impact", "severity": 2.0, "probability": 0.3}
        ]
    
    try:
        results = ScenarioSimulator.simulate_scenarios(
            base_portfolio=portfolio,
            company_impacts=company_impacts,
            scenarios=scenarios,
            time_horizon_days=time_horizon_days
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error simulating scenarios: {str(e)}")


@router.post("/monte-carlo")
async def monte_carlo_simulation(request: dict):
    """
    Run Monte Carlo simulation for regulatory impacts
    """
    company_impacts = request.get("companyImpacts", [])
    num_simulations = request.get("numSimulations", 1000)
    confidence_level = request.get("confidenceLevel", 0.95)
    
    if not company_impacts:
        raise HTTPException(status_code=400, detail="Company impacts are required")
    
    try:
        results = ScenarioSimulator.generate_monte_carlo_scenarios(
            base_impacts=company_impacts,
            num_simulations=num_simulations,
            confidence_level=confidence_level
        )
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error running Monte Carlo simulation: {str(e)}")


@router.post("/explain-impact")
async def explain_impact(request: dict):
    """
    Generate detailed explainability report for company impact
    Provides reasoning and breakdown of impact calculation
    """
    ticker = request.get("ticker")
    regulation_data = request.get("regulation")
    company_data = request.get("companyData")
    impact_result = request.get("impact")
    
    if not ticker:
        raise HTTPException(status_code=400, detail="Ticker is required")
    
    if not regulation_data and not impact_result:
        raise HTTPException(status_code=400, detail="Either regulation data or impact result is required")
    
    # If impact not provided, calculate it
    if not impact_result:
        if not company_data:
            raise HTTPException(status_code=400, detail="Company data is required if impact is not provided")
        
        impact_result = ImpactModeler.calculate_company_impact(
            regulation_data=regulation_data,
            company_data=company_data
        )
    
    # Build explainability report
    explainability = {
        "ticker": ticker,
        "risk_score": impact_result.get("risk_score", 0),
        "exposure_level": impact_result.get("exposure", "Unknown"),
        "reasoning": impact_result.get("reasoning", ""),
        "breakdown": {
            "supply_chain": {
                "score": impact_result.get("supply_chain_risk", 0),
                "weight": 0.35,
                "explanation": _explain_supply_chain_risk(impact_result)
            },
            "geographic": {
                "score": impact_result.get("geographic_risk", 0),
                "weight": 0.25,
                "explanation": _explain_geographic_risk(impact_result)
            },
            "sector": {
                "score": impact_result.get("sector_risk", 0),
                "weight": 0.25,
                "explanation": _explain_sector_risk(impact_result)
            },
            "product": {
                "score": impact_result.get("product_risk", 0),
                "weight": 0.15,
                "explanation": _explain_product_risk(impact_result)
            }
        },
        "key_factors": impact_result.get("detailed_breakdown", {}),
        "revenue_impact": {
            "percentage": impact_result.get("revenue_impact_pct", 0),
            "calculation_method": "Weighted average of supply chain, geographic, sector, and product exposures"
        },
        "mitigation_strategies": impact_result.get("mitigation_strategies", []),
        "confidence_score": _calculate_confidence_score(impact_result)
    }
    
    return explainability


def _explain_supply_chain_risk(impact_result: dict) -> str:
    """Generate explanation for supply chain risk"""
    breakdown = impact_result.get("detailed_breakdown", {}).get("supply_chain", {})
    factors = breakdown.get("factors", [])
    
    if not factors:
        return "Limited supply chain exposure identified."
    
    return f"Supply chain risk is driven by: {'; '.join(factors[:3])}."


def _explain_geographic_risk(impact_result: dict) -> str:
    """Generate explanation for geographic risk"""
    breakdown = impact_result.get("detailed_breakdown", {}).get("geographic", {})
    affected_revenue = breakdown.get("affected_revenue_pct", 0)
    factors = breakdown.get("factors", [])
    
    if affected_revenue > 50:
        return f"High geographic exposure: {affected_revenue:.1f}% of revenue from affected regions. {factors[0] if factors else ''}"
    elif affected_revenue > 25:
        return f"Moderate geographic exposure: {affected_revenue:.1f}% of revenue from affected regions."
    else:
        return "Low geographic exposure to affected regions."


def _explain_sector_risk(impact_result: dict) -> str:
    """Generate explanation for sector risk"""
    breakdown = impact_result.get("detailed_breakdown", {}).get("sector", {})
    factors = breakdown.get("factors", [])
    
    if factors:
        return f"Sector exposure: {'; '.join(factors[:2])}."
    return "Limited direct sector exposure."


def _explain_product_risk(impact_result: dict) -> str:
    """Generate explanation for product risk"""
    breakdown = impact_result.get("detailed_breakdown", {}).get("product", {})
    factors = breakdown.get("factors", [])
    
    if factors:
        return f"Product-specific impact: {'; '.join(factors[:2])}."
    return "No direct product targeting identified."


def _calculate_confidence_score(impact_result: dict) -> float:
    """Calculate confidence score for impact assessment"""
    # Higher confidence if we have detailed breakdown
    detailed = impact_result.get("detailed_breakdown", {})
    
    confidence = 0.5  # Base confidence
    
    if detailed.get("supply_chain", {}).get("factors"):
        confidence += 0.15
    if detailed.get("geographic", {}).get("factors"):
        confidence += 0.15
    if detailed.get("sector", {}).get("factors"):
        confidence += 0.1
    if detailed.get("product", {}).get("factors"):
        confidence += 0.1
    
    return min(confidence, 1.0)


def _load_sp500_portfolio() -> dict:
    """Load S&P 500 portfolio from CSV file"""
    portfolio = {}
    sp500_file = DATASET_DIR / "2025-08-15_composition_sp500.csv"
    
    if not sp500_file.exists():
        return portfolio
    
    try:
        with open(sp500_file, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            for row in reader:
                symbol = row.get('Symbol', '').strip().upper()
                if symbol:
                    weight_str = row.get('Weight', '').replace(',', '.')
                    try:
                        weight = float(weight_str) if weight_str else 0.0
                    except:
                        weight = 0.0
                    
                    price_str = row.get('Price', '').replace(',', '.')
                    try:
                        price = float(price_str) if price_str else 0.0
                    except:
                        price = 0.0
                    
                    portfolio[symbol] = {
                        "ticker": symbol,
                        "company_name": row.get('Company', ''),
                        "weight": weight,
                        "price": price
                    }
    except Exception as e:
        print(f"Error loading S&P 500 portfolio: {e}")
        import traceback
        traceback.print_exc()
    
    return portfolio


@router.get("/sp500-portfolio")
async def get_sp500_portfolio():
    """
    Get S&P 500 portfolio composition
    Returns list of all S&P 500 stocks with their weights
    """
    portfolio = _load_sp500_portfolio()
    portfolio_list = list(portfolio.values())
    
    return {
        "total_stocks": len(portfolio_list),
        "portfolio": portfolio_list,
        "portfolio_weights": {k: v["weight"] for k, v in portfolio.items()}
    }


@router.post("/analyze-sp500-impact")
async def analyze_sp500_impact(request: dict):
    """
    Analyze regulatory document impact on S&P 500 portfolio
    Takes regulation data and analyzes impact on all S&P 500 stocks
    """
    regulation_data = request.get("regulation")
    
    if not regulation_data:
        raise HTTPException(status_code=400, detail="Regulation data is required")
    
    # Load S&P 500 portfolio
    portfolio = _load_sp500_portfolio()
    
    if not portfolio:
        raise HTTPException(status_code=404, detail="S&P 500 portfolio data not found")
    
    # Get all tickers
    companies = list(portfolio.keys())
    
    # Build company data map (simplified - in production, would fetch from 10-K or other sources)
    company_data_map = {}
    for ticker, data in portfolio.items():
        company_data_map[ticker] = {
            "ticker": ticker,
            "company_name": data["company_name"],
            "key_suppliers": [],
            "geographic_revenue": [],
            "product_lines": [],
            "business_description_full": "",
            "supply_chain_risk_score": 50.0,
            "geographic_concentration_score": 50.0
        }
    
    # Assess impact on all companies
    company_impacts = []
    
    for company_ticker in companies:
        company_data = company_data_map.get(company_ticker, {
            "ticker": company_ticker,
            "company_name": portfolio.get(company_ticker, {}).get("company_name", f"{company_ticker} Inc."),
            "key_suppliers": [],
            "geographic_revenue": [],
            "product_lines": [],
            "business_description_full": "",
            "supply_chain_risk_score": 50.0,
            "geographic_concentration_score": 50.0
        })
        
        try:
            impact = ImpactModeler.calculate_company_impact(
                regulation_data=regulation_data,
                company_data=company_data,
                stock_data=request.get("stockData", {}).get(company_ticker)
            )
            # Add portfolio weight to impact
            impact["portfolio_weight"] = portfolio.get(company_ticker, {}).get("weight", 0.0)
            impact["weighted_risk"] = impact.get("risk_score", 0) * portfolio.get(company_ticker, {}).get("weight", 0.0)
            company_impacts.append(impact)
        except Exception as e:
            # Fallback to basic scoring
            company_impacts.append({
                "ticker": company_ticker,
                "company_name": company_data.get("company_name", f"{company_ticker} Inc."),
                "risk_score": 50.0,
                "exposure": "Medium",
                "reasoning": f"Error calculating impact: {str(e)}",
                "supply_chain_risk": 50.0,
                "revenue_impact_pct": 0.0,
                "mitigation_strategies": ["Review manually"],
                "portfolio_weight": portfolio.get(company_ticker, {}).get("weight", 0.0),
                "weighted_risk": 50.0 * portfolio.get(company_ticker, {}).get("weight", 0.0)
            })
    
    # Sort by risk score (highest first)
    company_impacts.sort(key=lambda x: x.get("risk_score", 0), reverse=True)
    
    # Calculate portfolio-level metrics
    total_weighted_risk = sum(c.get("weighted_risk", 0) for c in company_impacts)
    avg_risk_score = sum(c.get("risk_score", 0) for c in company_impacts) / len(company_impacts) if company_impacts else 0
    
    return {
        "companies": company_impacts,
        "total_assessed": len(company_impacts),
        "high_risk_count": len([c for c in company_impacts if c.get("risk_score", 0) > 70]),
        "medium_risk_count": len([c for c in company_impacts if 40 < c.get("risk_score", 0) <= 70]),
        "low_risk_count": len([c for c in company_impacts if c.get("risk_score", 0) <= 40]),
        "average_risk_score": round(avg_risk_score, 2),
        "portfolio_weighted_risk": round(total_weighted_risk, 4),
        "total_portfolio_weight": sum(portfolio.get(ticker, {}).get("weight", 0.0) for ticker in companies)
    }