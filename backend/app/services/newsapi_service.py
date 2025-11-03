"""
NewsAPI Service
Handles NewsAPI integration for news sentiment and lawsuit mentions
Free tier: 100 requests/day
"""

import httpx
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import os
import logging

logger = logging.getLogger(__name__)


class NewsAPIService:
    """Service for NewsAPI operations"""
    
    BASE_URL = "https://newsapi.org/v2"
    
    @staticmethod
    def _get_api_key() -> Optional[str]:
        """Get NewsAPI key from environment"""
        return os.getenv("NEWSAPI_KEY")
    
    @staticmethod
    async def search_news(
        query: str,
        company_name: Optional[str] = None,
        page_size: int = 20,
        page: int = 1,
        sort_by: str = "publishedAt",  # relevancy, popularity, publishedAt
        language: str = "en"
    ) -> Dict:
        """
        Search for news articles
        
        Args:
            query: Search query (e.g., ticker symbol or company name)
            company_name: Optional company name for better search
            page_size: Number of results per page (max 100)
            page: Page number
            sort_by: Sort order (relevancy, popularity, publishedAt)
            language: Language code (e.g., 'en')
        
        Returns:
            Dict with:
            - articles: List of article dictionaries
            - totalResults: Total number of results
            - status: API status
        """
        api_key = NewsAPIService._get_api_key()
        if not api_key:
            logger.warning("NewsAPI key not found in environment. Skipping NewsAPI requests.")
            return {
                "articles": [],
                "totalResults": 0,
                "status": "error",
                "message": "API key not configured"
            }
        
        try:
            # Build query - include both ticker and company name if available
            search_query = query
            if company_name:
                search_query = f'"{query}" OR "{company_name}"'
            
            url = f"{NewsAPIService.BASE_URL}/everything"
            params = {
                "q": search_query,
                "pageSize": min(page_size, 100),
                "page": page,
                "sortBy": sort_by,
                "language": language,
                "apiKey": api_key
            }
            
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()
                
                return {
                    "articles": data.get("articles", []),
                    "totalResults": data.get("totalResults", 0),
                    "status": data.get("status", "ok")
                }
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429:
                logger.warning("NewsAPI rate limit exceeded")
                return {
                    "articles": [],
                    "totalResults": 0,
                    "status": "error",
                    "message": "Rate limit exceeded"
                }
            logger.warning(f"NewsAPI HTTP error: {e}")
            return {
                "articles": [],
                "totalResults": 0,
                "status": "error",
                "message": str(e)
            }
        except Exception as e:
            logger.warning(f"Error searching NewsAPI for {query}: {e}")
            return {
                "articles": [],
                "totalResults": 0,
                "status": "error",
                "message": str(e)
            }
    
    @staticmethod
    async def get_company_sentiment(
        ticker: str,
        company_name: Optional[str] = None,
        days_back: int = 30
    ) -> Dict:
        """
        Get sentiment data from news articles for a company
        
        Args:
            ticker: Stock ticker symbol
            company_name: Optional company name for better search
            days_back: Number of days to look back
        
        Returns:
            Dict with:
            - articles: List of articles
            - total_results: Total number of articles found
            - sentiment_score: Calculated sentiment score (0-100)
            - lawsuit_mentions: Number of articles mentioning lawsuits
        """
        # Calculate date range
        to_date = datetime.now()
        from_date = to_date - timedelta(days=days_back)
        
        # Search for news
        results = await NewsAPIService.search_news(
            query=ticker,
            company_name=company_name,
            page_size=50,
            sort_by="publishedAt"
        )
        
        articles = results.get("articles", [])
        
        if not articles:
            return {
                "articles": [],
                "total_results": 0,
                "sentiment_score": 50.0,  # Neutral default
                "lawsuit_mentions": 0,
                "lawsuit_articles": []
            }
        
        # Filter articles by date
        filtered_articles = []
        lawsuit_articles = []
        
        for article in articles:
            published_at = article.get("publishedAt", "")
            if published_at:
                try:
                    pub_date = datetime.fromisoformat(published_at.replace('Z', '+00:00'))
                    if pub_date >= from_date:
                        filtered_articles.append(article)
                        
                        # Check for lawsuit keywords
                        title = article.get("title", "").lower()
                        description = article.get("description", "").lower()
                        content = f"{title} {description}"
                        
                        lawsuit_keywords = [
                            "lawsuit", "litigation", "sued", "legal action",
                            "court", "settlement", "complaint", "lawsuit",
                            "enforcement action", "regulatory action", "sec enforcement"
                        ]
                        
                        if any(keyword in content for keyword in lawsuit_keywords):
                            lawsuit_articles.append(article)
                except Exception:
                    # If date parsing fails, include the article
                    filtered_articles.append(article)
        
        # Simple sentiment scoring based on title/description keywords
        # This is a heuristic - could be improved with NLP sentiment analysis
        positive_keywords = ["growth", "profit", "gain", "up", "rise", "positive", "success", "beat"]
        negative_keywords = ["loss", "decline", "down", "fall", "miss", "negative", "fail", "drop", "lawsuit", "sued"]
        
        sentiment_scores = []
        for article in filtered_articles:
            title = article.get("title", "").lower()
            description = article.get("description", "").lower()
            text = f"{title} {description}"
            
            positive_count = sum(1 for kw in positive_keywords if kw in text)
            negative_count = sum(1 for kw in negative_keywords if kw in text)
            
            # Simple scoring: positive keywords add, negative subtract
            score = 50.0 + (positive_count * 5) - (negative_count * 10)
            score = max(0.0, min(100.0, score))
            sentiment_scores.append(score)
        
        avg_sentiment = sum(sentiment_scores) / len(sentiment_scores) if sentiment_scores else 50.0
        
        return {
            "articles": filtered_articles[:30],  # Limit to top 30
            "total_results": len(filtered_articles),
            "sentiment_score": avg_sentiment,
            "lawsuit_mentions": len(lawsuit_articles),
            "lawsuit_articles": lawsuit_articles[:10]  # Top 10 lawsuit articles
        }

