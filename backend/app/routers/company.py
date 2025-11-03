"""
Company router - Company sentiment assessment endpoint
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from pydantic import BaseModel
import asyncio

from app.models.types import RiskComponent
from app.services.nlp_quant_strategy import NLPQuantStrategy
from app.services.social_sentiment_service import SocialSentimentService
from app.services.courtlistener_service import CourtListenerService
from app.services.sec_enforcement_service import SECEnforcementService
from app.routers.stocks import find_filings_for_ticker, get_filing_content

router = APIRouter()


class SentimentRequest(BaseModel):
    """Request model for sentiment analysis"""
    ticker: str
    portfolio_tickers: Optional[List[str]] = None  # For peer comparison


@router.get("/sentiment")
async def get_company_sentiment(
    ticker: str = Query(..., description="Company ticker symbol"),
    portfolio_tickers: Optional[List[str]] = Query(None, description="List of portfolio tickers for peer comparison"),
    include_reddit: Optional[bool] = Query(None, description="Whether to include Reddit API calls. If not provided, defaults to False to reduce API calls")
):
    """
    Get company sentiment analysis with peer comparison
    
    Sources:
    - SEC filings (section-level sentiment)
    - Twitter/X (rate-limited sample)
    - Reddit (ticker subs)
    - Lawsuits/news (headlines)
    
    Returns:
    {
        "ticker": str,
        "sentiment_risk": RiskComponent,
        "sources": Dict,
        "peer_comparison": Dict
    }
    """
    try:
        ticker = ticker.upper()
        
        # Get company name from filings if available
        company_name = None
        filings = find_filings_for_ticker(ticker)
        filing_text = None
        
        for filing in filings:
            if '10-k' in filing.get('filename', '').lower():
                filing_text = get_filing_content(filing['path'], max_length=50000)
                # Try to extract company name from filing
                if filing_text and not company_name:
                    # Simple extraction - look for common patterns
                    lines = filing_text[:5000].split('\n')
                    for line in lines:
                        if 'company name' in line.lower() or 'registrant' in line.lower():
                            parts = line.split(':')
                            if len(parts) > 1:
                                company_name = parts[1].strip().split('\n')[0].strip()
                                break
                break
        
        # Calculate filing sentiment (using cached NLP if available, otherwise compute)
        filing_sentiment_score = 50.0  # Default
        if filing_text:
            try:
                # Use NLP quant strategy for sentiment
                nlp_result = NLPQuantStrategy.analyze_filing_advanced(
                    document_text=filing_text,
                    ticker=ticker
                )
                sentiment_scores = nlp_result.get("sentiment_scores", {})
                filing_sentiment_score = sentiment_scores.get("compound", 0.0) * 50.0 + 50.0  # Scale to 0-100
            except Exception:
                pass
        
        # Fetch social sentiment from multiple sources (Reddit + NewsAPI)
        # Default include_reddit to False if not explicitly provided
        fetch_reddit = include_reddit if include_reddit is not None else False
        social_sentiment_data = await SocialSentimentService.get_comprehensive_sentiment(
            ticker=ticker,
            company_name=company_name,
            days_back=30,
            include_reddit=fetch_reddit
        )
        social_sentiment_score = social_sentiment_data.get("overall_sentiment_score", 50.0)
        
        # Fetch lawsuit data from CourtListener and SEC
        lawsuit_data = await CourtListenerService.get_company_lawsuits(
            company_name=company_name or ticker,
            ticker=ticker,
            years_back=3
        )
        
        sec_enforcement_data = await SECEnforcementService.get_company_enforcement_actions(
            company_name=company_name or ticker,
            ticker=ticker,
            years_back=2
        )
        
        # Calculate lawsuit signal (0-100 scale)
        # Combine court cases and SEC enforcement actions
        court_lawsuit_score = lawsuit_data.get("lawsuit_score", 0.0)
        sec_enforcement_score = sec_enforcement_data.get("enforcement_score", 0.0)
        
        # Weighted combination: court cases 60%, SEC enforcement 40%
        lawsuit_signal = (court_lawsuit_score * 0.6) + (sec_enforcement_score * 0.4)
        
        # Calculate controversy score based on news lawsuit mentions and active cases
        news_lawsuit_mentions = social_sentiment_data.get("news_sentiment", {}).get("lawsuit_mentions", 0)
        active_cases = len(lawsuit_data.get("active_cases", []))
        recent_cases = len(lawsuit_data.get("recent_cases", []))
        recent_enforcement = len(sec_enforcement_data.get("recent_actions", []))
        
        # Controversy score: higher with more mentions and active/recent legal issues
        controversy_score = min(100.0, (news_lawsuit_mentions * 10) + (active_cases * 15) + (recent_cases * 20) + (recent_enforcement * 25))
        
        # Combine into SentimentRisk component
        # Weighted average (can be calibrated)
        weights = {
            "filing": 0.5,
            "social": 0.3,
            "lawsuit": 0.15,
            "controversy": 0.05
        }
        
        sentiment_risk_score = (
            filing_sentiment_score * weights["filing"] +
            social_sentiment_score * weights["social"] +
            lawsuit_signal * weights["lawsuit"] +
            controversy_score * weights["controversy"]
        )
        
        # Clamp to 0-100
        sentiment_risk_score = max(0.0, min(100.0, sentiment_risk_score))
        
        sentiment_risk = RiskComponent(
            name="SentimentRisk",
            score=float(sentiment_risk_score),
            evidence=None  # TODO: Add evidence spans
        )
        
        # Calculate peer comparison if portfolio tickers provided
        peer_z_score = 0.0
        percentile = 50.0
        
        if portfolio_tickers and len(portfolio_tickers) > 1:
            # TODO: Fetch sentiment for all portfolio tickers and calculate z-score
            # For now, return placeholder values
            pass
        
        return {
            "ticker": ticker,
            "company_name": company_name,
            "sentiment_risk": sentiment_risk.dict(),
            "sources": {
                "filing_sentiment": filing_sentiment_score,
                "social_sentiment": social_sentiment_score,
                "lawsuit_signal": lawsuit_signal,
                "controversy_score": controversy_score,
                "reddit_mentions": social_sentiment_data.get("reddit_sentiment", {}).get("mentions", 0),
                "news_articles": social_sentiment_data.get("news_sentiment", {}).get("total_articles", 0),
                "news_lawsuit_mentions": social_sentiment_data.get("news_sentiment", {}).get("lawsuit_mentions", 0),
                "court_cases": lawsuit_data.get("total_cases", 0),
                "active_cases": len(lawsuit_data.get("active_cases", [])),
                "sec_enforcement_actions": sec_enforcement_data.get("total_actions", 0)
            },
            "details": {
                "reddit_data": social_sentiment_data.get("reddit_sentiment", {}),
                "news_data": social_sentiment_data.get("news_sentiment", {}),
                "lawsuit_data": {
                    "cases": lawsuit_data.get("cases", [])[:5],  # Top 5 cases
                    "recent_cases": lawsuit_data.get("recent_cases", [])[:5],
                    "active_cases": lawsuit_data.get("active_cases", [])[:5]
                },
                "sec_enforcement_data": {
                    "actions": sec_enforcement_data.get("actions", [])[:5],  # Top 5 actions
                    "recent_actions": sec_enforcement_data.get("recent_actions", [])[:5]
                }
            },
            "peer_comparison": {
                "z_score": peer_z_score,
                "percentile": percentile
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing sentiment: {str(e)}")

