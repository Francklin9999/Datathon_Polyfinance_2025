"""
Documents router - Consolidated document analysis endpoint
"""

import logging
import asyncio
import time
import traceback
import json
from concurrent.futures import ThreadPoolExecutor
from fastapi import APIRouter, HTTPException, Query, Request
from typing import Optional
from pydantic import BaseModel

from app.models.types import Portfolio
from app.services.document_analyzer_service import DocumentAnalyzerService
from app.services.aws_bedrock_service import BedrockService
from app.services.aws_config import is_aws_configured

logger = logging.getLogger(__name__)
router = APIRouter()

# Thread pool executor for CPU-bound tasks
# This allows multiple requests to run concurrently
_executor = ThreadPoolExecutor(max_workers=4)


class DocumentAnalysisRequest(BaseModel):
    """Request model for document analysis"""
    portfolio: Portfolio
    documentText: Optional[str] = None
    fileUrl: Optional[str] = None
    agentQuery: Optional[str] = None
    threshold: float = 0.6
    strictUnits: bool = False
    maxCompanies: Optional[int] = None  # Optional: max companies to analyze (default: 50)


@router.post("/analyze")
async def analyze_document(request: DocumentAnalysisRequest, http_request: Request):
    """
    Analyze document (upload, agent query, or raw text) and return CompanyRisk[] + PortfolioImpact
    
    Accepts:
    - documentText: Raw document text
    - fileUrl: URL/path to document file
    - agentQuery: Query string for agent to fetch document
    
    Returns:
    {
        "company_risks": List[CompanyRisk],
        "portfolio_impact": PortfolioImpact,
        "document_provenance": Dict,
        "calibration": CalibrationMetadata
    }
    """
    start_time = time.time()
    
    portfolio_size = len(request.portfolio.holdings) if request.portfolio.holdings else 0
    request_id = id(request)  # Unique ID for this request
    
    # Console logging for visibility
    print("\n" + "=" * 80)
    print(f"[DOCUMENT ANALYSIS] New request received [ID: {request_id}]")
    print(f"  Timestamp: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  Portfolio size: {portfolio_size} companies")
    print(f"  Max companies to analyze: {request.maxCompanies or 50}")
    print(f"  Input types: file={request.fileUrl is not None}, text={request.documentText is not None}, query={request.agentQuery is not None}")
    print(f"  Parameters: threshold={request.threshold}, strict_units={request.strictUnits}")
    
    # Validate portfolio has at least one company
    if not request.portfolio.holdings or len(request.portfolio.holdings) == 0:
        error_msg = "Portfolio must contain at least one company. Please add companies to the portfolio before analyzing documents."
        print(f"[ERROR] {error_msg}")
        logger.error(f"ERROR: {error_msg}")
        raise HTTPException(status_code=400, detail=error_msg)
    
    # Log request details including headers for debugging
    logger.info(f"POST request received - Method: {http_request.method}, URL: {http_request.url}")
    logger.info(f"   Origin: {http_request.headers.get('origin', 'N/A')}")
    logger.info(f"   Content-Type: {http_request.headers.get('content-type', 'N/A')}")
    logger.info(f"   Referer: {http_request.headers.get('referer', 'N/A')}")
    
    logger.info("=" * 60)
    logger.info(f"Received document analysis POST request [ID: {request_id}]")
    logger.info(f"   Portfolio: {portfolio_size} companies")
    logger.info(f"   Input type: file={request.fileUrl is not None}, text={request.documentText is not None}, query={request.agentQuery is not None}")
    logger.info(f"   Parameters: threshold={request.threshold}, strict_units={request.strictUnits}")
    
    try:
        # Run CPU-bound analysis in thread pool to allow concurrent requests
        # This prevents blocking the event loop and allows multiple requests to process simultaneously
        loop = asyncio.get_event_loop()
        print(f"[DOCUMENT ANALYSIS] [ID: {request_id}] Starting analysis in thread pool executor...")
        logger.info(f"   [ID: {request_id}] Running analysis in thread pool executor...")
        
        # Add timeout to prevent hanging indefinitely (10 minutes max)
        # Large portfolios might take several minutes, but shouldn't take more than 10
        MAX_TIMEOUT = 600  # 10 minutes
        
        print(f"[DOCUMENT ANALYSIS] [ID: {request_id}] Analysis timeout set to {MAX_TIMEOUT}s ({MAX_TIMEOUT/60:.1f} minutes)")
        
        try:
            print(f"[DOCUMENT ANALYSIS] [ID: {request_id}] Executing analysis...")
            result = await asyncio.wait_for(
                loop.run_in_executor(
                    _executor,
                    DocumentAnalyzerService.analyze_document,
                    request.portfolio,
                    request.documentText,
                    request.fileUrl,
                    request.agentQuery,
                    request.threshold,
                    request.strictUnits,
                    request.maxCompanies  # Pass maxCompanies parameter
                ),
                timeout=MAX_TIMEOUT
            )
            print(f"[DOCUMENT ANALYSIS] [ID: {request_id}] Analysis execution completed successfully")
        except asyncio.TimeoutError:
            elapsed = time.time() - start_time
            error_msg = f"Analysis timed out after {elapsed:.1f}s (max: {MAX_TIMEOUT}s). The document may be too large or the portfolio too complex."
            print(f"[ERROR] [ID: {request_id}] {error_msg}")
            logger.error(f"ERROR: {error_msg}")
            raise HTTPException(status_code=504, detail=error_msg)
        
        # Convert Pydantic models to dict for JSON serialization
        total_time = time.time() - start_time
        num_risks = len(result["company_risks"])
        
        # Extract result summary
        portfolio_impact = result.get("portfolio_impact")
        global_impact = result.get("global_impact", {})
        delta_return = None
        if portfolio_impact and hasattr(portfolio_impact, 'delta_return_bps'):
            delta_return = portfolio_impact.delta_return_bps
        
        print(f"[DOCUMENT ANALYSIS] [ID: {request_id}] Request completed successfully!")
        print(f"  Total time: {total_time:.2f}s ({total_time/60:.1f} minutes)")
        print(f"  Company risks calculated: {num_risks}")
        if delta_return is not None:
            print(f"  Portfolio delta return: {delta_return:.2f} bps")
        if global_impact:
            global_summary = global_impact.get("global_summary", {})
            if global_summary:
                print(f"  Global impact: {global_summary.get('overall_impact', 'N/A')}")
        print("=" * 80 + "\n")
        
        logger.info(f"Request [ID: {request_id}] completed successfully in {total_time:.2f}s ({total_time/60:.1f} min)")
        logger.info(f"   Results: {num_risks} company risks calculated")
        logger.info("=" * 60)
        
        return {
            "company_risks": [risk.dict() for risk in result["company_risks"]],
            "portfolio_impact": result["portfolio_impact"].dict(),
            "global_impact": result.get("global_impact"),  # Include global impact if present
            "document_provenance": result["document_provenance"],
            "calibration": result["calibration"].dict()
        }
    except HTTPException:
        # Re-raise HTTP exceptions (like timeout)
        elapsed = time.time() - start_time
        print(f"[ERROR] [ID: {request_id}] HTTPException raised after {elapsed:.2f}s")
        raise
    except ValueError as e:
        error_msg = str(e)
        total_time = time.time() - start_time
        print(f"[ERROR] [ID: {request_id}] Validation error after {total_time:.2f}s")
        print(f"  Error message: {error_msg}")
        print("=" * 80 + "\n")
        logger.error(f"ERROR: Validation error after {total_time:.2f}s: {error_msg}")
        raise HTTPException(status_code=400, detail=error_msg)
    except Exception as e:
        error_msg = str(e)
        total_time = time.time() - start_time
        print(f"[ERROR] [ID: {request_id}] Exception occurred after {total_time:.2f}s")
        print(f"  Error type: {type(e).__name__}")
        print(f"  Error message: {error_msg}")
        print(f"  Full traceback:")
        traceback.print_exc()
        print("=" * 80 + "\n")
        logger.error(f"ERROR: Error analyzing document after {total_time:.2f}s: {error_msg}", exc_info=True)
        # Include elapsed time in error message for debugging
        raise HTTPException(
            status_code=500, 
            detail=f"Error analyzing document after {total_time:.1f}s: {error_msg}"
        )


