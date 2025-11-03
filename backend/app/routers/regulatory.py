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
from app.services.searxng_service import SearXNGService

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
    Uses equal-weighted portfolio as base
    """
    regulation_data = request.get("regulation")
    companies = request.get("companies", [])
    company_data_map = request.get("companyData", {})  # Optional: pre-parsed 10-K data
    use_equal_weight = request.get("useEqualWeight", True)  # Default to equal weight
    
    if not regulation_data:
        raise HTTPException(status_code=400, detail="Regulation data is required")
    
    # If no companies specified, load S&P 500 portfolio with equal weights
    if not companies:
        if company_data_map:
            companies = list(company_data_map.keys())
        else:
            # Load S&P 500 portfolio with equal weights
            portfolio = _load_sp500_portfolio(use_equal_weights=True)
            companies = list(portfolio.keys())
            # Populate company_data_map from portfolio
            for ticker, data in portfolio.items():
                if ticker not in company_data_map:
                    company_data_map[ticker] = {
                        "ticker": ticker,
                        "company_name": data.get("company_name", f"{ticker} Inc."),
                        "key_suppliers": [],
                        "geographic_revenue": [],
                        "product_lines": [],
                        "business_description_full": "",
                        "supply_chain_risk_score": 50.0,
                        "geographic_concentration_score": 50.0
                    }
    
    if not companies:
        raise HTTPException(status_code=400, detail="At least one company must be specified")
    
    # Calculate equal weight if using equal weight portfolio
    equal_weight = 1.0 / len(companies) if use_equal_weight and companies else None
    
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
            # Add equal weight if specified
            if use_equal_weight and equal_weight:
                impact["portfolio_weight"] = equal_weight
                impact["weight_percentage"] = equal_weight * 100
            company_impacts.append(impact)
        except Exception as e:
            # Fallback to basic scoring if error
            fallback_impact = {
                "ticker": company_ticker,
                "company_name": company_data.get("company_name", f"{company_ticker} Inc."),
                "risk_score": 50.0,
                "exposure": "Medium",
                "reasoning": f"Error calculating impact: {str(e)}",
                "supply_chain_risk": 50.0,
                "revenue_impact_pct": 0.0,
                "mitigation_strategies": ["Review manually"]
            }
            if use_equal_weight and equal_weight:
                fallback_impact["portfolio_weight"] = equal_weight
                fallback_impact["weight_percentage"] = equal_weight * 100
            company_impacts.append(fallback_impact)
    
    # Sort by risk score (highest first)
    company_impacts.sort(key=lambda x: x.get("risk_score", 0), reverse=True)
    
    return {
        "companies": company_impacts,
        "total_assessed": len(company_impacts),
        "high_risk_count": len([c for c in company_impacts if c.get("risk_score", 0) > 70]),
        "medium_risk_count": len([c for c in company_impacts if 40 < c.get("risk_score", 0) <= 70]),
        "low_risk_count": len([c for c in company_impacts if c.get("risk_score", 0) <= 40]),
        "average_risk_score": round(sum(c.get("risk_score", 0) for c in company_impacts) / len(company_impacts), 2) if company_impacts else 0,
        "is_equal_weight": use_equal_weight,
        "equal_weight_percentage": round(equal_weight * 100, 4) if equal_weight else None
    }


@router.post("/simulate-scenarios")
async def simulate_regulatory_scenarios(request: dict):
    """
    Simulate multiple regulatory scenarios and their portfolio impacts
    Uses equal-weighted portfolio if portfolio not provided
    """
    portfolio = request.get("portfolio", {})  # {ticker: weight}
    company_impacts = request.get("companyImpacts", [])
    scenarios = request.get("scenarios", [])
    time_horizon_days = request.get("timeHorizonDays", 90)
    use_equal_weight = request.get("useEqualWeight", True)  # Default to equal weight
    
    # If portfolio not provided, build equal-weighted from company_impacts
    if not portfolio and company_impacts:
        # Build equal-weighted portfolio from company impacts
        num_companies = len(company_impacts)
        equal_weight = 1.0 / num_companies if num_companies > 0 else 0.0
        portfolio = {
            impact.get("ticker", ""): equal_weight 
            for impact in company_impacts 
            if impact.get("ticker")
        }
    
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
        # Add equal weight info
        results["is_equal_weight"] = use_equal_weight
        if use_equal_weight and portfolio:
            equal_weight_val = list(portfolio.values())[0] if portfolio else 0.0
            results["equal_weight_percentage"] = round(equal_weight_val * 100, 4)
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


def _load_sp500_portfolio(use_equal_weights: bool = True) -> dict:
    """
    Load S&P 500 portfolio from CSV file with equal weights
    
    Args:
        use_equal_weights: If True, all stocks have equal weight (1/n)
                          If False, uses weights from CSV file
    
    Returns:
        Dictionary with ticker as key and portfolio info as value
    """
    portfolio = {}
    sp500_file = DATASET_DIR / "2025-08-15_composition_sp500.csv"
    
    if not sp500_file.exists():
        return portfolio
    
    try:
        with open(sp500_file, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            stocks = []
            for row in reader:
                symbol = row.get('Symbol', '').strip().upper()
                if symbol:
                    stocks.append({
                        "ticker": symbol,
                        "company_name": row.get('Company', ''),
                        "original_weight": row.get('Weight', '0.0'),
                        "original_price": row.get('Price', '0.0')
                    })
        
        # Get real-time prices using yfinance
        try:
            import yfinance as yf
            tickers = [s["ticker"] for s in stocks]
            
            # Fetch prices in batches to avoid rate limits
            # yfinance supports multiple tickers but can be slow with 500+
            batch_size = 50
            prices = {}
            for i in range(0, len(tickers), batch_size):
                batch = tickers[i:i+batch_size]
                try:
                    # Use Tickers class for batch fetching (space-separated tickers)
                    ticker_string = ' '.join(batch)
                    ticker_objects = yf.Tickers(ticker_string)
                    
                    for ticker in batch:
                        try:
                            stock_obj = ticker_objects.tickers.get(ticker)
                            if not stock_obj:
                                # Fallback: try individual Ticker
                                stock_obj = yf.Ticker(ticker)
                            
                            # Try to get current price from history
                            hist = stock_obj.history(period="1d")
                            if not hist.empty:
                                prices[ticker] = float(hist['Close'].iloc[-1])
                            else:
                                # Fallback: try info dict
                                try:
                                    info = stock_obj.info
                                    if info and isinstance(info, dict):
                                        if 'currentPrice' in info and info['currentPrice']:
                                            prices[ticker] = float(info['currentPrice'])
                                        elif 'regularMarketPrice' in info and info['regularMarketPrice']:
                                            prices[ticker] = float(info['regularMarketPrice'])
                                        elif 'previousClose' in info and info['previousClose']:
                                            prices[ticker] = float(info['previousClose'])
                                        else:
                                            prices[ticker] = None
                                    else:
                                        prices[ticker] = None
                                except Exception as e2:
                                    print(f"Error getting info for {ticker}: {e2}")
                                    prices[ticker] = None
                        except Exception as e:
                            print(f"Error fetching price for {ticker}: {e}")
                            prices[ticker] = None
                except Exception as e:
                    print(f"Error fetching batch prices: {e}")
                    # Set all batch prices to None on batch error
                    for ticker in batch:
                        prices[ticker] = None
        except ImportError:
            print("yfinance not available, using CSV prices")
            prices = {}
        except Exception as e:
            print(f"Error fetching real-time prices: {e}")
            prices = {}
        
        # Calculate equal weight if requested
        num_stocks = len(stocks)
        equal_weight = 1.0 / num_stocks if num_stocks > 0 else 0.0
        
        # Build portfolio
        for stock in stocks:
            ticker = stock["ticker"]
            
            # Get price (prefer real-time, fallback to CSV)
            price = prices.get(ticker)
            if price is None:
                # Fallback to CSV price
                try:
                    price_str = stock["original_price"].replace(',', '.')
                    price = float(price_str) if price_str else 0.0
                except:
                    price = 0.0
            
            # Use equal weight if requested
            if use_equal_weights:
                weight = equal_weight
            else:
                try:
                    weight_str = stock["original_weight"].replace(',', '.')
                    weight = float(weight_str) if weight_str else 0.0
                except:
                    weight = 0.0
            
            portfolio[ticker] = {
                "ticker": ticker,
                "company_name": stock["company_name"],
                "weight": weight,
                "weight_percentage": weight * 100,  # For display
                "price": price,
                "market_cap": None,  # Could fetch from yfinance if needed
                "sector": None,  # Could fetch from yfinance if needed
                "is_equal_weight": use_equal_weights
            }
    
    except Exception as e:
        print(f"Error loading S&P 500 portfolio: {e}")
        import traceback
        traceback.print_exc()
    
    return portfolio


@router.get("/sp500-portfolio")
async def get_sp500_portfolio(equal_weight: bool = True):
    """
    Get S&P 500 portfolio composition with equal weights
    
    Args:
        equal_weight: If True, all stocks have equal weight (default: True)
    
    Returns:
        Dictionary with portfolio data including equal weights and real-time prices
    """
    portfolio = _load_sp500_portfolio(use_equal_weights=equal_weight)
    portfolio_list = list(portfolio.values())
    
    # Calculate total portfolio value using real-time prices
    total_portfolio_value = sum(stock.get("price", 0) * stock.get("weight", 0) for stock in portfolio_list if stock.get("price"))
    
    # Calculate equal weight summary
    equal_weight_pct = (1.0 / len(portfolio_list) * 100) if portfolio_list else 0.0
    
    # Try to get sector information from yfinance for sector breakdown
    sector_breakdown = {}
    try:
        import yfinance as yf
        # Sample stocks from each sector to get sector mapping
        # In production, would fetch sector for all stocks
        sectors = {}
        sample_size = min(100, len(portfolio_list))  # Sample for speed
        for stock in portfolio_list[:sample_size]:
            ticker = stock.get("ticker")
            if ticker:
                try:
                    stock_obj = yf.Ticker(ticker)
                    info = stock_obj.info
                    if info and 'sector' in info:
                        sector = info['sector']
                        if sector not in sectors:
                            sectors[sector] = []
                        sectors[sector].append(stock)
                except:
                    pass
        
        # Calculate sector weights for equal weight portfolio
        for sector, stocks in sectors.items():
            sector_weight = len(stocks) * equal_weight_pct
            sector_breakdown[sector] = {
                "weight": round(sector_weight, 2),
                "stock_count": len(stocks),
                "equal_weight_per_stock": round(equal_weight_pct, 4)
            }
    except:
        pass
    
    return {
        "total_stocks": len(portfolio_list),
        "portfolio": portfolio_list,
        "portfolio_weights": {k: v["weight"] for k, v in portfolio.items()},
        "equal_weight_percentage": round(equal_weight_pct, 4),
        "is_equal_weight": equal_weight,
        "total_portfolio_value": total_portfolio_value,
        "average_weight": equal_weight_pct if equal_weight else sum(v["weight"] * 100 for v in portfolio.values()) / len(portfolio) if portfolio else 0,
        "sector_breakdown": sector_breakdown if sector_breakdown else None,
        "portfolio_type": "Equal Weight" if equal_weight else "Market Cap Weighted"
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
    
    # Load S&P 500 portfolio with equal weights
    portfolio = _load_sp500_portfolio(use_equal_weights=True)
    
    if not portfolio:
        raise HTTPException(status_code=404, detail="S&P 500 portfolio data not found")
    
    # Get all tickers
    companies = list(portfolio.keys())
    
    # Calculate equal weight for each stock
    equal_weight = 1.0 / len(companies) if companies else 0.0
    
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
            # Use equal weight for all stocks
            impact["portfolio_weight"] = equal_weight
            impact["weight_percentage"] = equal_weight * 100
            impact["weighted_risk"] = impact.get("risk_score", 0) * equal_weight
            # Add price info from portfolio
            impact["price"] = portfolio.get(company_ticker, {}).get("price", 0.0)
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
                "portfolio_weight": equal_weight,
                "weight_percentage": equal_weight * 100,
                "weighted_risk": 50.0 * equal_weight,
                "price": portfolio.get(company_ticker, {}).get("price", 0.0)
            })
    
    # Sort by risk score (highest first)
    company_impacts.sort(key=lambda x: x.get("risk_score", 0), reverse=True)
    
    # Calculate portfolio-level metrics using equal weights
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
        "total_portfolio_weight": len(companies) * equal_weight,  # Should be 1.0
        "equal_weight": equal_weight,
        "equal_weight_percentage": round(equal_weight * 100, 4),
        "is_equal_weight": True
    }


@router.post("/search-missing-elements")
async def search_missing_elements(request: dict):
    """
    Search for missing elements from reports using SearXNG
    Identifies what should be in reports and searches for missing information across all pages
    
    Args:
        request: Dict with:
            - report_type: Type of report (regulatory, company_impact, portfolio, etc.)
            - report_data: Current report data to analyze
            - page_url: Optional page URL to check
            - elements_to_check: Optional list of specific elements to check
    
    Returns:
        Dict with:
            - missing_elements: List of identified missing elements
            - search_results: Search results from SearXNG for each missing element
            - recommendations: Recommendations for filling missing elements
    """
    report_type = request.get("report_type", "regulatory")
    report_data = request.get("report_data", {})
    page_url = request.get("page_url")
    elements_to_check = request.get("elements_to_check")
    
    # Define expected elements for different report types
    expected_elements_map = {
        "regulatory": {
            "required": ["regulation_name", "regulation_type", "jurisdiction", "effective_date", "summary", "measures", "entities"],
            "optional": ["issuing_body", "citations", "supply_chain_impact", "key_provisions", "geographic_choke_points"],
            "descriptions": {
                "regulation_name": "Name of the regulation or document",
                "regulation_type": "Type of regulation (tax_credit, sanction, directive, etc.)",
                "jurisdiction": "Country or region where regulation applies",
                "effective_date": "Date when regulation becomes effective",
                "summary": "Summary of the regulation",
                "measures": "List of regulatory measures and provisions",
                "entities": "Affected entities (companies, sectors, countries)",
                "issuing_body": "Organization that issued the regulation",
                "citations": "Document citations with paragraph references",
                "supply_chain_impact": "Supply chain impact analysis",
                "key_provisions": "Key regulatory provisions",
                "geographic_choke_points": "Geographic supply chain choke points"
            }
        },
        "company_impact": {
            "required": ["ticker", "company_name", "risk_score", "exposure", "reasoning"],
            "optional": ["supply_chain_exposure", "revenue_exposure", "compliance_requirements", "opportunities", "mitigation_strategies"],
            "descriptions": {
                "ticker": "Company stock ticker symbol",
                "company_name": "Full company name",
                "risk_score": "Numeric risk score (0-100)",
                "exposure": "Exposure level (Low, Medium, High, Critical)",
                "reasoning": "Explanation of impact assessment",
                "supply_chain_exposure": "Supply chain exposure details",
                "revenue_exposure": "Revenue exposure analysis",
                "compliance_requirements": "Compliance requirements",
                "opportunities": "Potential opportunities from regulation",
                "mitigation_strategies": "Strategies to mitigate risk"
            }
        },
        "portfolio": {
            "required": ["total_assessed", "high_risk_count", "medium_risk_count", "low_risk_count", "average_risk_score"],
            "optional": ["portfolio_weighted_risk", "companies", "scenario_analysis"],
            "descriptions": {
                "total_assessed": "Total number of companies assessed",
                "high_risk_count": "Number of high-risk companies",
                "medium_risk_count": "Number of medium-risk companies",
                "low_risk_count": "Number of low-risk companies",
                "average_risk_score": "Average risk score across portfolio",
                "portfolio_weighted_risk": "Portfolio-weighted risk metric",
                "companies": "List of company impact assessments",
                "scenario_analysis": "Scenario analysis results"
            }
        }
    }
    
    # Get expected elements for this report type
    expected_elements = expected_elements_map.get(report_type, expected_elements_map["regulatory"])
    required_elements = expected_elements.get("required", [])
    optional_elements = expected_elements.get("optional", [])
    element_descriptions = expected_elements.get("descriptions", {})
    
    # If specific elements to check are provided, use those
    if elements_to_check:
        elements_to_verify = elements_to_check
    else:
        elements_to_verify = required_elements + optional_elements
    
    # Identify missing elements
    missing_elements = []
    present_elements = []
    
    for element in elements_to_verify:
        value = report_data.get(element)
        
        # Check if element is missing or empty
        is_missing = False
        if value is None:
            is_missing = True
        elif isinstance(value, (list, dict)):
            if len(value) == 0:
                is_missing = True
        elif isinstance(value, str):
            if not value.strip():
                is_missing = True
        
        if is_missing:
            missing_elements.append({
                "element": element,
                "description": element_descriptions.get(element, f"{element} information"),
                "required": element in required_elements
            })
        else:
            present_elements.append(element)
    
    # Search for missing elements using SearXNG
    search_results = []
    recommendations = []
    
    for missing_element in missing_elements:
        element_name = missing_element["element"]
        element_desc = missing_element["description"]
        is_required = missing_element["required"]
        
        # Build search query based on report context
        context_parts = []
        
        if report_type == "regulatory":
            regulation_name = report_data.get("regulation_name", "")
            jurisdiction = report_data.get("jurisdiction", "")
            if regulation_name:
                context_parts.append(regulation_name)
            if jurisdiction:
                context_parts.append(jurisdiction)
            context_parts.append("regulation")
        
        elif report_type == "company_impact":
            company_name = report_data.get("company_name", "")
            ticker = report_data.get("ticker", "")
            if company_name:
                context_parts.append(company_name)
            if ticker:
                context_parts.append(ticker)
            context_parts.append("regulatory impact")
        
        # Create search query
        search_query = f"{' '.join(context_parts)} {element_desc} {element_name}"
        
        # Perform search using SearXNG
        try:
            search_result = SearXNGService.search(
                query=search_query,
                categories=["general", "news", "finance"] if report_type in ["company_impact", "portfolio"] else ["general", "news"],
                max_results=5,
                timeout=15.0
            )
            
            if search_result.get("success") and search_result.get("results"):
                search_results.append({
                    "element": element_name,
                    "query": search_query,
                    "results": search_result["results"],
                    "number_of_results": search_result.get("number_of_results", 0)
                })
                
                # Generate recommendation based on search results
                top_results = search_result["results"][:3]
                recommendation = f"For {element_desc}: "
                
                if top_results:
                    sources = [r.get("title", "") for r in top_results if r.get("title")]
                    recommendation += f"Found {len(top_results)} potential sources. "
                    if sources:
                        recommendation += f"Top sources: {', '.join(sources[:2])}."
                else:
                    recommendation += f"Could not find specific information about {element_desc}."
                
                recommendations.append({
                    "element": element_name,
                    "recommendation": recommendation,
                    "priority": "HIGH" if is_required else "MEDIUM",
                    "sources": [{"title": r.get("title", ""), "url": r.get("url", "")} for r in top_results]
                })
            else:
                recommendations.append({
                    "element": element_name,
                    "recommendation": f"Search unavailable for {element_desc}. Consider manual review.",
                    "priority": "HIGH" if is_required else "MEDIUM",
                    "sources": []
                })
        
        except Exception as e:
            recommendations.append({
                "element": element_name,
                "recommendation": f"Error searching for {element_desc}: {str(e)}",
                "priority": "HIGH" if is_required else "MEDIUM",
                "sources": []
            })
    
    return {
        "report_type": report_type,
        "page_url": page_url,
        "missing_elements": missing_elements,
        "present_elements": present_elements,
        "missing_count": len(missing_elements),
        "present_count": len(present_elements),
        "total_elements": len(elements_to_verify),
        "search_results": search_results,
        "recommendations": recommendations,
        "completeness_percentage": round((len(present_elements) / len(elements_to_verify)) * 100, 2) if elements_to_verify else 0
    }