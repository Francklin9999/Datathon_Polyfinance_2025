"""
Portfolio Service - Builds and manages equal-weight portfolios from filing universe
"""

from typing import Dict, List, Optional
from pathlib import Path
from datetime import datetime, timedelta
import os

from app.models.types import Portfolio


class PortfolioService:
    """Service for building and managing portfolios"""
    
    # Path to fillings directory
    FILLINGS_DIR = Path(__file__).parent.parent.parent.parent / "fillings"
    
    @staticmethod
    def init_equal_weight_universe(
        universe_cutoff_months: int = 18
    ) -> Portfolio:
        """
        Build equal-weight portfolio from tickers with recent filings (10-K/10-Q)
        in the last N months.
        
        Args:
            universe_cutoff_months: Number of months to look back for recent filings
            
        Returns:
            Portfolio with equal weights for all tickers with recent filings
        """
        cutoff_date = datetime.now() - timedelta(days=universe_cutoff_months * 30)
        
        # Find all tickers with recent filings
        tickers_with_filings = PortfolioService._find_tickers_with_recent_filings(
            cutoff_date=cutoff_date
        )
        
        if not tickers_with_filings:
            # Fallback: return empty portfolio or use all available tickers
            tickers_with_filings = PortfolioService._find_all_available_tickers()
        
        # Calculate equal weight (1/N)
        num_holdings = len(tickers_with_filings)
        equal_weight = 1.0 / num_holdings if num_holdings > 0 else 0.0
        
        # Build holdings dictionary
        holdings = {ticker: equal_weight for ticker in tickers_with_filings}
        
        return Portfolio(
            asof=datetime.now().isoformat(),
            holdings=holdings,
            meta={
                "source": "equal_weight_universe",
                "num_holdings": num_holdings,
                "universe_cutoff_months": universe_cutoff_months,
                "equal_weight": equal_weight
            }
        )
    
    @staticmethod
    def _find_tickers_with_recent_filings(cutoff_date: datetime) -> List[str]:
        """
        Find all tickers that have 10-K or 10-Q filings after cutoff_date
        """
        tickers = set()
        
        if not PortfolioService.FILLINGS_DIR.exists():
            return []
        
        # Iterate through ticker directories
        for ticker_dir in PortfolioService.FILLINGS_DIR.iterdir():
            if not ticker_dir.is_dir():
                continue
            
            ticker = ticker_dir.name.upper()
            
            # Check files in this ticker's directory
            for file_path in ticker_dir.iterdir():
                if not file_path.is_file():
                    continue
                
                filename_lower = file_path.name.lower()
                
                # Check if it's a 10-K or 10-Q filing
                is_10k = '10-k' in filename_lower or '10k' in filename_lower
                is_10q = '10-q' in filename_lower or '10q' in filename_lower
                
                if not (is_10k or is_10q):
                    continue
                
                # Try to extract date from filename
                # Format: YYYY-MM-DD-10k-TICKER.html or similar
                try:
                    # Get file modification time as fallback
                    file_mtime = datetime.fromtimestamp(file_path.stat().st_mtime)
                    
                    # Try to parse date from filename
                    parts = file_path.stem.split('-')
                    if len(parts) >= 3:
                        try:
                            file_date = datetime.strptime(
                                f"{parts[0]}-{parts[1]}-{parts[2]}",
                                "%Y-%m-%d"
                            )
                        except:
                            file_date = file_mtime
                    else:
                        file_date = file_mtime
                    
                    # If file is recent enough, add ticker
                    if file_date >= cutoff_date:
                        tickers.add(ticker)
                        break  # Found one recent filing, no need to check more
                
                except Exception:
                    # If parsing fails, use file modification time
                    try:
                        file_mtime = datetime.fromtimestamp(file_path.stat().st_mtime)
                        if file_mtime >= cutoff_date:
                            tickers.add(ticker)
                            break
                    except:
                        pass
        
        return sorted(list(tickers))
    
    @staticmethod
    def _find_all_available_tickers() -> List[str]:
        """
        Fallback: find all tickers that have any filings
        """
        tickers = set()
        
        if not PortfolioService.FILLINGS_DIR.exists():
            return []
        
        for ticker_dir in PortfolioService.FILLINGS_DIR.iterdir():
            if ticker_dir.is_dir():
                tickers.add(ticker_dir.name.upper())
        
        return sorted(list(tickers))
    
    @staticmethod
    def get_portfolio_stats(portfolio: Portfolio) -> Dict:
        """
        Get statistics about a portfolio
        """
        holdings = portfolio.holdings
        num_holdings = len(holdings)
        total_weight = sum(holdings.values())
        
        return {
            "num_holdings": num_holdings,
            "total_weight": total_weight,
            "equal_weight": 1.0 / num_holdings if num_holdings > 0 else 0.0,
            "tickers": sorted(list(holdings.keys()))
        }