@router.post("/generate-interpretation")
async def generate_document_interpretation(request: DocumentAnalysisRequest):
    """
    Generate general interpretation of document using NLP
    
    Takes document and generates a general global market interpretation using NLP,
    providing portfolio-level insights and recommendations.
    NO company-specific analysis - only global market trends.
    """
    try:
        # Get document text
        doc_text, doc_provenance = DocumentAnalyzerService._get_document_text(
            document_text=request.documentText,
            file_url=request.fileUrl,
            agent_query=request.agentQuery
        )
        
        if not doc_text:
            raise HTTPException(status_code=400, detail="Could not obtain document text")
        
        # Generate interpretation using NLP - GLOBAL MARKET ONLY, NO COMPANY ANALYSIS
        portfolio_size = len(request.portfolio.holdings) if request.portfolio.holdings else 0
        
        # Create prompt for NLP interpretation - FOCUS ON GLOBAL MARKET
        system_prompt = """You are a financial analyst providing global market interpretation of regulatory documents, 
economic reports, and market analysis. Focus on macroeconomic trends, sector-level impacts, and geographic implications.
DO NOT analyze individual companies. Provide general market insights only."""
        
        interpretation_prompt = f"""Analyze the following document and provide a GENERAL GLOBAL MARKET interpretation for portfolio management.
DO NOT mention or analyze specific companies. Focus on macro trends, sectors, and geographic regions.

Document (first 15000 characters):
{doc_text[:15000]}

Portfolio Context:
- Portfolio size: {portfolio_size} companies (for context only - do not analyze companies)

Please provide a structured interpretation in JSON format with the following fields:
{{
  "summary": "2-3 sentence overall summary of the document focusing on global market implications",
  "key_themes": ["global theme 1", "global theme 2", "global theme 3"],
  "portfolio_implications": "2-3 sentence explanation of how this affects portfolios in general (not specific companies)",
  "risk_assessment": "assessment of overall market risk (low/medium/high) with brief explanation",
  "recommendations": [
    "General portfolio recommendation 1 (no company names)",
    "General portfolio recommendation 2",
    "General portfolio recommendation 3"
  ],
  "sectors_mentioned": ["sector1", "sector2"],
  "sector_impacts": {{
    "sector1": "brief impact description",
    "sector2": "brief impact description"
  }},
  "geographic_impact": "brief description of geographic/regional market implications",
  "market_trends": "brief description of broader market trends identified"
}}

IMPORTANT: 
- Focus on GLOBAL MARKET trends, not individual companies
- Analyze sectors, regions, and macroeconomic factors
- Provide actionable portfolio-level guidance
- NO company names or ticker symbols
- Be concise and actionable."""

        # Use NLP to generate interpretation
        if is_aws_configured():
            nlp_response = BedrockService.invoke_model(
                prompt=interpretation_prompt,
                system_prompt=system_prompt,
                max_tokens=2048,
                temperature=0.5
            )
            response_text = nlp_response.get("text", "")
        else:
            # Fallback interpretation
            response_text = json.dumps({
                "summary": "Document analysis indicates regulatory and market factors that may impact portfolio performance.",
                "key_themes": ["Regulatory changes", "Market volatility", "Economic conditions"],
                "portfolio_implications": "The document suggests potential adjustments to portfolio weights based on risk factors.",
                "risk_assessment": "Medium risk - requires monitoring and potential adjustments",
                "recommendations": [
                    "Review high-risk positions",
                    "Consider diversification",
                    "Monitor regulatory changes"
                ],
                "sectors_mentioned": ["Technology", "Healthcare"],
                "geographic_impact": "May affect international exposure"
            })
        
        # Parse JSON response
        interpretation = None
        try:
            # Try to extract JSON from response
            if "```json" in response_text:
                json_start = response_text.find("```json") + 7
                json_end = response_text.find("```", json_start)
                if json_end > json_start:
                    interpretation = json.loads(response_text[json_start:json_end].strip())
            elif "{" in response_text and "}" in response_text:
                # Try to find JSON object in text
                json_start = response_text.find("{")
                json_end = response_text.rfind("}") + 1
                if json_end > json_start:
                    interpretation = json.loads(response_text[json_start:json_end])
            else:
                interpretation = json.loads(response_text)
        except (json.JSONDecodeError, ValueError):
            # If JSON parsing fails, create structured response from text
            interpretation = {
                "summary": response_text[:500] if len(response_text) > 500 else response_text,
                "key_themes": [],
                "portfolio_implications": response_text,
                "risk_assessment": "Medium",
                "recommendations": ["Review document analysis", "Consider portfolio adjustments"],
                "sectors_mentioned": [],
                "geographic_impact": "Analysis pending"
            }
        
        # Return interpretation immediately (fast) - NO COMPANY ANALYSIS
        # This is purely global market interpretation
        return {
            "interpretation": interpretation,
            "timestamp": time.strftime('%Y-%m-%d %H:%M:%S'),
            "note": "General global market interpretation - no individual company analysis performed"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error generating interpretation: {str(e)}")

