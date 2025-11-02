"""
General analytics router - sentiment, trends, social data
"""

from fastapi import APIRouter, HTTPException
from typing import Optional
import random
import os

from app.services.tenk_parser import TenKParser
from app.services.document_parser import DocumentParser
from app.services.nlp_quant_strategy import NLPQuantStrategy

router = APIRouter()


@router.get("/")
async def analytics_root():
    """Root endpoint for analytics router"""
    return {
        "message": "Analytics API",
        "endpoints": [
            "/sentiment",
            "/trends",
            "/tenk-analyze",
            "/nlp-quant-strategy"
        ]
    }


@router.get("/sentiment")
async def get_sentiment_analysis(
    symbol: Optional[str] = None,
    region: Optional[str] = None
):
    """
    Get sentiment analysis for symbol or region
    """
    return {
        "symbol": symbol,
        "region": region,
        "overall_sentiment": random.choice(["positive", "neutral", "negative"]),
        "sentiment_score": random.uniform(-1, 1),
        "breakdown": {
            "positive": random.uniform(20, 40),
            "neutral": random.uniform(30, 50),
            "negative": random.uniform(20, 40)
        },
        "keywords": ["technology", "growth", "innovation"],
        "sources": ["Twitter", "Reddit", "News"]
    }


@router.get("/trends")
async def get_trends(
    category: Optional[str] = None,
    time_period: str = "7d"
):
    """
    Get trending topics and keywords
    """
    return {
        "trends": [
            {"keyword": "AI", "volume": 10000, "change": 25.5},
            {"keyword": "Electric Vehicles", "volume": 8500, "change": 18.2},
            {"keyword": "Renewable Energy", "volume": 7200, "change": 12.8}
        ],
        "category": category,
        "time_period": time_period
    }


@router.post("/tenk-analyze")
async def analyze_tenk(request: dict):
    """
    Analyze 10-K filing for a company using advanced parser
    Supports both file upload and file path
    """
    ticker = request.get("ticker", "").upper()
    file_path = request.get("filePath")
    file_url = request.get("fileUrl")
    document_text = request.get("documentText")
    
    if not ticker:
        raise HTTPException(status_code=400, detail="Ticker symbol is required")
    
    text = None
    
    # Get document text from provided sources
    if document_text:
        text = document_text
    elif file_path or file_url:
        # Try to find and parse file from provided path
        path_to_try = file_path or file_url
        
        # Common locations for 10-K files
        possible_paths = [
            path_to_try,
            os.path.join("fillings", ticker, "10-K.txt"),
            os.path.join("fillings", ticker, "10-K.html"),
            os.path.join("fillings", ticker, "10-K.pdf"),
            os.path.join("fillings", ticker, f"{ticker}_10K.txt"),
            os.path.join("fillings", ticker, f"{ticker}_10K.html"),
        ]
        
        for path in possible_paths:
            if os.path.exists(path):
                try:
                    text, file_format = DocumentParser.parse_file(path)
                    break
                except Exception as e:
                    continue
    
    # If no text yet, try to find files in jeu_de_donnees directory
    if not text:
        from app.routers.stocks import find_filings_for_ticker, get_filing_content
        
        try:
            filings = find_filings_for_ticker(ticker)
            # Try to get content from the first 10-K filing found
            for filing in filings:
                if '10-k' in filing.get('filename', '').lower() or '10k' in filing.get('filename', '').lower():
                    filing_content = get_filing_content(filing['path'])
                    if filing_content:
                        text = filing_content
                        break
        except Exception as e:
            # Continue to fallback if filing lookup fails
            pass
    
    # If still no text, return fallback structure
    if not text:
        # Fallback: return basic structure with ticker
        return {
            "ticker": ticker,
            "company_name": f"{ticker} Inc.",
            "fiscal_year": "2024",
            "error": f"10-K file not found for {ticker}. Please upload the file or provide document text.",
            "note": "Using placeholder data. Upload 10-K file for full analysis."
        }
    
    # Parse 10-K using TenKParser
    try:
        analysis = TenKParser.parse_tenk(text, ticker)
        analysis["company_name"] = request.get("companyName", f"{ticker} Inc.")
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error parsing 10-K: {str(e)}")


