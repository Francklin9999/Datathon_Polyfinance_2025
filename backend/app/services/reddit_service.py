"""
Reddit API Service
Handles Reddit API integration for social sentiment analysis
Uses Reddit's public JSON API (no authentication required for read access)
Includes caching to avoid redundant API calls
"""

import httpx
import asyncio
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import os
import logging
from pathlib import Path
import json

logger = logging.getLogger(__name__)


class RedditService:
    """Service for Reddit API operations with caching"""
    
    BASE_URL = "https://www.reddit.com"
    USER_AGENT = "PolyFinance/1.0 by /u/polyfinance (Financial Analytics Platform)"
    
    # In-memory cache: {ticker: {data: Dict, timestamp: datetime}}
    _cache: Dict[str, Dict] = {}
    
    # Cache TTL: 6 hours (Reddit data doesn't change frequently)
    CACHE_TTL_HOURS = 6
    
    @staticmethod
    def _get_cache_key(ticker: str) -> str:
        """Get cache key for a ticker"""
        return f"reddit:{ticker.upper()}"
    
    @staticmethod
    def _is_cache_valid(cache_entry: Dict) -> bool:
        """Check if cache entry is still valid"""
        if not cache_entry or 'timestamp' not in cache_entry:
            return False
        
        timestamp = cache_entry['timestamp']
        if isinstance(timestamp, str):
            timestamp = datetime.fromisoformat(timestamp)
        
        age = datetime.now() - timestamp
        return age < timedelta(hours=RedditService.CACHE_TTL_HOURS)
    
    @staticmethod
    def _get_from_cache(ticker: str) -> Optional[Dict]:
        """Get Reddit data from cache if available and valid"""
        cache_key = RedditService._get_cache_key(ticker)
        cache_entry = RedditService._cache.get(cache_key)
        
        if cache_entry and RedditService._is_cache_valid(cache_entry):
            logger.debug(f"Using cached Reddit data for {ticker}")
            return cache_entry.get('data')
        
        return None
    
    @staticmethod
    def _save_to_cache(ticker: str, data: Dict):
        """Save Reddit data to cache"""
        cache_key = RedditService._get_cache_key(ticker)
        RedditService._cache[cache_key] = {
            'data': data,
            'timestamp': datetime.now()
        }
    
    @staticmethod
    def _get_headers() -> Dict[str, str]:
        """Get headers for Reddit API requests"""
        return {
            "User-Agent": RedditService.USER_AGENT
        }
    
    @staticmethod
    async def search_subreddit(
        subreddit: str,
        query: str,
        limit: int = 25,
        sort: str = "relevance",
        time_filter: str = "month"  # hour, day, week, month, year, all
    ) -> List[Dict]:
        """
        Search posts in a subreddit
        
        Args:
            subreddit: Subreddit name (e.g., 'stocks', 'investing')
            query: Search query (e.g., ticker symbol)
            limit: Maximum number of results (1-100)
            sort: Sort order (relevance, hot, top, new, comments)
            time_filter: Time filter for sorting (hour, day, week, month, year, all)
        
        Returns:
            List of post dictionaries with title, score, comments, url, created_utc, etc.
        """
        try:
            url = f"{RedditService.BASE_URL}/r/{subreddit}/search.json"
            params = {
                "q": query,
                "limit": min(limit, 100),
                "sort": sort,
                "restrict_sr": "true",  # Restrict to subreddit
                "t": time_filter
            }
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    url,
                    headers=RedditService._get_headers(),
                    params=params
                )
                response.raise_for_status()
                data = response.json()
                
                posts = []
                if "data" in data and "children" in data["data"]:
                    for child in data["data"]["children"]:
                        post_data = child.get("data", {})
                        posts.append({
                            "title": post_data.get("title", ""),
                            "score": post_data.get("score", 0),
                            "num_comments": post_data.get("num_comments", 0),
                            "url": post_data.get("url", ""),
                            "permalink": f"{RedditService.BASE_URL}{post_data.get('permalink', '')}",
                            "created_utc": post_data.get("created_utc", 0),
                            "selftext": post_data.get("selftext", ""),
                            "author": post_data.get("author", ""),
                            "subreddit": post_data.get("subreddit", "")
                        })
                
                return posts
        except Exception as e:
            logger.warning(f"Error searching Reddit subreddit {subreddit} for {query}: {e}")
            return []
    
    @staticmethod
    async def get_ticker_sentiment(
        ticker: str,
        limit_per_subreddit: int = 10,
        use_cache: bool = True
    ) -> Dict:
        """
        Get sentiment data for a ticker across relevant subreddits
        
        Args:
            ticker: Stock ticker symbol
            limit_per_subreddit: Number of posts to fetch per subreddit
            use_cache: Whether to use cached data if available
        
        Returns:
            Dict with:
            - posts: List of relevant posts
            - average_score: Average post score
            - total_comments: Total comment count
            - mentions: Number of mentions
            - sentiment_score: Calculated sentiment score (0-100)
        """
        ticker = ticker.upper()
        
        # Check cache first
        if use_cache:
            cached_data = RedditService._get_from_cache(ticker)
            if cached_data:
                return cached_data
        
        subreddits = ["stocks", "investing", "StockMarket", "wallstreetbets", "SecurityAnalysis"]
        
        all_posts = []
        
        # Fetch from all subreddits in parallel (no delays)
        tasks = []
        for subreddit in subreddits:
            tasks.append(RedditService.search_subreddit(
                subreddit=subreddit,
                query=ticker,
                limit=limit_per_subreddit,
                sort="hot",
                time_filter="month"
            ))
        
        # Wait for all requests to complete in parallel
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Collect posts from all results
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                logger.warning(f"Error fetching from r/{subreddits[i]}: {result}")
                continue
            all_posts.extend(result)
        
        if not all_posts:
            return {
                "posts": [],
                "average_score": 0.0,
                "total_comments": 0,
                "mentions": 0,
                "sentiment_score": 50.0  # Neutral default
            }
        
        # Calculate metrics
        total_score = sum(post.get("score", 0) for post in all_posts)
        total_comments = sum(post.get("num_comments", 0) for post in all_posts)
        avg_score = total_score / len(all_posts) if all_posts else 0.0
        
        # Simple sentiment score based on post scores and comments
        # Higher engagement (score + comments) = more positive sentiment (if positive scores)
        # This is a simplified heuristic - could be improved with NLP
        engagement_score = (total_score + total_comments * 0.1) / len(all_posts) if all_posts else 0.0
        
        # Normalize to 0-100 scale (rough heuristic)
        # Positive engagement (>0) -> 50-100, Negative (<0) -> 0-50
        if engagement_score > 0:
            sentiment_score = min(100.0, 50.0 + min(50.0, engagement_score * 0.1))
        elif engagement_score < 0:
            sentiment_score = max(0.0, 50.0 + max(-50.0, engagement_score * 0.1))
        else:
            sentiment_score = 50.0  # Neutral if no engagement
        
        result = {
            "posts": all_posts[:50],  # Limit to top 50 posts
            "average_score": avg_score,
            "total_comments": total_comments,
            "mentions": len(all_posts),
            "sentiment_score": sentiment_score
        }
        
        # Cache the result
        if use_cache:
            RedditService._save_to_cache(ticker, result)
        
        return result
    
    @staticmethod
    async def get_comments(
        post_id: str,
        limit: int = 25
    ) -> List[Dict]:
        """
        Get comments for a Reddit post
        
        Args:
            post_id: Reddit post ID
            limit: Maximum number of comments
        
        Returns:
            List of comment dictionaries
        """
        try:
            url = f"{RedditService.BASE_URL}/comments/{post_id}.json"
            params = {"limit": limit}
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    url,
                    headers=RedditService._get_headers(),
                    params=params
                )
                response.raise_for_status()
                data = response.json()
                
                comments = []
                if len(data) > 1 and "data" in data[1]:
                    for child in data[1]["data"].get("children", []):
                        comment_data = child.get("data", {})
                        if comment_data.get("body"):
                            comments.append({
                                "body": comment_data.get("body", ""),
                                "score": comment_data.get("score", 0),
                                "created_utc": comment_data.get("created_utc", 0),
                                "author": comment_data.get("author", "")
                            })
                
                return comments
        except Exception as e:
            logger.warning(f"Error fetching comments for post {post_id}: {e}")
            return []

