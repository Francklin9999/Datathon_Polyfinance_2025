"""
AI/LLM router - handles AI integrations for summaries and document analysis
"""

from fastapi import APIRouter, HTTPException
from typing import Optional
import json
import random
import os

from app.models.requests import LLMRequest
from app.services.aws_bedrock_service import BedrockService
from app.services.aws_config import is_aws_configured, AWSServices
from app.services.searxng_service import SearXNGService
from app.services.web_scraper_service import WebScraperService
from fastapi import WebSocket, WebSocketDisconnect
import uuid
import base64

router = APIRouter()


@router.post("/invoke-llm")
async def invoke_llm(request: LLMRequest):
    """
    Invoke LLM for AI summaries and document analysis
    Uses AWS Bedrock (Claude models) for AI-powered analysis
    Falls back to mock responses if AWS not configured
    Supports online search via SearXNG when add_context_from_internet is True
    """
    prompt = request.prompt
    enhanced_prompt = prompt
    
    # Check if online search should be performed
    should_search = request.add_context_from_internet or SearXNGService.should_search_online(prompt)
    
    # Perform online search if needed
    search_context = ""
    if should_search:
        try:
            search_context = SearXNGService.search_and_format_context(query=prompt, max_results=5)
            # Add search context to the prompt
            enhanced_prompt = f"""User Question: {prompt}

{search_context}

Please answer the user's question using the above search results as additional context. If the search results don't contain relevant information, you can still answer based on your training knowledge, but please indicate when you're using general knowledge vs. the provided search results."""
        except Exception as e:
            # If search fails, continue without search context
            search_context = f"[Note: Online search unavailable - {str(e)}]"
    
    # Use AWS Bedrock if configured
    if is_aws_configured():
        try:
            # Try different models - start with requested model, then try others
            models_to_try = []
            if request.model:
                # Try requested model first
                models_to_try.append(request.model)
                # Then try others as fallback
                all_models = ["claude-3-haiku", "claude-3-sonnet", "claude-3-5-sonnet", "claude-3-opus"]
                models_to_try.extend([m for m in all_models if m != request.model])
            else:
                # Try all available models in order (fastest/cheapest first)
                models_to_try = ["claude-3-haiku", "claude-3-sonnet", "claude-3-5-sonnet", "claude-3-opus"]
            
            response = None
            last_error = None
            
            for model in models_to_try:
                try:
                    response = BedrockService.invoke_model(
                        prompt=enhanced_prompt,
                        model_id=model,
                        max_tokens=4096,
                        temperature=0.7
                    )
                    # If successful (not an error response), break
                    if response and not response.get("text", "").startswith("[Error]"):
                        break
                except Exception as e:
                    last_error = str(e)
                    continue
            
            # Try to parse JSON if requested
            if request.response_json_schema:
                try:
                    import json
                    import re
                    text = response.get("text", "")
                    
                    # Try multiple methods to extract JSON
                    json_text = None
                    
                    # Method 1: Look for ```json code blocks
                    if "```json" in text:
                        json_start = text.find("```json") + 7
                        json_end = text.find("```", json_start)
                        if json_end > json_start:
                            json_text = text[json_start:json_end].strip()
                    
                    # Method 2: Look for JSON object in text (find first { and last })
                    # This handles nested JSON objects by finding the outermost braces
                    if not json_text:
                        first_brace = text.find('{')
                        if first_brace != -1:
                            # Find matching closing brace, accounting for nested braces
                            brace_count = 0
                            last_brace = first_brace
                            for i in range(first_brace, len(text)):
                                if text[i] == '{':
                                    brace_count += 1
                                elif text[i] == '}':
                                    brace_count -= 1
                                    if brace_count == 0:
                                        last_brace = i
                                        break
                            if last_brace > first_brace:
                                json_text = text[first_brace:last_brace + 1].strip()
                    
                    # Method 3: Try to find JSON array if object not found
                    if not json_text:
                        first_bracket = text.find('[')
                        last_bracket = text.rfind(']')
                        if first_bracket != -1 and last_bracket != -1 and last_bracket > first_bracket:
                            json_text = text[first_bracket:last_bracket + 1].strip()
                    
                    # Method 4: Try regex to find JSON object
                    if not json_text:
                        json_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', text, re.DOTALL)
                        if json_match:
                            json_text = json_match.group(0)
                    
                    if json_text:
                        try:
                            parsed = json.loads(json_text)
                            return parsed
                        except json.JSONDecodeError:
                            # If parsing fails, try to clean up common issues
                            # Remove common markdown artifacts
                            cleaned = json_text
                            if cleaned.startswith('json'):
                                cleaned = cleaned[4:].strip()
                            if cleaned.startswith('```'):
                                cleaned = cleaned[3:].strip()
                            if cleaned.endswith('```'):
                                cleaned = cleaned[:-3].strip()
                            try:
                                parsed = json.loads(cleaned)
                                return parsed
                            except:
                                pass
                    
                    # If no JSON found in text, try parsing the whole text
                    # But only if it looks like JSON
                    if text.strip().startswith('{') or text.strip().startswith('['):
                        try:
                            parsed = json.loads(text.strip())
                            return parsed
                        except:
                            pass
                except json.JSONDecodeError as e:
                    # If JSON parsing fails, try to return a structured error with the raw response
                    return {
                        "error": "Failed to parse JSON response",
                        "raw_response": response.get("text", ""),
                        "method": response.get("method", ""),
                        "parse_error": str(e)
                    }
                except Exception as e:
                    return {
                        "error": "Error processing response",
                        "raw_response": response.get("text", ""),
                        "method": response.get("method", ""),
                        "error_message": str(e)
                    }
            else:
                return response.get("text", "")
        except Exception as e:
            # Fallback to mock on error
            pass
    
    # Use NLP classification to determine response type instead of hardcoded if/else
    response_type = BedrockService._classify_prompt_type(prompt) if is_aws_configured() else None
    
    # If classification failed or AWS not configured, use fallback classification
    if not response_type:
        response_type = BedrockService._classify_prompt_type_fallback(prompt)
    
    # Mock LLM response (fallback if AWS not configured)
    if response_type == "regulatory":
        # Regulatory document analysis
        try:
            # Parse document text if provided
            if "Document Text:" in prompt:
                doc_text = prompt.split("Document Text:")[1].strip()
                
            # Mock structured response for regulatory analysis
            response = {
                "docId": "MOCK-REG-001",
                "regulation_name": "Sample Regulation",
                "regulation_type": "tariff",
                "issuing_body": "Government",
                "jurisdiction": "USA",
                "effective_date": "2024-01-01",
                "summary": "Sample regulation summary extracted from document.",
                "entities": {
                    "tickers": ["AAPL", "TSLA", "MSFT"],
                    "sectors": ["Technology", "Automotive"],
                    "countries": ["USA", "China"]
                },
                "measures": [
                    {
                        "target": "Imports",
                        "rate_pct": 25.0,
                        "quota": None,
                        "description": "25% tariff on specified imports",
                        "citation_id": "para-1"
                    }
                ],
                "key_provisions": ["Key provision 1", "Key provision 2"],
                "penalties": "Standard penalties apply",
                "exemptions": "Some exemptions may apply",
                "citations": [
                    {
                        "id": "para-1",
                        "text": "Citation text from document",
                        "paragraph": "§1.1"
                    }
                ],
                "supply_chain_impact": {
                    "affected_components": ["Component 1", "Component 2"],
                    "affected_suppliers": ["Supplier 1", "Supplier 2"],
                    "geographic_choke_points": ["Location 1", "Location 2"]
                }
            }
            
            if request.response_json_schema:
                return response
            else:
                return json.dumps(response)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error analyzing document: {str(e)}")
    
    elif response_type == "filing":
        # 10-K filing analysis
        response = {
            "ticker": "AAPL",
            "company_name": "Apple Inc.",
            "fiscal_year": "2024",
            "business_model": "Technology company designing and manufacturing consumer electronics.",
            "key_suppliers": [
                {
                    "name": "Supplier 1",
                    "country": "China",
                    "products": "Components",
                    "dependency": "High"
                }
            ],
            "geographic_revenue": [
                {
                    "region": "Americas",
                    "revenue_percent": 45.0,
                    "revenue_amount": "$150B"
                }
            ],
            "product_lines": [
                {
                    "name": "iPhone",
                    "revenue_percent": 52.0,
                    "description": "Smartphones"
                }
            ],
            "risk_factors": ["Market competition", "Supply chain risks", "Regulatory changes"],
            "regulatory_mentions": ["GDPR", "Trade regulations"],
            "trade_dependencies": "High dependency on international supply chains"
        }
        
        if request.response_json_schema:
            return response
        else:
            return json.dumps(response)
    
    elif response_type == "portfolio":
        # Portfolio recommendations
        response = {
            "sector_rotation": [
                {
                    "action": "REDUCE",
                    "sector": "Technology",
                    "current_weight": "28.5%",
                    "target_weight": "23.5%",
                    "change": "-5.0%",
                    "reason": "High China exposure and tariff sensitivity"
                },
                {
                    "action": "REDUCE",
                    "sector": "Communication Services",
                    "current_weight": "8.7%",
                    "target_weight": "6.5%",
                    "change": "-2.2%",
                    "reason": "Regulatory headwinds (GDPR, antitrust)"
                },
                {
                    "action": "INCREASE",
                    "sector": "Utilities",
                    "current_weight": "3.2%",
                    "target_weight": "5.5%",
                    "change": "+2.3%",
                    "reason": "Defensive play with low regulatory risk"
                },
                {
                    "action": "INCREASE",
                    "sector": "Consumer Staples",
                    "current_weight": "6.5%",
                    "target_weight": "11.4%",
                    "change": "+4.9%",
                    "reason": "Resilient to trade tensions, domestic focus"
                }
            ],
            "stock_replacements": [
                {
                    "sell": "TSLA",
                    "sell_name": "Tesla Inc.",
                    "sell_risk_score": 85,
                    "buy": "F",
                    "buy_name": "Ford Motor",
                    "buy_risk_score": 48,
                    "sector": "Automotive",
                    "reason": "Lower China exposure, established US manufacturing"
                },
                {
                    "sell": "META",
                    "sell_name": "Meta Platforms",
                    "sell_risk_score": 88,
                    "buy": "CMCSA",
                    "buy_name": "Comcast",
                    "buy_risk_score": 42,
                    "sector": "Communication",
                    "reason": "Less regulatory scrutiny, domestic infrastructure focus"
                },
                {
                    "sell": "JNJ",
                    "sell_name": "Johnson & Johnson",
                    "sell_risk_score": 92,
                    "buy": "UNH",
                    "buy_name": "UnitedHealth",
                    "buy_risk_score": 38,
                    "sector": "Healthcare",
                    "reason": "Managed care less exposed to product liability"
                },
                {
                    "sell": "NVDA",
                    "sell_name": "NVIDIA",
                    "sell_risk_score": 78,
                    "buy": "INTC",
                    "buy_name": "Intel",
                    "buy_risk_score": 52,
                    "sector": "Technology",
                    "reason": "US-based manufacturing, lower China revenue"
                },
                {
                    "sell": "GOOGL",
                    "sell_name": "Alphabet",
                    "sell_risk_score": 82,
                    "buy": "ORCL",
                    "buy_name": "Oracle",
                    "buy_risk_score": 45,
                    "sector": "Technology",
                    "reason": "Enterprise focus, less antitrust exposure"
                }
            ],
            "geographic_reallocation": [
                {
                    "region": "China",
                    "current_exposure": "18%",
                    "target_exposure": "12%",
                    "change": "-6%",
                    "reason": "Reduce exposure due to tariff risks and regulatory uncertainty"
                },
                {
                    "region": "USA",
                    "current_exposure": "55%",
                    "target_exposure": "62%",
                    "change": "+7%",
                    "reason": "Increase domestic exposure for stability"
                },
                {
                    "region": "Europe",
                    "current_exposure": "15%",
                    "target_exposure": "14%",
                    "change": "-1%",
                    "reason": "Slight reduction due to GDPR compliance costs"
                }
            ],
            "expected_outcomes": {
                "risk_score_reduction": "-8 points (from 62 to 54)",
                "estimated_return_impact": "-0.3% to -0.5% short-term, +0.8% to +1.2% long-term",
                "diversification_improvement": "Reduced geographic concentration risk, improved sector balance"
            }
        }
        
        if request.response_json_schema:
            return response
        else:
            return json.dumps(response)
    
    else:
        # General market summary
        summaries = [
            "Global markets advanced with broad-based moderate moves. Volatility remains contained across regions. Market participants monitoring macro developments.",
            "USD strengthened with DXY showing defensive positioning. Cross-currency volatility contained, suggesting range-bound trading conditions.",
            "Energy complex rallied with oil prices surging. Gold gained reflecting safe-haven demand. Broad commodity volatility moderate.",
            f"Market conditions show {random.choice(['stable', 'volatile', 'uncertain'])} conditions with {random.choice(['moderate', 'elevated', 'low'])} volatility across regions."
        ]
        
        return random.choice(summaries)


