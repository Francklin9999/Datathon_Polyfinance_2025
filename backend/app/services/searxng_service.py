"""
SearXNG Service
Handles online search capabilities for RAG system
"""

import os
import httpx
from typing import Dict, List, Optional
from urllib.parse import urlencode


class SearXNGService:
    """Service for SearXNG search operations"""
    
    DEFAULT_URL = "http://localhost:8080"  # Default SearXNG instance URL
    
    @staticmethod
    def get_searxng_url() -> str:
        """Get SearXNG instance URL from environment or use default"""
        return os.getenv("SEARXNG_URL", SearXNGService.DEFAULT_URL)
    
    @staticmethod
    def search(
        query: str,
        categories: Optional[List[str]] = None,
        engines: Optional[List[str]] = None,
        max_results: int = 10,
        timeout: float = 10.0
    ) -> Dict:
        """
        Perform a search using SearXNG
        
        Args:
            query: Search query string
            categories: Optional list of categories to search (e.g., ['general', 'news', 'finance'])
            engines: Optional list of specific engines to use
            max_results: Maximum number of results to return
            timeout: Request timeout in seconds
        
        Returns:
            Dict with search results including:
            - results: List of search result dicts with title, url, content, etc.
            - query: The original query
            - number_of_results: Total number of results
        """
        searxng_url = SearXNGService.get_searxng_url()
        
        # Build search URL
        search_params = {
            "q": query,
            "format": "json"
        }
        
        if categories:
            search_params["categories"] = ",".join(categories)
        
        if engines:
            search_params["engines"] = ",".join(engines)
        
        search_url = f"{searxng_url}/search?{urlencode(search_params)}"
        
        try:
            with httpx.Client(timeout=timeout) as client:
                response = client.get(search_url)
                response.raise_for_status()
                data = response.json()
                
                # Extract and format results
                results = data.get("results", [])[:max_results]
                
                formatted_results = []
                for result in results:
                    formatted_results.append({
                        "title": result.get("title", ""),
                        "url": result.get("url", ""),
                        "content": result.get("content", ""),
                        "engine": result.get("engine", ""),
                        "score": result.get("score", 0.0)
                    })
                
                return {
                    "success": True,
                    "query": query,
                    "results": formatted_results,
                    "number_of_results": len(formatted_results),
                    "search_url": search_url
                }
        
        except httpx.TimeoutException:
            return {
                "success": False,
                "error": "Search request timed out",
                "query": query,
                "results": []
            }
        except httpx.RequestError as e:
            return {
                "success": False,
                "error": f"Search request failed: {str(e)}",
                "query": query,
                "results": []
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Unexpected error during search: {str(e)}",
                "query": query,
                "results": []
            }
    
    @staticmethod
    def search_and_format_context(query: str, max_results: int = 5) -> str:
        """
        Perform a search and format results as context text for LLM
        
        Args:
            query: Search query string
            max_results: Maximum number of results to include
        
        Returns:
            Formatted string with search results to be used as context
        """
        search_result = SearXNGService.search(
            query=query,
            categories=["general", "news"],  # Focus on general and news for financial queries
            max_results=max_results
        )
        
        if not search_result.get("success") or not search_result.get("results"):
            return f"[Online search unavailable or returned no results for query: '{query}']"
        
        formatted_context = f"=== Online Search Results for: '{query}' ===\n\n"
        
        for i, result in enumerate(search_result["results"], 1):
            formatted_context += f"Result {i}:\n"
            formatted_context += f"Title: {result['title']}\n"
            formatted_context += f"URL: {result['url']}\n"
            formatted_context += f"Content: {result['content'][:500]}...\n\n"  # Limit content length
        
        formatted_context += "=== End of Search Results ===\n"
        
        return formatted_context
    
    @staticmethod
    def should_search_online(prompt: str) -> bool:
        """
        Determine if a prompt would benefit from online search
        
        Args:
            prompt: User's prompt/query
        
        Returns:
            True if online search would be helpful, False otherwise
        """
        prompt_lower = prompt.lower()
        
        # Keywords that indicate need for current/recent information
        search_indicators = [
            "current", "latest", "recent", "today", "this week", "this month",
            "2025", "2024", "news", "update", "breaking", "announcement",
            "what happened", "what's happening", "latest news",
            "recently", "newly", "just announced", "just released"
        ]
        
        # Financial-specific indicators
        financial_indicators = [
            "market news", "trading update", "earnings report", "financial news",
            "regulatory update", "policy change", "economic data", "fed decision",
            "interest rate", "inflation", "gdp", "unemployment"
        ]
        
        all_indicators = search_indicators + financial_indicators
        
        return any(indicator in prompt_lower for indicator in all_indicators)

