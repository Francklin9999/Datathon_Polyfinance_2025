"""
Market Research Service
AI-powered web research to identify risks and opportunities for stocks
Uses cached NLP analysis data when available
"""

from typing import Dict, List, Optional
from datetime import datetime
from pathlib import Path
import json
import re

from app.services.searxng_service import SearXNGService
from app.services.nlp_quant_strategy import NLPQuantStrategy
from app.routers.stocks import find_filings_for_ticker, get_filing_content
from app.services.aws_bedrock_service import BedrockService
from app.services.aws_config import is_aws_configured
from app.services.web_scraper_service import WebScraperService


class MarketResearchService:
    """Service for conducting AI-powered market research on stocks"""
    
    RISK_KEYWORDS = [
        "risk", "lawsuit", "litigation", "regulation", "regulatory", "ban", "sanction",
        "violation", "fraud", "investigation", "scandal", "crisis", "bankruptcy",
        "decline", "loss", "downgrade", "warning", "alert", "concern", "threat",
        "uncertainty", "volatility", "headwind", "pressure", "challenge", "problem",
        "issue", "delay", "shortage", "disruption", "recall", "safety", "quality"
    ]
    
    OPPORTUNITY_KEYWORDS = [
        "growth", "opportunity", "expansion", "acquisition", "merger", "partnership",
        "innovation", "breakthrough", "milestone", "achievement", "success", "profit",
        "gain", "surge", "rally", "boom", "strong", "robust", "leading", "dominant",
        "premium", "upside", "bullish", "optimistic", "confidence", "advantage"
    ]
    
    @staticmethod
    async def research_stock(
        ticker: str,
        company_name: Optional[str] = None,
        max_results: int = 20,
        include_filings: bool = True
    ) -> Dict:
        """
        Conduct comprehensive market research on a stock using web search and AI analysis
        
        Args:
            ticker: Stock ticker symbol
            company_name: Optional company name (will be fetched if not provided)
            max_results: Maximum number of web search results to analyze
            include_filings: Whether to include 10-K/10-Q filing analysis
            
        Returns:
            Dictionary with research findings including risks, opportunities, sentiment, etc.
        """
        ticker = ticker.upper()
        
        # Initialize results
        research_results = {
            "ticker": ticker,
            "company_name": company_name or f"{ticker} Inc.",
            "research_date": datetime.now().isoformat(),
            "risks": [],
            "opportunities": [],
            "sentiment": {},
            "key_findings": [],
            "sources": [],
            "filing_analysis": None,
            "risk_score": 0.0,
            "recommendation": "NEUTRAL"
        }
        
        # 1. Get company name from filings if not provided
        if not company_name:
            try:
                filings = find_filings_for_ticker(ticker)
                if filings:
                    # Try to extract company name from first filing
                    filing_content = get_filing_content(filings[0]['path'], max_length=10000)
                    if filing_content:
                        # Extract company name from filing (usually in first few paragraphs)
                        name_match = re.search(r'Company Name[:]\s*([A-Za-z0-9\s,&.-]+)', filing_content[:5000], re.IGNORECASE)
                        if name_match:
                            research_results["company_name"] = name_match.group(1).strip()
            except Exception as e:
                print(f"Warning: Could not fetch company name for {ticker}: {e}")
        
        # 2. Generate search queries using Amazon Bedrock
        search_queries = MarketResearchService._generate_search_queries(
            ticker,
            research_results['company_name']
        )
        
        # 3. Search using SearXNG and extract content from pages
        all_results = []
        scraped_content_list = []
        
        for query in search_queries[:10]:  # Limit to 10 queries
            try:
                # Search with SearXNG
                search_result = SearXNGService.search(query, max_results=5)
                if search_result and search_result.get('success') and search_result.get('results'):
                    results = search_result['results']
                    all_results.extend(results)
                    
                    # Extract full content from top 3 results per query
                    for result in results[:3]:
                        url = result.get('url', '')
                        if url:
                            try:
                                scraped = WebScraperService.scrape_url(url, timeout=10.0)
                                if scraped.get('success') and scraped.get('content'):
                                    scraped_content_list.append(scraped)
                                    # Enhance result with scraped content
                                    result['full_content'] = scraped.get('content', '')[:5000]  # Limit content length
                            except Exception as e:
                                print(f"Warning: Could not scrape {url}: {e}")
                                continue
            except Exception as e:
                print(f"Warning: Web search failed for query '{query}': {e}")
        
        # Deduplicate results by URL
        seen_urls = set()
        unique_results = []
        for result in all_results:
            url = result.get('url', '')
            if url and url not in seen_urls:
                seen_urls.add(url)
                unique_results.append(result)
        
        # Limit to max_results
        unique_results = unique_results[:max_results]
        research_results["sources"] = unique_results
        
        # 4. Use Bedrock to analyze scraped content and generate quantitative research
        if scraped_content_list and is_aws_configured():
            try:
                quantitative_analysis = MarketResearchService._generate_quantitative_research(
                    ticker,
                    research_results['company_name'],
                    scraped_content_list,
                    unique_results
                )
                research_results["quantitative_analysis"] = quantitative_analysis
            except Exception as e:
                print(f"Warning: Could not generate quantitative analysis: {e}")
        
        # 5. Analyze search results for risks and opportunities
        # NOTE: These will be overridden by filing analysis if available
        # Keep web search results as backup
        web_risks = []
        web_opportunities = []
        sentiment_scores = []
        web_key_findings = []
        
        for result in unique_results:
            title = result.get('title', '')
            snippet = result.get('snippet', '') or result.get('content', '')  # SearXNG uses 'content' instead of 'snippet'
            url = result.get('url', '')
            text = f"{title} {snippet}".lower()
            
            # Check for risk keywords
            risk_score = sum(1 for keyword in MarketResearchService.RISK_KEYWORDS if keyword in text)
            if risk_score > 0:
                # Extract risk context
                risk_context = MarketResearchService._extract_risk_context(title, snippet)
                web_risks.append({
                    "title": title,
                    "snippet": snippet,
                    "url": url,
                    "risk_score": risk_score,
                    "context": risk_context,
                    "detected_keywords": [kw for kw in MarketResearchService.RISK_KEYWORDS if kw in text],
                    "timestamp": result.get('timestamp', datetime.now().isoformat()),
                    "source": "Web Search"
                })
            
            # Check for opportunity keywords
            opportunity_score = sum(1 for keyword in MarketResearchService.OPPORTUNITY_KEYWORDS if keyword in text)
            if opportunity_score > 0:
                web_opportunities.append({
                    "title": title,
                    "snippet": snippet,
                    "url": url,
                    "opportunity_score": opportunity_score,
                    "detected_keywords": [kw for kw in MarketResearchService.OPPORTUNITY_KEYWORDS if kw in text],
                    "timestamp": result.get('timestamp', datetime.now().isoformat()),
                    "source": "Web Search"
                })
            
            # Calculate sentiment
            sentiment = MarketResearchService._calculate_sentiment(title, snippet)
            sentiment_scores.append(sentiment)
            
            # Extract key findings
            if risk_score > 2 or opportunity_score > 2:
                web_key_findings.append({
                    "title": title,
                    "summary": snippet[:200],
                    "url": url,
                    "type": "RISK" if risk_score > 2 else "OPPORTUNITY",
                    "timestamp": result.get('timestamp', datetime.now().isoformat()),
                    "source": "Web Search"
                })
        
        # Sort web risks and opportunities by score
        web_risks.sort(key=lambda x: x['risk_score'], reverse=True)
        web_opportunities.sort(key=lambda x: x['opportunity_score'], reverse=True)
        
        # Store web results as backup (will be overridden by filing analysis if available)
        research_results["_web_risks"] = web_risks[:10]  # Top 10 web risks (backup)
        research_results["_web_opportunities"] = web_opportunities[:10]  # Top 10 web opportunities (backup)
        research_results["_web_key_findings"] = web_key_findings  # Web key findings (backup)
        
        # 6. Calculate overall sentiment
        if sentiment_scores:
            avg_sentiment = sum(sentiment_scores) / len(sentiment_scores)
            research_results["sentiment"] = {
                "compound": avg_sentiment,
                "positive": len([s for s in sentiment_scores if s > 0.1]),
                "negative": len([s for s in sentiment_scores if s < -0.1]),
                "neutral": len([s for s in sentiment_scores if -0.1 <= s <= 0.1])
            }
        
        # 7. Calculate risk score (0-100, higher is riskier)
        total_risk_points = sum(r['risk_score'] for r in web_risks)
        total_opportunity_points = sum(o['opportunity_score'] for o in web_opportunities)
        
        if total_risk_points + total_opportunity_points > 0:
            risk_score = (total_risk_points / (total_risk_points + total_opportunity_points)) * 100
        else:
            risk_score = 50.0  # Neutral if no signals
        
        research_results["risk_score"] = min(100.0, max(0.0, risk_score))
        
        # 8. Generate recommendation
        if research_results["risk_score"] > 70:
            research_results["recommendation"] = "HIGH_RISK"
        elif research_results["risk_score"] > 50:
            research_results["recommendation"] = "MODERATE_RISK"
        elif research_results["risk_score"] > 30:
            research_results["recommendation"] = "LOW_RISK"
        else:
            research_results["recommendation"] = "LOW_RISK"
        
        # Adjust based on opportunities
        if total_opportunity_points > total_risk_points * 1.5:
            if research_results["recommendation"] == "HIGH_RISK":
                research_results["recommendation"] = "MODERATE_RISK"
            elif research_results["recommendation"] == "MODERATE_RISK":
                research_results["recommendation"] = "LOW_RISK"
        
        # 9. Analyze 10-K/10-Q filing if available (using cached data when possible)
        # Initialize filing_based_data as empty dict - will always be populated if filing exists
        filing_based_data = {}
        filing_analysis = None
        
        if include_filings:
            try:
                filing_analysis = MarketResearchService._analyze_filings(ticker)
                if filing_analysis:
                    research_results["filing_analysis"] = filing_analysis
                
                # 10. Extract risks, opportunities, and key findings from SEC filing using RAG (primary method)
                # This uses RAG with Amazon Bedrock to analyze SEC filings directly from disk
                cached_nlp_data = MarketResearchService._load_cached_nlp_analysis(ticker)
                
                # Use RAG with Bedrock as primary method, falls back to cached NLP data
                filing_based_data = MarketResearchService._extract_from_filing_analysis(
                    cached_nlp_data or {},  # Pass empty dict if no cached data
                    ticker,
                    research_results.get("company_name", ticker)
                )
                
                # ALWAYS override with filing-derived data (filing analysis is PRIMARY source)
                # This ensures risks, opportunities, and key findings ALWAYS come from SEC filing analysis
                # Filing analysis takes priority over web search results
                research_results["risks"] = filing_based_data.get("risks", [])
                research_results["opportunities"] = filing_based_data.get("opportunities", [])
                research_results["key_findings"] = filing_based_data.get("key_findings", [])
                
                # Enhance NLP data if cached data is available
                if cached_nlp_data:
                    # Generate LLM-enhanced descriptions for better presentation
                    enhanced_nlp_data = MarketResearchService._enhance_nlp_with_descriptions(
                        cached_nlp_data,
                        ticker,
                        research_results.get("company_name", ticker)
                    )
                    research_results["nlp_analysis"] = enhanced_nlp_data
                
                print(f"[INFO] Derived {len(research_results['risks'])} risks, {len(research_results['opportunities'])} opportunities, {len(research_results['key_findings'])} key findings from SEC filing analysis (RAG)")
                
                # Enhance recommendation with NLP signals
                if cached_nlp_data and cached_nlp_data.get("analysis") and cached_nlp_data["analysis"].get("trading_signals"):
                    trading_signals = cached_nlp_data["analysis"]["trading_signals"]
                    nlp_recommendation = trading_signals.get("recommendation", "HOLD")
                    nlp_score = cached_nlp_data["analysis"].get("strategy_score", 0)
                    
                    # Use NLP recommendation as primary if strong signal
                    if abs(nlp_score) > 0.3:  # Strong NLP signal
                        research_results["nlp_recommendation"] = nlp_recommendation
                        research_results["nlp_confidence"] = trading_signals.get("confidence", 0.5)
                        # Use NLP-based risk score from filing analysis if available
                        if filing_based_data.get("risk_score") is not None:
                            research_results["risk_score"] = filing_based_data["risk_score"]
                        # Adjust overall recommendation based on NLP
                        research_results["recommendation"] = MarketResearchService._derive_recommendation_from_nlp(
                            nlp_recommendation,
                            nlp_score,
                            filing_based_data.get("risk_score", research_results["risk_score"])
                        )
            except Exception as e:
                print(f"Warning: Could not analyze filings for {ticker}: {e}")
                import traceback
                traceback.print_exc()
        
        # 12. Ensure we always have filing analysis data, even if extraction failed
        # Fallback: Try to get at least basic filing analysis
        if include_filings and not research_results.get("filing_analysis") and not filing_analysis:
            try:
                # Try one more time to get filing analysis
                filing_analysis = MarketResearchService._analyze_filings(ticker)
                if filing_analysis:
                    research_results["filing_analysis"] = filing_analysis
            except Exception as e:
                print(f"Warning: Final attempt to get filing analysis failed for {ticker}: {e}")
        
        # 13. Ensure risks, opportunities, and key findings are always present from filing analysis
        # If filing analysis didn't provide them, use empty lists (not web search results)
        # This ensures filing analysis is ALWAYS the source
        if not research_results.get("risks"):
            research_results["risks"] = []
        if not research_results.get("opportunities"):
            research_results["opportunities"] = []
        if not research_results.get("key_findings"):
            research_results["key_findings"] = []
        
        # Ensure filing_analysis is always present
        if include_filings and not research_results.get("filing_analysis"):
            # Create minimal filing analysis structure
            research_results["filing_analysis"] = {
                "filing_date": "unknown",
                "cached": False,
                "sentiment_score": 0.0,
                "risk_factors_count": 0,
                "forward_looking_statements_count": 0,
                "note": "Filing analysis not available"
            }
        
        return research_results
    
    @staticmethod
    def _extract_risk_context(title: str, snippet: str) -> str:
        """Extract risk context from title and snippet"""
        text = f"{title} {snippet}"
        
        # Try to find risk-related sentences
        sentences = re.split(r'[.!?]+', text)
        risk_sentences = [
            s.strip() for s in sentences
            if any(kw in s.lower() for kw in MarketResearchService.RISK_KEYWORDS)
        ]
        
        if risk_sentences:
            return risk_sentences[0][:300]  # First risk sentence, truncated
        
        return snippet[:300]  # Fallback to snippet
    
    @staticmethod
    def _calculate_sentiment(title: str, snippet: str) -> float:
        """Calculate sentiment score (-1 to 1) for text"""
        text = f"{title} {snippet}".lower()
        
        # Simple sentiment calculation based on keywords
        positive_count = sum(1 for kw in MarketResearchService.OPPORTUNITY_KEYWORDS if kw in text)
        negative_count = sum(1 for kw in MarketResearchService.RISK_KEYWORDS if kw in text)
        
        total = positive_count + negative_count
        if total == 0:
            return 0.0
        
        # Normalize to -1 to 1 range
        sentiment = (positive_count - negative_count) / max(total, 1)
        return sentiment
    
    @staticmethod
    def _load_cached_nlp_analysis(ticker: str) -> Optional[Dict]:
        """
        Load cached NLP analysis from disk if available
        
        Args:
            ticker: Stock ticker symbol
            
        Returns:
            Cached NLP analysis data if found, None otherwise
        """
        try:
            ticker = ticker.upper()
            # Path to data folder: project_root/data/nlp_cache/{TICKER}.json
            project_root = Path(__file__).parent.parent.parent
            cache_file = project_root / "data" / "nlp_cache" / f"{ticker}.json"
            
            if cache_file.exists():
                with open(cache_file, 'r', encoding='utf-8') as f:
                    cached_data = json.load(f)
                    return cached_data
            else:
                return None
        except Exception as e:
            print(f"Warning: Could not load cached NLP analysis for {ticker}: {e}")
            return None
    
    @staticmethod
    def _enhance_nlp_with_descriptions(nlp_data: Dict, ticker: str, company_name: str) -> Dict:
        """
        Enhance NLP analysis data with LLM-generated descriptions using SEC filing content
        
        Args:
            nlp_data: Cached NLP analysis data
            ticker: Stock ticker symbol
            company_name: Company name
            
        Returns:
            Enhanced NLP data with LLM-generated descriptions
        """
        enhanced_data = nlp_data.copy()
        
        # Only enhance if AWS Bedrock is configured
        if not is_aws_configured():
            enhanced_data["enhancement_note"] = "LLM enhancement not available (AWS not configured)"
            return enhanced_data
        
        if not nlp_data.get("analysis"):
            return enhanced_data
        
        analysis = nlp_data["analysis"]
        nlp_analysis = analysis.get("nlp_analysis", {})
        trading_signals = analysis.get("trading_signals", {})
        sentiment_scores = nlp_analysis.get("sentiment_scores", {})
        risk_analysis = nlp_analysis.get("risk_analysis", {})
        
        # Load SEC filing content to provide context for LLM
        filing_content = None
        filing_date = nlp_data.get("filing_date", "unknown")
        filing_filename = nlp_data.get("filing_filename", "")
        
        try:
            filings = find_filings_for_ticker(ticker)
            if filings:
                # Find the filing that matches the cached one, or use the most recent
                target_filing = None
                if filing_filename:
                    target_filing = next((f for f in filings if filing_filename in f.get('filename', '')), None)
                
                if not target_filing:
                    # Use most recent 10-K or 10-Q
                    tenk_filings = [f for f in filings if '10-k' in f.get('filename', '').lower() or '10k' in f.get('filename', '').lower()]
                    target_filing = tenk_filings[0] if tenk_filings else filings[0]
                
                if target_filing:
                    filing_content = get_filing_content(target_filing['path'], max_length=30000)  # Limit for LLM context
        except Exception as e:
            print(f"Warning: Could not load filing content for {ticker}: {e}")
        
        enhanced_descriptions = {}
        
        try:
            # 1. Generate overall sentiment description
            if sentiment_scores:
                overall_sentiment = sentiment_scores.get("overall_sentiment", 0) or sentiment_scores.get("compound", 0)
                financial_sentiment = sentiment_scores.get("financial_sentiment", 0)
                uncertainty = sentiment_scores.get("uncertainty_score", 0)
                
                # Include filing content excerpt for context
                filing_context = ""
                if filing_content:
                    # Get a representative sample from the filing (middle section often has good content)
                    excerpt_start = len(filing_content) // 3
                    excerpt = filing_content[excerpt_start:excerpt_start + 2000]  # 2000 char excerpt
                    filing_context = f"\n\nRelevant excerpt from SEC filing:\n{excerpt}"
                
                sentiment_prompt = f"""You are analyzing {company_name} ({ticker})'s SEC filing (10-K/10-Q). Based on the NLP analysis below and the filing content excerpt, provide a clear, investor-friendly explanation of the sentiment analysis:

Overall Sentiment: {overall_sentiment:.3f}
Financial Sentiment: {financial_sentiment:.3f}
Uncertainty Score: {uncertainty:.1f}%

Risk Factors Count: {len(risk_analysis.get('risk_factors', []))}
Risk Severity: {risk_analysis.get('severity', 0):.1f}%

Strategy Score: {analysis.get('strategy_score', 0):.3f}
Recommendation: {trading_signals.get('recommendation', 'HOLD')}
Confidence: {trading_signals.get('confidence', 0.5):.1%}

{filing_context}

Provide a 2-3 sentence explanation that:
1. Interprets what these sentiment scores mean for investors based on the filing content
2. Explains the key factors influencing the sentiment (reference specific language from the filing if relevant)
3. Provides actionable insight about the company's outlook

Keep it concise and professional. Reference specific examples from the filing when relevant."""
                
                sentiment_desc = BedrockService.invoke_model(
                    prompt=sentiment_prompt,
                    max_tokens=400,
                    temperature=0.6
                )
                enhanced_descriptions["sentiment_description"] = sentiment_desc.get("text", "")
            
            # 2. Generate risk analysis description
            if risk_analysis and (len(risk_analysis.get("risk_factors", [])) > 0 or risk_analysis.get("severity", 0) > 0):
                risk_factors_list = risk_analysis.get("risk_factors", [])[:10]  # Top 10
                
                # Get risk factors section from filing if available
                risk_section_context = ""
                if filing_content:
                    # Try to extract "Risk Factors" section
                    risk_section_match = re.search(r'(ITEM\s+1A\.|RISK\s+FACTORS)[\s\S]{1,3000}', filing_content, re.IGNORECASE)
                    if risk_section_match:
                        risk_section_context = f"\n\nRisk Factors section from filing:\n{risk_section_match.group(0)[:2000]}"
                    else:
                        # Use excerpt from filing
                        excerpt_start = len(filing_content) // 4
                        risk_section_context = f"\n\nRelevant excerpt from SEC filing:\n{filing_content[excerpt_start:excerpt_start + 2000]}"
                
                risk_prompt = f"""You are analyzing {company_name} ({ticker})'s SEC filing. Based on the NLP analysis below and the filing content, provide a clear explanation of the risk profile:

Risk Severity Score: {risk_analysis.get('severity', 0):.1f}%
Number of Risk Factors Identified: {len(risk_analysis.get('risk_factors', []))}
Top Risk Keywords: {', '.join(risk_factors_list[:5]) if risk_factors_list else 'None identified'}

Forward-Looking Statements: {len(nlp_analysis.get('forward_looking_statements', []))}

{risk_section_context}

Provide a 2-3 sentence explanation that:
1. Summarizes what the risk severity score means for investors based on the actual filing content
2. Highlights the most significant risk concerns mentioned in the filing (quote specific risks if relevant)
3. Explains how forward-looking statements relate to risk

Keep it concise and focused on actionable insights. Reference specific risks from the filing when relevant."""
                
                risk_desc = BedrockService.invoke_model(
                    prompt=risk_prompt,
                    max_tokens=400,
                    temperature=0.6
                )
                enhanced_descriptions["risk_description"] = risk_desc.get("text", "")
            
            # 3. Generate trading signal explanation
            if trading_signals:
                strategy_score = analysis.get("strategy_score", 0)
                recommendation = trading_signals.get("recommendation", "HOLD")
                confidence = trading_signals.get("confidence", 0.5)
                reasons = trading_signals.get("reasons", [])
                
                # Get key sections from filing for context
                filing_key_sections = ""
                if filing_content:
                    # Try to extract Management Discussion section and Risk Factors
                    mgmt_match = re.search(r'(MANAGEMENT[\'S\s]*DISCUSSION|ITEM\s+7)[\s\S]{1,2500}', filing_content, re.IGNORECASE)
                    if mgmt_match:
                        filing_key_sections = f"\n\nManagement Discussion excerpt:\n{mgmt_match.group(0)[:2000]}"
                    else:
                        # Use multiple excerpts
                        excerpt1 = filing_content[len(filing_content) // 5:len(filing_content) // 5 + 1500]
                        excerpt2 = filing_content[len(filing_content) // 2:len(filing_content) // 2 + 1500]
                        filing_key_sections = f"\n\nKey excerpts from SEC filing:\n{excerpt1}\n\n---\n\n{excerpt2}"
                
                trading_prompt = f"""You are analyzing {company_name} ({ticker})'s SEC filing (10-K/10-Q) for investment decision-making. Based on comprehensive NLP analysis and the filing content below, explain the trading recommendation:

Recommendation: {recommendation}
Strategy Score: {strategy_score:.3f} (range: -1 to +1, where positive is bullish)
Confidence: {confidence:.1%}
Overall Sentiment: {sentiment_scores.get('overall_sentiment', 0) or sentiment_scores.get('compound', 0):.3f}
Risk Severity: {risk_analysis.get('severity', 0):.1f}%

Key Factors:
{chr(10).join(f'- {reason}' for reason in reasons[:5]) if reasons else '- Standard analysis performed'}

{filing_key_sections}

Provide a 2-3 sentence explanation that:
1. Interprets what the {recommendation} recommendation means based on the filing content
2. Explains the confidence level and what it indicates (reference specific factors from the filing)
3. Highlights the most important factors driving this recommendation (quote or reference filing language when relevant)

Write for an investor audience, be clear and actionable. Use specific examples from the filing."""
                
                trading_desc = BedrockService.invoke_model(
                    prompt=trading_prompt,
                    max_tokens=400,
                    temperature=0.6
                )
                enhanced_descriptions["trading_signal_description"] = trading_desc.get("text", "")
            
            # 4. Generate forward-looking statements summary
            forward_statements = nlp_analysis.get("forward_looking_statements", [])
            if forward_statements:
                # Get top statements with sentiment
                top_statements = [
                    stmt.get("statement", str(stmt))[:150] 
                    for stmt in forward_statements[:5]
                ]
                
                # Get full context around forward-looking statements from filing
                fls_context = ""
                if filing_content:
                    # Extract the full forward-looking statements section
                    fls_section_match = re.search(r'(FORWARD[\s-]*LOOKING|CAUTIONARY[\s\w]*STATEMENT)[\s\S]{1,3000}', filing_content, re.IGNORECASE)
                    if fls_section_match:
                        fls_context = f"\n\nForward-Looking Statements section from filing:\n{fls_section_match.group(0)[:2500]}"
                    else:
                        # Use excerpt
                        excerpt = filing_content[len(filing_content) // 3:len(filing_content) // 3 + 2000]
                        fls_context = f"\n\nRelevant excerpt from SEC filing:\n{excerpt}"
                
                fls_prompt = f"""You are analyzing {company_name} ({ticker})'s SEC filing. Based on NLP analysis of forward-looking statements and the filing content below, provide a summary:

Number of Forward-Looking Statements: {len(forward_statements)}
Sample Statements:
{chr(10).join(f'- {stmt}...' for stmt in top_statements)}

{fls_context}

Provide a 2-3 sentence explanation that:
1. Summarizes what these forward-looking statements indicate about company outlook (reference specific statements from the filing)
2. Highlights key themes or areas of focus mentioned in the filing
3. Explains what this means for future performance expectations (quote or reference filing language)

Keep it concise and investor-focused. Use specific examples from the forward-looking statements."""
                
                fls_desc = BedrockService.invoke_model(
                    prompt=fls_prompt,
                    max_tokens=350,
                    temperature=0.6
                )
                enhanced_descriptions["forward_statements_summary"] = fls_desc.get("text", "")
            
            # 5. Overall executive summary
            # Get executive summary context from filing
            exec_context = ""
            if filing_content:
                # Try to get multiple key sections
                business_section = re.search(r'(ITEM\s+1[\s\.]*BUSINESS|BUSINESS\s+OVERVIEW)[\s\S]{1,2000}', filing_content, re.IGNORECASE)
                mgmt_section = re.search(r'(MANAGEMENT[\'S\s]*DISCUSSION|ITEM\s+7)[\s\S]{1,2000}', filing_content, re.IGNORECASE)
                
                context_parts = []
                if business_section:
                    context_parts.append(f"Business Overview:\n{business_section.group(0)[:1500]}")
                if mgmt_section:
                    context_parts.append(f"\n\nManagement Discussion:\n{mgmt_section.group(0)[:1500]}")
                
                if context_parts:
                    exec_context = "\n\n" + "\n\n---\n\n".join(context_parts)
                else:
                    # Use excerpts
                    excerpt1 = filing_content[:2000]  # Beginning
                    excerpt2 = filing_content[len(filing_content) // 2:len(filing_content) // 2 + 2000]  # Middle
                    exec_context = f"\n\nKey excerpts from SEC filing:\n{excerpt1}\n\n---\n\n{excerpt2}"
            
            executive_prompt = f"""You are providing an executive summary analysis of {company_name} ({ticker})'s SEC filing (10-K/10-Q). Based on comprehensive NLP analysis and the filing content below, provide an executive summary:

Sentiment: Overall {sentiment_scores.get('overall_sentiment', 0) or sentiment_scores.get('compound', 0):.3f}, Financial {sentiment_scores.get('financial_sentiment', 0):.3f}
Risk: Severity {risk_analysis.get('severity', 0):.1f}%, {len(risk_analysis.get('risk_factors', []))} factors identified
Recommendation: {trading_signals.get('recommendation', 'HOLD')} (Confidence: {trading_signals.get('confidence', 0.5):.1%})
Strategy Score: {analysis.get('strategy_score', 0):.3f}

{exec_context}

Provide a 3-4 sentence executive summary that:
1. Gives a high-level overview of the filing analysis (incorporate key points from the filing)
2. Highlights the most important findings from both the NLP analysis and the filing content
3. Provides a clear takeaway for investors (reference specific filing details when relevant)

Keep it professional and concise. Reference specific sections or statements from the filing to support your analysis."""
            
            exec_summary = BedrockService.invoke_model(
                prompt=executive_prompt,
                max_tokens=500,
                temperature=0.6
            )
            enhanced_descriptions["executive_summary"] = exec_summary.get("text", "")
            
            enhanced_data["enhanced_descriptions"] = enhanced_descriptions
            enhanced_data["enhanced_at"] = datetime.now().isoformat()
            enhanced_data["enhancement_note"] = "Enhanced with LLM-generated descriptions"
            
        except Exception as e:
            print(f"Warning: Could not generate LLM descriptions for {ticker}: {e}")
            enhanced_data["enhancement_note"] = f"LLM enhancement failed: {str(e)}"
            enhanced_data["enhanced_descriptions"] = {}
        
        return enhanced_data
    
    @staticmethod
    def _analyze_filings_with_rag(ticker: str, company_name: str) -> Optional[Dict]:
        """
        Analyze 10-K/10-Q filings using RAG with Amazon Bedrock
        Loads filing content from disk and uses Bedrock to analyze it
        
        Args:
            ticker: Stock ticker symbol
            company_name: Company name
            
        Returns:
            Dictionary with filing analysis results
        """
        if not is_aws_configured():
            return None
        
        try:
            filings = find_filings_for_ticker(ticker)
            if not filings:
                return None
            
            # Get most recent 10-K filing
            tenk_filings = [f for f in filings if '10-k' in f.get('filename', '').lower() or '10k' in f.get('filename', '').lower()]
            if not tenk_filings:
                tenk_filings = filings
            
            if tenk_filings:
                filing = tenk_filings[0]
                filing_content = get_filing_content(filing['path'], max_length=100000)
                filing_date = filing.get('filename', 'unknown')
                
                if not filing_content:
                    return None
                
                # Chunk the filing content
                chunks = MarketResearchService._chunk_filing_content(filing_content, max_chunk_size=50000)
                combined_chunk = "\n\n---\n\n".join(chunks[:2])[:60000]  # Limit combined size for analysis
                
                # Generate filing analysis using RAG
                prompt = f"""You are analyzing {company_name} ({ticker})'s SEC filing (10-K/10-Q) to provide comprehensive filing analysis.

SEC Filing Content:
{combined_chunk[:60000]}

Based on this SEC filing, provide a comprehensive analysis. Return your response as a JSON object with:
- sentiment_score: number (-1 to 1, where positive is optimistic)
- financial_sentiment: number (-1 to 1, financial outlook sentiment)
- uncertainty_score: number (0-100, percentage indicating uncertainty level)
- risk_factors_count: number (estimated number of risk factors identified)
- risk_severity: number (0-100, overall risk severity percentage)
- forward_looking_statements_count: number (estimated forward-looking statements)
- strategy_score: number (-1 to 1, strategic outlook score)
- recommendation: string (BUY, HOLD, or SELL based on filing analysis)
- confidence: number (0-1, confidence in the analysis)
- summary: string (2-3 sentence summary of the filing analysis)

Focus on:
- Overall sentiment and tone of the filing
- Financial performance indicators
- Risk factors and their severity
- Forward-looking statements and guidance
- Strategic initiatives and outlook
- Competitive position and market dynamics

Return ONLY a valid JSON object, no additional text or explanation.

Example format:
{{
  "sentiment_score": 0.15,
  "financial_sentiment": 0.08,
  "uncertainty_score": 35.0,
  "risk_factors_count": 25,
  "risk_severity": 45.0,
  "forward_looking_statements_count": 18,
  "strategy_score": 0.12,
  "recommendation": "HOLD",
  "confidence": 0.75,
  "summary": "The filing indicates moderate positive sentiment with stable financial outlook..."
}}"""
                
                response = BedrockService.invoke_model(
                    prompt=prompt,
                    max_tokens=2000,
                    temperature=0.3
                )
                
                response_text = response.get("text", "").strip()
                
                # Try to extract JSON from response
                json_match = re.search(r'\{.*?\}', response_text, re.DOTALL)
                if json_match:
                    analysis_data = json.loads(json_match.group(0))
                    if isinstance(analysis_data, dict):
                        return {
                            "filing_date": filing_date,
                            "filing_filename": filing.get('filename', 'unknown'),
                            "cached": False,  # RAG analysis is not cached
                            "method": "RAG",
                            "sentiment_score": float(analysis_data.get("sentiment_score", 0.0)),
                            "financial_sentiment": float(analysis_data.get("financial_sentiment", 0.0)),
                            "uncertainty_score": float(analysis_data.get("uncertainty_score", 0.0)),
                            "risk_factors_count": int(analysis_data.get("risk_factors_count", 0)),
                            "risk_severity": float(analysis_data.get("risk_severity", 0.0)),
                            "forward_looking_statements_count": int(analysis_data.get("forward_looking_statements_count", 0)),
                            "strategy_score": float(analysis_data.get("strategy_score", 0.0)),
                            "recommendation": analysis_data.get("recommendation", "HOLD"),
                            "confidence": float(analysis_data.get("confidence", 0.5)),
                            "summary": analysis_data.get("summary", "")
                        }
                
        except Exception as e:
            print(f"Warning: RAG filing analysis failed for {ticker}: {e}")
            import traceback
            traceback.print_exc()
        
        return None
    
    @staticmethod
    def _analyze_filings(ticker: str) -> Optional[Dict]:
        """
        Analyze 10-K/10-Q filings for risk factors
        First tries RAG with Bedrock, then cached NLP analysis, falls back to on-the-fly analysis
        """
        try:
            # First, try RAG with Bedrock (primary method)
            if is_aws_configured():
                # Get company name from ticker if available
                company_name = f"{ticker} Inc."
                filings = find_filings_for_ticker(ticker)
                if filings:
                    # Try to extract company name from filing
                    try:
                        filing_content = get_filing_content(filings[0]['path'], max_length=10000)
                        if filing_content:
                            name_match = re.search(r'Company Name[:]\s*([A-Za-z0-9\s,&.-]+)', filing_content[:5000], re.IGNORECASE)
                            if name_match:
                                company_name = name_match.group(1).strip()
                    except:
                        pass
                
                rag_result = MarketResearchService._analyze_filings_with_rag(ticker, company_name)
                if rag_result:
                    return rag_result
            
            # Fallback: Try to load cached NLP analysis
            cached_data = MarketResearchService._load_cached_nlp_analysis(ticker)
            if cached_data and cached_data.get("analysis"):
                analysis = cached_data["analysis"]
                nlp_analysis = analysis.get("nlp_analysis", {})
                sentiment_scores = nlp_analysis.get("sentiment_scores", {})
                risk_analysis = nlp_analysis.get("risk_analysis", {})
                forward_statements = nlp_analysis.get("forward_looking_statements", [])
                
                return {
                    "filing_date": cached_data.get("filing_date", "unknown"),
                    "filing_filename": cached_data.get("filing_filename", "unknown"),
                    "cached": True,  # Indicate this came from cache
                    "method": "cached_nlp",
                    "sentiment_score": sentiment_scores.get("compound") or sentiment_scores.get("overall_sentiment", 0),
                    "financial_sentiment": sentiment_scores.get("financial_sentiment", 0),
                    "uncertainty_score": sentiment_scores.get("uncertainty_score", 0),
                    "risk_factors_count": len(risk_analysis.get("risk_factors", [])) or len(risk_analysis.get("key_risks", [])) or risk_analysis.get("risk_count", 0),
                    "risk_severity": risk_analysis.get("severity", 0) or risk_analysis.get("severity_score", 0),
                    "risk_categories": risk_analysis.get("risk_categories", []),
                    "forward_looking_statements_count": len(forward_statements),
                    "forward_looking_statements": forward_statements[:5],  # Include sample statements
                    "entities": nlp_analysis.get("entities", {}),
                    "strategy_score": analysis.get("strategy_score", 0),
                    "recommendation": analysis.get("trading_signals", {}).get("recommendation", "HOLD"),
                    "confidence": analysis.get("trading_signals", {}).get("confidence", 0.5),
                    "cached_at": cached_data.get("cached_at", "unknown")
                }
            
            # Final fallback: Analyze on the fly if no cache available
            filings = find_filings_for_ticker(ticker)
            if not filings:
                return None
            
            # Get most recent 10-K filing
            tenk_filings = [f for f in filings if '10-k' in f.get('filename', '').lower() or '10k' in f.get('filename', '').lower()]
            if not tenk_filings:
                tenk_filings = filings
            
            if tenk_filings:
                # Sort by filename (newest first)
                tenk_filings.sort(key=lambda x: x.get('filename', ''), reverse=True)
                filing_content = get_filing_content(tenk_filings[0]['path'], max_length=50000)
                
                if filing_content:
                    # Use NLPQuantStrategy for basic analysis
                    try:
                        analysis = NLPQuantStrategy.analyze_filing_advanced(
                            document_text=filing_content[:50000],  # Limit for performance
                            ticker=ticker,
                            previous_filing=None,
                            benchmark_tickers=None
                        )
                        
                        nlp_analysis = analysis.get("nlp_analysis", {})
                        sentiment_scores = nlp_analysis.get("sentiment_scores", {})
                        risk_analysis = nlp_analysis.get("risk_analysis", {})
                        forward_statements = nlp_analysis.get("forward_looking_statements", [])
                        
                        return {
                            "filing_date": tenk_filings[0].get('filename', 'unknown'),
                            "cached": False,  # Indicate this was analyzed on-the-fly
                            "method": "on_the_fly_nlp",
                            "sentiment_score": sentiment_scores.get("compound") or sentiment_scores.get("overall_sentiment", 0),
                            "financial_sentiment": sentiment_scores.get("financial_sentiment", 0),
                            "uncertainty_score": sentiment_scores.get("uncertainty_score", 0),
                            "risk_factors_count": len(risk_analysis.get("risk_factors", [])),
                            "risk_severity": risk_analysis.get("severity", 0),
                            "forward_looking_statements_count": len(forward_statements),
                            "strategy_score": analysis.get("strategy_score", 0),
                            "recommendation": analysis.get("trading_signals", {}).get("recommendation", "HOLD"),
                            "confidence": analysis.get("trading_signals", {}).get("confidence", 0.5)
                        }
                    except Exception as e:
                        print(f"Warning: NLP analysis failed for filing: {e}")
                        return {
                            "filing_date": tenk_filings[0].get('filename', 'unknown'),
                            "cached": False,
                            "method": "error",
                            "error": str(e)
                        }
        except Exception as e:
            print(f"Error analyzing filings: {e}")
            return None
        
        return None
    
    @staticmethod
    def _generate_search_queries(ticker: str, company_name: str) -> List[str]:
        """
        Generate search queries using Amazon Bedrock
        
        Args:
            ticker: Stock ticker symbol
            company_name: Company name
            
        Returns:
            List of search query strings
        """
        if not is_aws_configured():
            # Fallback to static queries
            return [
                f"{ticker} stock news risks",
                f"{company_name} regulatory issues",
                f"{ticker} lawsuit litigation",
                f"{ticker} earnings report",
                f"{company_name} business update",
                f"{ticker} analyst ratings"
            ]
        
        try:
            prompt = f"""Generate 7-10 comprehensive internet search queries to find information about {company_name} ({ticker}) for quantitative market research. 
Focus on:
- Company overview, business model, and recent financial performance
- Risks, regulatory issues, lawsuits, and litigation
- Market opportunities, growth prospects, and strategic initiatives
- Supply chain information, key suppliers, and dependencies
- Geographic revenue breakdown and international operations
- Recent news, analyst ratings, and market sentiment
- Earnings reports, guidance, and forward-looking statements
- Competitive positioning and market share

Return ONLY a JSON array of search query strings, like: ["query 1", "query 2", "query 3"]
No explanations, just the JSON array."""
            
            response = BedrockService.invoke_model(
                prompt=prompt,
                max_tokens=1000,
                temperature=0.7
            )
            
            response_text = response.get("text", "")
            
            # Try to parse JSON from response
            try:
                # Extract JSON array from response
                json_match = re.search(r'\[.*?\]', response_text, re.DOTALL)
                if json_match:
                    queries = json.loads(json_match.group(0))
                    if isinstance(queries, list) and len(queries) > 0:
                        return queries[:10]  # Limit to 10 queries
                else:
                    queries = json.loads(response_text)
                    if isinstance(queries, list) and len(queries) > 0:
                        return queries[:10]
            except json.JSONDecodeError:
                # Fallback if JSON parsing fails
                pass
        except Exception as e:
            print(f"Warning: Could not generate search queries with Bedrock: {e}")
        
        # Fallback to static queries
        return [
            f"{ticker} stock news risks",
            f"{company_name} regulatory issues",
            f"{ticker} lawsuit litigation",
            f"{ticker} earnings report",
            f"{company_name} business update",
            f"{ticker} analyst ratings",
            f"{ticker} supply chain suppliers",
            f"{company_name} geographic revenue",
            f"{ticker} competitive analysis"
        ]
    
    @staticmethod
    def _generate_quantitative_research(
        ticker: str,
        company_name: str,
        scraped_content_list: List[Dict],
        search_results: List[Dict]
    ) -> Dict:
        """
        Generate quantitative research explanation using Amazon Bedrock
        
        Args:
            ticker: Stock ticker symbol
            company_name: Company name
            scraped_content_list: List of scraped content from web pages
            search_results: List of search results
            
        Returns:
            Dictionary with quantitative research analysis
        """
        if not is_aws_configured():
            return {
                "explanation": "Quantitative research not available (AWS not configured)",
                "method": "fallback"
            }
        
        try:
            # Format scraped content for context
            content_context = ""
            if scraped_content_list:
                for i, scraped in enumerate(scraped_content_list[:5], 1):  # Top 5 sources
                    content_context += f"\n\n--- Source {i} ---\n"
                    content_context += f"URL: {scraped.get('url', 'N/A')}\n"
                    content_context += f"Title: {scraped.get('title', 'N/A')}\n"
                    content_context += f"Content: {scraped.get('content', '')[:3000]}\n"  # Limit content
            
            # Format search results summary
            search_summary = ""
            if search_results:
                search_summary = "\n\n--- Search Results Summary ---\n"
                for i, result in enumerate(search_results[:5], 1):
                    search_summary += f"\nResult {i}:\n"
                    search_summary += f"Title: {result.get('title', 'N/A')}\n"
                    search_summary += f"URL: {result.get('url', 'N/A')}\n"
                    search_summary += f"Snippet: {result.get('snippet', result.get('content', ''))[:500]}\n"
            
            prompt = f"""You are a quantitative research analyst specializing in equity research. Based on the web-scraped content and search results below, provide a comprehensive quantitative research analysis for {company_name} ({ticker}).

{content_context}

{search_summary}

Please provide a quantitative research report that includes:

1. **Executive Summary**: 2-3 sentence overview of key findings
2. **Company Analysis**: Business model, revenue streams, and competitive positioning
3. **Financial Metrics**: Any quantitative metrics found (revenue, earnings, growth rates, margins, etc.)
4. **Risk Assessment**: Quantitative risk factors identified (regulatory, competitive, operational, financial)
5. **Opportunities**: Growth opportunities and strategic initiatives with quantitative potential
6. **Market Position**: Competitive positioning and market share indicators
7. **Valuation Considerations**: Any valuation metrics or market multiples mentioned
8. **Investment Thesis**: Summary recommendation with quantitative support

Write in the style of a professional quantitative research report, focusing on data-driven insights and quantitative metrics. Use specific numbers and percentages when available. If certain information is not available, clearly state that.

Keep the report comprehensive but concise (approximately 1000-1500 words)."""
            
            response = BedrockService.invoke_model(
                prompt=prompt,
                max_tokens=3000,
                temperature=0.3  # Lower temperature for more factual analysis
            )
            
            explanation = response.get("text", "")
            
            return {
                "explanation": explanation,
                "method": "aws_bedrock",
                "model": response.get("model", "unknown"),
                "sources_count": len(scraped_content_list),
                "search_results_count": len(search_results)
            }
        except Exception as e:
            print(f"Warning: Could not generate quantitative research: {e}")
            return {
                "explanation": f"Error generating quantitative research: {str(e)}",
                "method": "error"
            }
    
    @staticmethod
    async def answer_followup_question(
        ticker: str,
        company_name: str,
        question: str,
        research_context: Optional[Dict] = None,
        conversation_history: Optional[List[Dict]] = None
    ) -> Dict:
        """
        Answer follow-up questions about a company using Bedrock
        
        Args:
            ticker: Stock ticker symbol
            company_name: Company name
            question: User's follow-up question
            research_context: Previous research results for context
            conversation_history: Previous conversation messages
            
        Returns:
            Dictionary with answer and whether additional search was needed
        """
        if not is_aws_configured():
            return {
                "answer": "Follow-up questions require AWS Bedrock configuration.",
                "needs_search": False,
                "method": "fallback"
            }
        
        # Determine if we need to search for more information
        needs_search = MarketResearchService._should_search_for_question(question)
        
        search_context = ""
        if needs_search:
            # Generate search query for the specific question
            search_query = f"{ticker} {company_name} {question}"
            try:
                # Search with SearXNG
                search_result = SearXNGService.search(search_query, max_results=3)
                if search_result and search_result.get('success') and search_result.get('results'):
                    # Scrape top result
                    top_result = search_result['results'][0]
                    url = top_result.get('url', '')
                    if url:
                        scraped = WebScraperService.scrape_url(url, timeout=10.0)
                        if scraped.get('success') and scraped.get('content'):
                            search_context = f"\n\n--- Recent Search Context ---\n"
                            search_context += f"URL: {url}\n"
                            search_context += f"Title: {scraped.get('title', 'N/A')}\n"
                            search_context += f"Content: {scraped.get('content', '')[:2000]}\n"
            except Exception as e:
                print(f"Warning: Could not search for follow-up question: {e}")
        
        # Build context from previous research
        research_context_str = ""
        if research_context:
            research_context_str = "\n\n--- Previous Research Context ---\n"
            if research_context.get("quantitative_analysis"):
                research_context_str += f"Quantitative Analysis: {research_context['quantitative_analysis'].get('explanation', '')[:1500]}\n"
            if research_context.get("filing_analysis"):
                research_context_str += f"Filing Analysis Available: Yes\n"
            if research_context.get("nlp_analysis"):
                research_context_str += f"NLP Analysis Available: Yes\n"
            if research_context.get("risks"):
                research_context_str += f"Risks Identified: {len(research_context['risks'])}\n"
            if research_context.get("opportunities"):
                research_context_str += f"Opportunities Identified: {len(research_context['opportunities'])}\n"
        
        # Build conversation history context
        history_context = ""
        if conversation_history:
            history_context = "\n\n--- Conversation History ---\n"
            for msg in conversation_history[-5:]:  # Last 5 messages
                history_context += f"{msg.get('role', 'user')}: {msg.get('content', '')}\n"
        
        prompt = f"""You are a quantitative research analyst answering follow-up questions about {company_name} ({ticker}).

{research_context_str}

{history_context}

{search_context}

User Question: {question}

Provide a clear, quantitative answer to the user's question. If you need more information, indicate that. Focus on:
- Data-driven insights
- Specific numbers and metrics when available
- Clear explanations suitable for investors
- If information is not available, state that clearly

Answer the question directly and concisely (2-4 paragraphs)."""
        
        try:
            response = BedrockService.invoke_model(
                prompt=prompt,
                max_tokens=1500,
                temperature=0.4
            )
            
            answer = response.get("text", "")
            
            return {
                "answer": answer,
                "needs_search": needs_search,
                "method": "aws_bedrock",
                "model": response.get("model", "unknown")
            }
        except Exception as e:
            return {
                "answer": f"Error generating answer: {str(e)}",
                "needs_search": needs_search,
                "method": "error"
            }
    
    @staticmethod
    def _extract_from_filing_analysis_with_rag(ticker: str, company_name: str) -> Dict:
        """
        Extract risks, opportunities, and key findings from SEC filing using RAG with Amazon Bedrock
        Loads filing content from disk and uses Bedrock to analyze it
        
        Args:
            ticker: Stock ticker symbol
            company_name: Company name
            
        Returns:
            Dictionary with risks, opportunities, key_findings, and risk_score
        """
        result = {
            "risks": [],
            "opportunities": [],
            "key_findings": [],
            "risk_score": 50.0
        }
        
        # Check if AWS Bedrock is configured
        if not is_aws_configured():
            print(f"Warning: AWS Bedrock not configured, cannot use RAG for {ticker}")
            return result
        
        # Load SEC filing content from disk
        try:
            filings = find_filings_for_ticker(ticker)
            if not filings:
                print(f"Warning: No SEC filings found for {ticker}")
                return result
            
            # Get most recent 10-K filing
            tenk_filings = [f for f in filings if '10-k' in f.get('filename', '').lower() or '10k' in f.get('filename', '').lower()]
            if not tenk_filings:
                tenk_filings = filings
            
            if tenk_filings:
                filing = tenk_filings[0]
                filing_content = get_filing_content(filing['path'], max_length=100000)  # Larger limit for RAG
                filing_date = filing.get('filename', 'unknown')
                
                if not filing_content:
                    print(f"Warning: Could not read filing content for {ticker}")
                    return result
                
                # Use RAG to generate risks, opportunities, and key findings
                # Chunk the filing content if it's too long (Bedrock has context limits)
                chunks = MarketResearchService._chunk_filing_content(filing_content, max_chunk_size=50000)
                
                # Generate risks using RAG
                risks = MarketResearchService._generate_risks_with_rag(
                    ticker, company_name, chunks, filing_date
                )
                result["risks"] = risks
                
                # Generate opportunities using RAG
                opportunities = MarketResearchService._generate_opportunities_with_rag(
                    ticker, company_name, chunks, filing_date
                )
                result["opportunities"] = opportunities
                
                # Generate key findings using RAG
                key_findings = MarketResearchService._generate_key_findings_with_rag(
                    ticker, company_name, chunks, filing_date, risks, opportunities
                )
                result["key_findings"] = key_findings
                
                # Calculate risk score from generated risks
                if risks:
                    total_risk_score = sum(r.get("risk_score", 0) for r in risks)
                    avg_risk_score = total_risk_score / len(risks)
                    result["risk_score"] = min(100.0, max(0.0, avg_risk_score * 10))
                else:
                    result["risk_score"] = 50.0
                
                print(f"[INFO] RAG generated {len(risks)} risks, {len(opportunities)} opportunities, {len(key_findings)} key findings for {ticker}")
                
        except Exception as e:
            print(f"Warning: RAG analysis failed for {ticker}: {e}")
            import traceback
            traceback.print_exc()
        
        return result
    
    @staticmethod
    def _chunk_filing_content(content: str, max_chunk_size: int = 50000) -> List[str]:
        """
        Chunk filing content into manageable pieces for RAG
        
        Args:
            content: Full filing content
            max_chunk_size: Maximum size of each chunk
            
        Returns:
            List of content chunks
        """
        if len(content) <= max_chunk_size:
            return [content]
        
        chunks = []
        # Try to split at section boundaries (ITEM 1, ITEM 1A, etc.)
        section_pattern = r'(ITEM\s+\d+[A-Z]?[:\.]?\s+[^\n]+\n)'
        sections = re.split(section_pattern, content)
        
        current_chunk = ""
        for i, section in enumerate(sections):
            if len(current_chunk) + len(section) > max_chunk_size and current_chunk:
                chunks.append(current_chunk)
                current_chunk = section
            else:
                current_chunk += section
        
        if current_chunk:
            chunks.append(current_chunk)
        
        # If no good splits found, just split by size
        if len(chunks) == 1 and len(chunks[0]) > max_chunk_size:
            chunks = []
            for i in range(0, len(content), max_chunk_size):
                chunks.append(content[i:i + max_chunk_size])
        
        return chunks
    
    @staticmethod
    def _generate_risks_with_rag(ticker: str, company_name: str, chunks: List[str], filing_date: str) -> List[Dict]:
        """Generate risks from SEC filing using RAG with Bedrock"""
        all_risks = []
        
        for chunk_idx, chunk in enumerate(chunks[:3]):  # Limit to first 3 chunks to avoid token limits
            try:
                prompt = f"""You are analyzing {company_name} ({ticker})'s SEC filing (10-K/10-Q) to identify investment risks.

SEC Filing Content Excerpt (Part {chunk_idx + 1}):
{chunk[:40000]}

Based on this SEC filing excerpt, identify specific investment risks. For each risk you identify:
1. Provide a clear, concise title (10-15 words)
2. Provide a detailed snippet explaining the risk (2-4 sentences)
3. Assign a risk_score from 1-10 (10 being most severe)
4. Identify key risk keywords/topics
5. Provide context from the filing that supports this risk

Return your response as a JSON array of risk objects, each with:
- title: string (brief risk title)
- snippet: string (detailed risk description)
- risk_score: number (1-10)
- detected_keywords: array of strings (relevant keywords)
- context: string (specific filing content that supports this risk)

Focus on:
- Regulatory and compliance risks
- Financial and operational risks
- Market and competitive risks
- Legal and litigation risks
- Strategic and execution risks
- Supply chain and operational risks

Return ONLY a valid JSON array, no additional text or explanation. If no significant risks are found, return an empty array [].

Example format:
[
  {{
    "title": "Regulatory Compliance Risk",
    "snippet": "The company faces increased regulatory scrutiny in key markets...",
    "risk_score": 8,
    "detected_keywords": ["regulation", "compliance", "scrutiny"],
    "context": "As noted in Item 1A, regulatory changes may impact operations..."
  }}
]"""
                
                response = BedrockService.invoke_model(
                    prompt=prompt,
                    max_tokens=4000,
                    temperature=0.3
                )
                
                response_text = response.get("text", "").strip()
                
                # Try to extract JSON from response
                risks = None
                json_text = None
                
                # First, try to extract JSON from markdown code blocks
                if "```json" in response_text:
                    json_start = response_text.find("```json") + 7
                    json_end = response_text.find("```", json_start)
                    if json_end > json_start:
                        json_text = response_text[json_start:json_end].strip()
                elif "```" in response_text:
                    json_start = response_text.find("```") + 3
                    json_end = response_text.find("```", json_start)
                    if json_end > json_start:
                        json_text = response_text[json_start:json_end].strip()
                else:
                    # Try to find JSON array in the text
                    json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
                    if json_match:
                        json_text = json_match.group(0)
                
                if json_text:
                    try:
                        # Try to parse the JSON
                        risks = json.loads(json_text)
                    except json.JSONDecodeError as json_err:
                        # Try to fix common JSON issues
                        try:
                            # Remove trailing commas before closing brackets/braces
                            json_text_fixed = re.sub(r',(\s*[}\]])', r'\1', json_text)
                            risks = json.loads(json_text_fixed)
                        except json.JSONDecodeError:
                            # Try more aggressive JSON repair
                            try:
                                # Fix missing commas between objects in arrays
                                # Pattern: } { should be }, { (missing comma between objects)
                                json_text_fixed = json_text
                                # Add commas between closing and opening braces/brackets
                                json_text_fixed = re.sub(r'}(\s*)(?={)', r'},\1', json_text_fixed)
                                json_text_fixed = re.sub(r'](\s*)(?={)', r'],\1', json_text_fixed)
                                # Remove trailing commas before closing brackets/braces
                                json_text_fixed = re.sub(r',(\s*[}\]])', r'\1', json_text_fixed)
                                risks = json.loads(json_text_fixed)
                            except json.JSONDecodeError:
                                # Try to extract individual objects and rebuild array
                                try:
                                    # Find all JSON objects in the text
                                    objects = []
                                    brace_count = 0
                                    obj_start = -1
                                    
                                    for i, char in enumerate(json_text):
                                        if char == '{':
                                            if brace_count == 0:
                                                obj_start = i
                                            brace_count += 1
                                        elif char == '}':
                                            brace_count -= 1
                                            if brace_count == 0 and obj_start >= 0:
                                                obj_str = json_text[obj_start:i+1]
                                                try:
                                                    obj = json.loads(obj_str)
                                                    objects.append(obj)
                                                except json.JSONDecodeError:
                                                    pass
                                                
                                    if objects:
                                        risks = objects
                                except Exception:
                                    # Try to extract just the first valid JSON object/array
                                    try:
                                        # Find the first complete JSON array
                                        bracket_count = 0
                                        json_start_pos = json_text.find('[')
                                        if json_start_pos >= 0:
                                            json_text_fixed = None
                                            for i in range(json_start_pos, len(json_text)):
                                                if json_text[i] == '[':
                                                    bracket_count += 1
                                                elif json_text[i] == ']':
                                                    bracket_count -= 1
                                                    if bracket_count == 0:
                                                        json_text_fixed = json_text[json_start_pos:i+1]
                                                        break
                                            if json_text_fixed:
                                                # One more attempt at fixing trailing commas
                                                json_text_fixed = re.sub(r',(\s*[}\]])', r'\1', json_text_fixed)
                                                risks = json.loads(json_text_fixed)
                                    except (json.JSONDecodeError, ValueError):
                                        # If all parsing attempts fail, log the error and response snippet
                                        # Log detailed error information
                                        error_pos = None
                                        if hasattr(json_err, 'pos'):
                                            error_pos = json_err.pos
                                        elif hasattr(json_err, 'colno'):
                                            error_pos = json_err.colno
                                        
                                        if error_pos:
                                            start = max(0, error_pos - 150)
                                            end = min(len(json_text), error_pos + 150)
                                            snippet = json_text[start:end]
                                            print(f"Warning: Could not parse JSON from chunk {chunk_idx}: {json_err}")
                                            print(f"Error at position {error_pos}. JSON snippet: ...{snippet}...")
                                        else:
                                            # Log first 500 chars of the problematic JSON
                                            snippet = json_text[:500] if len(json_text) > 500 else json_text
                                            print(f"Warning: Could not parse JSON from chunk {chunk_idx}: {json_err}")
                                            print(f"JSON preview: {snippet}...")
                                        risks = None
                
                if risks and isinstance(risks, list):
                    for risk in risks:
                        if isinstance(risk, dict):
                            all_risks.append({
                                "title": risk.get("title", "Risk Factor"),
                                "snippet": risk.get("snippet", ""),
                                "url": "",
                                "risk_score": int(risk.get("risk_score", 5)),
                                "context": risk.get("context", ""),
                                "detected_keywords": risk.get("detected_keywords", [])[:5],
                                "timestamp": filing_date,
                                "source": "SEC Filing (RAG Analysis)",
                                "filing_date": filing_date
                            })
                
            except Exception as e:
                print(f"Warning: Could not generate risks from chunk {chunk_idx}: {e}")
                continue
        
        # Remove duplicates and sort by risk score
        unique_risks = []
        seen_titles = set()
        for risk in all_risks:
            title_key = risk["title"].lower()[:50]
            if title_key not in seen_titles:
                seen_titles.add(title_key)
                unique_risks.append(risk)
        
        unique_risks.sort(key=lambda x: x.get("risk_score", 0), reverse=True)
        return unique_risks[:15]  # Top 15 risks
    
    @staticmethod
    def _generate_opportunities_with_rag(ticker: str, company_name: str, chunks: List[str], filing_date: str) -> List[Dict]:
        """Generate opportunities from SEC filing using RAG with Bedrock"""
        all_opportunities = []
        
        for chunk_idx, chunk in enumerate(chunks[:3]):  # Limit to first 3 chunks
            try:
                prompt = f"""You are analyzing {company_name} ({ticker})'s SEC filing (10-K/10-Q) to identify investment opportunities and growth prospects.

SEC Filing Content Excerpt (Part {chunk_idx + 1}):
{chunk[:40000]}

Based on this SEC filing excerpt, identify specific investment opportunities and growth prospects. For each opportunity you identify:
1. Provide a clear, concise title (10-15 words)
2. Provide a detailed snippet explaining the opportunity (2-4 sentences)
3. Assign an opportunity_score from 1-10 (10 being highest potential)
4. Identify key opportunity keywords/topics
5. Provide context from the filing that supports this opportunity

Return your response as a JSON array of opportunity objects, each with:
- title: string (brief opportunity title)
- snippet: string (detailed opportunity description)
- opportunity_score: number (1-10)
- detected_keywords: array of strings (relevant keywords)
- context: string (specific filing content that supports this opportunity)

Focus on:
- Market expansion and growth opportunities
- Strategic initiatives and investments
- Innovation and product development
- Competitive advantages
- Positive forward-looking statements
- Growth prospects and future plans

Return ONLY a valid JSON array, no additional text or explanation. If no significant opportunities are found, return an empty array [].

Example format:
[
  {{
    "title": "International Market Expansion",
    "snippet": "The company plans to expand into new international markets...",
    "opportunity_score": 8,
    "detected_keywords": ["expansion", "growth", "international"],
    "context": "As discussed in Management's Discussion, international expansion is a key priority..."
  }}
]"""
                
                response = BedrockService.invoke_model(
                    prompt=prompt,
                    max_tokens=4000,
                    temperature=0.3
                )
                
                response_text = response.get("text", "").strip()
                
                # Try to extract JSON from response
                opportunities = None
                json_text = None
                
                # First, try to extract JSON from markdown code blocks
                if "```json" in response_text:
                    json_start = response_text.find("```json") + 7
                    json_end = response_text.find("```", json_start)
                    if json_end > json_start:
                        json_text = response_text[json_start:json_end].strip()
                elif "```" in response_text:
                    json_start = response_text.find("```") + 3
                    json_end = response_text.find("```", json_start)
                    if json_end > json_start:
                        json_text = response_text[json_start:json_end].strip()
                else:
                    # Try to find JSON array in the text
                    json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
                    if json_match:
                        json_text = json_match.group(0)
                
                if json_text:
                    try:
                        # Try to parse the JSON
                        opportunities = json.loads(json_text)
                    except json.JSONDecodeError as json_err:
                        # Try to fix common JSON issues
                        try:
                            # Remove trailing commas before closing brackets/braces
                            json_text_fixed = re.sub(r',(\s*[}\]])', r'\1', json_text)
                            opportunities = json.loads(json_text_fixed)
                        except json.JSONDecodeError:
                            # Try more aggressive JSON repair
                            try:
                                # Fix missing commas between objects in arrays
                                # Pattern: } { should be }, { (missing comma between objects)
                                json_text_fixed = json_text
                                # Add commas between closing and opening braces/brackets
                                json_text_fixed = re.sub(r'}(\s*)(?={)', r'},\1', json_text_fixed)
                                json_text_fixed = re.sub(r'](\s*)(?={)', r'],\1', json_text_fixed)
                                # Remove trailing commas before closing brackets/braces
                                json_text_fixed = re.sub(r',(\s*[}\]])', r'\1', json_text_fixed)
                                opportunities = json.loads(json_text_fixed)
                            except json.JSONDecodeError:
                                # Try to extract individual objects and rebuild array
                                try:
                                    # Find all JSON objects in the text
                                    objects = []
                                    brace_count = 0
                                    obj_start = -1
                                    
                                    for i, char in enumerate(json_text):
                                        if char == '{':
                                            if brace_count == 0:
                                                obj_start = i
                                            brace_count += 1
                                        elif char == '}':
                                            brace_count -= 1
                                            if brace_count == 0 and obj_start >= 0:
                                                obj_str = json_text[obj_start:i+1]
                                                try:
                                                    obj = json.loads(obj_str)
                                                    objects.append(obj)
                                                except json.JSONDecodeError:
                                                    pass
                                                
                                    if objects:
                                        opportunities = objects
                                except Exception:
                                    # Try to extract just the first valid JSON object/array
                                    try:
                                        # Find the first complete JSON array
                                        bracket_count = 0
                                        json_start_pos = json_text.find('[')
                                        if json_start_pos >= 0:
                                            json_text_fixed = None
                                            for i in range(json_start_pos, len(json_text)):
                                                if json_text[i] == '[':
                                                    bracket_count += 1
                                                elif json_text[i] == ']':
                                                    bracket_count -= 1
                                                    if bracket_count == 0:
                                                        json_text_fixed = json_text[json_start_pos:i+1]
                                                        break
                                            if json_text_fixed:
                                                # One more attempt at fixing trailing commas
                                                json_text_fixed = re.sub(r',(\s*[}\]])', r'\1', json_text_fixed)
                                                opportunities = json.loads(json_text_fixed)
                                    except (json.JSONDecodeError, ValueError):
                                        # If all parsing attempts fail, log the error and response snippet
                                        error_pos = None
                                        if hasattr(json_err, 'pos'):
                                            error_pos = json_err.pos
                                        elif hasattr(json_err, 'colno'):
                                            error_pos = json_err.colno
                                        
                                        if error_pos:
                                            start = max(0, error_pos - 150)
                                            end = min(len(json_text), error_pos + 150)
                                            snippet = json_text[start:end]
                                            print(f"Warning: Could not parse JSON from chunk {chunk_idx}: {json_err}")
                                            print(f"Error at position {error_pos}. JSON snippet: ...{snippet}...")
                                        else:
                                            # Log first 500 chars of the problematic JSON
                                            snippet = json_text[:500] if len(json_text) > 500 else json_text
                                            print(f"Warning: Could not parse JSON from chunk {chunk_idx}: {json_err}")
                                            print(f"JSON preview: {snippet}...")
                                        opportunities = None
                
                if opportunities and isinstance(opportunities, list):
                    for opp in opportunities:
                        if isinstance(opp, dict):
                            all_opportunities.append({
                                "title": opp.get("title", "Opportunity"),
                                "snippet": opp.get("snippet", ""),
                                "url": "",
                                "opportunity_score": int(opp.get("opportunity_score", 5)),
                                "detected_keywords": opp.get("detected_keywords", [])[:5],
                                "timestamp": filing_date,
                                "source": "SEC Filing (RAG Analysis)",
                                "filing_date": filing_date
                            })
                
            except Exception as e:
                print(f"Warning: Could not generate opportunities from chunk {chunk_idx}: {e}")
                continue
        
        # Remove duplicates and sort by opportunity score
        unique_opportunities = []
        seen_titles = set()
        for opp in all_opportunities:
            title_key = opp["title"].lower()[:50]
            if title_key not in seen_titles:
                seen_titles.add(title_key)
                unique_opportunities.append(opp)
        
        unique_opportunities.sort(key=lambda x: x.get("opportunity_score", 0), reverse=True)
        return unique_opportunities[:15]  # Top 15 opportunities
    
    @staticmethod
    def _generate_key_findings_with_rag(ticker: str, company_name: str, chunks: List[str], filing_date: str, risks: List[Dict], opportunities: List[Dict]) -> List[Dict]:
        """Generate key findings from SEC filing using RAG with Bedrock"""
        key_findings = []
        
        # Add top risks as key findings
        for risk in risks[:5]:
            key_findings.append({
                "title": risk["title"],
                "summary": risk["snippet"],
                "url": risk.get("url", ""),
                "type": "RISK",
                "timestamp": risk["timestamp"],
                "source": "SEC Filing (RAG Analysis)"
            })
        
        # Add top opportunities as key findings
        for opp in opportunities[:5]:
            key_findings.append({
                "title": opp["title"],
                "summary": opp["snippet"],
                "url": opp.get("url", ""),
                "type": "OPPORTUNITY",
                "timestamp": opp["timestamp"],
                "source": "SEC Filing (RAG Analysis)"
            })
        
        # Generate additional key findings using RAG
        try:
            # Combine chunks for summary analysis
            combined_chunk = "\n\n---\n\n".join(chunks[:2])[:60000]  # Limit combined size
            
            prompt = f"""You are analyzing {company_name} ({ticker})'s SEC filing (10-K/10-Q) to identify key findings and important insights for investors.

SEC Filing Content:
{combined_chunk[:60000]}

Based on this SEC filing, identify the most important key findings that investors should know. For each finding:
1. Provide a clear, concise title (10-15 words)
2. Provide a detailed summary (2-3 sentences)
3. Classify as RISK, OPPORTUNITY, or INFO

Return your response as a JSON array of finding objects, each with:
- title: string (brief finding title)
- summary: string (detailed finding description)
- type: string (RISK, OPPORTUNITY, or INFO)

Focus on:
- Critical financial metrics and performance
- Strategic changes or initiatives
- Regulatory or compliance issues
- Market position and competitive landscape
- Management outlook and forward guidance

Return ONLY a valid JSON array, no additional text or explanation. Limit to top 5-7 most important findings.

Example format:
[
  {{
    "title": "Strong Revenue Growth in Core Segment",
    "summary": "The company reported 15% revenue growth in its core segment, driven by strong demand...",
    "type": "OPPORTUNITY"
  }}
]"""
            
            response = BedrockService.invoke_model(
                prompt=prompt,
                max_tokens=3000,
                temperature=0.3
            )
            
            response_text = response.get("text", "").strip()
            
            # Try to extract JSON from response
            json_match = re.search(r'\[.*?\]', response_text, re.DOTALL)
            if json_match:
                findings = json.loads(json_match.group(0))
                if isinstance(findings, list):
                    for finding in findings[:7]:  # Limit to 7 additional findings
                        if isinstance(finding, dict):
                            key_findings.append({
                                "title": finding.get("title", "Key Finding"),
                                "summary": finding.get("summary", ""),
                                "url": "",
                                "type": finding.get("type", "INFO"),
                                "timestamp": filing_date,
                                "source": "SEC Filing (RAG Analysis)"
                            })
        
        except Exception as e:
            print(f"Warning: Could not generate additional key findings: {e}")
        
        return key_findings[:15]  # Limit to top 15 findings
    
    @staticmethod
    def _extract_from_filing_analysis(cached_nlp_data: Dict, ticker: str, company_name: str) -> Dict:
        """
        Extract risks, opportunities, and key findings from SEC filing NLP analysis
        Uses RAG with Bedrock as primary method, falls back to cached NLP data
        
        Args:
            cached_nlp_data: Cached NLP analysis data from SEC filing (optional, for fallback)
            ticker: Stock ticker symbol
            company_name: Company name
            
        Returns:
            Dictionary with risks, opportunities, key_findings, and risk_score
        """
        # Primary: Use RAG with Bedrock to analyze SEC filing from disk
        if is_aws_configured():
            try:
                rag_result = MarketResearchService._extract_from_filing_analysis_with_rag(ticker, company_name)
                if rag_result.get("risks") or rag_result.get("opportunities") or rag_result.get("key_findings"):
                    return rag_result
            except Exception as e:
                print(f"Warning: RAG analysis failed, falling back to cached NLP data: {e}")
        
        # Fallback: Use cached NLP data if available
        result = {
            "risks": [],
            "opportunities": [],
            "key_findings": [],
            "risk_score": None
        }
        
        if not cached_nlp_data.get("analysis"):
            return result
        
        analysis = cached_nlp_data["analysis"]
        nlp_analysis = analysis.get("nlp_analysis", {})
        risk_analysis = nlp_analysis.get("risk_analysis", {})
        forward_statements = nlp_analysis.get("forward_looking_statements", [])
        sentiment_scores = nlp_analysis.get("sentiment_scores", {})
        trading_signals = analysis.get("trading_signals", {})
        entities = nlp_analysis.get("entities", {})
        anomalies = nlp_analysis.get("anomalies", [])
        risk_categories = risk_analysis.get("risk_categories", [])
        
        filing_date = cached_nlp_data.get("filing_date", "unknown")
        filing_filename = cached_nlp_data.get("filing_filename", "")
        
        # Extract risks from risk_analysis
        # Handle both structures: risk_factors (list) or key_risks (list)
        risk_factors = risk_analysis.get("risk_factors", []) or risk_analysis.get("key_risks", [])
        # Handle both severity field names
        risk_severity = risk_analysis.get("severity", 0) or risk_analysis.get("severity_score", 0)
        risk_count = risk_analysis.get("risk_count", 0)
        
        # If no explicit risk factors, create risks from risk categories
        if not risk_factors and risk_categories:
            for i, category in enumerate(risk_categories[:10], 1):
                if isinstance(category, dict):
                    category_name = category.get("category", "unknown")
                    category_count = category.get("count", 0)
                    if category_count > 0:
                        result["risks"].append({
                            "title": f"{category_name.replace('_', ' ').title()} Risk",
                            "snippet": f"Identified {category_count} instances of {category_name.replace('_', ' ')} risk in SEC filing.",
                            "url": "",
                            "risk_score": max(1, min(10, int(category_count / 50))),  # Score based on count
                            "context": f"Risk category: {category_name.replace('_', ' ').title()} with {category_count} mentions",
                            "detected_keywords": [category_name],
                            "timestamp": filing_date,
                            "source": "SEC Filing",
                            "filing_date": filing_date,
                            "category": category_name
                        })
        
        # Convert risk factors to risk items
        for i, risk_factor in enumerate(risk_factors[:10], 1):  # Top 10 risks
            if isinstance(risk_factor, str):
                risk_text = risk_factor
            elif isinstance(risk_factor, dict):
                risk_text = risk_factor.get("factor", risk_factor.get("text", str(risk_factor)))
            else:
                risk_text = str(risk_factor)
            
            # Calculate risk score based on severity and position
            risk_score = max(1, int(risk_severity / 10) - (i - 1) * 2)  # Decreasing score
            
            result["risks"].append({
                "title": f"Risk Factor {i}: {risk_text[:100]}",
                "snippet": risk_text[:300] if len(risk_text) > 300 else risk_text,
                "url": "",
                "risk_score": max(1, risk_score),
                "context": risk_text[:500],
                "detected_keywords": [kw for kw in MarketResearchService.RISK_KEYWORDS if kw in risk_text.lower()][:5],
                "timestamp": filing_date,
                "source": "SEC Filing",
                "filing_date": filing_date
            })
        
        # If still no risks, create from risk count and severity
        if not result["risks"] and (risk_count > 0 or risk_severity > 0):
            result["risks"].append({
                "title": f"General Risk Factors Identified",
                "snippet": f"SEC filing identifies {risk_count} risk factors with severity score of {risk_severity:.1f}%",
                "url": "",
                "risk_score": max(1, min(10, int(risk_severity / 10))),
                "context": f"Risk analysis from SEC filing: {risk_count} risk factors identified",
                "detected_keywords": ["risk", "factors"],
                "timestamp": filing_date,
                "source": "SEC Filing",
                "filing_date": filing_date
            })
        
        # Extract opportunities from forward-looking statements
        # ALWAYS use forward-looking statements from filing analysis
        # Prioritize positive sentiment, but include all relevant statements
        positive_statements = [
            stmt for stmt in forward_statements
            if isinstance(stmt, dict) and stmt.get("sentiment", 0) > 0
        ]
        
        # If no positive statements, use all forward-looking statements (they contain opportunities)
        all_statements = positive_statements if positive_statements else forward_statements[:20]
        
        for i, statement in enumerate(all_statements[:10], 1):  # Top 10 opportunities
            if isinstance(statement, dict):
                statement_text = statement.get("statement", str(statement))
                statement_sentiment = statement.get("sentiment", 0)
            else:
                statement_text = str(statement)
                statement_sentiment = 0.0  # Default neutral
            
            # Include statements with positive sentiment or growth-oriented keywords
            opportunity_keywords = ["growth", "expansion", "increase", "expect", "plan", "opportunity", 
                                   "future", "development", "innovation", "strategic", "investment", "believe"]
            has_opportunity_keyword = any(kw in statement_text.lower() for kw in opportunity_keywords)
            
            # Always include if it has positive sentiment or opportunity keywords
            if statement_sentiment > 0 or has_opportunity_keyword:
                opportunity_score = max(1, int(abs(statement_sentiment) * 5) if statement_sentiment > 0 else 3)
                
                result["opportunities"].append({
                    "title": f"Forward-Looking Opportunity {i}: {statement_text[:100]}",
                    "snippet": statement_text[:300] if len(statement_text) > 300 else statement_text,
                    "url": "",
                    "opportunity_score": opportunity_score,
                    "detected_keywords": [kw for kw in MarketResearchService.OPPORTUNITY_KEYWORDS if kw in statement_text.lower()][:5],
                    "timestamp": filing_date,
                    "source": "SEC Filing",
                    "filing_date": filing_date,
                    "sentiment": statement_sentiment
                })
        
        # If no opportunities from statements, create from trading signals
        if not result["opportunities"] and trading_signals:
            recommendation = trading_signals.get("recommendation", "HOLD")
            if recommendation in ["BUY", "HOLD"]:
                rationale = trading_signals.get("rationale", [])
                if rationale:
                    for i, reason in enumerate(rationale[:5], 1):
                        if any(kw in reason.lower() for kw in ["growth", "positive", "opportunity", "strength", "improvement"]):
                            result["opportunities"].append({
                                "title": f"Trading Signal Opportunity {i}: {reason[:100]}",
                                "snippet": reason[:300] if len(reason) > 300 else reason,
                                "url": "",
                                "opportunity_score": 3,
                                "detected_keywords": [kw for kw in MarketResearchService.OPPORTUNITY_KEYWORDS if kw in reason.lower()][:5],
                                "timestamp": filing_date,
                                "source": "SEC Filing - Trading Signals",
                                "filing_date": filing_date
                            })
        
        # If still no opportunities, create at least one from forward-looking statements
        if not result["opportunities"] and forward_statements:
            # Take first forward-looking statement as opportunity
            first_stmt = forward_statements[0]
            if isinstance(first_stmt, dict):
                statement_text = first_stmt.get("statement", str(first_stmt))
            else:
                statement_text = str(first_stmt)
            
            result["opportunities"].append({
                "title": f"Forward-Looking Statement: {statement_text[:100]}",
                "snippet": statement_text[:300] if len(statement_text) > 300 else statement_text,
                "url": "",
                "opportunity_score": 2,
                "detected_keywords": [kw for kw in MarketResearchService.OPPORTUNITY_KEYWORDS if kw in statement_text.lower()][:5],
                "timestamp": filing_date,
                "source": "SEC Filing",
                "filing_date": filing_date
            })
        
        # Generate key findings from risks, opportunities, entities, and trading signals
        key_findings = []
        
        # Top 5 risks as key findings
        for risk in result["risks"][:5]:
            key_findings.append({
                "title": risk["title"],
                "summary": risk["snippet"],
                "url": risk.get("url", ""),
                "type": "RISK",
                "timestamp": risk["timestamp"],
                "source": "SEC Filing"
            })
        
        # Top 5 opportunities as key findings
        for opp in result["opportunities"][:5]:
            key_findings.append({
                "title": opp["title"],
                "summary": opp["snippet"],
                "url": opp.get("url", ""),
                "type": "OPPORTUNITY",
                "timestamp": opp["timestamp"],
                "source": "SEC Filing"
            })
        
        # Add key findings from entities (financial metrics)
        financial_metrics = entities.get("financial_metrics", [])
        if financial_metrics:
            unique_metrics = {}
            for metric in financial_metrics[:10]:
                if isinstance(metric, dict):
                    metric_name = metric.get("metric", "unknown")
                    metric_context = metric.get("context", "")
                    if metric_name not in unique_metrics:
                        unique_metrics[metric_name] = metric_context
            
            for metric_name, context in list(unique_metrics.items())[:5]:
                key_findings.append({
                    "title": f"Financial Metric: {metric_name.title()}",
                    "summary": context[:200] if len(context) > 200 else context,
                    "url": "",
                    "type": "INFO",
                    "timestamp": filing_date,
                    "source": "SEC Filing - Financial Metrics"
                })
        
        # Add key findings from trading signals
        if trading_signals:
            recommendation = trading_signals.get("recommendation", "HOLD")
            confidence = trading_signals.get("confidence", 0)
            rationale = trading_signals.get("rationale", [])
            
            if rationale:
                for reason in rationale[:3]:
                    key_findings.append({
                        "title": f"Trading Signal: {recommendation}",
                        "summary": reason[:200] if len(reason) > 200 else reason,
                        "url": "",
                        "type": "RECOMMENDATION" if recommendation != "HOLD" else "INFO",
                        "timestamp": filing_date,
                        "source": "SEC Filing - Trading Signals"
                    })
        
        # If no key findings yet, create summary from analysis
        if not key_findings:
            overall_sentiment = sentiment_scores.get("overall_sentiment", 0) or sentiment_scores.get("compound", 0)
            key_findings.append({
                "title": f"SEC Filing Analysis Summary",
                "summary": f"Analysis of {company_name} ({ticker}) SEC filing: Sentiment {overall_sentiment:.2f}, {risk_count} risk factors, {len(forward_statements)} forward-looking statements",
                "url": "",
                "type": "INFO",
                "timestamp": filing_date,
                "source": "SEC Filing"
            })
        
        result["key_findings"] = key_findings
        
        # Calculate risk score from filing analysis
        # Risk score should be higher if more risks and higher severity
        risk_factor_count = len(risk_factors) or risk_count
        # Use risk categories count if available
        if risk_categories:
            total_category_count = sum(cat.get("count", 0) for cat in risk_categories if isinstance(cat, dict))
            if total_category_count > 0:
                risk_factor_count = max(risk_factor_count, total_category_count // 100)  # Normalize
        
        risk_score = min(100, max(0, (risk_severity * 0.7) + (risk_factor_count * 0.5)))
        
        # Adjust based on sentiment
        overall_sentiment = sentiment_scores.get("overall_sentiment", 0) or sentiment_scores.get("compound", 0)
        if overall_sentiment < -0.2:  # Negative sentiment increases risk
            risk_score = min(100, risk_score + 10)
        elif overall_sentiment > 0.2:  # Positive sentiment decreases risk
            risk_score = max(0, risk_score - 10)
        
        result["risk_score"] = risk_score
        
        return result
    
    @staticmethod
    def _derive_recommendation_from_nlp(nlp_recommendation: str, nlp_score: float, risk_score: float) -> str:
        """
        Derive recommendation from NLP analysis
        
        Args:
            nlp_recommendation: NLP recommendation (BUY/SELL/HOLD)
            nlp_score: NLP strategy score (-1 to 1)
            risk_score: Risk score (0-100)
            
        Returns:
            Recommendation string
        """
        # Map NLP recommendation to risk-based recommendation
        if nlp_recommendation == "BUY":
            # BUY with low risk = LOW_RISK, BUY with high risk = MODERATE_RISK
            if risk_score < 40:
                return "LOW_RISK"
            elif risk_score < 70:
                return "MODERATE_RISK"
            else:
                return "MODERATE_RISK"
        elif nlp_recommendation == "SELL":
            # SELL suggests higher risk
            if risk_score > 70:
                return "HIGH_RISK"
            elif risk_score > 50:
                return "MODERATE_RISK"
            else:
                return "MODERATE_RISK"
        else:  # HOLD
            # HOLD depends on risk score
            if risk_score > 70:
                return "HIGH_RISK"
            elif risk_score > 50:
                return "MODERATE_RISK"
            else:
                return "LOW_RISK"
    
    @staticmethod
    def _should_search_for_question(question: str) -> bool:
        """
        Determine if a question requires additional web search
        
        Args:
            question: User's question
            
        Returns:
            True if search is needed, False otherwise
        """
        question_lower = question.lower()
        
        # Keywords that suggest need for recent/current information
        search_indicators = [
            "recent", "latest", "current", "today", "now", "recently",
            "what happened", "news", "update", "announcement",
            "earnings", "guidance", "forecast", "outlook"
        ]
        
        return any(indicator in question_lower for indicator in search_indicators)