@router.post("/generate-summary")
async def generate_summary(request: dict):
    """
    Generate AI summary for market conditions
    """
    data = request.get("data", {})
    prompt_type = request.get("type", "market")
    
    # Mock AI summary generation
    if prompt_type == "market":
        return {
            "text": "Global markets show stable conditions with moderate volatility. Key drivers include economic data and central bank policy signals.",
            "timestamp": "2024-01-01T12:00:00Z"
        }
    elif prompt_type == "fx":
        return {
            "text": "USD strengthened with DXY advancing. EUR and JPY showing defensive positioning.",
            "timestamp": "2024-01-01T12:00:00Z"
        }
    elif prompt_type == "commodities":
        return {
            "text": "Energy complex rallied with WTI advancing. Gold gained reflecting safe-haven demand.",
            "timestamp": "2024-01-01T12:00:00Z"
        }
    else:
        return {
            "text": "Market summary generated successfully.",
            "timestamp": "2024-01-01T12:00:00Z"
        }


@router.get("/aws-voice/config")
async def get_aws_voice_config():
    """
    Get AWS voice chat configuration for frontend integration
    Returns AWS region and service availability
    """
    return {
        "configured": is_aws_configured(),
        "region": os.getenv("AWS_REGION", "us-east-1"),
        "services": {
            "bedrock": is_aws_configured(),
            "transcribe": is_aws_configured(),
            "polly": is_aws_configured()
        },
        "websocketUrl": "/api/ai/aws-voice/ws"  # WebSocket endpoint
    }