@router.post("/nlp-quant-strategy")
async def nlp_quant_strategy(request: dict):
    """
    Advanced NLP-based quantitative strategy analysis using spaCy, NLTK, and HuggingFace embeddings
    
    Analyzes 10K/10Q filings with:
    - Financial sentiment analysis (VADER + custom lexicons)
    - Forward-looking statement extraction
    - Entity extraction (companies, financial metrics, dates, amounts)
    - Risk factor analysis
    - Tone analysis using linguistic features
    - Embedding-based comparison (with previous filings or peers)
    - Anomaly detection (sentiment swings, uncertainty spikes)
    - Trading signal generation
    
    Automatically finds and loads 10-K/10-Q filings from disk if documentText is not provided.
    
    Returns comprehensive NLP signals and trading recommendations
    """
    ticker = request.get("ticker", "").upper()
    document_text = request.get("documentText")
    file_path = request.get("filePath")
    file_url = request.get("fileUrl")
    previous_filing = request.get("previousFiling")  # Optional: previous filing text
    benchmark_tickers = request.get("benchmarkTickers", [])  # Optional: peer tickers
    auto_find_previous = request.get("autoFindPrevious", True)  # Auto-find previous filing for comparison
    
    if not ticker:
        raise HTTPException(status_code=400, detail="Ticker symbol is required")
    
    text = None
    previous_filing_text = previous_filing
    
    # Get document text from provided sources or disk
    if document_text:
        text = document_text
    elif file_path or file_url:
        # Try to find and parse file from provided path
        path_to_try = file_path or file_url
        
        possible_paths = [
            path_to_try,
            os.path.join("fillings", ticker, "10-K.txt"),
            os.path.join("fillings", ticker, "10-Q.txt"),
            os.path.join("fillings", ticker, "10-K.html"),
            os.path.join("fillings", ticker, "10-Q.html"),
            os.path.join("fillings", ticker, "10-K.pdf"),
            os.path.join("fillings", ticker, "10-Q.pdf"),
            os.path.join("fillings", ticker, f"{ticker}_10K.txt"),
            os.path.join("fillings", ticker, f"{ticker}_10Q.txt"),
        ]
        
        for path in possible_paths:
            if os.path.exists(path):
                try:
                    text, file_format = DocumentParser.parse_file(path)
                    break
                except Exception as e:
                    continue
    
    # If no text yet, try to find files in jeu_de_donnees directory
    if not text:
        from app.routers.stocks import find_filings_for_ticker, get_filing_content
        
        try:
            filings = find_filings_for_ticker(ticker)
            
            # Prioritize 10-K filings, then 10-Q
            preferred_filings = []
            other_filings = []
            
            for filing in filings:
                filename_lower = filing.get('filename', '').lower()
                if '10-k' in filename_lower or '10k' in filename_lower:
                    preferred_filings.append(filing)
                elif '10-q' in filename_lower or '10q' in filename_lower:
                    other_filings.append(filing)
            
            # Sort by filename (newer filings usually have dates in filename)
            preferred_filings.sort(key=lambda x: x.get('filename', ''), reverse=True)
            other_filings.sort(key=lambda x: x.get('filename', ''), reverse=True)
            
            # Try preferred filings first (10-K), then 10-Q
            all_filings = preferred_filings + other_filings
            
            # Get content from the first filing found
            for filing in all_filings[:2]:  # Try first 2 filings
                filing_content = get_filing_content(filing['path'], max_length=None)  # No truncation for NLP
                if filing_content and len(filing_content) > 500:  # Ensure minimum length
                    if not text:
                        text = filing_content
                    elif auto_find_previous and not previous_filing_text:
                        # Use second filing as previous for comparison
                        previous_filing_text = filing_content
                        break
                    
                    # If we have current text and don't need previous, break
                    if not auto_find_previous or previous_filing_text:
                        break
        except Exception as e:
            # Continue to fallback if filing lookup fails
            pass
    
    # If still no text, try additional paths
    if not text:
        additional_paths = [
            os.path.join("jeu_de_donnees", ticker, "10-K.txt"),
            os.path.join("jeu_de_donnees", ticker, "10-Q.txt"),
            os.path.join("jeu_de_donnees", "10-K", ticker, "10-K.txt"),
            os.path.join("jeu_de_donnees", "directives", ticker),
        ]
        
        for base_path in additional_paths:
            if os.path.isdir(base_path):
                # Look for files in directory
                for filename in os.listdir(base_path):
                    file_path = os.path.join(base_path, filename)
                    if os.path.isfile(file_path):
                        try:
                            text, file_format = DocumentParser.parse_file(file_path)
                            if text and len(text) > 500:
                                break
                        except:
                            continue
                if text:
                    break
            elif os.path.isfile(base_path):
                try:
                    text, file_format = DocumentParser.parse_file(base_path)
                    if text and len(text) > 500:
                        break
                except:
                    continue
    
    if not text:
        raise HTTPException(
            status_code=404,
            detail=f"10-K/10-Q file not found for {ticker}. Please upload the file or provide document text."
        )
    
    # Perform advanced NLP analysis
    try:
        analysis = NLPQuantStrategy.analyze_filing_advanced(
            document_text=text,
            ticker=ticker,
            previous_filing=previous_filing_text if previous_filing_text else previous_filing,
            benchmark_tickers=benchmark_tickers if isinstance(benchmark_tickers, list) else []
        )
        
        return {
            "success": True,
            "ticker": ticker,
            **analysis,
            "methodology": {
                "nlp_libraries": {
                    "spacy": "Entity extraction, linguistic analysis, POS tagging",
                    "nltk": "Sentiment analysis (VADER), tokenization, text preprocessing",
                    "sentence_transformers": "Semantic embeddings for document comparison"
                },
                "techniques": [
                    "Financial sentiment analysis with custom lexicons",
                    "Forward-looking statement extraction using regex patterns",
                    "Named Entity Recognition (NER) for financial entities",
                    "Risk factor severity scoring",
                    "Linguistic tone analysis (certainty, formality, readability)",
                    "Embedding-based similarity comparison",
                    "Anomaly detection (sentiment swings, uncertainty spikes)",
                    "Multi-component trading signal generation"
                ]
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error performing NLP analysis: {str(e)}"
        )
