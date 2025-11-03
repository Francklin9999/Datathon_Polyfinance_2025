"""
Stock Graphs Router - Endpoints for correlation and dependency graphs
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from pydantic import BaseModel

from app.services.stock_graph_service import StockGraphService
from app.services.portfolio_service import PortfolioService

router = APIRouter()


class GraphRequest(BaseModel):
    tickers: Optional[List[str]] = None
    correlation_threshold: float = 0.5
    lookback_days: int = 90


@router.post("/correlation")
async def build_correlation_graph(request: GraphRequest):
    """
    Build a graph of stocks that move together based on price correlation
    
    Args:
        request: GraphRequest with optional tickers (uses portfolio universe if not provided)
        
    Returns:
        Correlation graph with nodes and edges
    """
    try:
        if request.tickers:
            tickers = request.tickers
        else:
            # Use portfolio universe
            portfolio = PortfolioService.init_equal_weight_universe()
            tickers = list(portfolio.holdings.keys())
        
        graph = await StockGraphService.build_correlation_graph(
            tickers=tickers,
            correlation_threshold=request.correlation_threshold,
            lookback_days=request.lookback_days
        )
        
        return graph
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error building correlation graph: {str(e)}")


class DependencyRequest(BaseModel):
    tickers: Optional[List[str]] = None


@router.post("/dependency")
async def build_dependency_graph_post(
    request: DependencyRequest,
    include_supply_chain: bool = Query(True),
    include_customers: bool = Query(True),
    include_partnerships: bool = Query(True)
):
    """
    Build a graph of stock dependencies (who affects whom)
    Based on supply chain, customer relationships, partnerships from 10-K filings
    
    Args:
        tickers: Optional list of tickers (uses portfolio universe if not provided)
        include_supply_chain: Include supplier-customer relationships
        include_customers: Include customer mentions
        include_partnerships: Include partnership mentions
        
    Returns:
        Dependency graph with nodes and edges
    """
    try:
        tickers = request.tickers
        if not tickers:
            # Use portfolio universe
            portfolio = PortfolioService.init_equal_weight_universe()
            tickers = list(portfolio.holdings.keys())
        
        graph = await StockGraphService.build_dependency_graph(
            tickers=tickers,
            include_supply_chain=include_supply_chain,
            include_customers=include_customers,
            include_partnerships=include_partnerships
        )
        
        return graph
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error building dependency graph: {str(e)}")


@router.get("/relationships/{ticker}")
async def get_stock_relationships(
    ticker: str,
    relationship_type: Optional[str] = Query(None, description="Filter by type: correlation, supplier, customer, partnership")
):
    """
    Get all relationships for a specific ticker
    
    Args:
        ticker: Ticker symbol
        relationship_type: Optional filter by relationship type
        
    Returns:
        Dictionary with relationships grouped by type
    """
    try:
        relationships = await StockGraphService.get_stock_relationships(
            ticker=ticker,
            relationship_type=relationship_type
        )
        
        return relationships
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting stock relationships: {str(e)}")


@router.get("/portfolio/correlation")
async def get_portfolio_correlation_graph(
    correlation_threshold: float = Query(0.5, ge=0.0, le=1.0),
    lookback_days: int = Query(90, ge=1, le=365)
):
    """
    Get correlation graph for current portfolio universe
    
    Args:
        correlation_threshold: Minimum correlation to include edge (0-1)
        lookback_days: Number of days to look back for correlation
        
    Returns:
        Correlation graph
    """
    try:
        portfolio = PortfolioService.init_equal_weight_universe()
        tickers = list(portfolio.holdings.keys())
        
        graph = await StockGraphService.build_correlation_graph(
            tickers=tickers,
            correlation_threshold=correlation_threshold,
            lookback_days=lookback_days
        )
        
        return graph
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error building portfolio correlation graph: {str(e)}")


@router.get("/portfolio/dependency")
async def get_portfolio_dependency_graph(
    include_supply_chain: bool = Query(True),
    include_customers: bool = Query(True),
    include_partnerships: bool = Query(True)
):
    """
    Get dependency graph for current portfolio universe
    
    Args:
        include_supply_chain: Include supplier relationships
        include_customers: Include customer relationships
        include_partnerships: Include partnership relationships
        
    Returns:
        Dependency graph
    """
    try:
        portfolio = PortfolioService.init_equal_weight_universe()
        tickers = list(portfolio.holdings.keys())
        
        graph = await StockGraphService.build_dependency_graph(
            tickers=tickers,
            include_supply_chain=include_supply_chain,
            include_customers=include_customers,
            include_partnerships=include_partnerships
        )
        
        return graph
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error building portfolio dependency graph: {str(e)}")