@router.websocket("/aws-voice/ws")
async def aws_voice_websocket(websocket: WebSocket):
    """
    WebSocket endpoint for real-time voice chat using AWS services
    Handles bidirectional communication:
    - Receives audio chunks from client (for Transcribe)
    - Sends audio chunks to client (from Polly)
    - Sends transcripts in real-time
    """
    await websocket.accept()
    
    conversation_id = str(uuid.uuid4())
    conversation_history = []
    system_prompt = """You are a financial AI coworker and assistant for IntelliRisk. 
You help users understand financial markets, analyze portfolios, interpret regulatory documents, 
and provide insights on equities, fixed income, options, commodities, and FX markets.

Key capabilities:
- Market analysis and insights
- Portfolio risk assessment
- Regulatory impact analysis
- Trading strategy suggestions
- Financial data interpretation

Be concise, professional, and helpful. Always provide actionable insights when possible."""

    try:
        # Send initial greeting
        await websocket.send_json({
            "type": "message",
            "role": "assistant",
            "text": "Hello! I'm your financial AI coworker. How can I help you today?",
            "conversationId": conversation_id
        })

        while True:
            # Receive data from client
            data = await websocket.receive_json()
            message_type = data.get("type")

            if message_type == "audio":
                # Handle audio chunk for speech-to-text
                audio_base64 = data.get("audio")
                if audio_base64:
                    # Decode audio
                    audio_bytes = base64.b64decode(audio_base64)
                    
                    # For now, we'll process text messages directly
                    # In production, use AWS Transcribe Streaming API here
                    # For this implementation, we'll expect text messages
                    pass

            elif message_type == "text":
                # Handle text message
                user_message = data.get("text", "")
                conversation_history.append({"role": "user", "content": user_message})
                
                # Send user message for display
                await websocket.send_json({
                    "type": "message",
                    "role": "user",
                    "text": user_message,
                    "conversationId": conversation_id
                })
                
                # Get AI response from Bedrock
                try:
                    if is_aws_configured():
                        prompt = "\n\n".join([
                            system_prompt,
                            *[f"{msg['role']}: {msg['content']}" for msg in conversation_history[-10:]],  # Last 10 messages
                            "assistant:"
                        ])
                        
                        response = BedrockService.invoke_model(
                            prompt=prompt,
                            max_tokens=1000,
                            temperature=0.7,
                            system_prompt=system_prompt
                        )
                        
                        assistant_text = response.get("text", "I'm sorry, I couldn't process that request.")
                    else:
                        # Fallback response if AWS not configured
                        assistant_text = "AWS services are not configured. Please configure AWS credentials to use voice chat."
                    
                    conversation_history.append({"role": "assistant", "content": assistant_text})
                    
                    # Send assistant response
                    await websocket.send_json({
                        "type": "message",
                        "role": "assistant",
                        "text": assistant_text,
                        "conversationId": conversation_id
                    })
                    
                    # Generate audio from text using Polly
                    if is_aws_configured():
                        try:
                            polly_client = AWSServices.get_polly_client()
                            polly_response = polly_client.synthesize_speech(
                                Text=assistant_text,
                                OutputFormat='mp3',
                                VoiceId='Joanna'  # Professional female voice
                            )
                            
                            # Convert audio stream to base64
                            audio_data = polly_response['AudioStream'].read()
                            audio_base64 = base64.b64encode(audio_data).decode('utf-8')
                            
                            # Send audio back to client
                            await websocket.send_json({
                                "type": "audio",
                                "audio": audio_base64,
                                "format": "mp3",
                                "conversationId": conversation_id
                            })
                        except Exception as e:
                            print(f"Error generating audio: {e}")
                    
                except Exception as e:
                    error_message = f"Error processing message: {str(e)}"
                    await websocket.send_json({
                        "type": "error",
                        "message": error_message,
                        "conversationId": conversation_id
                    })

            elif message_type == "end":
                # End conversation
                break

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_json({
                "type": "error",
                "message": f"Connection error: {str(e)}"
            })
        except:
            pass


