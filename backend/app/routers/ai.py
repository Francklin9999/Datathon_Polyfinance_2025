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
    
    # Mock LLM response (fallback if AWS not configured)
    if "regulatory document" in prompt.lower() or "regulation" in prompt.lower():
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
    
    elif "10-k" in prompt.lower() or "filing" in prompt.lower():
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
    
    elif ("portfolio manager" in prompt.lower() or "portfolio adjustments" in prompt.lower() or 
          ("recommendations" in prompt.lower() and "sector_rotation" in prompt.lower())):
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
    system_prompt = """You are a financial AI coworker and assistant for PolyFinance 2025. 
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
            bucket_name = os.getenv("S3_BUCKET_NAME", "polyfinance-temp")
            
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
