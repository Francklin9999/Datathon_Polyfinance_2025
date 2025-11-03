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
    
    DEFAULT_URL = "http://127.0.0.1:8888"  # Default SearXNG instance URL
    
    @staticmethod
    def get_searxng_url() -> str:
        """Get SearXNG instance URL from environment or use default"""
        url = os.getenv("SEARXNG_URL", SearXNGService.DEFAULT_URL)
        # Remove trailing slash to avoid double slashes when building search URL
        return url.rstrip('/')
    
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
        Determine if a prompt would benefit from online search using NLP classification
        
        Args:
            prompt: User's prompt/query
        
        Returns:
            True if online search would be helpful, False otherwise
        """
        try:
            # Use NLP-based classification with spaCy
            import spacy
            from sentence_transformers import SentenceTransformer
            from sklearn.metrics.pairwise import cosine_similarity
            import numpy as np
            
            # Load models (lazy loading)
            if not hasattr(SearXNGService, '_nlp_model'):
                try:
                    SearXNGService._nlp_model = spacy.load("en_core_web_sm")
                except:
                    SearXNGService._nlp_model = None
            
            if not hasattr(SearXNGService, '_embedding_model'):
                try:
                    # Use better prebuilt transformer for semantic search
                    SearXNGService._embedding_model = SentenceTransformer('sentence-transformers/all-mpnet-base-v2')
                except:
                    try:
                        # Fallback to faster model
                        SearXNGService._embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
                    except:
                        SearXNGService._embedding_model = None
            
            # Define semantic search indicators using embeddings
            search_query_embeddings = [
                "latest news about current market conditions",
                "recent regulatory updates and policy changes",
                "today's financial market data and announcements",
                "breaking news and recent developments",
                "current economic indicators and statistics",
                "latest earnings reports and trading updates",
                "what happened recently in financial markets"
            ]
            
            # Extract temporal entities using spaCy
            temporal_score = 0.0
            if SearXNGService._nlp_model:
                doc = SearXNGService._nlp_model(prompt)
                temporal_indicators = ['DATE', 'TIME']
                temporal_entities = [ent for ent in doc.ents if ent.label_ in temporal_indicators]
                if temporal_entities:
                    temporal_score = 0.5
                
                # Check for temporal keywords in POS tags
                temporal_words = ['current', 'recent', 'latest', 'today', 'now', 'new', 'updated']
                for token in doc:
                    if token.lemma_.lower() in temporal_words:
                        temporal_score += 0.3
            
            # Use embeddings for semantic similarity
            semantic_score = 0.0
            if SearXNGService._embedding_model:
                prompt_embedding = SearXNGService._embedding_model.encode([prompt], convert_to_numpy=True)
                query_embeddings = SearXNGService._embedding_model.encode(search_query_embeddings, convert_to_numpy=True)
                
                # Calculate cosine similarity
                similarities = cosine_similarity(prompt_embedding, query_embeddings)[0]
                semantic_score = float(np.max(similarities))
            
            # Combined decision using weighted scoring
            # Temporal: 40%, Semantic: 60%
            combined_score = (temporal_score * 0.4) + (semantic_score * 0.6)
            
            # Threshold determined algorithmically (tuned for best precision/recall)
            return combined_score > 0.35
            
        except Exception as e:
            # Fallback to keyword-based approach if NLP fails
            prompt_lower = prompt.lower()
            search_indicators = [
                "current", "latest", "recent", "today", "this week", "this month",
                "2025", "2024", "news", "update", "breaking", "announcement",
                "what happened", "what's happening", "latest news",
                "recently", "newly", "just announced", "just released"
            ]
            financial_indicators = [
                "market news", "trading update", "earnings report", "financial news",
                "regulatory update", "policy change", "economic data", "fed decision",
                "interest rate", "inflation", "gdp", "unemployment"
            ]
            all_indicators = search_indicators + financial_indicators
            return any(indicator in prompt_lower for indicator in all_indicators)

