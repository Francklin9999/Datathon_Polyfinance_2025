"""
NLP Analysis Cache Service
Pre-computes and caches NLP analysis results for all tickers at startup
Uses multithreading for parallel processing and BeautifulSoup for HTML parsing
"""

import asyncio
from typing import Dict, List, Optional, Any
from pathlib import Path
import json
from datetime import datetime, timedelta
import re
from concurrent.futures import ThreadPoolExecutor
import os
import numpy as np
import multiprocessing

try:
    from bs4 import BeautifulSoup
    BEAUTIFULSOUP_AVAILABLE = True
except ImportError:
    BEAUTIFULSOUP_AVAILABLE = False
    print("Warning: BeautifulSoup not available. Install with: pip install beautifulsoup4")

from app.services.portfolio_service import PortfolioService
from app.services.nlp_quant_strategy import NLPQuantStrategy


def make_json_serializable(obj: Any) -> Any:
    """
    Convert numpy types and other non-serializable types to JSON-serializable Python types
    
    Args:
        obj: Object to convert
        
    Returns:
        JSON-serializable version of the object
    """
    # Handle None
    if obj is None:
        return None
    
    # Handle numpy types (check before Python native types)
    # This catches numpy.bool_, numpy.int_, numpy.float_, etc.
    if isinstance(obj, np.generic):
        try:
            return obj.item()  # Convert numpy scalar to Python native type
        except (AttributeError, ValueError):
            # Fallback for numpy types without .item() method
            return bool(obj) if isinstance(obj, (np.bool_, np.bool)) else obj
    
    # Handle numpy arrays
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    
    # Handle dictionaries (recursively)
    if isinstance(obj, dict):
        return {str(key): make_json_serializable(value) for key, value in obj.items()}
    
    # Handle lists and tuples (recursively)
    if isinstance(obj, (list, tuple)):
        return [make_json_serializable(item) for item in obj]
    
    # Handle sets
    if isinstance(obj, set):
        return [make_json_serializable(item) for item in obj]
    
    # Handle Python native types that are JSON-serializable
    # Check numpy bool first, then Python bool
    if type(obj).__module__ == 'numpy':
        # It's a numpy type - try to convert
        try:
            return obj.item()
        except:
            return bool(obj) if hasattr(obj, '__bool__') else str(obj)
    
    if isinstance(obj, (str, int, float, bool)):
        return obj
    
    # Try to convert numpy types that might have slipped through
    try:
        if hasattr(obj, 'item'):  # numpy scalar
            return obj.item()
        if hasattr(obj, 'tolist'):  # numpy array
            return obj.tolist()
    except:
        pass
    
    # For datetime objects
    if isinstance(obj, (datetime, timedelta)):
        return obj.isoformat()
    
    # For Path objects
    if isinstance(obj, Path):
        return str(obj)
    
    # Last resort: try to convert to string
    try:
        return str(obj)
    except:
        # If all else fails, return None
        return None


