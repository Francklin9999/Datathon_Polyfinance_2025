"""
Entities router - handles all entity CRUD operations
MarketSnapshot, RiskMetrics, NewsItem, Position, Order, EventItem
"""

from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List, Literal
from datetime import datetime
import random

from app.models.entities import (
    MarketSnapshot,
    RiskMetrics,
    NewsItem,
    Position,
    Order,
    EventItem
)

router = APIRouter()


# Mock data storage (in production, use a database)
market_snapshots_db = []
risk_metrics_db = []
news_items_db = []
positions_db = []
orders_db = []
events_db = []


@router.get("/MarketSnapshot", response_model=List[MarketSnapshot])
async def list_market_snapshots(
    region: Optional[Literal["US", "EU", "ASIA", "GLOBAL"]] = Query(None, description="Filter by region"),
    sort: Optional[str] = Query(None, description="Sort order (e.g., '-updated_date')"),
    limit: Optional[int] = Query(100, description="Limit results")
):
    """List market snapshots"""
    results = market_snapshots_db
    
    if region:
        results = [s for s in results if s.get("region") == region]
    
    # Apply sorting
    if sort:
        reverse = sort.startswith("-")
        sort_key = sort.lstrip("-")
        results = sorted(results, key=lambda x: x.get(sort_key, 0), reverse=reverse)
    
    return results[:limit] if limit else results


@router.post("/MarketSnapshot", response_model=MarketSnapshot)
async def create_market_snapshot(snapshot: MarketSnapshot):
    """Create a new market snapshot"""
    snapshot_dict = snapshot.model_dump()
    snapshot_dict["updated_date"] = datetime.now().isoformat()
    market_snapshots_db.append(snapshot_dict)
    return snapshot_dict


@router.get("/MarketSnapshot/{region}", response_model=Optional[MarketSnapshot])
async def get_market_snapshot_by_region(region: Literal["US", "EU", "ASIA", "GLOBAL"]):
    """Get market snapshot by region"""
    for snapshot in market_snapshots_db:
        if snapshot.get("region") == region:
            return snapshot
    # Generate mock data if not found
    return generate_mock_snapshot(region)


def generate_mock_snapshot(region: str) -> dict:
    """Generate mock market snapshot data"""
    indices = [
        {"symbol": "SPX", "name": "S&P 500", "price": 4500 + random.uniform(-50, 50), 
         "chg1D": random.uniform(-2, 2), "chg5D": random.uniform(-5, 5), "ytd": random.uniform(-10, 15)},
    ]
    
    if region == "EU":
        indices = [
            {"symbol": "STOXX50", "name": "Euro STOXX 50", "price": 4000 + random.uniform(-50, 50),
             "chg1D": random.uniform(-2, 2), "chg5D": random.uniform(-5, 5), "ytd": random.uniform(-10, 15)},
        ]
    elif region == "ASIA":
        indices = [
            {"symbol": "N225", "name": "Nikkei 225", "price": 30000 + random.uniform(-500, 500),
             "chg1D": random.uniform(-2, 2), "chg5D": random.uniform(-5, 5), "ytd": random.uniform(-10, 15)},
        ]
    
    return {
        "region": region,
        "status": "OPEN",
        "localTime": datetime.now().isoformat(),
        "indices": indices,
        "fx": [
            {"symbol": "EURUSD", "name": "EUR/USD", "price": 1.08 + random.uniform(-0.02, 0.02), 
             "chg1D": random.uniform(-1, 1)},
        ],
        "commodities": [
            {"symbol": "GC", "name": "Gold", "price": 2000 + random.uniform(-50, 50),
             "chg1D": random.uniform(-2, 2)},
        ],
        "bonds": [],
        "sources": ["Mock Data"]
    }


@router.get("/RiskMetrics", response_model=List[RiskMetrics])
async def list_risk_metrics(
    region: Optional[Literal["US", "EU", "ASIA", "GLOBAL"]] = Query(None),
    sort: Optional[str] = Query(None),
    limit: Optional[int] = Query(100)
):
    """List risk metrics"""
    results = risk_metrics_db
    
    if region:
        results = [r for r in results if r.get("region") == region]
    
    if sort:
        reverse = sort.startswith("-")
        sort_key = sort.lstrip("-")
        results = sorted(results, key=lambda x: x.get(sort_key, 0), reverse=reverse)
    
    if not results:
        # Generate mock data
        for r in ["US", "EU", "ASIA"]:
            results.append({
                "region": r,
                "volatility20d": random.uniform(10, 30),
                "vix": random.uniform(15, 35),
                "yield10s": random.uniform(3.5, 5.5),
                "credit_spread": random.uniform(1.0, 3.0),
                "updated_date": datetime.now().isoformat()
            })
    
    return results[:limit] if limit else results


