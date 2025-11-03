"""
Document Analyzer Service - Consolidated service for document analysis
Returns CompanyRisk[] and PortfolioImpact per spec
"""

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
    """Consolidated service for document analysis with portfolio impact"""
    
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
        """
        Analyze document (upload, agent query, or raw text) and return CompanyRisk[] + PortfolioImpact
        
        Args:
            portfolio: Current portfolio
            document_text: Raw document text
            file_url: URL/path to document file
            agent_query: Query string for agent to fetch document
            threshold: Cosine similarity threshold for matching
            strict_units: Only match with unit guards
            
        Returns:
            {
                "company_risks": List[CompanyRisk],
                "portfolio_impact": PortfolioImpact,
                "document_provenance": Dict,
                "calibration": CalibrationMetadata
            }
        """
        start_time = time.time()
        portfolio_size = len(portfolio.holdings) if portfolio.holdings else 0
        
        logger.info(f"Starting document analysis - Portfolio size: {portfolio_size} companies")
        logger.info(f"   Input: file_url={file_url is not None}, document_text={'yes' if document_text else 'no'}, agent_query={agent_query is not None}")
        logger.info(f"   Settings: threshold={threshold}, strict_units={strict_units}")
        
        # Step 1: Get document text (from upload, agent query, or provided)
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
        
        # Step 2: Analyze document using regulatory analyzer
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
        
        # Step 3: Get calibration weights
        step_start = time.time()
        logger.info("Step 3: Loading calibration weights...")
        calibration = CalibrationService.get_calibrated_weights()
        logger.info(f"   Calibration loaded: n_samples={calibration.n_samples}, confidence={calibration.confidence}")
        logger.debug(f"   Step 3 time: {time.time() - step_start:.2f}s")
        
        # Step 4: Calculate document sentiment using NLP
        step_start = time.time()
        logger.info("Step 4: Calculating document sentiment using NLP...")
        try:
            sentiment_score = DocumentAnalyzerService._calculate_document_sentiment(doc_text)
            step_time = time.time() - step_start
            logger.info(f"   Document sentiment calculated: {sentiment_score:.1f}/100 (took {step_time:.2f}s)")
            logger.debug(f"   Step 4 time: {step_time:.2f}s")
        except Exception as e:
            step_time = time.time() - step_start
            logger.error(f"   ERROR in Step 4 after {step_time:.2f}s: {str(e)}", exc_info=True)
            # Don't fail completely, use neutral sentiment
            logger.warning("   Using fallback neutral sentiment (50.0)")
            sentiment_score = 50.0
        
        # Step 5: For each ticker in portfolio, calculate CompanyRisk
        # OPTIMIZATION: For large portfolios, analyze a sample for speed
        # User can choose how many companies to analyze (default: 50)
        step_start = time.time()
        portfolio_holdings = portfolio.holdings
        MAX_COMPANIES_TO_ANALYZE = max_companies if max_companies else 50  # User-configurable, default 50
        SAMPLE_SIZE = min(MAX_COMPANIES_TO_ANALYZE, portfolio_size)
        
        logger.info(f"Step 5: Calculating company risks for {SAMPLE_SIZE} companies (sampled from {portfolio_size} total)...")
        
        # Select companies to analyze:
        # 1. Top 20 by weight (if weighted portfolio)
        # 2. Random sample of remaining companies
        import random
        tickers_list = list(portfolio_holdings.keys())
        selected_tickers = set()
        
        # Get top 20 by weight
        if portfolio_holdings:
            sorted_by_weight = sorted(
                tickers_list,
                key=lambda t: portfolio_holdings.get(t, 0),
                reverse=True
            )[:20]
            selected_tickers.update(sorted_by_weight)
        
        # Fill remaining slots with random sample
        remaining_tickers = [t for t in tickers_list if t not in selected_tickers]
        if remaining_tickers:
            random_sample = random.sample(
                remaining_tickers,
                min(SAMPLE_SIZE - len(selected_tickers), len(remaining_tickers))
            )
            selected_tickers.update(random_sample)
        
        selected_tickers = list(selected_tickers)[:SAMPLE_SIZE]
        logger.info(f"   Selected {len(selected_tickers)} companies for analysis (top weighted + random sample)")
        
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
                
                # Log progress more frequently for visibility
                if processed % 10 == 0 or ticker_time > 1.0:
                    logger.info(f"   Progress: {processed}/{SAMPLE_SIZE} companies processed (last: {ticker}, score: {company_risk.total_score:.1f}, time: {ticker_time:.2f}s)")
                elif ticker_time > 3.0:
                    # Warn if a single company takes more than 3 seconds (reduced from 5)
                    logger.warning(f"   WARNING: {ticker} took {ticker_time:.2f}s to process (may be slow)")
                
                # Skip companies that take too long (>5 seconds) - too expensive
                if ticker_time > 10.0:
                    logger.warning(f"   Skipping remaining companies if they take >10s each. {ticker} took {ticker_time:.2f}s")
            except Exception as e:
                ticker_time = time.time() - ticker_start
                logger.error(f"   ERROR processing {ticker} after {ticker_time:.2f}s: {str(e)}")
                # Continue with next ticker instead of failing completely
                processed += 1
                # Add a default risk for this ticker
                from app.models.types import CompanyRisk, RiskComponent
                company_risks.append(CompanyRisk(
                    ticker=ticker,
                    total_score=50.0,
                    components=[RiskComponent(name="Error", score=50.0, evidence=None)],
                    price_impact_bps=0.0
                ))
        
        # For companies not analyzed, add default low-risk entries
        analyzed_tickers = {risk.ticker for risk in company_risks}
        for ticker in portfolio_holdings.keys():
            if ticker not in analyzed_tickers:
                from app.models.types import CompanyRisk, RiskComponent
                company_risks.append(CompanyRisk(
                    ticker=ticker,
                    total_score=25.0,  # Default low risk for unanalyzed companies
                    components=[RiskComponent(name="NotAnalyzed", score=25.0, evidence="Sampled analysis")],
                    price_impact_bps=0.0
                ))
        
        logger.info(f"   Company risks calculated: {processed} companies analyzed in detail, {portfolio_size - processed} assigned default scores")
        logger.info(f"   Step 5 total time: {time.time() - step_start:.2f}s (avg: {(time.time() - step_start)/max(processed,1):.3f}s per analyzed company)")
        
        # Step 6: Calculate global/macro impact analysis
        step_start = time.time()
        logger.info("Step 6: Calculating global/macro impact analysis...")
        global_impact = DocumentAnalyzerService._calculate_global_impact(
            document_text=doc_text,
            regulation_data=regulation_data,
            company_risks=company_risks,
            portfolio=portfolio
        )
        logger.info(f"   Global impact analysis complete")
        logger.debug(f"   Step 6 time: {time.time() - step_start:.2f}s")
        
        # Step 7: Calculate portfolio-level impact
        step_start = time.time()
        logger.info("Step 7: Calculating portfolio-level impact...")
        portfolio_impact = DocumentAnalyzerService._calculate_portfolio_impact(
            portfolio=portfolio,
            company_risks=company_risks
        )
        delta_return = portfolio_impact.delta_return_bps
        logger.info(f"   Portfolio impact calculated: DeltaReturn = {delta_return:.1f} bps")
        logger.debug(f"   Step 7 time: {time.time() - step_start:.2f}s")
        
        # Step 8: Update provenance with sentiment info
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
        """
        Get document text from various sources
        
        Returns:
            (document_text, provenance_dict)
        """
        provenance = {
            "source": None,
            "file_url": file_url,
            "agent_query": agent_query,
            "extraction_method": None
        }
        
        # Priority 1: Provided document text
        if document_text:
            logger.debug("   Using provided document text (direct input)")
            provenance["source"] = "provided_text"
            provenance["extraction_method"] = "direct"
            return document_text, provenance
        
        # Priority 2: File upload
        if file_url:
            logger.debug(f"   Attempting to parse file from URL: {file_url}")
            try:
                # Handle different URL formats
                file_path = None
                
                # Handle relative paths from uploads directory
                if file_url.startswith('/uploads/'):
                    file_path = file_url.replace('/uploads/', 'uploads/')
                    logger.debug(f"   Detected uploads path: {file_path}")
                # Handle S3 URLs (for AWS uploads)
                elif file_url.startswith('http://') or file_url.startswith('https://'):
                    logger.warning(f"   S3 URL detected but download not yet implemented: {file_url}")
                    # For S3 URLs, we would need to download first
                    # For now, check if it's a local path that was returned as URL
                    provenance["source"] = "file_upload"
                    provenance["extraction_method"] = "s3_url"
                    provenance["error"] = "S3 URL download not yet implemented"
                    return None, provenance
                # Handle direct file paths
                else:
                    file_path = file_url
                    logger.debug(f"   Using direct file path: {file_path}")
                
                # Try to find file in various locations
                if not file_path or not os.path.exists(file_path):
                    logger.debug(f"   File not found at {file_path}, trying alternative paths...")
                    # Try common paths
                    possible_paths = [
                        file_path,
                        os.path.join('uploads', os.path.basename(file_url)),
                        os.path.join('backend', 'uploads', os.path.basename(file_url)),
                        file_url.replace('/uploads/', 'uploads/') if '/' in file_url else None
                    ]
                    
                    for path in possible_paths:
                        if path and os.path.exists(path):
                            file_path = path
                            logger.debug(f"   Found file at: {file_path}")
                            break
                
                # Parse file if found
                if file_path and os.path.exists(file_path):
                    file_ext = os.path.splitext(file_path)[1].lower()
                    file_size = os.path.getsize(file_path)
                    logger.debug(f"   Parsing {file_ext} file ({file_size:,} bytes)...")
                    doc_text, file_format = DocumentParser.parse_file(file_path)
                    provenance["source"] = "file_upload"
                    provenance["file_format"] = file_format
                    provenance["extraction_method"] = f"DocumentParser.{file_format}"
                    provenance["file_path"] = file_path
                    logger.debug(f"   File parsed successfully: {len(doc_text):,} chars extracted")
                    return doc_text, provenance
                else:
                    error_msg = f"File not found: {file_url}"
                    logger.error(f"   ERROR: {error_msg}")
                    provenance["error"] = error_msg
                    
            except Exception as e:
                error_msg = str(e)
                logger.error(f"   ERROR parsing file: {error_msg}")
                provenance["error"] = error_msg
        
        # Priority 3: Agent query
        if agent_query:
            logger.debug(f"   Using agent query: {agent_query[:50]}...")
            try:
                # Use SearXNG service to fetch document
                logger.debug("   Searching with SearXNG...")
                search_results = SearXNGService.search(agent_query, num_results=5)
                if search_results and len(search_results) > 0:
                    logger.debug(f"   Found {len(search_results)} search results")
                    # Get first result (could be enhanced to select best result)
                    result = search_results[0]
                    url = result.get("url", "")
                    
                    # Try to fetch and parse
                    # (This would need web scraping implementation)
                    # For now, return the query as text
                    provenance["source"] = "agent_query"
                    provenance["search_results"] = len(search_results)
                    provenance["extraction_method"] = "SearXNG_search"
                    logger.warning("   WARNING: Agent query: actual document fetching not yet implemented, using query as text")
                    # TODO: Implement actual document fetching from URL
                    return agent_query, provenance
                else:
                    logger.warning("   WARNING: No search results found for agent query")
            except Exception as e:
                error_msg = str(e)
                logger.error(f"   ERROR with agent query: {error_msg}")
                provenance["error"] = error_msg
        
        logger.warning("   WARNING: No document text obtained from any source")
        return None, provenance
    
    @staticmethod
    def _calculate_document_sentiment(document_text: str) -> float:
        """
        Calculate sentiment score from document text using NLP (OPTIMIZED for speed)
        
        Returns a sentiment score in the range [0, 100] where:
        - 0-30: Very negative sentiment (high risk)
        - 30-50: Negative sentiment
        - 50: Neutral sentiment
        - 50-70: Positive sentiment
        - 70-100: Very positive sentiment (low risk)
        
        For risk scoring, we invert: negative sentiment = high risk score
        """
        try:
            # OPTIMIZATION: Sample document text for faster analysis (first 50k chars)
            text_sample = document_text[:50000] if len(document_text) > 50000 else document_text
            
            logger.debug("   Extracting sentences for sentiment analysis (sampled for speed)...")
            # Use NLPQuantStrategy to analyze sentiment
            sentences = NLPQuantStrategy._extract_sentences(text_sample)
            logger.debug(f"   Extracted {len(sentences)} sentences")
            
            # OPTIMIZATION: Limit to first 100 sentences for faster analysis
            if len(sentences) > 100:
                sentences = sentences[:100]
                logger.debug(f"   Limited to first 100 sentences for speed")
            
            logger.debug("   Running NLP sentiment analysis (VADER/FinBERT - optimized)...")
            sentiment_results = NLPQuantStrategy._analyze_financial_sentiment(text_sample, sentences)
            
            # Extract overall sentiment score
            # VADER compound score ranges from -1 (negative) to +1 (positive)
            overall_sentiment = sentiment_results.get("overall_sentiment", 0.0)
            uncertainty_score = sentiment_results.get("uncertainty_score", 0.0)
            
            logger.debug(f"   Raw sentiment scores: overall={overall_sentiment:.3f}, uncertainty={uncertainty_score:.1f}")
            
            # Convert from [-1, 1] range to [0, 100] risk score
            # Negative sentiment (toward -1) = higher risk score (toward 100)
            # Positive sentiment (toward +1) = lower risk score (toward 0)
            # Formula: risk_score = 50 - (sentiment * 50), then clip to [0, 100]
            risk_score = max(0.0, min(100.0, 50.0 - (overall_sentiment * 50.0)))
            
            # Also consider uncertainty - higher uncertainty increases risk
            if uncertainty_score > 30:  # High uncertainty
                adjustment = (uncertainty_score - 30) * 0.3
                risk_score = min(100.0, risk_score + adjustment)
                logger.debug(f"   Adjusted for high uncertainty (+{adjustment:.1f})")
            
            logger.debug(f"   Final sentiment risk score: {risk_score:.1f}/100")
            return float(risk_score)
        except Exception as e:
            # Fallback: return neutral risk score if sentiment analysis fails
            logger.error(f"   ERROR calculating sentiment: {e}", exc_info=True)
            logger.warning("   Using fallback neutral sentiment score: 50.0")
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
        """
        Calculate CompanyRisk for a single ticker
        
        Args:
            ticker: Company ticker symbol
            regulation_data: Regulatory analysis results
            calibration: Calibration weights
            sentiment_score: Overall document sentiment risk score [0, 100]
            document_text: Full document text for company-specific analysis
            threshold: Cosine similarity threshold
            strict_units: Only match with unit guards
        """
        # Get company data (from 10-K parser or fallback)
        company_data = DocumentAnalyzerService._get_company_data(ticker)
        has_10k = "business_description_full" in company_data and company_data.get("business_description_full")
        
        # Calculate impact using ImpactModeler
        impact_result = ImpactModeler.calculate_company_impact(
            regulation_data=regulation_data,
            company_data=company_data
        )
        
        supply_chain = impact_result.get("supply_chain_risk", 50.0)
        geo_exposure = impact_result.get("geographic_exposure", 50.0)
        measure_match = impact_result.get("measure_impact", 50.0)
        
        # Calculate company-specific sentiment if possible
        # This could be enhanced to find mentions of the specific company in the document
        company_sentiment_score = DocumentAnalyzerService._calculate_company_specific_sentiment(
            ticker=ticker,
            document_text=document_text,
            base_sentiment=sentiment_score,
            company_data=company_data
        )
        
        # Build risk components
        components = [
            RiskComponent(
                name="SupplyChain",
                score=impact_result.get("supply_chain_risk", 50.0),
                evidence=None  # TODO: Add evidence spans
            ),
            RiskComponent(
                name="GeoExposure",
                score=impact_result.get("geographic_exposure", 50.0),
                evidence=None  # TODO: Add evidence spans
            ),
            RiskComponent(
                name="MeasureMatch",
                score=impact_result.get("measure_impact", 50.0),
                evidence=None  # TODO: Add evidence spans
            ),
            RiskComponent(
                name="SentimentRisk",
                score=company_sentiment_score,  # Use calculated sentiment score
                evidence=None
            )
        ]
        
        # Calculate total score using calibration
        component_scores = [c.score for c in components]
        total_score, _ = CalibrationService.calculate_total_score(
            components=component_scores,
            calibration=calibration
        )
        
        # Calculate price impact (with uncertainty-based k factor)
        price_impact_bps = DocumentAnalyzerService._calculate_price_impact(
            total_score=total_score,
            components=components,
            calibration=calibration
        )
        
        logger.debug(f"   {ticker}: score={total_score:.1f}, sentiment={company_sentiment_score:.1f}, impact={price_impact_bps:.1f}bps")
        
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
        """
        Calculate company-specific sentiment score
        
        This looks for mentions of the company name or ticker in the document
        and adjusts the sentiment score accordingly.
        
        Args:
            ticker: Company ticker symbol
            document_text: Full document text
            base_sentiment: Base sentiment score from overall document
            company_data: Company information including name
            
        Returns:
            Company-specific sentiment risk score [0, 100]
        """
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
                logger.debug(f"   {ticker}: No mentions found, using base sentiment")
                return base_sentiment
            
            logger.debug(f"   {ticker}: Found {total_mentions} mentions (ticker: {ticker_mentions}, name: {name_mentions})")
            
            # If company is mentioned, analyze those specific sections
            if total_mentions > 0:
                # Extract sentences mentioning the company
                sentences = NLPQuantStrategy._extract_sentences(document_text)
                company_sentences = []
                
                for sentence in sentences:
                    sentence_lower = sentence.lower()
                    if ticker.lower() in sentence_lower or any(
                        word in sentence_lower for word in company_name.lower().split() if len(word) > 3
                    ):
                        company_sentences.append(sentence)
                
                # Analyze sentiment of company-specific sentences
                if company_sentences:
                    logger.debug(f"   {ticker}: Analyzing {min(20, len(company_sentences))} company-specific sentences")
                    company_text = " ".join(company_sentences[:20])  # Limit to first 20 mentions
                    company_sentiment = NLPQuantStrategy._analyze_financial_sentiment(
                        company_text, company_sentences[:20]
                    )
                    company_overall = company_sentiment.get("overall_sentiment", 0.0)
                    
                    # Convert to risk score
                    company_risk = max(0.0, min(100.0, 50.0 - (company_overall * 50.0)))
                    
                    # Blend base sentiment (60%) with company-specific sentiment (40%)
                    blended_score = base_sentiment * 0.6 + company_risk * 0.4
                    logger.debug(f"   {ticker}: Company-specific sentiment: {company_risk:.1f}, blended: {blended_score:.1f}")
                    return float(blended_score)
            
            # If no specific mentions, use base sentiment
            return base_sentiment
            
        except Exception as e:
            # Fallback to base sentiment if analysis fails
            logger.warning(f"   {ticker}: Error calculating company-specific sentiment: {e}")
            return base_sentiment
    
    @staticmethod
    def _get_company_data(ticker: str) -> Dict:
        """
        Get company data from 10-K parser or fallback
        """
        # Try to find and parse 10-K filing
        from app.routers.stocks import find_filings_for_ticker, get_filing_content
        
        try:
            filings = find_filings_for_ticker(ticker)
            for filing in filings:
                if '10-k' in filing.get('filename', '').lower():
                    filing_content = get_filing_content(filing['path'], max_length=None)
                    if filing_content:
                        # Parse 10-K
                        tenk_data = TenKParser.parse_tenk(filing_content, ticker)
                        
                        # Convert to company_data format
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
        
        # Fallback: return minimal company data
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
        """
        Calculate price impact in basis points with uncertainty-based k factor
        """
        # Calculate uncertainty from components
        uncertainties = [c.ucb95 - c.score if c.ucb95 else 0.0 for c in components]
        avg_uncertainty = np.mean(uncertainties) if uncertainties else 50.0
        
        # Map uncertainty decile to k factor [0.5, 1.0]
        uncertainty_decile = min(10, max(1, int(avg_uncertainty / 10)))
        k_factor = 0.5 + (uncertainty_decile / 10) * 0.5
        
        # Base impact: k * total_score
        price_impact_bps = k_factor * total_score * 10  # Scale to basis points
        
        return float(price_impact_bps)
    
    @staticmethod
    def _calculate_portfolio_impact(
        portfolio: Portfolio,
        company_risks: List[CompanyRisk]
    ) -> PortfolioImpact:
        """
        Calculate portfolio-level impact
        """
        holdings = portfolio.holdings
        
        # Calculate weighted portfolio impact
        total_delta_return_bps = 0.0
        worst_offenders = []
        
        # Build risk map
        risk_map = {risk.ticker: risk for risk in company_risks}
        
        for ticker, weight in holdings.items():
            if ticker in risk_map:
                risk = risk_map[ticker]
                price_impact = risk.price_impact_bps or 0.0
                
                # Weighted contribution
                contribution = weight * price_impact
                total_delta_return_bps += contribution
                
                # Track worst offenders
                worst_offenders.append({
                    "ticker": ticker,
                    "score": risk.total_score,
                    "weight": weight,
                    "impact_bps": price_impact
                })
        
        # Sort by score descending
        worst_offenders.sort(key=lambda x: x["score"], reverse=True)
        worst_offenders = worst_offenders[:5]  # Top 5
        
        # Calculate percentiles (P5, P50, P95) from Monte Carlo or empirical
        # For now, use simple estimates
        p50 = total_delta_return_bps
        uncertainty = abs(total_delta_return_bps * 0.3)  # 30% uncertainty
        p5 = p50 - uncertainty * 1.645  # Approximate 5th percentile
        p95 = p50 + uncertainty * 1.645  # Approximate 95th percentile
        
        # Collect evidence for top offenders
        evidences = {}
        for offender in worst_offenders[:3]:  # Top 3 only
            ticker = offender["ticker"]
            if ticker in risk_map:
                risk = risk_map[ticker]
                # Collect evidence from components
                ticker_evidences = []
                for component in risk.components:
                    if component.evidence:
                        ticker_evidences.extend(component.evidence)
                if ticker_evidences:
                    evidences[ticker] = ticker_evidences
        
        return PortfolioImpact(
            delta_return_bps=float(total_delta_return_bps),
            delta_vol_bps=None,  # TODO: Calculate volatility change
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
        """
        Calculate global/macro impact analysis:
        - Sector-level impacts
        - Regional/geographic impacts
        - Industry impacts
        - Socioeconomic impacts (jobs, people, economy)
        """
        logger = logging.getLogger(__name__)
        logger.info("   Analyzing global/macro impacts...")
        
        # Extract regulation entities
        affected_countries = regulation_data.get("entities", {}).get("countries", [])
        affected_sectors = regulation_data.get("entities", {}).get("sectors", [])
        measures = regulation_data.get("measures", [])
        
        # Sector Analysis
        sector_impacts = {}
        holdings = portfolio.holdings or {}
        
        # Map companies to sectors (simplified - in production would use real sector data)
        sector_keywords = {
            "Technology": ["technology", "software", "tech", "semiconductor", "cloud", "internet"],
            "Healthcare": ["healthcare", "pharmaceutical", "biotech", "medical", "drug"],
            "Finance": ["financial", "banking", "insurance", "finance", "investment"],
            "Energy": ["energy", "oil", "gas", "renewable", "petroleum"],
            "Consumer": ["consumer", "retail", "consumer goods", "products"],
            "Industrial": ["industrial", "manufacturing", "automotive", "machinery"],
            "Communication": ["communication", "telecom", "media", "telecommunications"]
        }
        
        # Analyze document for sector mentions
        doc_lower = document_text.lower()
        for sector, keywords in sector_keywords.items():
            mention_count = sum(1 for kw in keywords if kw in doc_lower)
            if mention_count > 0:
                # Calculate average risk for companies in this sector (if we have sector data)
                sector_impacts[sector] = {
                    "mention_count": mention_count,
                    "severity": "high" if mention_count > 3 else "medium" if mention_count > 1 else "low",
                    "keywords_found": [kw for kw in keywords if kw in doc_lower],
                    "estimated_impact": "Significant regulatory exposure" if mention_count > 2 else "Moderate regulatory exposure"
                }
        
        # Regional/Geographic Analysis
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