class NLPAnalysisCache:
    """Cache for pre-computed NLP analysis results"""
    
    # In-memory cache: {ticker: analysis_result}
    _cache: Dict[str, Dict] = {}
    
    # Cache file path
    _CACHE_FILE = Path(__file__).parent.parent.parent.parent / "nlp_cache.json"
    
    # Individual ticker cache directory
    _DATA_DIR = Path(__file__).parent.parent.parent.parent / "data" / "nlp_cache"
    
    # Cache metadata
    _cache_metadata = {
        "last_updated": None,
        "total_analyzed": 0,
        "total_errors": 0,
        "status": "not_started"  # not_started, running, completed, error
    }
    
    @staticmethod
    def _ensure_data_dir():
        """Ensure the data directory exists"""
        NLPAnalysisCache._DATA_DIR.mkdir(parents=True, exist_ok=True)
    
    @staticmethod
    def _get_ticker_cache_path(ticker: str) -> Path:
        """Get the cache file path for a specific ticker"""
        NLPAnalysisCache._ensure_data_dir()
        ticker = ticker.upper()
        return NLPAnalysisCache._DATA_DIR / f"{ticker}.json"
    
    @staticmethod
    def save_ticker_analysis(ticker: str, analysis_data: Dict):
        """
        Save individual ticker analysis to data folder
        
        Args:
            ticker: Ticker symbol
            analysis_data: Analysis data to save
        """
        try:
            ticker = ticker.upper()
            cache_file = NLPAnalysisCache._get_ticker_cache_path(ticker)
            
            # Convert to JSON-serializable format
            serializable_data = make_json_serializable(analysis_data)
            
            # Save to file
            with open(cache_file, 'w', encoding='utf-8') as f:
                json.dump(serializable_data, f, indent=2, ensure_ascii=False)
            
            # Silent save - don't log every ticker to reduce noise
            # print(f"   Saved {ticker} analysis to: {cache_file}")
        except Exception as e:
            print(f"   Warning: Could not save {ticker} analysis to disk: {e}")
    
    @staticmethod
    def load_ticker_analysis(ticker: str) -> Optional[Dict]:
        """
        Load individual ticker analysis from data folder
        
        Args:
            ticker: Ticker symbol
            
        Returns:
            Analysis data if found, None otherwise
        """
        try:
            ticker = ticker.upper()
            cache_file = NLPAnalysisCache._get_ticker_cache_path(ticker)
            
            if cache_file.exists():
                with open(cache_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except Exception as e:
            print(f"   Warning: Could not load {ticker} analysis from disk: {e}")
        
        return None
    
    @staticmethod
    def load_all_ticker_analyses() -> Dict[str, Dict]:
        """
        Load all individual ticker analyses from data folder
        
        Returns:
            Dictionary of all ticker analyses
        """
        analyses = {}
        
        try:
            NLPAnalysisCache._ensure_data_dir()
            
            if not NLPAnalysisCache._DATA_DIR.exists():
                return analyses
            
            # Load all JSON files in the data directory
            for cache_file in NLPAnalysisCache._DATA_DIR.glob("*.json"):
                try:
                    ticker = cache_file.stem.upper()
                    with open(cache_file, 'r', encoding='utf-8') as f:
                        analyses[ticker] = json.load(f)
                except Exception as e:
                    print(f"Warning: Could not load analysis from {cache_file}: {e}")
            
            if analyses:
                print(f"Loaded {len(analyses)} individual ticker analyses from data folder")
        
        except Exception as e:
            print(f"Warning: Could not load ticker analyses from data folder: {e}")
        
        return analyses
    
    @staticmethod
    def load_cache_from_disk() -> bool:
        """
        Load cache from disk file if it exists
        Also tries to load individual ticker files from data folder
        
        Returns:
            True if cache was loaded successfully, False otherwise
        """
        loaded_any = False
        
        # Try loading from aggregated cache file first
        try:
            if NLPAnalysisCache._CACHE_FILE.exists():
                print(f"Loading cache from: {NLPAnalysisCache._CACHE_FILE}")
                file_size = NLPAnalysisCache._CACHE_FILE.stat().st_size
                print(f"Cache file size: {file_size / (1024 * 1024):.2f} MB")
                
                with open(NLPAnalysisCache._CACHE_FILE, 'r', encoding='utf-8') as f:
                    cache_data = json.load(f)
                    NLPAnalysisCache._cache = cache_data.get("cache", {})
                    NLPAnalysisCache._cache_metadata = cache_data.get("metadata", NLPAnalysisCache._cache_metadata)
                
                cached_count = len(NLPAnalysisCache._cache)
                last_updated = NLPAnalysisCache._cache_metadata.get("last_updated", "unknown")
                print(f"Loaded {cached_count} tickers from aggregated cache (last updated: {last_updated})")
                loaded_any = True
            else:
                print(f"Aggregated cache file not found: {NLPAnalysisCache._CACHE_FILE}")
        except Exception as e:
            print(f"Warning: Could not load aggregated cache from disk: {e}")
        
        # Try loading individual ticker files from data folder
        try:
            individual_analyses = NLPAnalysisCache.load_all_ticker_analyses()
            if individual_analyses:
                # Merge with existing cache (individual files take precedence)
                for ticker, analysis in individual_analyses.items():
                    if ticker not in NLPAnalysisCache._cache:
                        NLPAnalysisCache._cache[ticker] = analysis
                
                new_count = len(individual_analyses)
                print(f"Merged {new_count} individual ticker analyses from data folder")
                if new_count > 0:
                    loaded_any = True
        except Exception as e:
            print(f"Warning: Could not load individual ticker analyses: {e}")
        
        if loaded_any:
            total_count = len(NLPAnalysisCache._cache)
            print(f"Total cache loaded: {total_count} tickers")
        
        return loaded_any
    
    @staticmethod
    def save_cache_to_disk():
        """Save cache to disk file"""
        try:
            print(f"Saving cache to: {NLPAnalysisCache._CACHE_FILE}")
            
            # Convert cache to JSON-serializable format
            print("Converting cache data to JSON-serializable format...")
            serializable_cache = make_json_serializable(NLPAnalysisCache._cache)
            serializable_metadata = make_json_serializable(NLPAnalysisCache._cache_metadata)
            
            cache_data = {
                "cache": serializable_cache,
                "metadata": serializable_metadata,
                "saved_at": datetime.now().isoformat()
            }
            
            # Save to temporary file first, then rename (atomic write)
            temp_file = NLPAnalysisCache._CACHE_FILE.with_suffix('.tmp')
            print(f"Writing to temporary file: {temp_file}")
            with open(temp_file, 'w', encoding='utf-8') as f:
                json.dump(cache_data, f, indent=2, ensure_ascii=False)
            
            # Get file size before renaming
            file_size = temp_file.stat().st_size
            print(f"Temporary file written: {file_size / (1024 * 1024):.2f} MB")
            
            # Atomic rename
            temp_file.replace(NLPAnalysisCache._CACHE_FILE)
            print(f"Renamed temporary file to cache file")
            
            print(f"Cache saved successfully: {len(NLPAnalysisCache._cache)} tickers ({file_size / (1024 * 1024):.2f} MB)")
        except Exception as e:
            print(f"Warning: Could not save cache to disk: {e}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
    
    @staticmethod
    async def initialize_cache(
        universe_cutoff_months: int = 18, 
        max_tickers: Optional[int] = None,
        force_new: bool = False
    ):
        """
        Initialize cache by analyzing all tickers in the universe
        
        Args:
            universe_cutoff_months: Number of months to look back for recent filings
            max_tickers: Optional limit on number of tickers to analyze (for testing)
            force_new: If True, ignore cached data and re-analyze everything
        """
        # Try to load existing cache first
        if not force_new and NLPAnalysisCache.load_cache_from_disk():
            NLPAnalysisCache._cache_metadata["status"] = "completed"
            print("Using existing NLP cache from disk. Use --new flag to re-analyze.")
            return
        
        # Clear cache if forcing new analysis
        if force_new:
            NLPAnalysisCache._cache = {}
        
        NLPAnalysisCache._cache_metadata["status"] = "running"
        NLPAnalysisCache._cache_metadata["last_updated"] = datetime.now().isoformat()
        
        try:
            # Get portfolio universe
            portfolio = PortfolioService.init_equal_weight_universe(
                universe_cutoff_months=universe_cutoff_months
            )
            
            tickers = list(portfolio.holdings.keys())
            
            # Limit tickers if specified
            if max_tickers:
                tickers = tickers[:max_tickers]
            
            NLPAnalysisCache._cache_metadata["total_analyzed"] = len(tickers)
            
            # Get number of CPU cores available
            cpu_count = multiprocessing.cpu_count()
            # Use all available cores for parallel processing
            max_concurrent = cpu_count
            # For NLP analysis, use all cores too
            nlp_workers = cpu_count
            
            print(f"\nProcessing {len(tickers)} tickers for NLP analysis...")
            print(f"Universe cutoff: {universe_cutoff_months} months")
            print(f"CPU cores available: {cpu_count}")
            print(f"Maximum concurrent tasks: {max_concurrent}")
            print(f"NLP analysis workers: {nlp_workers}")
            print(f"Start time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            
            # Process tickers in parallel using asyncio with semaphore to limit concurrency
            # Use all available CPU cores
            semaphore = asyncio.Semaphore(max_concurrent)
            
            async def analyze_with_semaphore(ticker, index, total):
                async with semaphore:
                    print(f"[{index}/{total}] Starting analysis for {ticker}...")
                    start_time = datetime.now()
                    try:
                        result = await NLPAnalysisCache._analyze_ticker(ticker, universe_cutoff_months, nlp_workers)
                        elapsed = (datetime.now() - start_time).total_seconds()
                        if result and result.get('analysis'):
                            print(f"[{index}/{total}] Completed {ticker} (took {elapsed:.2f}s) - Saved to data folder")
                            
                            # Save immediately after completion (already done in _analyze_ticker, but log it)
                            # Update in-memory cache immediately
                            NLPAnalysisCache._cache[ticker] = result
                        else:
                            print(f"[{index}/{total}] {ticker} - No filing found (took {elapsed:.2f}s)")
                        return result
                    except Exception as e:
                        elapsed = (datetime.now() - start_time).total_seconds()
                        print(f"[{index}/{total}] Error analyzing {ticker}: {str(e)} (took {elapsed:.2f}s)")
                        raise
            
            # Create tasks for all tickers
            tasks = [
                analyze_with_semaphore(ticker, i + 1, len(tickers))
                for i, ticker in enumerate(tickers)
            ]
            
            # Run all tasks concurrently (with concurrency limit)
            print(f"Launching {len(tasks)} analysis tasks in parallel...\n")
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Process results and count errors
            # Note: Individual ticker analyses are already saved to disk as they complete
            errors = 0
            successful = 0
            no_filing = 0
            
            print(f"\nProcessing results from {len(results)} analyses...\n")
            
            for i, result in enumerate(results):
                ticker = tickers[i]
                if isinstance(result, Exception):
                    error_data = {
                        "ticker": ticker,
                        "analysis": None,
                        "cached_at": datetime.now().isoformat(),
                        "filing_date": None,
                        "error": str(result)
                    }
                    NLPAnalysisCache._cache[ticker] = error_data
                    # Save error info to data folder too
                    NLPAnalysisCache.save_ticker_analysis(ticker, error_data)
                    errors += 1
                elif result and result.get('analysis'):
                    # result is already saved to disk in _analyze_ticker
                    # Just ensure in-memory cache is updated (should already be set)
                    if ticker not in NLPAnalysisCache._cache:
                        NLPAnalysisCache._cache[ticker] = result
                    successful += 1
                else:
                    # No filing found
                    no_filing_data = {
                        "ticker": ticker,
                        "analysis": None,
                        "cached_at": datetime.now().isoformat(),
                        "filing_date": None,
                        "error": "No 10-K/10-Q filing found"
                    }
                    NLPAnalysisCache._cache[ticker] = no_filing_data
                    # Save no-filing info to data folder
                    NLPAnalysisCache.save_ticker_analysis(ticker, no_filing_data)
                    no_filing += 1
                
                # Log progress every 25 tickers
                if (i + 1) % 25 == 0:
                    print(f"Progress: {i + 1}/{len(tickers)} tickers processed | Successful: {successful} | No filing: {no_filing} | Errors: {errors}")
            
            NLPAnalysisCache._cache_metadata["total_errors"] = errors
            NLPAnalysisCache._cache_metadata["status"] = "completed"
            
            print(f"\nAnalysis Summary:")
            print(f"   Successful: {successful}")
            print(f"   No filing found: {no_filing}")
            print(f"   Errors: {errors}")
            print(f"   Total cached: {len(NLPAnalysisCache._cache)}")
            
            # Calculate and save aggregate statistics
            print(f"\nCalculating aggregate statistics...")
            aggregate_stats = NLPAnalysisCache._calculate_aggregate_stats()
            stats_file = NLPAnalysisCache._DATA_DIR.parent / "nlp_analysis_stats.json"
            try:
                with open(stats_file, 'w', encoding='utf-8') as f:
                    json.dump(make_json_serializable(aggregate_stats), f, indent=2, ensure_ascii=False)
                print(f"Aggregate statistics saved to: {stats_file}")
            except Exception as e:
                print(f"Warning: Could not save aggregate statistics: {e}")
            
            # Save aggregated cache to disk (optional, for backward compatibility)
            print(f"\nSaving aggregated cache to disk...")
            NLPAnalysisCache.save_cache_to_disk()
            
            start_time_str = NLPAnalysisCache._cache_metadata.get("last_updated", datetime.now().isoformat())
            try:
                start_time = datetime.fromisoformat(start_time_str)
                elapsed_time = (datetime.now() - start_time).total_seconds()
            except:
                elapsed_time = 0
            
            print(f"\nNLP Analysis Cache Initialization Complete!")
            print(f"   Total time: {elapsed_time:.2f} seconds")
            print(f"   Cache size: {len(NLPAnalysisCache._cache)} tickers")
            print(f"   Individual cache files: {NLPAnalysisCache._DATA_DIR}")
            print(f"   Aggregate cache file: {NLPAnalysisCache._CACHE_FILE}")
            print(f"   Statistics file: {stats_file}")
        
        except Exception as e:
            print(f"Error initializing NLP cache: {str(e)}")
            NLPAnalysisCache._cache_metadata["status"] = "error"
            NLPAnalysisCache._cache_metadata["error"] = str(e)
    
    @staticmethod
    def _calculate_aggregate_stats() -> Dict:
        """
        Calculate aggregate statistics from all cached analyses
        
        Returns:
            Dictionary with aggregate statistics
        """
        stats = {
            "total_tickers": len(NLPAnalysisCache._cache),
            "successful_analyses": 0,
            "failed_analyses": 0,
            "no_filing_analyses": 0,
            "average_sentiment": 0.0,
            "average_strategy_score": 0.0,
            "average_confidence": 0.0,
            "sentiment_distribution": {
                "positive": 0,
                "neutral": 0,
                "negative": 0
            },
            "recommendation_distribution": {
                "BUY": 0,
                "HOLD": 0,
                "SELL": 0
            },
            "calculated_at": datetime.now().isoformat()
        }
        
        sentiment_scores = []
        strategy_scores = []
        confidence_scores = []
        
        for ticker, data in NLPAnalysisCache._cache.items():
            if data.get("analysis"):
                stats["successful_analyses"] += 1
                
                analysis = data.get("analysis", {})
                nlp_analysis = analysis.get("nlp_analysis", {})
                trading_signals = analysis.get("trading_signals", {})
                
                # Collect sentiment scores
                sentiment = nlp_analysis.get("sentiment_scores", {})
                compound_sentiment = sentiment.get("compound", 0) or sentiment.get("overall_sentiment", 0)
                if compound_sentiment is not None:
                    sentiment_scores.append(float(compound_sentiment))
                    if compound_sentiment > 0.1:
                        stats["sentiment_distribution"]["positive"] += 1
                    elif compound_sentiment < -0.1:
                        stats["sentiment_distribution"]["negative"] += 1
                    else:
                        stats["sentiment_distribution"]["neutral"] += 1
                
                # Collect strategy scores
                strategy_score = analysis.get("strategy_score", 0)
                if strategy_score is not None:
                    strategy_scores.append(float(strategy_score))
                
                # Collect confidence scores
                confidence = trading_signals.get("confidence", 0) or analysis.get("confidence", 0)
                if confidence is not None:
                    confidence_scores.append(float(confidence))
                
                # Collect recommendations
                recommendation = trading_signals.get("recommendation", "HOLD") or analysis.get("recommendation", "HOLD")
                if recommendation:
                    rec_upper = recommendation.upper()
                    if "BUY" in rec_upper or "STRONG BUY" in rec_upper:
                        stats["recommendation_distribution"]["BUY"] += 1
                    elif "SELL" in rec_upper or "STRONG SELL" in rec_upper:
                        stats["recommendation_distribution"]["SELL"] += 1
                    else:
                        stats["recommendation_distribution"]["HOLD"] += 1
            elif data.get("error"):
                if "No 10-K/10-Q filing found" in str(data.get("error", "")):
                    stats["no_filing_analyses"] += 1
                else:
                    stats["failed_analyses"] += 1
        
        # Calculate averages
        if sentiment_scores:
            stats["average_sentiment"] = float(np.mean(sentiment_scores))
            stats["sentiment_std"] = float(np.std(sentiment_scores))
            stats["sentiment_min"] = float(np.min(sentiment_scores))
            stats["sentiment_max"] = float(np.max(sentiment_scores))
        
        if strategy_scores:
            stats["average_strategy_score"] = float(np.mean(strategy_scores))
            stats["strategy_score_std"] = float(np.std(strategy_scores))
            stats["strategy_score_min"] = float(np.min(strategy_scores))
            stats["strategy_score_max"] = float(np.max(strategy_scores))
        
        if confidence_scores:
            stats["average_confidence"] = float(np.mean(confidence_scores))
            stats["confidence_std"] = float(np.std(confidence_scores))
        
        return stats
    
    @staticmethod
    async def _analyze_ticker(ticker: str, universe_cutoff_months: int, nlp_workers: int = 1) -> Optional[Dict]:
        """
        Analyze a single ticker (async worker function)
        Saves analysis immediately to data folder upon completion
        
        Args:
            ticker: Ticker symbol to analyze
            universe_cutoff_months: Cutoff months for filings
            nlp_workers: Number of workers for NLP analysis ThreadPoolExecutor
            
        Returns:
            Cache data dict if successful, None if no filing found, raises Exception on error
        """
        try:
            # Import here to avoid circular imports
            from app.routers.stocks import find_filings_for_ticker
            from app.services.html_parser import extract_text_from_html
            from pathlib import Path
            
            # Find 10-K/10-Q filing for ticker
            filings = find_filings_for_ticker(ticker)
            
            if not filings:
                print(f"   {ticker}: No filings found in directory")
                return None
            
            print(f"   {ticker}: Found {len(filings)} filing(s)")
            
            def extract_filing_date(filing):
                """Extract date from filename (format: YYYY-MM-DD-10k-TICKER.html)"""
                filename = filing.get('filename', '')
                # Try to extract date from filename: YYYY-MM-DD
                date_match = re.search(r'(\d{4})-(\d{2})-(\d{2})', filename)
                if date_match:
                    year, month, day = date_match.groups()
                    try:
                        return datetime(int(year), int(month), int(day))
                    except:
                        pass
                # Fallback: use file modification time
                try:
                    file_path = Path(filing['path'])
                    if file_path.exists():
                        return datetime.fromtimestamp(file_path.stat().st_mtime)
                except:
                    pass
                # Last resort: return very old date
                return datetime(2000, 1, 1)
            
            # Prioritize 10-K filings, then 10-Q
            preferred_filings = []
            other_filings = []
            
            for f in filings:
                filename_lower = f.get('filename', '').lower()
                if '10-k' in filename_lower or '10k' in filename_lower:
                    preferred_filings.append(f)
                elif '10-q' in filename_lower or '10q' in filename_lower:
                    other_filings.append(f)
            
            # Sort by date (newest first), then by filename
            preferred_filings.sort(key=lambda x: (extract_filing_date(x), x.get('filename', '')), reverse=True)
            other_filings.sort(key=lambda x: (extract_filing_date(x), x.get('filename', '')), reverse=True)
            
            # Filter filings by cutoff date - only use recent filings
            cutoff_date = datetime.now() - timedelta(days=universe_cutoff_months * 30)
            
            preferred_filings_filtered = [
                f for f in preferred_filings 
                if extract_filing_date(f) >= cutoff_date
            ]
            other_filings_filtered = [
                f for f in other_filings 
                if extract_filing_date(f) >= cutoff_date
            ]
            
            all_filings = preferred_filings_filtered + other_filings_filtered
            
            # If no recent filings found, use oldest available filing (with warning)
            if not all_filings:
                all_filings = preferred_filings + other_filings
                if all_filings:
                    # Get most recent available (even if old)
                    all_filings = [max(
                        preferred_filings + other_filings,
                        key=lambda x: extract_filing_date(x)
                    )]
            
            text = None
            previous_filing_text = None
            current_filing_date = None
            previous_filing_date = None
            
            # Get content from most recent filing first
            # Read raw file and extract text with BeautifulSoup
            print(f"   {ticker}: Reading {len(all_filings)} filing(s)...")
            
            # First, get the most recent filing (current)
            for filing in all_filings:
                try:
                    filing_name = filing.get('filename', 'unknown')
                    print(f"   {ticker}: Processing {filing_name}...")
                    
                    # Read raw HTML file
                    with open(filing['path'], 'r', encoding='utf-8', errors='ignore') as f:
                        raw_content = f.read()
                    
                    print(f"   {ticker}: Extracting text from {filing_name} ({len(raw_content)} chars)...")
                    
                    # Extract text using BeautifulSoup
                    filing_content = extract_text_from_html(raw_content, max_length=None)
                    filing_date = extract_filing_date(filing)
                    
                    print(f"   {ticker}: Extracted {len(filing_content)} chars from {filing_name}")
                    
                    if filing_content and len(filing_content) > 500:
                        if not text:
                            text = filing_content
                            current_filing_date = filing_date
                            print(f"   {ticker}: Using {filing_name} as primary filing (date: {filing_date.strftime('%Y-%m-%d') if filing_date else 'unknown'})")
                            break  # Found current filing, now look for previous
                    else:
                        print(f"   {ticker}: {filing_name} content too short ({len(filing_content) if filing_content else 0} chars, need > 500)")
                except Exception as e:
                    print(f"   {ticker}: Error reading {filing.get('filename', 'unknown')}: {e}")
                    continue
            
            # Now look for a previous filing (must be older than current)
            if text and current_filing_date:
                for filing in all_filings:
                    filing_date = extract_filing_date(filing)
                    
                    # Skip if this is the current filing or if it's not older
                    if filing_date >= current_filing_date:
                        continue
                    
                    try:
                        filing_name = filing.get('filename', 'unknown')
                        print(f"   {ticker}: Checking {filing_name} as previous filing...")
                        
                        # Read raw HTML file
                        with open(filing['path'], 'r', encoding='utf-8', errors='ignore') as f:
                            raw_content = f.read()
                        
                        # Extract text using BeautifulSoup
                        filing_content = extract_text_from_html(raw_content, max_length=None)
                        
                        if filing_content and len(filing_content) > 500:
                            previous_filing_text = filing_content
                            previous_filing_date = filing_date
                            print(f"   {ticker}: Using {filing_name} as previous filing (date: {filing_date.strftime('%Y-%m-%d') if filing_date else 'unknown'})")
                            break  # Found previous filing
                    except Exception as e:
                        print(f"   {ticker}: Error reading {filing.get('filename', 'unknown')} for previous filing: {e}")
                        continue
            
            if text:
                # Check if we have a cached analysis for this ticker
                cached_analysis = NLPAnalysisCache.load_ticker_analysis(ticker)
                if cached_analysis and cached_analysis.get('analysis'):
                    # Update previous filing info if we found one (even if cached)
                    if previous_filing_date and not cached_analysis.get('previous_filing_date'):
                        cached_analysis['previous_filing_date'] = previous_filing_date.strftime('%Y-%m-%d') if previous_filing_date else None
                        cached_analysis['has_previous_filing'] = previous_filing_text is not None
                        # Save updated cache
                        NLPAnalysisCache.save_ticker_analysis(ticker, cached_analysis)
                        print(f"   {ticker}: Updated cached analysis with previous filing info")
                    print(f"   {ticker}: Using cached analysis from data folder")
                    return cached_analysis
                
                print(f"   {ticker}: Starting NLP analysis ({len(text)} chars)...")
                
                # Perform NLP analysis using ThreadPoolExecutor for CPU-intensive operations
                # Run in executor to avoid blocking the event loop
                # Use all available CPU cores for NLP analysis
                loop = asyncio.get_event_loop()
                analysis_start = datetime.now()
                
                with ThreadPoolExecutor(max_workers=nlp_workers) as executor:
                    analysis = await loop.run_in_executor(
                        executor,
                        NLPQuantStrategy.analyze_filing_advanced,
                        text,
                        ticker,
                        previous_filing_text,
                        None  # benchmark_tickers
                    )
                
                analysis_time = (datetime.now() - analysis_start).total_seconds()
                print(f"   {ticker}: NLP analysis complete (took {analysis_time:.2f}s)")
                
                # Store in cache with filing date info
                filing_date_str = current_filing_date.strftime('%Y-%m-%d') if current_filing_date else 'unknown'
                previous_filing_date_str = previous_filing_date.strftime('%Y-%m-%d') if previous_filing_date else None
                
                cache_data = {
                    "ticker": ticker,
                    "analysis": analysis,
                    "cached_at": datetime.now().isoformat(),
                    "filing_date": filing_date_str,
                    "filing_filename": all_filings[0].get('filename', 'unknown') if all_filings else 'unknown',
                    "previous_filing_date": previous_filing_date_str,
                    "has_previous_filing": previous_filing_text is not None
                }
                
                # Save individual ticker analysis to data folder IMMEDIATELY
                # This happens as soon as analysis completes, not at the end
                NLPAnalysisCache.save_ticker_analysis(ticker, cache_data)
                
                return cache_data
            else:
                # No filing found
                print(f"   {ticker}: No valid filing content found")
                return None
        
        except Exception as e:
            raise Exception(f"Error analyzing {ticker}: {str(e)}")
    
    @staticmethod
    def get_analysis(ticker: str) -> Optional[Dict]:
        """
        Get cached analysis for a ticker
        
        Args:
            ticker: Ticker symbol
            
        Returns:
            Cached analysis result or None
        """
        ticker = ticker.upper()
        return NLPAnalysisCache._cache.get(ticker)
    
    @staticmethod
    def get_all_analyses() -> Dict[str, Dict]:
        """
        Get all cached analyses
        
        Returns:
            Dictionary of all cached analyses
        """
        return NLPAnalysisCache._cache.copy()
    
    @staticmethod
    def get_cache_metadata() -> Dict:
        """
        Get cache metadata
        
        Returns:
            Cache metadata (status, last_updated, counts, etc.)
        """
        return {
            **NLPAnalysisCache._cache_metadata,
            "cache_size": len(NLPAnalysisCache._cache),
            "cache_keys": list(NLPAnalysisCache._cache.keys())[:10]  # Sample of keys
        }
    
    @staticmethod
    def get_top_signals(limit: int = 20) -> List[Dict]:
        """
        Get top trading signals from cache
        
        Args:
            limit: Number of top signals to return
            
        Returns:
            List of top signals sorted by signal strength
        """
        signals = []
        
        for ticker, data in NLPAnalysisCache._cache.items():
            if data.get("analysis") and data["analysis"].get("trading_signal"):
                signal = data["analysis"]["trading_signal"]
                signal_strength = abs(data["analysis"].get("signal_strength", 0))
                
                signals.append({
                    "ticker": ticker,
                    "signal": signal.get("recommendation", "HOLD"),
                    "strength": signal_strength,
                    "confidence": signal.get("confidence", 0.5),
                    "sentiment_score": data["analysis"].get("sentiment_scores", {}).get("compound", 0),
                    "analysis": data["analysis"]
                })
        
        # Sort by signal strength descending
        signals.sort(key=lambda x: x["strength"], reverse=True)
        
        return signals[:limit]

