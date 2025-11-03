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

load_dotenv()

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
    stock_graphs,
    video,
    image
)


async def initialize_nlp_cache(force_new: bool = False):
    try:
        from app.services.nlp_analysis_cache import NLPAnalysisCache
        
        print("=" * 60)
        print("NLP Analysis Cache Initialization")
        print("=" * 60)
        if force_new:
            print("--new flag detected: Forcing re-analysis of all tickers...")
        else:
            print("Loading cache from disk (if available)...")
        
        await NLPAnalysisCache.initialize_cache(
            universe_cutoff_months=18,
            max_tickers=None,
            force_new=force_new
        )
        
        print("=" * 60)
        print("NLP Analysis Cache Initialization Complete")
        print("=" * 60)
    except Exception as e:
        print(f"Error during NLP cache initialization: {str(e)}")
        raise


async def initialize_portfolio_risk_cache(force_new: bool = False):
    try:
        from app.services.portfolio_risk_service import PortfolioRiskService
        
        print("=" * 60)
        print("Portfolio Risk Metrics Cache Initialization")
        print("=" * 60)
        if force_new:
            print("--new flag detected: Forcing recompute of portfolio risk metrics...")
        else:
            print("Loading portfolio risk cache from disk (if available)...")
        
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
    print("\n" + "=" * 60)
    print("Starting FastAPI Server - Waiting for NLP Cache Initialization")
    print("=" * 60 + "\n")
    
    force_new = args.new if hasattr(args, 'new') and args.new else os.getenv('FORCE_NEW_NLP', 'false').lower() == 'true'
    
    await initialize_nlp_cache(force_new=force_new)
    await initialize_portfolio_risk_cache(force_new=force_new)
    
    print("\n" + "=" * 60)
    print("FastAPI Server Starting - All Caches Ready")
    print("=" * 60 + "\n")
    
    yield
    
    print("Shutting down NLP cache...")


app = FastAPI(
    title="IntelliRisk API",
    description="Backend API for financial analytics platform",
    version="1.0.0",
    lifespan=lifespan
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    method = request.method
    url = request.url
    origin = request.headers.get("origin", "N/A")
    
    logging.info(f"[REQUEST] {method} {url.path}")
    if method == "OPTIONS":
        logging.info(f"   [CORS Preflight] Origin: {origin}")
        logging.info(f"   Access-Control-Request-Method: {request.headers.get('access-control-request-method', 'N/A')}")
        logging.info(f"   Access-Control-Request-Headers: {request.headers.get('access-control-request-headers', 'N/A')}")
    
    response = await call_next(request)
    
    if method == "OPTIONS":
        cors_origin = response.headers.get("access-control-allow-origin", "N/A")
        cors_methods = response.headers.get("access-control-allow-methods", "N/A")
        cors_headers = response.headers.get("access-control-allow-headers", "N/A")
        logging.info(f"   [CORS Response] Allow-Origin: {cors_origin}, Allow-Methods: {cors_methods}, Allow-Headers: {cors_headers}")
        logging.info(f"   [CORS Response] Status: {response.status_code}")
    
    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600
)

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
app.include_router(video.router, prefix="/api/video", tags=["video"])
app.include_router(image.router, prefix="/api/image", tags=["image"])


@app.get("/")
async def root():
    return {
        "message": "IntelliRisk API",
        "version": "1.0.0",
        "status": "operational"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/aws/status")
async def aws_status():
    from app.services.aws_config import get_aws_status
    return get_aws_status()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='IntelliRisk Backend Server')
    parser.add_argument('--new', action='store_true', help='Force re-analysis of all NLP data, ignoring cache')
    parsed_args = parser.parse_args()
    
    import __main__
    __main__.args = parsed_args
    args = parsed_args
    
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000,
        loop="asyncio",
        limit_concurrency=100,
        limit_max_requests=1000,
        timeout_keep_alive=5,
        backlog=2048,
        access_log=True,
    )

