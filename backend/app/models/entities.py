"""
Pydantic models for entity data structures
Matching frontend Entity JSON schemas
"""

from typing import List, Optional, Literal
from pydantic import BaseModel, Field
from datetime import datetime


# Market Snapshot Models
class IndexItem(BaseModel):
    symbol: str
    name: str
    price: float
    chg1D: float
    chg5D: Optional[float] = None
    ytd: Optional[float] = None


class FXPair(BaseModel):
    symbol: str
    name: str
    price: float
    chg1D: float


class Commodity(BaseModel):
    symbol: str
    name: str
    price: float
    chg1D: float


class Bond(BaseModel):
    symbol: str
    name: str
    yield_value: float = Field(..., serialization_alias="yield")
    chg1D: float


class MarketSnapshot(BaseModel):
    region: Literal["US", "EU", "ASIA", "GLOBAL"]
    status: Literal["OPEN", "PREOPEN", "CLOSED"] = "OPEN"
    localTime: Optional[str] = None
    indices: Optional[List[IndexItem]] = []
    fx: Optional[List[FXPair]] = []
    commodities: Optional[List[Commodity]] = []
    bonds: Optional[List[Bond]] = []
    sources: Optional[List[str]] = []


# Risk Metrics Model
class RiskMetrics(BaseModel):
    region: Literal["US", "EU", "ASIA", "GLOBAL"]
    volatility20d: float
    vix: Optional[float] = None
    yield10s: Optional[float] = None
    credit_spread: Optional[float] = None
    updated_date: Optional[datetime] = None


# News Item Model
class NewsItem(BaseModel):
    region: Literal["US", "EU", "ASIA", "GLOBAL"]
    title: str
    source: str
    url: Optional[str] = None
    publishedDate: datetime
    sentiment: Literal["positive", "neutral", "negative"] = "neutral"
    sentimentScore: Optional[float] = None
    keywords: Optional[List[str]] = []
    summary: Optional[str] = None


# Position Model
class Position(BaseModel):
    trader: Optional[str] = None
    desk: Literal["Equities", "FixedIncome", "FX", "Commodities", "Options", "Credit"]
    symbol: str
    name: Optional[str] = None
    assetClass: Literal["Equity", "Bond", "FX", "Commodity", "Option", "Credit"]
    quantity: float
    avgPrice: float
    currentPrice: Optional[float] = None
    marketValue: Optional[float] = None
    unrealizedPnL: Optional[float] = None
    realizedPnL: Optional[float] = None
    dayPnL: Optional[float] = None
    exposure: Optional[float] = None
    side: Literal["LONG", "SHORT"]
    region: Optional[Literal["US", "EU", "ASIA", "GLOBAL"]] = None
    updated_date: Optional[datetime] = None


# Order Model
class Order(BaseModel):
    orderId: str
    trader: Optional[str] = None
    desk: Literal["Equities", "FixedIncome", "FX", "Commodities", "Options", "Credit"]
    symbol: str
    side: Literal["BUY", "SELL"]
    quantity: float
    orderType: Literal["MARKET", "LIMIT", "STOP"] = "MARKET"
    limitPrice: Optional[float] = None
    status: Literal["PENDING", "FILLED", "PARTIALLY_FILLED", "CANCELLED", "REJECTED"]
    filledQuantity: Optional[float] = None
    avgFillPrice: Optional[float] = None
    timestamp: datetime
    region: Optional[Literal["US", "EU", "ASIA", "GLOBAL"]] = None


# Event Item Model
class EventItem(BaseModel):
    eventId: str
    title: str
    description: Optional[str] = None
    eventType: str
    scheduledDate: datetime
    region: Optional[Literal["US", "EU", "ASIA", "GLOBAL"]] = None
    affectedInstruments: Optional[List[str]] = []
    importance: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"] = "MEDIUM"
