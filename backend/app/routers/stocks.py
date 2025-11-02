"""
Stocks router - handles stock data from jeu_de_donnees CSV files and filings
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, Dict, Any, List
import csv
import os
from pathlib import Path

router = APIRouter()

# Path to jeu_de_donnees folder
# Go up from app/routers/stocks.py -> app/routers -> app -> backend -> polyfinance2025 -> jeu_de_donnees
DATASET_DIR = Path(__file__).parent.parent.parent.parent / "jeu_de_donnees"

# Supported filing file extensions
FILING_EXTENSIONS = ['.pdf', '.txt', '.html', '.htm', '.xml', '.docx']


def load_stock_data_from_csv(ticker: str) -> Optional[Dict[str, Any]]:
    """
    Load stock data from CSV files in jeu_de_donnees folder
    Returns combined data from all relevant CSV files
    """
    ticker = ticker.upper()
    stock_data = {}
    
    # Load from stocks-performance CSV
    performance_file = DATASET_DIR / "2025-09-26_stocks-performance.csv"
    if not performance_file.exists():
        print(f"Performance CSV not found at: {performance_file}")
    else:
        try:
            with open(performance_file, 'r', encoding='utf-8-sig') as f:  # utf-8-sig handles BOM
                reader = csv.DictReader(f)
                for row in reader:
                    # Handle BOM in Symbol field - try both 'Symbol' and '\ufeffSymbol'
                    symbol = row.get('Symbol', row.get('\ufeffSymbol', '')).strip()
                    if symbol.upper() == ticker:
                        stock_data.update({
                            'symbol': symbol,
                            'company_name': row.get('Company Name', ''),
                            'market_cap': row.get('Market Cap', ''),
                            'revenue': row.get('Revenue', ''),
                            'operating_income': row.get('Op. Income', ''),
                            'net_income': row.get('Net Income', ''),
                            'eps': row.get('EPS', ''),
                            'fcf': row.get('FCF', '')
                        })
                        break
        except Exception as e:
            print(f"Error reading performance CSV: {e}")
            import traceback
            traceback.print_exc()
    
    # Load from SP500 composition CSV
    sp500_file = DATASET_DIR / "2025-08-15_composition_sp500.csv"
    if not sp500_file.exists():
        print(f"SP500 CSV not found at: {sp500_file}")
    else:
        try:
            with open(sp500_file, 'r', encoding='utf-8-sig') as f:  # utf-8-sig for consistency
                reader = csv.DictReader(f)
                for row in reader:
                    symbol = row.get('Symbol', '').strip()
                    if symbol.upper() == ticker:
                        stock_data.update({
                            'symbol': symbol,
                            'company': row.get('Company', ''),
                            'weight': row.get('Weight', ''),
                            'price': row.get('Price', ''),
                            'is_sp500': True
                        })
                        break
        except Exception as e:
            print(f"Error reading SP500 CSV: {e}")
            import traceback
            traceback.print_exc()
    
    if not stock_data:
        print(f"No data found for ticker: {ticker} in dataset files")
        print(f"Looking in: {DATASET_DIR}")
    
    return stock_data if stock_data else None


@router.get("/list")
async def list_all_stocks():
    """
    Get list of all available stocks from jeu_de_donnees CSV files
    Returns unique list of tickers with company names
    """
    stocks = {}
    
    # Load from stocks-performance CSV
    performance_file = DATASET_DIR / "2025-09-26_stocks-performance.csv"
    if performance_file.exists():
        try:
            with open(performance_file, 'r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    symbol = row.get('Symbol', row.get('\ufeffSymbol', '')).strip().upper()
                    if symbol:
                        company_name = row.get('Company Name', '')
                        if symbol not in stocks:
                            stocks[symbol] = {
                                'ticker': symbol,
                                'company_name': company_name,
                                'market_cap': row.get('Market Cap', ''),
                                'source': 'performance'
                            }
        except Exception as e:
            print(f"Error reading performance CSV: {e}")
    
    # Load from SP500 composition CSV
    sp500_file = DATASET_DIR / "2025-08-15_composition_sp500.csv"
    if sp500_file.exists():
        try:
            with open(sp500_file, 'r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    symbol = row.get('Symbol', '').strip().upper()
                    if symbol:
                        company = row.get('Company', '')
                        if symbol not in stocks:
                            stocks[symbol] = {
                                'ticker': symbol,
                                'company_name': company,
                                'price': row.get('Price', ''),
                                'weight': row.get('Weight', ''),
                                'source': 'sp500'
                            }
                        else:
                            # Update with SP500 data if available
                            stocks[symbol]['company'] = company
                            stocks[symbol]['price'] = row.get('Price', '')
                            stocks[symbol]['weight'] = row.get('Weight', '')
                            stocks[symbol]['is_sp500'] = True
        except Exception as e:
            print(f"Error reading SP500 CSV: {e}")
    
    # Convert to sorted list
    stock_list = sorted(stocks.values(), key=lambda x: x.get('company_name', x['ticker']))
    
    return {
        "total": len(stock_list),
        "stocks": stock_list
    }


@router.get("/stock/{ticker}")
async def get_stock_data(ticker: str):
    """
    Get stock data from jeu_de_donnees CSV files for a given ticker
    Also returns available filing documents
    """
    ticker = ticker.upper()
    stock_data = load_stock_data_from_csv(ticker)
    
    if not stock_data:
        raise HTTPException(
            status_code=404,
            detail=f"Stock data not found for ticker: {ticker}"
        )
    
    # Find available filings
    filings = find_filings_for_ticker(ticker)
    
    return {
        "ticker": ticker,
        "data": stock_data,
        "filings": [
            {
                'filename': f['filename'],
                'type': f['type'],
                'size': f['size'],
                'path': f['path']
            } for f in filings
        ],
        "source": "jeu_de_donnees"
    }


@router.get("/stock/{ticker}/filings")
async def get_stock_filings(ticker: str):
    """
    Get available filing documents for a ticker
    """
    ticker = ticker.upper()
    filings = find_filings_for_ticker(ticker)
    
    if not filings:
        raise HTTPException(
            status_code=404,
            detail=f"No filings found for ticker: {ticker}"
        )
    
    return {
        "ticker": ticker,
        "filings": [
            {
                'filename': f['filename'],
                'type': f['type'],
                'size': f['size'],
                'path': f['path']
            } for f in filings
        ]
    }


@router.get("/stock/{ticker}/filings/{filename:path}/analyze")
async def analyze_filing_with_bedrock(ticker: str, filename: str):
    """
    Analyze a specific filing document using AWS Bedrock LLM
    """
    ticker = ticker.upper()
    filings = find_filings_for_ticker(ticker)
    
    # Find the specific filing
    filing = None
    for f in filings:
        if f['filename'] == filename or f['path'].endswith(filename):
            filing = f
            break
    
    if not filing:
        raise HTTPException(
            status_code=404,
            detail=f"Filing {filename} not found for ticker: {ticker}"
        )
    
    # Read filing content
    filing_content = get_filing_content(filing['path'])
    if not filing_content:
        raise HTTPException(
            status_code=500,
            detail=f"Could not read filing content from {filing['path']}"
        )
    
    # Analyze with Bedrock
    try:
        from app.services.aws_bedrock_service import BedrockService
        
        # Use Bedrock to analyze the filing
        if '10-k' in filename.lower() or '10k' in filename.lower():
            # 10-K specific analysis
            analysis = BedrockService.compare_with_10k(
                regulation_text="",  # Not applicable for 10-K analysis
                company_10k_summary=filing_content
            )
        else:
            # General filing analysis
            analysis = BedrockService.analyze_regulatory_document(
                document_text=filing_content,
                document_type="filing"
            )
        
        return {
            "ticker": ticker,
            "filename": filing['filename'],
            "analysis": analysis,
            "filing_size": len(filing_content),
            "method": "aws_bedrock"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error analyzing filing with Bedrock: {str(e)}"
        )


@router.get("/stock/{ticker}/formatted")
async def get_stock_data_formatted(ticker: str, include_filings: bool = True):
    """
    Get stock data formatted as text for LLM prompts
    Includes filing documents if found in jeu_de_donnees directory
    """
    ticker = ticker.upper()
    stock_data = load_stock_data_from_csv(ticker)
    
    if not stock_data:
        raise HTTPException(
            status_code=404,
            detail=f"Stock data not found for ticker: {ticker}"
        )
    
    # Format as readable text for LLM
    formatted_text = f"Stock Data for {stock_data.get('company_name', stock_data.get('company', ticker))} ({ticker}):\n\n"
    
    if stock_data.get('market_cap'):
        formatted_text += f"Market Cap: ${format_number(stock_data['market_cap'])}\n"
    if stock_data.get('revenue'):
        formatted_text += f"Revenue: ${format_number(stock_data['revenue'])}\n"
    if stock_data.get('operating_income'):
        formatted_text += f"Operating Income: ${format_number(stock_data['operating_income'])}\n"
    if stock_data.get('net_income'):
        formatted_text += f"Net Income: ${format_number(stock_data['net_income'])}\n"
    if stock_data.get('eps'):
        formatted_text += f"EPS: ${stock_data['eps']}\n"
    if stock_data.get('fcf'):
        formatted_text += f"Free Cash Flow: ${format_number(stock_data['fcf'])}\n"
    if stock_data.get('weight'):
        formatted_text += f"S&P 500 Weight: {stock_data['weight']}\n"
    if stock_data.get('price'):
        formatted_text += f"Price: ${stock_data['price']}\n"
    
    # Find and include filings if requested
    filing_text = ""
    filings_info = []
    if include_filings:
        filings = find_filings_for_ticker(ticker)
        if filings:
            formatted_text += f"\n\n--- Filing Documents Found ---\n"
            for filing in filings[:3]:  # Limit to first 3 filings to avoid token limits
                filing_content = get_filing_content(filing['path'], max_length=15000)
                if filing_content:
                    formatted_text += f"\n\nFiling: {filing['filename']} ({filing['type']})\n"
                    formatted_text += f"{filing_content}\n"
                    filings_info.append({
                        'filename': filing['filename'],
                        'type': filing['type'],
                        'size': filing['size'],
                        'included': True
                    })
                else:
                    filings_info.append({
                        'filename': filing['filename'],
                        'type': filing['type'],
                        'size': filing['size'],
                        'included': False,
                        'error': 'Could not read file content'
                    })
    
    return {
        "ticker": ticker,
        "formatted_data": formatted_text,
        "raw_data": stock_data,
        "filings": filings_info if include_filings else [],
        "source": "jeu_de_donnees"
    }


def format_number(num_str: str) -> str:
    """Format large numbers with commas and suffixes"""
    try:
        num = int(float(num_str.replace(',', '')))
        if num >= 1_000_000_000_000:
            return f"{num / 1_000_000_000_000:.2f}T"
        elif num >= 1_000_000_000:
            return f"{num / 1_000_000_000:.2f}B"
        elif num >= 1_000_000:
            return f"{num / 1_000_000:.2f}M"
        else:
            return f"{num:,}"
    except:
        return num_str


def find_filings_for_ticker(ticker: str) -> List[Dict[str, str]]:
    """
    Find filing documents for a given ticker in jeu_de_donnees directory
    Returns list of filing info dicts with path, filename, and type
    """
    ticker = ticker.upper()
    filings = []
    
    # Look for filings in various possible locations
    possible_paths = [
        DATASET_DIR / "directives" / ticker,
        DATASET_DIR / "filings" / ticker,
        DATASET_DIR / "10-K" / ticker,
        DATASET_DIR / ticker,
        DATASET_DIR / "directives",
        DATASET_DIR,
    ]
    
    for base_path in possible_paths:
        if not base_path.exists():
            continue
            
        # Look for files matching ticker or common filing patterns
        for file_path in base_path.rglob('*'):
            if file_path.is_file():
                file_ext = file_path.suffix.lower()
                if file_ext in FILING_EXTENSIONS:
                    # Check if filename contains ticker or is a filing document
                    filename_lower = file_path.name.lower()
                    if (ticker.lower() in filename_lower or 
                        '10-k' in filename_lower or 
                        '10k' in filename_lower or
                        'filing' in filename_lower or
                        'annual' in filename_lower or
                        'report' in filename_lower):
                        filings.append({
                            'path': str(file_path),
                            'filename': file_path.name,
                            'type': file_ext[1:],  # Remove the dot
                            'size': file_path.stat().st_size
                        })
    
    return filings


def get_filing_content(filing_path: str, max_length: int = 50000) -> Optional[str]:
    """
    Read filing content from disk
    Uses DocumentParser if available, otherwise basic text reading
    """
    try:
        from app.services.document_parser import DocumentParser
        try:
            text, file_format = DocumentParser.parse_file(filing_path)
            # Truncate if too long (for LLM context limits)
            if len(text) > max_length:
                text = text[:max_length] + f"\n\n[... Content truncated. Total length: {len(text)} characters ...]"
            return text
        except Exception as e:
            print(f"Error parsing filing with DocumentParser: {e}")
            # Fallback to basic text reading
            pass
    except ImportError:
        pass
    
    # Fallback: basic text file reading
    try:
        with open(filing_path, 'r', encoding='utf-8') as f:
            text = f.read(max_length)
        return text
    except UnicodeDecodeError:
        try:
            with open(filing_path, 'r', encoding='latin-1') as f:
                text = f.read(max_length)
            return text
        except Exception:
            return None
    except Exception as e:
        print(f"Error reading filing: {e}")
        return None