@router.post("/aws-voice/transcribe")
async def transcribe_audio(request: dict):
    """
    Transcribe audio using AWS Transcribe
    Accepts base64-encoded audio and returns transcript
    """
    if not is_aws_configured():
        raise HTTPException(
            status_code=500,
            detail="AWS not configured. Please configure AWS credentials."
        )
    
    try:
        audio_base64 = request.get("audio")
        if not audio_base64:
            raise HTTPException(status_code=400, detail="Audio data is required")
        
        # Decode audio
        audio_bytes = base64.b64decode(audio_base64)
        
        # Save to temporary file for Transcribe
        import tempfile
        import os as os_module
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
            temp_file.write(audio_bytes)
            temp_file_path = temp_file.name
        
        try:
            transcribe_client = AWSServices.get_transcribe_client()
            job_name = f"transcribe-{uuid.uuid4()}"
            s3_client = AWSServices.get_s3_client()
            bucket_name = os.getenv("S3_BUCKET_NAME", "intellirisk-temp")
            
            # Upload to S3 (Transcribe requires S3 input)
            s3_key = f"transcribe-input/{job_name}.wav"
            s3_client.upload_file(temp_file_path, bucket_name, s3_key)
            
            # Start transcription job
            transcribe_client.start_transcription_job(
                TranscriptionJobName=job_name,
                Media={'MediaFileUri': f"s3://{bucket_name}/{s3_key}"},
                MediaFormat='wav',
                LanguageCode='en-US'
            )
            
            # Wait for job to complete
            import time
            max_wait = 30
            wait_time = 0
            while wait_time < max_wait:
                job = transcribe_client.get_transcription_job(TranscriptionJobName=job_name)
                status = job['TranscriptionJob']['TranscriptionJobStatus']
                
                if status == 'COMPLETED':
                    transcript_uri = job['TranscriptionJob']['Transcript']['TranscriptFileUri']
                    # Download and parse transcript
                    import urllib.request
                    with urllib.request.urlopen(transcript_uri) as response:
                        transcript_data = json.loads(response.read())
                    transcript_text = transcript_data['results']['transcripts'][0]['transcript']
                    return {"transcript": transcript_text}
                elif status == 'FAILED':
                    raise HTTPException(status_code=500, detail="Transcription job failed")
                
                time.sleep(1)
                wait_time += 1
            
            raise HTTPException(status_code=504, detail="Transcription timeout")
            
        finally:
            # Cleanup
            if os_module.path.exists(temp_file_path):
                os_module.unlink(temp_file_path)
                
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error transcribing audio: {str(e)}")


