"""
Market Research Router - AI-powered stock research endpoints
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List, Dict
from pydantic import BaseModel

from app.services.market_research_service import MarketResearchService

router = APIRouter()


class MarketResearchRequest(BaseModel):
    ticker: str
    company_name: Optional[str] = None
    max_results: int = 20
    include_filings: bool = True


class MarketResearchResponse(BaseModel):
    ticker: str
    company_name: str
    research_date: str
    risks: list
    opportunities: list
    sentiment: dict
    key_findings: list
    sources: list
    filing_analysis: Optional[dict] = None
    nlp_analysis: Optional[dict] = None
    nlp_recommendation: Optional[str] = None
    nlp_confidence: Optional[float] = None
    quantitative_analysis: Optional[dict] = None
    risk_score: float
    recommendation: str


class FollowupQuestionRequest(BaseModel):
    ticker: str
    company_name: Optional[str] = None
    question: str
    research_context: Optional[dict] = None
    conversation_history: Optional[List[Dict]] = None


class FollowupQuestionResponse(BaseModel):
    answer: str
    needs_search: bool
    method: str
    model: Optional[str] = None


@router.post("/research", response_model=MarketResearchResponse)
async def research_stock(request: MarketResearchRequest):
    """
    Conduct AI-powered market research on a stock
    
    Searches the web for recent news, risks, and opportunities related to the stock.
    Analyzes 10-K/10-Q filings if available.
    
    Args:
        request: MarketResearchRequest with ticker and optional parameters
        
    Returns:
        MarketResearchResponse with comprehensive research findings
    """
    try:
        results = await MarketResearchService.research_stock(
            ticker=request.ticker,
            company_name=request.company_name,
            max_results=request.max_results,
            include_filings=request.include_filings
        )
        
        return MarketResearchResponse(**results)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error conducting market research: {str(e)}")


@router.get("/research/{ticker}")
async def research_stock_get(
    ticker: str,
    company_name: Optional[str] = Query(None),
    max_results: int = Query(20, ge=1, le=50),
    include_filings: bool = Query(True)
):
    """
    Conduct AI-powered market research on a stock (GET endpoint)
    
    Args:
        ticker: Stock ticker symbol
        company_name: Optional company name
        max_results: Maximum number of web search results (1-50)
        include_filings: Whether to include 10-K/10-Q filing analysis
        
    Returns:
        MarketResearchResponse with comprehensive research findings
    """
    try:
        results = await MarketResearchService.research_stock(
            ticker=ticker,
            company_name=company_name,
            max_results=max_results,
            include_filings=include_filings
        )
        
        return MarketResearchResponse(**results)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error conducting market research: {str(e)}")


@router.post("/followup", response_model=FollowupQuestionResponse)
async def answer_followup_question(request: FollowupQuestionRequest):
    """
    Answer follow-up questions about a company using Bedrock
    
    The system can search for additional information if needed based on the question.
    Uses previous research context and conversation history for context.
    
    Args:
        request: FollowupQuestionRequest with ticker, question, and optional context
        
    Returns:
        FollowupQuestionResponse with answer and metadata
    """
    try:
        result = await MarketResearchService.answer_followup_question(
            ticker=request.ticker,
            company_name=request.company_name or request.ticker,
            question=request.question,
            research_context=request.research_context,
            conversation_history=request.conversation_history
        )
        
        return FollowupQuestionResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error answering follow-up question: {str(e)}")

