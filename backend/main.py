"""
Main FastAPI application for IntelliRisk
Handles all dynamic features from the frontend
"""

import argparse
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from contextlib import asynccontextmanager
import uvicorn
from dotenv import load_dotenv
import os
import asyncio
import logging

# Load environment variables from .env file
load_dotenv()

# Global variable for command-line args (set in __main__ block)
args = argparse.Namespace(new=False)

from app.routers import (
    entities,
    ai,
    files,
    portfolio,
    regulatory,
    analytics,
    stocks,
    documents,
    scenarios,
    recommendations,
    company,
    nlp_cache,
    market_research,
    stock_graphs
)


async def initialize_nlp_cache(force_new: bool = False):
    """
    Initialize NLP analysis cache for all tickers in portfolio universe
    Blocks until all analysis is complete
    
    Args:
        force_new: If True, ignore cached data and re-analyze everything
    """
    try:
        from app.services.nlp_analysis_cache import NLPAnalysisCache
        
        print("=" * 60)
        print("NLP Analysis Cache Initialization")
        print("=" * 60)
        if force_new:
            print("--new flag detected: Forcing re-analysis of all tickers...")
        else:
            print("Loading cache from disk (if available)...")
        
        # Initialize cache - analyze all tickers in universe
        # This will block until all analysis is complete
        await NLPAnalysisCache.initialize_cache(
            universe_cutoff_months=18,
            max_tickers=None,  # Analyze all tickers
            force_new=force_new
        )
        
        print("=" * 60)
        print("NLP Analysis Cache Initialization Complete")
        print("=" * 60)
    except Exception as e:
        print(f"Error during NLP cache initialization: {str(e)}")
        raise


async def initialize_portfolio_risk_cache(force_new: bool = False):
    """
    Initialize portfolio risk metrics cache
    Computes all portfolio risk dashboard metrics and caches them
    
    Args:
        force_new: If True, recompute even if cache exists
    """
    try:
        from app.services.portfolio_risk_service import PortfolioRiskService
        
        print("=" * 60)
        print("Portfolio Risk Metrics Cache Initialization")
        print("=" * 60)
        if force_new:
            print("--new flag detected: Forcing recompute of portfolio risk metrics...")
        else:
            print("Loading portfolio risk cache from disk (if available)...")
        
        # Initialize cache - compute portfolio risk metrics
        PortfolioRiskService.initialize_cache(force_new=force_new)
        
        print("=" * 60)
        print("Portfolio Risk Metrics Cache Initialization Complete")
        print("=" * 60)
    except Exception as e:
        print(f"Error during portfolio risk cache initialization: {str(e)}")
        import traceback
        traceback.print_exc()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan event handler for startup and shutdown
    Replaces deprecated @app.on_event decorator
    
    Blocks startup until NLP cache initialization is complete
    """
    # Startup - BLOCK until NLP cache is complete
    print("\n" + "=" * 60)
    print("Starting FastAPI Server - Waiting for NLP Cache Initialization")
    print("=" * 60 + "\n")
    
    # Get force_new flag from global args or environment
    force_new = args.new if hasattr(args, 'new') and args.new else os.getenv('FORCE_NEW_NLP', 'false').lower() == 'true'
    
    # Initialize caches (blocks until complete)
    await initialize_nlp_cache(force_new=force_new)
    await initialize_portfolio_risk_cache(force_new=force_new)
    
    print("\n" + "=" * 60)
    print("FastAPI Server Starting - All Caches Ready")
    print("=" * 60 + "\n")
    
    yield
    
    # Shutdown
    print("Shutting down NLP cache...")


app = FastAPI(
    title="IntelliRisk API",
    description="Backend API for financial analytics platform",
    version="1.0.0",
    lifespan=lifespan
)

# Request logging middleware to debug CORS issues
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests for debugging CORS issues"""
    method = request.method
    url = request.url
    origin = request.headers.get("origin", "N/A")
    
    # Log the request
    logging.info(f"[REQUEST] {method} {url.path}")
    if method == "OPTIONS":
        logging.info(f"   [CORS Preflight] Origin: {origin}")
        logging.info(f"   Access-Control-Request-Method: {request.headers.get('access-control-request-method', 'N/A')}")
        logging.info(f"   Access-Control-Request-Headers: {request.headers.get('access-control-request-headers', 'N/A')}")
    
    response = await call_next(request)
    
    # Log response headers for CORS debugging
    if method == "OPTIONS":
        cors_origin = response.headers.get("access-control-allow-origin", "N/A")
        cors_methods = response.headers.get("access-control-allow-methods", "N/A")
        cors_headers = response.headers.get("access-control-allow-headers", "N/A")
        logging.info(f"   [CORS Response] Allow-Origin: {cors_origin}, Allow-Methods: {cors_methods}, Allow-Headers: {cors_headers}")
        logging.info(f"   [CORS Response] Status: {response.status_code}")
    
    return response

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:3000"
    ],  # Frontend dev servers (Vite can use different ports)
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,  # Cache preflight response for 1 hour
)

# Include routers
app.include_router(entities.router, prefix="/api/entities", tags=["entities"])
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])
app.include_router(files.router, prefix="/api/files", tags=["files"])
app.include_router(portfolio.router, prefix="/api/portfolio", tags=["portfolio"])
app.include_router(regulatory.router, prefix="/api/regulatory", tags=["regulatory"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(stocks.router, prefix="/api/stocks", tags=["stocks"])
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(scenarios.router, prefix="/api/scenarios", tags=["scenarios"])
app.include_router(recommendations.router, prefix="/api/recommendations", tags=["recommendations"])
app.include_router(company.router, prefix="/api/company", tags=["company"])
app.include_router(nlp_cache.router, prefix="/api/nlp-cache", tags=["nlp-cache"])
app.include_router(market_research.router, prefix="/api/market-research", tags=["market-research"])
app.include_router(stock_graphs.router, prefix="/api/stock-graphs", tags=["stock-graphs"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "IntelliRisk API",
        "version": "1.0.0",
        "status": "operational"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


@app.get("/aws/status")
async def aws_status():
    """AWS services status and configuration"""
    from app.services.aws_config import get_aws_status
    return get_aws_status()


if __name__ == "__main__":
    # Parse command-line arguments when running directly
    parser = argparse.ArgumentParser(description='IntelliRisk Backend Server')
    parser.add_argument('--new', action='store_true', help='Force re-analysis of all NLP data, ignoring cache')
    parsed_args = parser.parse_args()
    
    # Store in global variable for lifespan function
    import __main__
    __main__.args = parsed_args
    args = parsed_args
    
    # Run with multiple workers for better concurrency
    # Using 1 worker with async event loop is sufficient for most cases
    # Each worker can handle multiple concurrent requests via async/await
    # For production, consider using: workers=4 or running behind a reverse proxy like nginx
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000,
        # Loop settings for better async performance
        loop="asyncio",
        # Increase limit to allow larger request bodies (for file uploads)
        limit_concurrency=100,  # Max concurrent connections
        limit_max_requests=1000,  # Max requests before reload
        timeout_keep_alive=5,  # Keep-alive timeout
        backlog=2048,  # Socket backlog size
        access_log=True,  # Enable access logging
    )

