"""
CourtListener API Service
Handles CourtListener/Free Law Project API integration for lawsuit tracking
Free tier available with registration
API: https://www.courtlistener.com/api/
"""

import httpx
from typing import Dict, List, Optional
from datetime import datetime
import os
import logging

logger = logging.getLogger(__name__)


class CourtListenerService:
    """Service for CourtListener API operations"""
    
    BASE_URL = "https://www.courtlistener.com/api/rest/v3"
    
    @staticmethod
    def _get_api_key() -> Optional[str]:
        """Get CourtListener API key from environment"""
        return os.getenv("COURTLISTENER_API_KEY")
    
    @staticmethod
    def _get_headers() -> Dict[str, str]:
        """Get headers for CourtListener API requests"""
        headers = {
            "Content-Type": "application/json"
        }
        api_key = CourtListenerService._get_api_key()
        if api_key:
            headers["Authorization"] = f"Token {api_key}"
        return headers
    
    @staticmethod
    async def search_cases(
        party_name: str,
        max_results: int = 20,
        ordering: str = "-date_filed"  # -date_filed for newest first
    ) -> List[Dict]:
        """
        Search for court cases by party name
        
        Args:
            party_name: Company name or party name to search
            max_results: Maximum number of results to return
            ordering: Ordering field (-date_filed for newest first)
        
        Returns:
            List of case dictionaries
        """
        api_key = CourtListenerService._get_api_key()
        if not api_key:
            logger.warning("CourtListener API key not found. Cases search will be limited.")
            # Note: Some endpoints may work without auth, but results are limited
        
        try:
            url = f"{CourtListenerService.BASE_URL}/search/"
            params = {
                "q": f"party_name:{party_name}",
                "page_size": min(max_results, 100),
                "ordering": ordering,
                "filed_after": (datetime.now().year - 3)  # Last 3 years
            }
            
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(
                    url,
                    headers=CourtListenerService._get_headers(),
                    params=params
                )
                
                if response.status_code == 401:
                    logger.warning("CourtListener API authentication failed. Some features may be limited.")
                    return []
                
                response.raise_for_status()
                data = response.json()
                
                cases = []
                if "results" in data:
                    for result in data["results"]:
                        cases.append({
                            "case_name": result.get("case_name", ""),
                            "date_filed": result.get("date_filed", ""),
                            "date_terminated": result.get("date_terminated", ""),
                            "court": result.get("court", ""),
                            "court_id": result.get("court_id", ""),
                            "docket_number": result.get("docket_number", ""),
                            "absolute_url": result.get("absolute_url", ""),
                            "nature_of_suit": result.get("nature_of_suit", ""),
                            "id": result.get("id", "")
                        })
                
                return cases[:max_results]
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429:
                logger.warning("CourtListener API rate limit exceeded")
            else:
                logger.warning(f"CourtListener API HTTP error: {e}")
            return []
        except Exception as e:
            logger.warning(f"Error searching CourtListener for {party_name}: {e}")
            return []
    
    @staticmethod
    async def get_company_lawsuits(
        company_name: str,
        ticker: Optional[str] = None,
        years_back: int = 3
    ) -> Dict:
        """
        Get lawsuit information for a company
        
        Args:
            company_name: Company name to search
            ticker: Optional ticker symbol
            years_back: Number of years to look back
        
        Returns:
            Dict with:
            - cases: List of case dictionaries
            - total_cases: Total number of cases found
            - recent_cases: Cases from last year
            - active_cases: Cases without termination date
        """
        # Search with company name
        cases = await CourtListenerService.search_cases(
            party_name=company_name,
            max_results=50
        )
        
        # Also try searching with ticker if provided
        if ticker:
            ticker_cases = await CourtListenerService.search_cases(
                party_name=ticker,
                max_results=20
            )
            # Merge cases, avoiding duplicates
            existing_case_ids = {case.get("id") for case in cases}
            for case in ticker_cases:
                if case.get("id") not in existing_case_ids:
                    cases.append(case)
        
        if not cases:
            return {
                "cases": [],
                "total_cases": 0,
                "recent_cases": [],
                "active_cases": [],
                "lawsuit_score": 0.0
            }
        
        # Categorize cases
        recent_cases = []
        active_cases = []
        cutoff_date = datetime.now().replace(year=datetime.now().year - 1)
        
        for case in cases:
            date_filed = case.get("date_filed", "")
            date_terminated = case.get("date_terminated", "")
            
            # Check if recent (within last year)
            if date_filed:
                try:
                    filed_date = datetime.fromisoformat(date_filed.replace('Z', '+00:00'))
                    if filed_date >= cutoff_date:
                        recent_cases.append(case)
                except Exception:
                    pass
            
            # Check if active (no termination date)
            if not date_terminated:
                active_cases.append(case)
        
        # Calculate lawsuit score (0-100)
        # Higher score = more lawsuits, especially recent/active ones
        base_score = min(100.0, len(cases) * 5)  # 5 points per case, max 100
        recent_penalty = len(recent_cases) * 10  # Additional 10 points per recent case
        active_penalty = len(active_cases) * 10  # Additional 10 points per active case
        
        lawsuit_score = min(100.0, base_score + recent_penalty + active_penalty)
        
        return {
            "cases": cases[:30],  # Limit to top 30
            "total_cases": len(cases),
            "recent_cases": recent_cases[:10],
            "active_cases": active_cases[:10],
            "lawsuit_score": lawsuit_score
        }

