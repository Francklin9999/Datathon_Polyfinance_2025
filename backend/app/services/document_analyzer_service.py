from typing import Dict, List, Optional
import numpy as np
import os
import logging
import time
from datetime import datetime

logger = logging.getLogger(__name__)

from app.models.types import (
    Portfolio, CompanyRisk, PortfolioImpact, RiskComponent,
    EvidenceSpan, CalibrationMetadata
)
from app.services.regulatory_analyzer import RegulatoryAnalyzer
from app.services.impact_modeler import ImpactModeler
from app.services.calibration_service import CalibrationService
from app.services.searxng_service import SearXNGService
from app.services.tenk_parser import TenKParser
from app.services.document_parser import DocumentParser
from app.services.nlp_quant_strategy import NLPQuantStrategy


class DocumentAnalyzerService:
    @staticmethod
    def analyze_document(
        portfolio: Portfolio,
        document_text: Optional[str] = None,
        file_url: Optional[str] = None,
        agent_query: Optional[str] = None,
        threshold: float = 0.6,
        strict_units: bool = False,
        max_companies: Optional[int] = None
    ) -> Dict:
        start_time = time.time()
        portfolio_size = len(portfolio.holdings) if portfolio.holdings else 0
        
        logger.info(f"Starting document analysis - Portfolio size: {portfolio_size} companies")
        logger.info(f"   Input: file_url={file_url is not None}, document_text={'yes' if document_text else 'no'}, agent_query={agent_query is not None}")
        logger.info(f"   Settings: threshold={threshold}, strict_units={strict_units}")
        
        step_start = time.time()
        logger.info("Step 1: Extracting document text...")
        doc_text, doc_provenance = DocumentAnalyzerService._get_document_text(
            document_text=document_text,
            file_url=file_url,
            agent_query=agent_query
        )
        
        if not doc_text:
            logger.error("Failed to obtain document text from any source")
            raise ValueError("Could not obtain document text")
        
        doc_length = len(doc_text)
        doc_source = doc_provenance.get("source", "unknown")
        doc_format = doc_provenance.get("file_format", "text")
        logger.info(f"   Document extracted: {doc_length:,} chars from {doc_source} (format: {doc_format})")
        logger.debug(f"   Step 1 time: {time.time() - step_start:.2f}s")
        
        step_start = time.time()
        logger.info("Step 2: Analyzing document with regulatory analyzer...")
        logger.info(f"   Document length: {len(doc_text):,} characters")
        try:
            regulation_data = RegulatoryAnalyzer.analyze_document(doc_text)
            step_time = time.time() - step_start
            logger.info(f"   Regulatory analysis complete (took {step_time:.2f}s)")
            logger.debug(f"   Step 2 time: {step_time:.2f}s")
        except Exception as e:
            step_time = time.time() - step_start
            logger.error(f"   ERROR in Step 2 after {step_time:.2f}s: {str(e)}", exc_info=True)
            raise
        
        step_start = time.time()
        calibration = CalibrationService.get_calibrated_weights()
        logger.debug(f"Step 3 time: {time.time() - step_start:.2f}s")
        
        step_start = time.time()
        try:
            sentiment_score = DocumentAnalyzerService._calculate_document_sentiment(doc_text)
        except Exception as e:
            logger.error(f"Error calculating sentiment: {str(e)}", exc_info=True)
            sentiment_score = 50.0
        
        step_start = time.time()
        portfolio_holdings = portfolio.holdings
        MAX_COMPANIES_TO_ANALYZE = max_companies if max_companies else 50
        SAMPLE_SIZE = min(MAX_COMPANIES_TO_ANALYZE, portfolio_size)
        
        import random
        tickers_list = list(portfolio_holdings.keys())
        selected_tickers = set()
        
        if portfolio_holdings:
            sorted_by_weight = sorted(
                tickers_list,
                key=lambda t: portfolio_holdings.get(t, 0),
                reverse=True
            )[:20]
            selected_tickers.update(sorted_by_weight)
        
        remaining_tickers = [t for t in tickers_list if t not in selected_tickers]
        if remaining_tickers:
            random_sample = random.sample(
                remaining_tickers,
                min(SAMPLE_SIZE - len(selected_tickers), len(remaining_tickers))
            )
            selected_tickers.update(random_sample)
        
        selected_tickers = list(selected_tickers)[:SAMPLE_SIZE]
        
        company_risks = []
        processed = 0
        for ticker in selected_tickers:
            ticker_start = time.time()
            try:
                company_risk = DocumentAnalyzerService._calculate_company_risk(
                    ticker=ticker,
                    regulation_data=regulation_data,
                    calibration=calibration,
                    sentiment_score=sentiment_score,
                    document_text=doc_text,
                    threshold=threshold,
                    strict_units=strict_units
                )
                company_risks.append(company_risk)
                processed += 1
                ticker_time = time.time() - ticker_start
                
                if processed % 10 == 0 or ticker_time > 1.0:
                    logger.info(f"Progress: {processed}/{SAMPLE_SIZE} companies processed")
                elif ticker_time > 3.0:
                    logger.warning(f"{ticker} took {ticker_time:.2f}s to process")
            except Exception as e:
                ticker_time = time.time() - ticker_start
                logger.error(f"Error processing {ticker}: {str(e)}")
                processed += 1
                from app.models.types import CompanyRisk, RiskComponent
                company_risks.append(CompanyRisk(
                    ticker=ticker,
                    total_score=50.0,
                    components=[RiskComponent(name="Error", score=50.0, evidence=None)],
                    price_impact_bps=0.0
                ))
        
        analyzed_tickers = {risk.ticker for risk in company_risks}
        for ticker in portfolio_holdings.keys():
            if ticker not in analyzed_tickers:
                from app.models.types import CompanyRisk, RiskComponent
                company_risks.append(CompanyRisk(
                    ticker=ticker,
                    total_score=25.0,
                    components=[RiskComponent(name="NotAnalyzed", score=25.0, evidence="Sampled analysis")],
                    price_impact_bps=0.0
                ))
        
        logger.info(f"   Company risks calculated: {processed} companies analyzed in detail, {portfolio_size - processed} assigned default scores")
        logger.info(f"   Step 5 total time: {time.time() - step_start:.2f}s (avg: {(time.time() - step_start)/max(processed,1):.3f}s per analyzed company)")
        
        step_start = time.time()
        global_impact = DocumentAnalyzerService._calculate_global_impact(
            document_text=doc_text,
            regulation_data=regulation_data,
            company_risks=company_risks,
            portfolio=portfolio
        )
        
        step_start = time.time()
        portfolio_impact = DocumentAnalyzerService._calculate_portfolio_impact(
            portfolio=portfolio,
            company_risks=company_risks
        )
        delta_return = portfolio_impact.delta_return_bps
        
        total_time = time.time() - start_time
        doc_provenance.update({
            "analysis_timestamp": datetime.now().isoformat(),
            "threshold": threshold,
            "strict_units": strict_units,
            "num_companies": len(company_risks),
            "sentiment_score": sentiment_score,
            "total_processing_time_seconds": total_time
        })
        
        logger.info(f"Document analysis complete!")
        logger.info(f"   Summary: {portfolio_size} companies, sentiment={sentiment_score:.1f}, DeltaReturn={delta_return:.1f} bps")
        logger.info(f"   Total processing time: {total_time:.2f}s ({total_time/60:.1f} minutes)")
        
        return {
            "company_risks": company_risks,
            "portfolio_impact": portfolio_impact,
            "global_impact": global_impact,  # New: global/macro analysis
            "document_provenance": doc_provenance,
            "calibration": calibration
        }
    
    @staticmethod
    def _get_document_text(
        document_text: Optional[str] = None,
        file_url: Optional[str] = None,
        agent_query: Optional[str] = None
    ) -> tuple[Optional[str], Dict]:
        """Get document text from various sources"""
        provenance = {
            "source": None,
            "file_url": file_url,
            "agent_query": agent_query,
            "extraction_method": None
        }
        
        if document_text:
            provenance["source"] = "provided_text"
            provenance["extraction_method"] = "direct"
            return document_text, provenance
        
        if file_url:
            try:
                file_path = None
                
                if file_url.startswith('/uploads/'):
                    file_path = file_url.replace('/uploads/', 'uploads/')
                elif file_url.startswith('http://') or file_url.startswith('https://'):
                    provenance["source"] = "file_upload"
                    provenance["extraction_method"] = "s3_url"
                    provenance["error"] = "S3 URL download not yet implemented"
                    return None, provenance
                else:
                    file_path = file_url
                
                if not file_path or not os.path.exists(file_path):
                    possible_paths = [
                        file_path,
                        os.path.join('uploads', os.path.basename(file_url)),
                        os.path.join('backend', 'uploads', os.path.basename(file_url)),
                        file_url.replace('/uploads/', 'uploads/') if '/' in file_url else None
                    ]
                    
                    for path in possible_paths:
                        if path and os.path.exists(path):
                            file_path = path
                            break
                
                if file_path and os.path.exists(file_path):
                    doc_text, file_format = DocumentParser.parse_file(file_path)
                    provenance["source"] = "file_upload"
                    provenance["file_format"] = file_format
                    provenance["extraction_method"] = f"DocumentParser.{file_format}"
                    provenance["file_path"] = file_path
                    return doc_text, provenance
                else:
                    error_msg = f"File not found: {file_url}"
                    logger.error(error_msg)
                    provenance["error"] = error_msg
                    
            except Exception as e:
                error_msg = str(e)
                logger.error(f"Error parsing file: {error_msg}")
                provenance["error"] = error_msg
        
        if agent_query:
            try:
                search_results = SearXNGService.search(agent_query, num_results=5)
                if search_results and len(search_results) > 0:
                    provenance["source"] = "agent_query"
                    provenance["search_results"] = len(search_results)
                    provenance["extraction_method"] = "SearXNG_search"
                    return agent_query, provenance
            except Exception as e:
                error_msg = str(e)
                logger.error(f"Error with agent query: {error_msg}")
                provenance["error"] = error_msg
        
        return None, provenance
    
    @staticmethod
    def _calculate_document_sentiment(document_text: str) -> float:
        """Calculate sentiment score from document text using NLP"""
        try:
            text_sample = document_text[:50000] if len(document_text) > 50000 else document_text
            sentences = NLPQuantStrategy._extract_sentences(text_sample)
            
            if len(sentences) > 100:
                sentences = sentences[:100]
            
            sentiment_results = NLPQuantStrategy._analyze_financial_sentiment(text_sample, sentences)
            overall_sentiment = sentiment_results.get("overall_sentiment", 0.0)
            uncertainty_score = sentiment_results.get("uncertainty_score", 0.0)
            
            risk_score = max(0.0, min(100.0, 50.0 - (overall_sentiment * 50.0)))
            
            if uncertainty_score > 30:
                adjustment = (uncertainty_score - 30) * 0.3
                risk_score = min(100.0, risk_score + adjustment)
            
            return float(risk_score)
        except Exception as e:
            logger.error(f"Error calculating sentiment: {e}", exc_info=True)
            return 50.0
    
    @staticmethod
    def _calculate_company_risk(
        ticker: str,
        regulation_data: Dict,
        calibration: CalibrationMetadata,
        sentiment_score: float,
        document_text: str,
        threshold: float = 0.6,
        strict_units: bool = False
    ) -> CompanyRisk:
        """Calculate CompanyRisk for a single ticker"""
        company_data = DocumentAnalyzerService._get_company_data(ticker)
        
        impact_result = ImpactModeler.calculate_company_impact(
            regulation_data=regulation_data,
            company_data=company_data
        )
        
        company_sentiment_score = DocumentAnalyzerService._calculate_company_specific_sentiment(
            ticker=ticker,
            document_text=document_text,
            base_sentiment=sentiment_score,
            company_data=company_data
        )
        
        components = [
            RiskComponent(
                name="SupplyChain",
                score=impact_result.get("supply_chain_risk", 50.0),
                evidence=None
            ),
            RiskComponent(
                name="GeoExposure",
                score=impact_result.get("geographic_exposure", 50.0),
                evidence=None
            ),
            RiskComponent(
                name="MeasureMatch",
                score=impact_result.get("measure_impact", 50.0),
                evidence=None
            ),
            RiskComponent(
                name="SentimentRisk",
                score=company_sentiment_score,
                evidence=None
            )
        ]
        
        component_scores = [c.score for c in components]
        total_score, _ = CalibrationService.calculate_total_score(
            components=component_scores,
            calibration=calibration
        )
        
        price_impact_bps = DocumentAnalyzerService._calculate_price_impact(
            total_score=total_score,
            components=components,
            calibration=calibration
        )
        
        return CompanyRisk(
            ticker=ticker,
            total_score=total_score,
            components=components,
            price_impact_bps=price_impact_bps
        )
    
    @staticmethod
    def _calculate_company_specific_sentiment(
        ticker: str,
        document_text: str,
        base_sentiment: float,
        company_data: Dict
    ) -> float:
        """Calculate company-specific sentiment score"""
        try:
            company_name = company_data.get("company_name", ticker)
            text_lower = document_text.lower()
            
            # Look for mentions of ticker or company name
            ticker_mentions = text_lower.count(ticker.lower())
            name_mentions = 0
            if company_name and company_name != f"{ticker} Inc.":
                # Split company name into words and check for mentions
                name_words = company_name.lower().split()
                for word in name_words:
                    if len(word) > 3:  # Skip short words like "Inc"
                        name_mentions += text_lower.count(word)
            
            total_mentions = ticker_mentions + name_mentions
            
            if total_mentions == 0:
                return base_sentiment
            
            if total_mentions > 0:
                sentences = NLPQuantStrategy._extract_sentences(document_text)
                company_sentences = []
                
                for sentence in sentences:
                    sentence_lower = sentence.lower()
                    if ticker.lower() in sentence_lower or any(
                        word in sentence_lower for word in company_name.lower().split() if len(word) > 3
                    ):
                        company_sentences.append(sentence)
                
                if company_sentences:
                    company_text = " ".join(company_sentences[:20])
                    company_sentiment = NLPQuantStrategy._analyze_financial_sentiment(
                        company_text, company_sentences[:20]
                    )
                    company_overall = company_sentiment.get("overall_sentiment", 0.0)
                    company_risk = max(0.0, min(100.0, 50.0 - (company_overall * 50.0)))
                    blended_score = base_sentiment * 0.6 + company_risk * 0.4
                    return float(blended_score)
            
            return base_sentiment
            
        except Exception as e:
            logger.warning(f"Error calculating company-specific sentiment for {ticker}: {e}")
            return base_sentiment
    
    @staticmethod
    def _get_company_data(ticker: str) -> Dict:
        """Get company data from 10-K parser or fallback"""
        from app.routers.stocks import find_filings_for_ticker, get_filing_content
        
        try:
            filings = find_filings_for_ticker(ticker)
            for filing in filings:
                if '10-k' in filing.get('filename', '').lower():
                    filing_content = get_filing_content(filing['path'], max_length=None)
                    if filing_content:
                        tenk_data = TenKParser.parse_tenk(filing_content, ticker)
                        return {
                            "ticker": ticker,
                            "company_name": tenk_data.get("company_name", f"{ticker} Inc."),
                            "key_suppliers": tenk_data.get("key_suppliers", []),
                            "geographic_revenue": tenk_data.get("geographic_revenue", []),
                            "product_lines": tenk_data.get("product_lines", []),
                            "business_description_full": tenk_data.get("business_model", "")
                        }
        except Exception:
            pass
        
        return {
            "ticker": ticker,
            "company_name": f"{ticker} Inc.",
            "key_suppliers": [],
            "geographic_revenue": [],
            "product_lines": [],
            "business_description_full": ""
        }
    
    @staticmethod
    def _calculate_price_impact(
        total_score: float,
        components: List[RiskComponent],
        calibration: CalibrationMetadata
    ) -> float:
        """Calculate price impact in basis points"""
        uncertainties = [c.ucb95 - c.score if c.ucb95 else 0.0 for c in components]
        avg_uncertainty = np.mean(uncertainties) if uncertainties else 50.0
        
        uncertainty_decile = min(10, max(1, int(avg_uncertainty / 10)))
        k_factor = 0.5 + (uncertainty_decile / 10) * 0.5
        
        price_impact_bps = k_factor * total_score * 10
        
        return float(price_impact_bps)
    
    @staticmethod
    def _calculate_portfolio_impact(
        portfolio: Portfolio,
        company_risks: List[CompanyRisk]
    ) -> PortfolioImpact:
        """Calculate portfolio-level impact"""
        holdings = portfolio.holdings
        total_delta_return_bps = 0.0
        worst_offenders = []
        risk_map = {risk.ticker: risk for risk in company_risks}
        
        for ticker, weight in holdings.items():
            if ticker in risk_map:
                risk = risk_map[ticker]
                price_impact = risk.price_impact_bps or 0.0
                contribution = weight * price_impact
                total_delta_return_bps += contribution
                
                worst_offenders.append({
                    "ticker": ticker,
                    "score": risk.total_score,
                    "weight": weight,
                    "impact_bps": price_impact
                })
        
        worst_offenders.sort(key=lambda x: x["score"], reverse=True)
        worst_offenders = worst_offenders[:5]
        
        p50 = total_delta_return_bps
        uncertainty = abs(total_delta_return_bps * 0.3)
        p5 = p50 - uncertainty * 1.645
        p95 = p50 + uncertainty * 1.645
        
        evidences = {}
        for offender in worst_offenders[:3]:
            ticker = offender["ticker"]
            if ticker in risk_map:
                risk = risk_map[ticker]
                ticker_evidences = []
                for component in risk.components:
                    if component.evidence:
                        ticker_evidences.extend(component.evidence)
                if ticker_evidences:
                    evidences[ticker] = ticker_evidences
        
        return PortfolioImpact(
            delta_return_bps=float(total_delta_return_bps),
            delta_vol_bps=None,
            worst_offenders=worst_offenders,
            evidences=evidences if evidences else None,
            p5=float(p5),
            p50=float(p50),
            p95=float(p95)
        )
    
    @staticmethod
    def _calculate_global_impact(
        document_text: str,
        regulation_data: Dict,
        company_risks: List,
        portfolio: Portfolio
    ) -> Dict:
        """Calculate global/macro impact analysis"""
        logger = logging.getLogger(__name__)
        
        affected_countries = regulation_data.get("entities", {}).get("countries", [])
        affected_sectors = regulation_data.get("entities", {}).get("sectors", [])
        measures = regulation_data.get("measures", [])
        
        sector_impacts = {}
        holdings = portfolio.holdings or {}
        sector_keywords = {
            "Technology": ["technology", "software", "tech", "semiconductor", "cloud", "internet"],
            "Healthcare": ["healthcare", "pharmaceutical", "biotech", "medical", "drug"],
            "Finance": ["financial", "banking", "insurance", "finance", "investment"],
            "Energy": ["energy", "oil", "gas", "renewable", "petroleum"],
            "Consumer": ["consumer", "retail", "consumer goods", "products"],
            "Industrial": ["industrial", "manufacturing", "automotive", "machinery"],
            "Communication": ["communication", "telecom", "media", "telecommunications"]
        }
        
        doc_lower = document_text.lower()
        for sector, keywords in sector_keywords.items():
            mention_count = sum(1 for kw in keywords if kw in doc_lower)
            if mention_count > 0:
                sector_impacts[sector] = {
                    "mention_count": mention_count,
                    "severity": "high" if mention_count > 3 else "medium" if mention_count > 1 else "low",
                    "keywords_found": [kw for kw in keywords if kw in doc_lower],
                    "estimated_impact": "Significant regulatory exposure" if mention_count > 2 else "Moderate regulatory exposure"
                }
        
        regions = {
            "North America": ["United States", "USA", "US", "Canada", "Mexico", "America"],
            "Europe": ["EU", "Europe", "European Union", "Germany", "France", "UK", "United Kingdom", "Italy", "Spain"],
            "Asia-Pacific": ["China", "Japan", "Korea", "South Korea", "India", "Asia", "Pacific", "Taiwan", "Singapore"],
            "Latin America": ["Brazil", "Argentina", "Chile", "Latin America", "South America"],
            "Middle East": ["Saudi Arabia", "UAE", "Middle East", "Israel", "Qatar"],
            "Africa": ["Africa", "South Africa"]
        }
        
        regional_impacts = {}
        for region, country_names in regions.items():
            mentions = sum(1 for country in affected_countries if any(cn.lower() in country.lower() for cn in country_names))
            if mentions > 0 or any(cn.lower() in doc_lower for cn in country_names):
                regional_impacts[region] = {
                    "affected_countries": [c for c in affected_countries if any(cn.lower() in c.lower() for cn in country_names)],
                    "impact_level": "high" if mentions > 2 else "medium" if mentions > 0 else "low",
                    "economic_significance": "Major economic region affected" if mentions > 1 else "Moderate regional impact"
                }
        
        # Industry Analysis (beyond sectors - specific industries)
        industries = {
            "Semiconductors": ["semiconductor", "chip", "wafer", "semiconductor manufacturing"],
            "Automotive": ["automotive", "vehicle", "car", "truck", "auto"],
            "Aerospace": ["aerospace", "aircraft", "defense", "aviation"],
            "Pharmaceuticals": ["pharmaceutical", "drug", "medicine", "biopharmaceutical"],
            "Renewable Energy": ["renewable", "solar", "wind", "clean energy", "green energy"],
            "Telecommunications": ["telecom", "telecommunications", "5G", "wireless"]
        }
        
        industry_impacts = {}
        for industry, keywords in industries.items():
            mention_count = sum(1 for kw in keywords if kw in doc_lower)
            if mention_count > 0:
                industry_impacts[industry] = {
                    "mention_count": mention_count,
                    "severity": "high" if mention_count > 2 else "medium",
                    "description": f"Regulatory measures affecting {industry} industry"
                }
        
        # Socioeconomic Impact Analysis
        socioeconomic_keywords = {
            "jobs": ["job", "employment", "worker", "workforce", "labor"],
            "economy": ["economic", "economy", "GDP", "growth", "recession"],
            "trade": ["trade", "export", "import", "tariff", "trade war"],
            "consumers": ["consumer", "people", "public", "citizen", "household"],
            "environment": ["environment", "climate", "carbon", "emission", "sustainability"]
        }
        
        socioeconomic_impacts = {}
        for category, keywords in socioeconomic_keywords.items():
            mention_count = sum(1 for kw in keywords if kw in doc_lower)
            if mention_count > 0:
                socioeconomic_impacts[category] = {
                    "mention_count": mention_count,
                    "potential_impact": {
                        "jobs": "May affect employment in affected sectors",
                        "economy": "Could impact economic growth and GDP",
                        "trade": "May disrupt international trade flows",
                        "consumers": "May affect consumer prices and availability",
                        "environment": "May have environmental/climate implications"
                    }.get(category, "Potential socioeconomic impact"),
                    "severity": "high" if mention_count > 3 else "medium" if mention_count > 1 else "low"
                }
        
        # Global summary
        global_summary = {
            "overall_impact": "High" if len(sector_impacts) > 3 or len(regional_impacts) > 2 else "Medium" if len(sector_impacts) > 1 else "Low",
            "geographic_scope": list(regional_impacts.keys()) if regional_impacts else ["Global"],
            "sector_scope": list(sector_impacts.keys()) if sector_impacts else ["Multiple sectors"],
            "economic_scope": f"{len(regional_impacts)} regions, {len(sector_impacts)} sectors, {len(industry_impacts)} industries"
        }
        
        logger.info(f"   Global impact: {global_summary['overall_impact']} - {global_summary['economic_scope']}")
        
        return {
            "sector_impacts": sector_impacts,
            "regional_impacts": regional_impacts,
            "industry_impacts": industry_impacts,
            "socioeconomic_impacts": socioeconomic_impacts,
            "global_summary": global_summary,
            "affected_countries": affected_countries,
            "affected_sectors": affected_sectors
        }

