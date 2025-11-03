"""
Social Sentiment Service
Combines multiple sources (Reddit, NewsAPI) for comprehensive social sentiment analysis
"""

from typing import Dict, Optional
import logging
from app.services.reddit_service import RedditService
from app.services.newsapi_service import NewsAPIService

logger = logging.getLogger(__name__)


class SocialSentimentService:
    """Service that aggregates social sentiment from multiple sources"""
    
    @staticmethod
    async def get_comprehensive_sentiment(
        ticker: str,
        company_name: Optional[str] = None,
        days_back: int = 30,
        include_reddit: bool = True
    ) -> Dict:
        """
        Get comprehensive social sentiment from multiple sources
        
        Args:
            ticker: Stock ticker symbol
            company_name: Optional company name
            days_back: Number of days to look back
        
        Returns:
            Dict with aggregated sentiment data:
            - overall_sentiment_score: Combined sentiment score (0-100)
            - reddit_sentiment: Reddit sentiment data
            - news_sentiment: News sentiment data
            - sources: Breakdown by source
        """
        ticker = ticker.upper()
        
        # Fetch data from multiple sources concurrently
        reddit_data = None
        news_data = None
        
        # Fetch Reddit sentiment only if requested
        if include_reddit:
            try:
                reddit_data = await RedditService.get_ticker_sentiment(ticker)
            except Exception as e:
                logger.warning(f"Error fetching Reddit sentiment for {ticker}: {e}")
                reddit_data = {
                    "sentiment_score": 50.0,
                    "mentions": 0,
                    "posts": []
                }
        else:
            # Skip Reddit API calls - use default neutral values
            reddit_data = {
                "sentiment_score": 50.0,
                "mentions": 0,
                "posts": []
            }
        
        # Fetch NewsAPI sentiment
        try:
            news_data = await NewsAPIService.get_company_sentiment(
                ticker=ticker,
                company_name=company_name,
                days_back=days_back
            )
        except Exception as e:
            logger.warning(f"Error fetching NewsAPI sentiment for {ticker}: {e}")
            news_data = {
                "sentiment_score": 50.0,
                "total_results": 0,
                "lawsuit_mentions": 0,
                "articles": []
            }
        
        # Combine sentiment scores with weights
        # Reddit: 40% weight, News: 60% weight (or just News if Reddit is skipped)
        reddit_score = reddit_data.get("sentiment_score", 50.0)
        news_score = news_data.get("sentiment_score", 50.0)
        
        if include_reddit:
            overall_sentiment = (reddit_score * 0.4) + (news_score * 0.6)
        else:
            # If Reddit is skipped, use only news sentiment
            overall_sentiment = news_score
        
        return {
            "overall_sentiment_score": overall_sentiment,
            "reddit_sentiment": {
                "score": reddit_score,
                "mentions": reddit_data.get("mentions", 0),
                "posts": reddit_data.get("posts", [])[:10]  # Top 10 posts
            },
            "news_sentiment": {
                "score": news_score,
                "total_articles": news_data.get("total_results", 0),
                "lawsuit_mentions": news_data.get("lawsuit_mentions", 0),
                "articles": news_data.get("articles", [])[:10]  # Top 10 articles
            },
            "sources": {
                "reddit": {
                    "weight": 0.4,
                    "score": reddit_score
                },
                "news": {
                    "weight": 0.6,
                    "score": news_score
                }
            }
        }

