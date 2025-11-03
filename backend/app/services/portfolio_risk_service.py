"""
Portfolio Risk Service - Computes and caches portfolio risk metrics
"""

from typing import Dict, List, Optional
import json
import os
from pathlib import Path
from datetime import datetime, timedelta
import csv

from app.services.impact_modeler import ImpactModeler


class PortfolioRiskService:
    """Service for computing and caching portfolio risk metrics"""
    
    # Cache file location
    CACHE_DIR = Path(__file__).parent.parent.parent / "cache"
    CACHE_FILE = CACHE_DIR / "portfolio_risk_metrics.json"
    
    # Dataset directory
    DATASET_DIR = Path(__file__).parent.parent.parent.parent / "jeu_de_donnees"
    
    @staticmethod
    def initialize_cache(force_new: bool = False) -> Dict:
        """
        Initialize portfolio risk metrics cache at startup
        
        Args:
            force_new: If True, recompute even if cache exists
            
        Returns:
            Dictionary with all portfolio risk metrics
        """
        # Create cache directory if it doesn't exist
        PortfolioRiskService.CACHE_DIR.mkdir(parents=True, exist_ok=True)
        
        # Check cache unless force new
        if not force_new and PortfolioRiskService.CACHE_FILE.exists():
            try:
                with open(PortfolioRiskService.CACHE_FILE, 'r') as f:
                    cached_data = json.load(f)
                    print(f"✓ Portfolio risk cache found (cached at: {cached_data.get('cached_at', 'unknown')})")
                    return cached_data.get("metrics", {})
            except Exception as e:
                print(f"⚠ Error loading cache: {e}, will recompute...")
        
        # Compute metrics if cache doesn't exist or force_new is True
        print("Computing portfolio risk metrics...")
        portfolio = PortfolioRiskService._load_sp500_portfolio()
        
        if not portfolio:
            raise ValueError("Could not load S&P 500 portfolio")
        
        # Compute metrics
        metrics = PortfolioRiskService._compute_metrics(portfolio, regulation_data=None)
        
        # Save to cache
        try:
            cache_data = {
                "cached_at": datetime.now().isoformat(),
                "metrics": metrics
            }
            with open(PortfolioRiskService.CACHE_FILE, 'w') as f:
                json.dump(cache_data, f, indent=2)
            print(f"✓ Portfolio risk metrics computed and cached")
        except Exception as e:
            print(f"⚠ Error saving cache: {e}")
        
        return metrics
    
    @staticmethod
    def get_portfolio_risk_metrics() -> Dict:
        """
        Get portfolio risk metrics from cache
        
        Returns:
            Dictionary with all portfolio risk metrics (from cache or computed if missing)
        """
        # Create cache directory if it doesn't exist
        PortfolioRiskService.CACHE_DIR.mkdir(parents=True, exist_ok=True)
        
        # Try to load from cache
        if PortfolioRiskService.CACHE_FILE.exists():
            try:
                with open(PortfolioRiskService.CACHE_FILE, 'r') as f:
                    cached_data = json.load(f)
                    return cached_data.get("metrics", {})
            except Exception as e:
                print(f"Error loading cache: {e}")
        
        # If no cache, compute on the fly (shouldn't happen if initialize_cache was called)
        print("⚠ No cache found, computing portfolio risk metrics on the fly...")
        portfolio = PortfolioRiskService._load_sp500_portfolio()
        
        if not portfolio:
            raise ValueError("Could not load S&P 500 portfolio")
        
        return PortfolioRiskService._compute_metrics(portfolio, regulation_data=None)
    
    @staticmethod
    def _compute_metrics(portfolio: Dict, regulation_data: Optional[Dict] = None) -> Dict:
        """Compute all portfolio risk metrics"""
        
        # Get all tickers and equal weight
        tickers = list(portfolio.keys())
        num_stocks = len(tickers)
        equal_weight = 1.0 / num_stocks if num_stocks > 0 else 0.0
        
        # Load geographic revenue data from filings for each company
        print("Loading geographic revenue data from 10-K filings...")
        company_geographic_data = PortfolioRiskService._load_company_geographic_data(tickers)
        
        # Try to fetch sector information
        sectors = {}
        company_risk_scores = {}
        
        try:
            import yfinance as yf
            # Fetch sector info for stocks
            for ticker in tickers[:500]:  # Limit to avoid rate limits
                try:
                    stock = yf.Ticker(ticker)
                    info = stock.info
                    if info and 'sector' in info:
                        sector = info.get('sector', 'Unknown')
                        if sector not in sectors:
                            sectors[sector] = []
                        sectors[sector].append({
                            "ticker": ticker,
                            "company_name": portfolio[ticker].get("company_name", f"{ticker} Inc."),
                            "price": portfolio[ticker].get("price", 0.0),
                            "weight": equal_weight
                        })
                except:
                    pass
        except ImportError:
            pass
        except Exception as e:
            print(f"Error fetching sector info: {e}")
        
        # Compute risk scores based on geographic exposure from filings
        # Even without regulation_data, we can compute risk based on geographic concentration
        for ticker in tickers:
            geo_data = company_geographic_data.get(ticker, {})
            geographic_revenue = geo_data.get("geographic_revenue", [])
            
            # Calculate risk score based on geographic exposure
            # Higher risk for: China exposure, concentrated exposure, high emerging market exposure
            risk_score = PortfolioRiskService._calculate_geographic_risk_score(geographic_revenue)
            company_risk_scores[ticker] = risk_score
        
        # If regulation data provided, enhance scores with regulatory impact
        if regulation_data:
            for ticker in tickers:
                try:
                    geo_data = company_geographic_data.get(ticker, {})
                    company_data = {
                        "ticker": ticker,
                        "company_name": portfolio[ticker].get("company_name", f"{ticker} Inc."),
                        "key_suppliers": geo_data.get("key_suppliers", []),
                        "geographic_revenue": geo_data.get("geographic_revenue", []),
                        "product_lines": geo_data.get("product_lines", []),
                        "business_description_full": geo_data.get("business_description", ""),
                        "supply_chain_risk_score": 50.0,
                        "geographic_concentration_score": company_risk_scores.get(ticker, 50.0)
                    }
                    
                    impact = ImpactModeler.calculate_company_impact(
                        regulation_data=regulation_data,
                        company_data=company_data
                    )
                    # Blend geographic risk with regulatory risk
                    geo_risk = company_risk_scores.get(ticker, 50.0)
                    reg_risk = impact.get("risk_score", 50.0)
                    company_risk_scores[ticker] = geo_risk * 0.4 + reg_risk * 0.6
                except Exception as e:
                    # Keep geographic risk score if calculation fails
                    pass
        
        # Calculate sector breakdown
        sector_breakdown = []
        for sector, stocks in sectors.items():
            sector_weight = len(stocks) * equal_weight * 100  # Percentage
            avg_risk = sum(company_risk_scores.get(s["ticker"], 50.0) for s in stocks) / len(stocks) if stocks else 50.0
            total_exposure = sum(s["price"] * s["weight"] * 1000000 for s in stocks if s.get("price"))  # Market value
            
            sector_breakdown.append({
                "sector": sector,
                "weight": round(sector_weight, 1),
                "avgRisk": round(avg_risk, 1),
                "exposure": int(total_exposure),
                "stock_count": len(stocks)
            })
        
        # Sort by weight descending
        sector_breakdown.sort(key=lambda x: x["weight"], reverse=True)
        
        # Calculate geographic risk using actual filing data
        geographic_risk = PortfolioRiskService._compute_geographic_risk(
            portfolio, company_risk_scores, equal_weight, company_geographic_data
        )
        
        # Calculate high risk companies
        high_risk_companies = sorted(
            [
                {
                    "ticker": ticker,
                    "name": portfolio[ticker].get("company_name", f"{ticker} Inc."),
                    "riskScore": round(company_risk_scores[ticker], 1),
                    "exposure": int(portfolio[ticker].get("price", 0.0) * equal_weight * 1000000)
                }
                for ticker in tickers
                if company_risk_scores.get(ticker, 50.0) >= 75.0
            ],
            key=lambda x: x["riskScore"],
            reverse=True
        )[:5]  # Top 5
        
        # Calculate portfolio risk trend (12 months - simplified)
        risk_trend = PortfolioRiskService._compute_risk_trend(company_risk_scores, equal_weight)
        
        # Calculate portfolio summary
        total_exposure = sum(
            portfolio[ticker].get("price", 0.0) * equal_weight * 1000000
            for ticker in tickers
            if company_risk_scores.get(ticker, 50.0) >= 40.0
        )
        
        weighted_risk = sum(
            company_risk_scores.get(ticker, 50.0) * equal_weight
            for ticker in tickers
        )
        
        high_risk_count = len([t for t in tickers if company_risk_scores.get(t, 50.0) >= 75.0])
        
        # Calculate risk trend percentage (simplified - would use historical data)
        risk_trend_pct = (risk_trend[-1].get("portfolioRisk", weighted_risk) - weighted_risk) / weighted_risk * 100 if weighted_risk > 0 else 0.0
        
        return {
            "portfolioRiskSummary": {
                "totalRegulatoryExposure": int(total_exposure),
                "weightedRiskScore": round(weighted_risk, 1),
                "highRiskCompanies": high_risk_count,
                "riskTrendPercentage": round(risk_trend_pct, 1)
            },
            "sectorBreakdown": sector_breakdown,
            "geographicRisk": geographic_risk,
            "highRiskCompanies": high_risk_companies,
            "riskTrend": risk_trend,
            "portfolioComposition": {
                "totalStocks": num_stocks,
                "equalWeight": equal_weight,
                "equalWeightPercentage": round(equal_weight * 100, 3),
                "isEqualWeight": True
            }
        }
    
    @staticmethod
    def _load_company_geographic_data(tickers: List[str]) -> Dict:
        """Load geographic revenue data from 10-K filings for all companies"""
        from app.routers.stocks import find_filings_for_ticker, get_filing_content
        from app.services.tenk_parser import TenKParser
        
        company_data = {}
        processed = 0
        
        for ticker in tickers:
            try:
                # Find 10-K filings for this ticker
                filings = find_filings_for_ticker(ticker)
                tenk_filings = [f for f in filings if '10-k' in f.get('filename', '').lower() or '10k' in f.get('filename', '').lower()]
                
                if tenk_filings:
                    # Get most recent 10-K
                    filing = tenk_filings[0]
                    filing_content = get_filing_content(filing['path'], max_length=200000)
                    
                    if filing_content:
                        # Parse 10-K
                        tenk_data = TenKParser.parse_tenk(filing_content, ticker)
                        
                        # Map regions to our standard regions
                        geographic_revenue = PortfolioRiskService._map_regions_to_standard(
                            tenk_data.get("geographic_revenue", [])
                        )
                        
                        company_data[ticker] = {
                            "geographic_revenue": geographic_revenue,
                            "key_suppliers": tenk_data.get("key_suppliers", []),
                            "product_lines": tenk_data.get("product_lines", []),
                            "business_description": tenk_data.get("business_model", "")
                        }
                        processed += 1
                        
                        if processed % 50 == 0:
                            print(f"  Processed {processed}/{len(tickers)} companies...")
            except Exception as e:
                # Skip if parsing fails
                pass
        
        print(f"  Loaded geographic data for {processed}/{len(tickers)} companies from filings")
        return company_data
    
    @staticmethod
    def _map_regions_to_standard(geographic_revenue: List[Dict]) -> List[Dict]:
        """Map extracted regions from filings to standard regions"""
        # Mapping rules: filing regions -> our standard regions
        region_mapping = {
            # USA/ Americas
            "usa": "USA",
            "united states": "USA",
            "us": "USA",
            "americas": "USA",
            "north america": "USA",
            "america": "USA",
            
            # China
            "china": "China",
            "prc": "China",
            "people's republic of china": "China",
            
            # Europe
            "europe": "Europe",
            "european union": "Europe",
            "eu": "Europe",
            "united kingdom": "Europe",
            "uk": "Europe",
            "germany": "Europe",
            "france": "Europe",
            "italy": "Europe",
            "spain": "Europe",
            
            # Asia ex-China
            "asia": "Asia (ex-China)",
            "asia pacific": "Asia (ex-China)",
            "apac": "Asia (ex-China)",
            "japan": "Asia (ex-China)",
            "south korea": "Asia (ex-China)",
            "korea": "Asia (ex-China)",
            "india": "Asia (ex-China)",
            "singapore": "Asia (ex-China)",
            "taiwan": "Asia (ex-China)",
            "hong kong": "Asia (ex-China)",
            "thailand": "Asia (ex-China)",
            "malaysia": "Asia (ex-China)",
            "indonesia": "Asia (ex-China)",
            
            # Other
            "other": "Other",
            "latin america": "Other",
            "south america": "Other",
            "brazil": "Other",
            "mexico": "Other",
            "canada": "Other",
            "middle east": "Other",
            "africa": "Other",
        }
        
        # Aggregate by standard region
        aggregated = {}
        for geo in geographic_revenue:
            region_name = geo.get("region", "").lower().strip()
            revenue_pct = geo.get("revenue_percent", 0.0)
            
            # Find matching standard region
            standard_region = "Other"  # Default
            for key, value in region_mapping.items():
                if key in region_name:
                    standard_region = value
                    break
            
            # Aggregate percentages
            if standard_region not in aggregated:
                aggregated[standard_region] = 0.0
            aggregated[standard_region] += revenue_pct
        
        # Convert back to list format
        result = []
        for region, pct in aggregated.items():
            result.append({
                "region": region,
                "revenue_percent": round(pct, 1)
            })
        
        # Ensure all standard regions are represented
        standard_regions = ["USA", "China", "Europe", "Asia (ex-China)", "Other"]
        for region in standard_regions:
            if not any(r["region"] == region for r in result):
                result.append({
                    "region": region,
                    "revenue_percent": 0.0
                })
        
        return result
    
    @staticmethod
    def _calculate_geographic_risk_score(geographic_revenue: List[Dict]) -> float:
        """Calculate risk score based on geographic exposure"""
        if not geographic_revenue:
            return 50.0  # Unknown - medium risk
        
        # Region-specific risk factors
        region_risk_factors = {
            "USA": 0.8,           # Lower risk
            "Europe": 1.0,        # Baseline
            "Asia (ex-China)": 1.2,  # Moderate-high risk
            "China": 1.8,          # High risk
            "Other": 1.1          # Slightly elevated
        }
        
        # Calculate weighted risk score
        total_risk = 0.0
        total_exposure = 0.0
        
        for geo in geographic_revenue:
            region = geo.get("region", "Other")
            revenue_pct = geo.get("revenue_percent", 0.0)
            
            if revenue_pct > 0:
                risk_factor = region_risk_factors.get(region, 1.0)
                total_risk += revenue_pct * risk_factor * 50.0  # Base score 50, scaled by risk factor
                total_exposure += revenue_pct
        
        if total_exposure == 0:
            return 50.0
        
        # Calculate average risk weighted by exposure
        avg_risk = total_risk / total_exposure if total_exposure > 0 else 50.0
        
        # Adjust for concentration risk (single region > 80% is higher risk)
        max_exposure = max((geo.get("revenue_percent", 0.0) for geo in geographic_revenue), default=0.0)
        if max_exposure > 80.0:
            avg_risk *= 1.15  # 15% penalty for high concentration
        
        # Normalize to 0-100 range
        return min(100.0, max(0.0, avg_risk))
    
    @staticmethod
    def _compute_geographic_risk(
        portfolio: Dict,
        company_risk_scores: Dict,
        equal_weight: float,
        company_geographic_data: Optional[Dict] = None
    ) -> List[Dict]:
        """Compute geographic risk concentration using actual filing data"""
        
        # Default regions
        standard_regions = ["USA", "China", "Europe", "Asia (ex-China)", "Other"]
        
        # Aggregate data by region
        region_data = {region: {"companies": [], "total_exposure": 0.0, "weighted_risk": 0.0} 
                      for region in standard_regions}
        
        tickers = list(portfolio.keys())
        
        if company_geographic_data:
            # Use actual geographic revenue data from filings
            for ticker in tickers:
                risk_score = company_risk_scores.get(ticker, 50.0)
                geo_data = company_geographic_data.get(ticker, {})
                geographic_revenue = geo_data.get("geographic_revenue", [])
                
                if geographic_revenue:
                    # Distribute company across regions based on actual revenue percentages
                    for geo in geographic_revenue:
                        region = geo.get("region", "Other")
                        revenue_pct = geo.get("revenue_percent", 0.0)
                        
                        if region in region_data and revenue_pct > 0:
                            # Weight company risk by revenue exposure
                            region_data[region]["companies"].append({
                                "ticker": ticker,
                                "risk_score": risk_score,
                                "exposure_pct": revenue_pct
                            })
                            region_data[region]["total_exposure"] += revenue_pct
                            region_data[region]["weighted_risk"] += risk_score * revenue_pct
                else:
                    # No geographic data - distribute evenly across regions
                    # This is a fallback for companies without filing data
                    for region in standard_regions:
                        region_data[region]["companies"].append({
                            "ticker": ticker,
                            "risk_score": risk_score,
                            "exposure_pct": 20.0  # Equal distribution across 5 regions
                        })
                        region_data[region]["total_exposure"] += 20.0
                        region_data[region]["weighted_risk"] += risk_score * 20.0
        else:
            # Fallback: distribute companies evenly (shouldn't happen if _load_company_geographic_data worked)
            total_companies = len(tickers)
            for i, ticker in enumerate(tickers):
                risk_score = company_risk_scores.get(ticker, 50.0)
                # Distribute evenly across regions
                for region in standard_regions:
                    region_data[region]["companies"].append({
                        "ticker": ticker,
                        "risk_score": risk_score,
                        "exposure_pct": 20.0
                    })
                    region_data[region]["total_exposure"] += 20.0
                    region_data[region]["weighted_risk"] += risk_score * 20.0
        
        # Calculate final geographic risk metrics
        geographic_risk = []
        total_exposure_all = sum(rd["total_exposure"] for rd in region_data.values())
        
        # Set fixed percentages based on typical S&P 500 distribution (fallback)
        default_exposures = {
            "USA": 55.0,
            "China": 18.0,
            "Europe": 15.0,
            "Asia (ex-China)": 8.0,
            "Other": 4.0
        }
        
        # If we have actual geographic data, normalize to 100%
        # Otherwise use equal distribution
        if total_exposure_all > 0 and company_geographic_data:
            # Normalize so total exposure = 100%
            normalization_factor = 100.0 / total_exposure_all
        else:
            # Use fixed percentages for companies without data
            normalization_factor = 1.0
        
        for region in standard_regions:
            rd = region_data[region]
            
            if rd["total_exposure"] > 0:
                # Calculate weighted average risk score
                avg_risk = rd["weighted_risk"] / rd["total_exposure"] if rd["total_exposure"] > 0 else 50.0
                
                # Calculate exposure percentage
                if company_geographic_data and total_exposure_all > 0:
                    exposure = rd["total_exposure"] * normalization_factor
                else:
                    exposure = default_exposures.get(region, 0.0)
            else:
                avg_risk = 50.0
                exposure = default_exposures.get(region, 0.0) if not company_geographic_data else 0.0
            
            geographic_risk.append({
                "region": region,
                "exposure": round(exposure, 1),
                "riskScore": round(avg_risk, 1)
            })
        
        return geographic_risk
    
    @staticmethod
    def _compute_risk_trend(
        company_risk_scores: Dict,
        equal_weight: float
    ) -> List[Dict]:
        """Compute portfolio risk trend over 12 months"""
        
        # Simplified - would use historical risk data
        current_weighted_risk = sum(company_risk_scores.values()) * equal_weight
        
        trend = []
        for month in range(1, 13):
            # Simplified trend - would use actual historical data
            month_risk = current_weighted_risk + (month - 6) * 2 + (hash(str(month)) % 10 - 5)
            trend.append({
                "month": f"M{month}",
                "portfolioRisk": round(max(0, min(100, month_risk)), 1),
                "benchmark": 50.0
            })
        
        return trend
    
    @staticmethod
    def _load_sp500_portfolio() -> Dict:
        """Load S&P 500 portfolio from CSV file"""
        portfolio = {}
        sp500_file = PortfolioRiskService.DATASET_DIR / "2025-08-15_composition_sp500.csv"
        
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
            prices = {}
            try:
                import yfinance as yf
                tickers = [s["ticker"] for s in stocks]
                
                batch_size = 50
                for i in range(0, len(tickers), batch_size):
                    batch = tickers[i:i+batch_size]
                    try:
                        ticker_string = ' '.join(batch)
                        ticker_objects = yf.Tickers(ticker_string)
                        
                        for ticker in batch:
                            try:
                                stock_obj = ticker_objects.tickers.get(ticker) or yf.Ticker(ticker)
                                hist = stock_obj.history(period="1d")
                                if not hist.empty:
                                    prices[ticker] = float(hist['Close'].iloc[-1])
                                else:
                                    try:
                                        info = stock_obj.info
                                        if info and isinstance(info, dict):
                                            prices[ticker] = float(
                                                info.get('currentPrice') or
                                                info.get('regularMarketPrice') or
                                                info.get('previousClose') or 0.0
                                            )
                                    except:
                                        prices[ticker] = None
                            except:
                                prices[ticker] = None
                    except:
                        for ticker in batch:
                            prices[ticker] = None
            except:
                pass
            
            # Build portfolio with equal weights
            num_stocks = len(stocks)
            equal_weight = 1.0 / num_stocks if num_stocks > 0 else 0.0
            
            for stock in stocks:
                ticker = stock["ticker"]
                price = prices.get(ticker)
                if price is None:
                    try:
                        price_str = stock["original_price"].replace(',', '.')
                        price = float(price_str) if price_str else 0.0
                    except:
                        price = 0.0
                
                portfolio[ticker] = {
                    "ticker": ticker,
                    "company_name": stock["company_name"],
                    "weight": equal_weight,
                    "weight_percentage": equal_weight * 100,
                    "price": price,
                    "is_equal_weight": True
                }
        
        except Exception as e:
            print(f"Error loading S&P 500 portfolio: {e}")
        
        return portfolio

