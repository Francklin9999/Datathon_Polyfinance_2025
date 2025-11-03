"""
SEC Enforcement Actions Service
Handles SEC RSS feed parsing for enforcement actions and litigation releases
"""

import httpx
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from xml.etree import ElementTree as ET
import logging
import re

logger = logging.getLogger(__name__)


class SECEnforcementService:
    """Service for SEC enforcement actions and litigation releases"""
    
    LITIGATION_RELEASES_RSS = "https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=lit-rel&company=&dateb=&owner=include&start=0&count=100&output=atom"
    ENFORCEMENT_ACTIONS_RSS = "https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=admin-proceedings&company=&dateb=&owner=include&start=0&count=100&output=atom"
    
    @staticmethod
    async def parse_rss_feed(url: str) -> List[Dict]:
        """
        Parse an RSS/Atom feed from SEC
        
        Args:
            url: RSS feed URL
        
        Returns:
            List of feed entry dictionaries
        """
        try:
            headers = {
                "User-Agent": "IntelliRisk/1.0 (Financial Analytics Platform)"
            }
            
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(url, headers=headers)
                response.raise_for_status()
                
                # Parse XML
                root = ET.fromstring(response.content)
                
                entries = []
                
                # Handle Atom feed format
                for entry in root.findall(".//{http://www.w3.org/2005/Atom}entry"):
                    title_elem = entry.find("{http://www.w3.org/2005/Atom}title")
                    link_elem = entry.find("{http://www.w3.org/2005/Atom}link")
                    published_elem = entry.find("{http://www.w3.org/2005/Atom}published")
                    summary_elem = entry.find("{http://www.w3.org/2005/Atom}summary")
                    
                    title = title_elem.text if title_elem is not None else ""
                    link = link_elem.get("href") if link_elem is not None else ""
                    published = published_elem.text if published_elem is not None else ""
                    summary = summary_elem.text if summary_elem is not None else ""
                    
                    entries.append({
                        "title": title,
                        "link": link,
                        "published": published,
                        "summary": summary
                    })
                
                return entries
        except Exception as e:
            logger.warning(f"Error parsing SEC RSS feed {url}: {e}")
            return []
    
    @staticmethod
    async def search_enforcement_actions(
        company_name: Optional[str] = None,
        ticker: Optional[str] = None,
        days_back: int = 365
    ) -> List[Dict]:
        """
        Search SEC enforcement actions and litigation releases
        
        Args:
            company_name: Company name to search for
            ticker: Ticker symbol to search for
            days_back: Number of days to look back
        
        Returns:
            List of enforcement action dictionaries
        """
        cutoff_date = datetime.now() - timedelta(days=days_back)
        
        all_entries = []
        
        # Fetch litigation releases
        try:
            litigation_entries = await SECEnforcementService.parse_rss_feed(
                SECEnforcementService.LITIGATION_RELEASES_RSS
            )
            all_entries.extend([{**entry, "type": "litigation_release"} for entry in litigation_entries])
        except Exception as e:
            logger.warning(f"Error fetching litigation releases: {e}")
        
        # Fetch enforcement actions
        try:
            enforcement_entries = await SECEnforcementService.parse_rss_feed(
                SECEnforcementService.ENFORCEMENT_ACTIONS_RSS
            )
            all_entries.extend([{**entry, "type": "enforcement_action"} for entry in enforcement_entries])
        except Exception as e:
            logger.warning(f"Error fetching enforcement actions: {e}")
        
        # Filter by date and company if specified
        filtered_entries = []
        search_terms = []
        
        if company_name:
            search_terms.append(company_name.upper())
        if ticker:
            search_terms.append(ticker.upper())
        
        for entry in all_entries:
            # Check date
            published = entry.get("published", "")
            if published:
                try:
                    pub_date = datetime.fromisoformat(published.replace('Z', '+00:00'))
                    if pub_date < cutoff_date:
                        continue
                except Exception:
                    # If date parsing fails, include it
                    pass
            
            # Check if matches company/ticker
            if search_terms:
                title = entry.get("title", "").upper()
                summary = entry.get("summary", "").upper()
                text = f"{title} {summary}"
                
                if not any(term in text for term in search_terms):
                    continue
            
            filtered_entries.append(entry)
        
        # Sort by published date (newest first)
        filtered_entries.sort(
            key=lambda x: x.get("published", ""),
            reverse=True
        )
        
        return filtered_entries[:50]  # Limit to top 50
    
    @staticmethod
    async def get_company_enforcement_actions(
        company_name: str,
        ticker: Optional[str] = None,
        years_back: int = 2
    ) -> Dict:
        """
        Get SEC enforcement actions for a company
        
        Args:
            company_name: Company name
            ticker: Optional ticker symbol
            years_back: Number of years to look back
        
        Returns:
            Dict with:
            - actions: List of enforcement actions
            - total_actions: Total number of actions found
            - recent_actions: Actions from last 6 months
            - enforcement_score: Calculated risk score (0-100)
        """
        actions = await SECEnforcementService.search_enforcement_actions(
            company_name=company_name,
            ticker=ticker,
            days_back=years_back * 365
        )
        
        if not actions:
            return {
                "actions": [],
                "total_actions": 0,
                "recent_actions": [],
                "enforcement_score": 0.0
            }
        
        # Categorize recent actions (last 6 months)
        recent_cutoff = datetime.now() - timedelta(days=180)
        recent_actions = []
        
        for action in actions:
            published = action.get("published", "")
            if published:
                try:
                    pub_date = datetime.fromisoformat(published.replace('Z', '+00:00'))
                    if pub_date >= recent_cutoff:
                        recent_actions.append(action)
                except Exception:
                    pass
        
        # Calculate enforcement score (0-100)
        # Higher score = more enforcement actions, especially recent ones
        base_score = min(100.0, len(actions) * 15)  # 15 points per action, max 100
        recent_penalty = len(recent_actions) * 20  # Additional 20 points per recent action
        
        enforcement_score = min(100.0, base_score + recent_penalty)
        
        return {
            "actions": actions[:20],  # Limit to top 20
            "total_actions": len(actions),
            "recent_actions": recent_actions[:10],
            "enforcement_score": enforcement_score
        }

