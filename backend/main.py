"""
Main FastAPI application for PolyFinance 2025
Handles all dynamic features from the frontend
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

from app.routers import (
    entities,
    ai,
    files,
    portfolio,
    regulatory,
    risk,
    options,
    fixed_income,
    equities,
    analytics,
    stocks
)

app = FastAPI(
    title="PolyFinance 2025 API",
    description="Backend API for financial analytics platform",
    version="1.0.0"
)

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
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(entities.router, prefix="/api/entities", tags=["entities"])
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])
app.include_router(files.router, prefix="/api/files", tags=["files"])
app.include_router(portfolio.router, prefix="/api/portfolio", tags=["portfolio"])
app.include_router(regulatory.router, prefix="/api/regulatory", tags=["regulatory"])
app.include_router(risk.router, prefix="/api/risk", tags=["risk"])
app.include_router(options.router, prefix="/api/options", tags=["options"])
app.include_router(fixed_income.router, prefix="/api/fixed-income", tags=["fixed-income"])
app.include_router(equities.router, prefix="/api/equities", tags=["equities"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(stocks.router, prefix="/api/stocks", tags=["stocks"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "PolyFinance 2025 API",
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
    uvicorn.run(app, host="0.0.0.0", port=8000)