@router.post("/RiskMetrics", response_model=RiskMetrics)
async def create_risk_metrics(metrics: RiskMetrics):
    """Create risk metrics"""
    metrics_dict = metrics.model_dump()
    metrics_dict["updated_date"] = datetime.now().isoformat()
    risk_metrics_db.append(metrics_dict)
    return metrics_dict


@router.get("/NewsItem", response_model=List[NewsItem])
async def list_news_items(
    region: Optional[Literal["US", "EU", "ASIA", "GLOBAL"]] = Query(None),
    sort: Optional[str] = Query("-publishedDate"),
    limit: Optional[int] = Query(10)
):
    """List news items"""
    results = news_items_db
    
    if region:
        results = [n for n in results if n.get("region") == region]
    
    if sort:
        reverse = sort.startswith("-")
        sort_key = sort.lstrip("-")
        try:
            results = sorted(results, key=lambda x: datetime.fromisoformat(x.get(sort_key, "2000-01-01")) 
                          if isinstance(x.get(sort_key), str) else x.get(sort_key, 0), reverse=reverse)
        except:
            results = sorted(results, key=lambda x: x.get(sort_key, 0), reverse=reverse)
    
    if not results:
        # Generate mock data
        mock_titles = [
            "Fed Signals Rate Cut Pause",
            "Tech Stocks Rally on AI Optimism",
            "Oil Prices Surge on Supply Concerns",
            "GDP Growth Exceeds Expectations",
            "Corporate Earnings Beat Estimates"
        ]
        for i, title in enumerate(mock_titles[:limit or 5]):
            results.append({
                "region": region or "US",
                "title": title,
                "source": "Financial Times",
                "url": f"https://example.com/news/{i}",
                "publishedDate": datetime.now().isoformat(),
                "sentiment": random.choice(["positive", "neutral", "negative"]),
                "sentimentScore": random.uniform(-1, 1),
                "keywords": ["markets", "economy"],
                "summary": f"Summary for {title}"
            })
    
    return results[:limit] if limit else results


@router.post("/NewsItem", response_model=NewsItem)
async def create_news_item(news: NewsItem):
    """Create a news item"""
    news_dict = news.model_dump()
    news_items_db.append(news_dict)
    return news_dict


@router.get("/Position", response_model=List[Position])
async def list_positions(
    desk: Optional[str] = Query(None),
    region: Optional[Literal["US", "EU", "ASIA", "GLOBAL"]] = Query(None),
    sort: Optional[str] = Query("-updated_date"),
    limit: Optional[int] = Query(100)
):
    """List positions"""
    results = positions_db
    
    if desk:
        results = [p for p in results if p.get("desk") == desk]
    
    if region:
        results = [p for p in results if p.get("region") == region]
    
    if sort:
        reverse = sort.startswith("-")
        sort_key = sort.lstrip("-")
        results = sorted(results, key=lambda x: x.get(sort_key, 0), reverse=reverse)
    
    return results[:limit] if limit else results


@router.post("/Position", response_model=Position)
async def create_position(position: Position):
    """Create a position"""
    position_dict = position.model_dump()
    position_dict["updated_date"] = datetime.now().isoformat()
    positions_db.append(position_dict)
    return position_dict


@router.get("/Order", response_model=List[Order])
async def list_orders(
    desk: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    sort: Optional[str] = Query("-timestamp"),
    limit: Optional[int] = Query(50)
):
    """List orders"""
    results = orders_db
    
    if desk:
        results = [o for o in results if o.get("desk") == desk]
    
    if status:
        results = [o for o in results if o.get("status") == status]
    
    if sort:
        reverse = sort.startswith("-")
        sort_key = sort.lstrip("-")
        results = sorted(results, key=lambda x: x.get(sort_key, 0), reverse=reverse)
    
    return results[:limit] if limit else results


@router.post("/Order", response_model=Order)
async def create_order(order: Order):
    """Create an order"""
    order_dict = order.model_dump()
    order_dict["timestamp"] = datetime.now().isoformat()
    orders_db.append(order_dict)
    return order_dict


@router.get("/EventItem", response_model=List[EventItem])
async def list_events(
    region: Optional[Literal["US", "EU", "ASIA", "GLOBAL"]] = Query(None),
    sort: Optional[str] = Query("-scheduledDate"),
    limit: Optional[int] = Query(100)
):
    """List events"""
    results = events_db
    
    if region:
        results = [e for e in results if e.get("region") == region]
    
    if sort:
        reverse = sort.startswith("-")
        sort_key = sort.lstrip("-")
        results = sorted(results, key=lambda x: x.get(sort_key, 0), reverse=reverse)
    
    return results[:limit] if limit else results


@router.post("/EventItem", response_model=EventItem)
async def create_event(event: EventItem):
    """Create an event"""
    event_dict = event.model_dump()
    events_db.append(event_dict)
    return event_dict

