"""
NLP Cache Router - Endpoints for pre-computed NLP analysis results
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List

from app.services.nlp_analysis_cache import NLPAnalysisCache
from app.services.aws_bedrock_service import BedrockService

router = APIRouter()


@router.get("/all")
async def get_all_nlp_analyses():
    """
    Get all pre-computed NLP analysis results
    
    Returns:
        Dictionary of all cached analyses with metadata
    """
    try:
        analyses = NLPAnalysisCache.get_all_analyses()
        metadata = NLPAnalysisCache.get_cache_metadata()
        
        return {
            "analyses": analyses,
            "metadata": metadata
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching NLP analyses: {str(e)}")


@router.get("/ticker/{ticker}")
async def get_nlp_analysis(ticker: str):
    """
    Get pre-computed NLP analysis for a specific ticker
    
    Args:
        ticker: Ticker symbol
        
    Returns:
        Cached NLP analysis result
    """
    try:
        result = NLPAnalysisCache.get_analysis(ticker.upper())
        
        if result is None:
            raise HTTPException(
                status_code=404,
                detail=f"NLP analysis not found for {ticker}. Analysis may still be running or ticker not in universe."
            )
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching NLP analysis: {str(e)}")


@router.get("/top-signals")
async def get_top_signals(limit: int = Query(20, ge=1, le=100)):
    """
    Get top trading signals from pre-computed analyses
    
    Args:
        limit: Number of top signals to return (1-100)
        
    Returns:
        List of top trading signals sorted by strength
    """
    try:
        signals = NLPAnalysisCache.get_top_signals(limit=limit)
        
        return {
            "signals": signals,
            "count": len(signals)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching top signals: {str(e)}")


@router.get("/metadata")
async def get_cache_metadata():
    """
    Get cache metadata (status, last_updated, counts, etc.)
    
    Returns:
        Cache metadata
    """
    try:
        return NLPAnalysisCache.get_cache_metadata()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching cache metadata: {str(e)}")


@router.post("/ticker/{ticker}/descriptions")
async def generate_descriptions(ticker: str):
    """
    Generate AI-powered descriptions for NLP analysis sections using Amazon Bedrock
    
    Args:
        ticker: Ticker symbol
        
    Returns:
        Dictionary with descriptions for each analysis section
    """
    try:
        # Get the analysis data first
        analysis_data = NLPAnalysisCache.get_analysis(ticker.upper())
        
        if analysis_data is None:
            raise HTTPException(
                status_code=404,
                detail=f"NLP analysis not found for {ticker}. Analysis may still be running or ticker not in universe."
            )
        
        # Generate descriptions using Bedrock
        descriptions = BedrockService.generate_nlp_section_descriptions(analysis_data, ticker.upper())
        
        return descriptions
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating descriptions: {str(e)}")