@router.post("/aws-voice/synthesize")
async def synthesize_speech(request: dict):
    """
    Synthesize speech from text using AWS Polly
    Returns base64-encoded audio
    """
    if not is_aws_configured():
        raise HTTPException(
            status_code=500,
            detail="AWS not configured. Please configure AWS credentials."
        )
    
    try:
        text = request.get("text", "")
        voice_id = request.get("voiceId", "Joanna")  # Default professional voice
        
        if not text:
            raise HTTPException(status_code=400, detail="Text is required")
        
        polly_client = AWSServices.get_polly_client()
        response = polly_client.synthesize_speech(
            Text=text,
            OutputFormat='mp3',
            VoiceId=voice_id
        )
        
        # Convert audio stream to base64
        audio_data = response['AudioStream'].read()
        audio_base64 = base64.b64encode(audio_data).decode('utf-8')
        
        return {
            "audio": audio_base64,
            "format": "mp3",
            "voiceId": voice_id
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error synthesizing speech: {str(e)}")


@router.post("/tenk-rag-analysis")
async def tenk_rag_analysis(request: dict):
    """
    Perform comprehensive 10-K analysis using RAG:
    1. LLM generates search queries for the company
    2. Use crew4ai (SerperDevTool) to search with those queries and scrape content
       (Falls back to SearXNG + WebScraper if crew4ai not available)
    3. LLM analyzes with scraped content as RAG context
    """
    ticker = request.get("ticker", "").upper()
    if not ticker:
        raise HTTPException(status_code=400, detail="Ticker is required")
    
    try:
        # Step 1: LLM generates search queries about the company
        query_generation_prompt = f"""Generate 5-7 comprehensive internet search queries to find information about {ticker} for 10-K filing analysis. 
Focus on:
- Company overview and business model
- Suppliers and supply chain
- Geographic revenue breakdown
- Product lines and revenue segments
- Risk factors and regulatory concerns
- Trade dependencies and international operations
- Recent financial news and performance

Return ONLY a JSON array of search query strings, like: ["query 1", "query 2", "query 3"]
No explanations, just the JSON array."""
        
        # Call LLM directly for query generation
        query_request = LLMRequest(
            prompt=query_generation_prompt,
            add_context_from_internet=False,
            response_json_schema={
                "type": "array",
                "items": {"type": "string"}
            }
        )
        
        # Use AWS Bedrock if configured
        if is_aws_configured():
            try:
                query_result = BedrockService.invoke_model(
                    prompt=query_generation_prompt,
                    max_tokens=1000,
                    temperature=0.7
                )
                # Try to parse JSON from response
                response_text = query_result.get("text", "")
                try:
                    import re
                    json_match = re.search(r'\[.*\]', response_text, re.DOTALL)
                    if json_match:
                        query_result = json.loads(json_match.group(0))
                    else:
                        # Try parsing entire response
                        query_result = json.loads(response_text)
                except:
                    query_result = response_text
            except Exception as e:
                raise ValueError(f"Failed to generate search queries: {str(e)}")
        else:
            raise ValueError("AWS not configured - cannot generate search queries")
        
        # Ensure we have a list
        if not isinstance(query_result, list):
            if isinstance(query_result, str):
                try:
                    query_result = json.loads(query_result)
                except:
                    # Try to extract array from string
                    import re
                    json_match = re.search(r'\[.*\]', query_result, re.DOTALL)
                    if json_match:
                        query_result = json.loads(json_match.group(0))
                    else:
                        # Fallback to default queries
                        query_result = [f"{ticker} company overview", f"{ticker} business model", f"{ticker} suppliers", f"{ticker} revenue", f"{ticker} risk factors"]
            else:
                query_result = [f"{ticker} company overview", f"{ticker} business model", f"{ticker} suppliers", f"{ticker} revenue", f"{ticker} risk factors"]
        
        search_queries = query_result if isinstance(query_result, list) and len(query_result) > 0 else [f"{ticker} company overview", f"{ticker} business model", f"{ticker} suppliers"]
        
        print(f"[DEBUG] Generated {len(search_queries)} search queries for {ticker}: {search_queries[:3]}...")
        
        # Step 2: Use crew4ai to search and scrape based on queries
        scraped_content = ""
        try:
            # Try to use crew4ai if available
            try:
                from crewai_tools import WebsiteSearchTool, SerperDevTool
                # Use SerperDevTool for Google searches via crew4ai
                search_tool = SerperDevTool()
                print(f"[DEBUG] Using crew4ai SerperDevTool for searches...")
                
                all_scraped_content = []
                for query in search_queries[:7]:  # Limit to 7 queries
                    try:
                        print(f"[DEBUG] Searching with crew4ai for query: '{query}'")
                        search_result = search_tool.run(query)
                        if search_result:
                            # SerperDevTool returns search results with URLs
                            # We need to scrape those URLs
                            if isinstance(search_result, dict) and "urls" in search_result:
                                urls = search_result["urls"][:3]  # Get top 3 URLs per query
                            elif isinstance(search_result, list):
                                urls = [r.get("url", "") for r in search_result if isinstance(r, dict)][:3]
                            else:
                                # Try to extract URLs from the result
                                import re
                                urls = re.findall(r'https?://[^\s<>"{}|\\^`\[\]]+', str(search_result))[:3]
                            
                            # Scrape URLs found from search
                            if urls:
                                print(f"[DEBUG] Found {len(urls)} URLs from crew4ai search, scraping...")
                                scrape_results = WebScraperService.scrape_urls(urls, max_urls=3, delay=0.5)
                                for result in scrape_results:
                                    if result.get("success") and result.get("content"):
                                        all_scraped_content.append(result)
                    except Exception as e:
                        print(f"[DEBUG] crew4ai search failed for query '{query}': {e}")
                        continue
                
                if all_scraped_content:
                    scraped_content = WebScraperService.format_scraped_content_for_rag(all_scraped_content)
                    print(f"[DEBUG] crew4ai scraped {len(all_scraped_content)} sources, content length: {len(scraped_content)} chars")
                else:
                    print(f"[DEBUG] crew4ai found no scrapable content")
                    
            except ImportError:
                print(f"[DEBUG] crew4ai not available, falling back to SearXNG + WebScraper...")
                # Fallback to SearXNG + WebScraper approach
                all_urls = []
                
                for query in search_queries[:7]:  # Limit to 7 queries
                    try:
                        search_result = SearXNGService.search(query=query, max_results=5, categories=["general", "news", "finance"])
                        if search_result.get("success") and search_result.get("results"):
                            urls_found = 0
                            for result in search_result["results"]:
                                url = result.get("url", "")
                                if url and url not in all_urls:
                                    all_urls.append(url)
                                    urls_found += 1
                            print(f"[DEBUG] Query '{query}': found {urls_found} new URLs (total: {len(all_urls)})")
                        else:
                            print(f"[DEBUG] Query '{query}': no results (success={search_result.get('success')}, has_results={bool(search_result.get('results'))})")
                    except Exception as e:
                        print(f"[DEBUG] Search failed for query '{query}': {e}")
                        continue
                
                # Generate fallback URLs if no URLs found
                if len(all_urls) == 0:
                    print(f"[DEBUG] No URLs found, generating fallback URLs for {ticker}...")
                    fallback_urls = [
                        f"https://www.sec.gov/cgi-bin/browse-edgar?CIK={ticker}&action=getcompany&type=10-K",
                        f"https://finance.yahoo.com/quote/{ticker}",
                        f"https://www.marketwatch.com/investing/stock/{ticker}",
                        f"https://seekingalpha.com/symbol/{ticker}",
                    ]
                    all_urls.extend(fallback_urls)
                
                # Scrape URLs
                if all_urls:
                    try:
                        scrape_results = WebScraperService.scrape_urls(all_urls, max_urls=15, delay=0.5)
                        scraped_content = WebScraperService.format_scraped_content_for_rag(scrape_results)
                        print(f"[DEBUG] Scraped {len(scrape_results)} URLs, content length: {len(scraped_content)} chars")
                    except Exception as e:
                        print(f"[DEBUG] Error scraping URLs: {e}")
                        scraped_content = f"[Error scraping URLs: {str(e)}]"
                else:
                    print(f"[DEBUG] No URLs to scrape for {ticker}")
                    
        except Exception as e:
            print(f"[DEBUG] Error in search/scrape step: {e}")
            scraped_content = f"[Error during search/scrape: {str(e)}]"
        
        # Step 4: Build final analysis prompt with RAG context
        rag_context = scraped_content if scraped_content else "[No web content available]"
        
        # Check if we actually have meaningful context
        has_rag_context = scraped_content and len(scraped_content.strip()) > 50 and scraped_content != "[No web content available]"
        
        if has_rag_context:
            analysis_prompt = f"""You are analyzing the 10-K filing for {ticker}.

=== RAG CONTEXT FROM INTERNET SEARCHES ===
{rag_context}
=== END OF RAG CONTEXT ===

Based on the internet search results and scraped web content above, extract and return the following JSON structure. Use the RAG context as the primary source, and supplement with your general knowledge when specific details are not found in the context.

{{
  "ticker": "{ticker}",
  "company_name": "Full company name",
  "fiscal_year": "2024",
  "business_model": "2-3 sentence description",
  "key_suppliers": [
    {{
      "name": "Supplier name",
      "country": "Country",
      "products": "What they supply",
      "dependency": "High/Medium/Low"
    }}
  ],
  "geographic_revenue": [
    {{
      "region": "Region name",
      "revenue_percent": percentage as number,
      "revenue_amount": "dollar amount as string"
    }}
  ],
  "product_lines": [
    {{
      "name": "Product/service name",
      "revenue_percent": percentage as number,
      "description": "Brief description"
    }}
  ],
  "risk_factors": ["List 5 key risk factors"],
  "regulatory_mentions": ["List regulatory concerns mentioned"],
  "trade_dependencies": "Description of trade dependencies"
}}

IMPORTANT: Even if some information is not available in the RAG context, you should still fill out the JSON structure using your general knowledge about the company or the industry. Use "Not available" or "Unknown" only when absolutely necessary. The goal is to provide the most complete analysis possible."""
        else:
            # Fallback prompt when no RAG context is available
            analysis_prompt = f"""You are analyzing company information for {ticker}. 

Internet searches did not return sufficient detailed information about this company. However, you should still provide an analysis using your general knowledge about the company, its industry, and typical company structures.

Please provide the following JSON structure based on your knowledge of {ticker} or similar companies in the industry. If you don't know specific details, provide reasonable estimates or typical industry patterns, clearly marking them as estimates:

{{
  "ticker": "{ticker}",
  "company_name": "Full company name (or estimated based on ticker)",
  "fiscal_year": "2024",
  "business_model": "Description based on what you know about the company or industry",
  "key_suppliers": [
    {{
      "name": "Typical supplier name or 'Various'",
      "country": "Country",
      "products": "Typical supplies",
      "dependency": "Medium"
    }}
  ],
  "geographic_revenue": [
    {{
      "region": "Primary region",
      "revenue_percent": estimated percentage as number,
      "revenue_amount": "estimated amount"
    }}
  ],
  "product_lines": [
    {{
      "name": "Primary product/service",
      "revenue_percent": estimated percentage,
      "description": "Description"
    }}
  ],
  "risk_factors": ["Common industry risk factors"],
  "regulatory_mentions": ["Common regulatory concerns for this industry"],
  "trade_dependencies": "Description based on industry patterns"
}}

IMPORTANT: You MUST return valid JSON even if the information is limited or estimated. Use your general knowledge and industry expertise to fill out the structure as completely as possible."""

        # Step 5: Final LLM analysis with RAG context
        json_schema = {
            "type": "object",
            "properties": {
                "ticker": {"type": "string"},
                "company_name": {"type": "string"},
                "fiscal_year": {"type": "string"},
                "business_model": {"type": "string"},
                "key_suppliers": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "country": {"type": "string"},
                            "products": {"type": "string"},
                            "dependency": {"type": "string"}
                        }
                    }
                },
                "geographic_revenue": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "region": {"type": "string"},
                            "revenue_percent": {"type": "number"},
                            "revenue_amount": {"type": "string"}
                        }
                    }
                },
                "product_lines": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "revenue_percent": {"type": "number"},
                            "description": {"type": "string"}
                        }
                    }
                },
                "risk_factors": {"type": "array", "items": {"type": "string"}},
                "regulatory_mentions": {"type": "array", "items": {"type": "string"}},
                "trade_dependencies": {"type": "string"}
            }
        }
        
        # Call LLM for final analysis with improved prompt for JSON format
        if is_aws_configured():
            try:
                # Enhance prompt to emphasize JSON-only response and handle missing data
                enhanced_prompt = analysis_prompt + """

CRITICAL INSTRUCTIONS:
1. You MUST respond with ONLY valid JSON in the exact format specified above.
2. Do not include any explanations, markdown formatting, or text outside the JSON object.
3. Start your response with { and end with }.
4. If you don't have specific information, use your general knowledge, reasonable estimates, or typical industry patterns to fill out the structure.
5. Never refuse to provide the JSON structure - always return it, even if some fields use estimates or "Not available".
6. If the RAG context above says "[No web content available]" or is very short, rely on your general knowledge about the company or industry."""
                
                llm_response = BedrockService.invoke_model(
                    prompt=enhanced_prompt,
                    max_tokens=4096,
                    temperature=0.7
                )
                
                response_text = llm_response.get("text", "")
                
                # Use the same comprehensive JSON parsing logic as invoke_llm
                json_text = None
                
                # Method 1: Look for ```json code blocks
                if "```json" in response_text:
                    json_start = response_text.find("```json") + 7
                    json_end = response_text.find("```", json_start)
                    if json_end > json_start:
                        json_text = response_text[json_start:json_end].strip()
                
                # Method 2: Look for JSON object in text (find first { and last })
                if not json_text:
                    first_brace = response_text.find('{')
                    if first_brace != -1:
                        brace_count = 0
                        last_brace = first_brace
                        for i in range(first_brace, len(response_text)):
                            if response_text[i] == '{':
                                brace_count += 1
                            elif response_text[i] == '}':
                                brace_count -= 1
                                if brace_count == 0:
                                    last_brace = i
                                    break
                        if last_brace > first_brace:
                            json_text = response_text[first_brace:last_brace + 1].strip()
                
                # Method 3: Try regex to find JSON object
                if not json_text:
                    import re
                    json_match = re.search(r'\{[\s\S]*\}', response_text, re.DOTALL)
                    if json_match:
                        json_text = json_match.group(0)
                
                # Parse JSON
                if json_text:
                    try:
                        final_result = json.loads(json_text)
                    except json.JSONDecodeError:
                        # Try cleaning up
                        cleaned = json_text
                        if cleaned.startswith('json'):
                            cleaned = cleaned[4:].strip()
                        if cleaned.startswith('```'):
                            cleaned = cleaned[3:].strip()
                        if cleaned.endswith('```'):
                            cleaned = cleaned[:-3].strip()
                        try:
                            final_result = json.loads(cleaned)
                        except json.JSONDecodeError:
                            # If still fails, check if the response indicates no RAG context
                            if "no RAG context" in response_text.lower() or "don't see" in response_text.lower():
                                final_result = {
                                    "error": "Insufficient RAG context",
                                    "raw_response": response_text[:500],  # First 500 chars
                                    "suggestion": "The internet search did not return sufficient information. Try a different ticker or check if the company information is publicly available."
                                }
                            else:
                                final_result = {
                                    "error": "Failed to parse JSON response",
                                    "raw_response": response_text[:500],  # First 500 chars
                                    "parse_error": "Could not extract valid JSON from LLM response"
                                }
                elif response_text.strip().startswith('{'):
                    try:
                        final_result = json.loads(response_text.strip())
                    except json.JSONDecodeError:
                        final_result = {
                            "error": "Failed to parse JSON response",
                            "raw_response": response_text[:500],
                            "parse_error": "Response starts with { but is not valid JSON"
                        }
                else:
                    # No JSON found in response
                    if "no RAG context" in response_text.lower() or "don't see" in response_text.lower():
                        final_result = {
                            "error": "Insufficient RAG context",
                            "raw_response": response_text[:500],
                            "suggestion": "The internet search did not return sufficient information. Try a different ticker or check if the company information is publicly available."
                        }
                    else:
                        final_result = {
                            "error": "No JSON response found",
                            "raw_response": response_text[:500],
                            "parse_error": "LLM did not return JSON format"
                        }
            except Exception as e:
                raise ValueError(f"Failed to analyze with LLM: {str(e)}")
        else:
            raise ValueError("AWS not configured - cannot perform analysis")
        
        return {
            "ticker": ticker,
            "analysis": final_result,
            "search_queries": search_queries,
            "urls_searched": len(all_urls),
            "rag_context_available": bool(scraped_content)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in RAG analysis: {str(e)}")
