"""
AWS Bedrock Service
LLM-powered analysis using AWS Bedrock
"""

import json
import requests
from typing import Dict, Optional, List

from app.services.aws_config import AWSServices, is_aws_configured, AWS_BEARER_TOKEN_BEDROCK, AWS_REGION


class BedrockService:
    """Service for AWS Bedrock operations"""
    
    # Supported models
    CLAUDE_MODELS = {
        "claude-3-5-sonnet": "anthropic.claude-3-5-sonnet-20241022-v2:0",
        "claude-3-opus": "anthropic.claude-3-opus-20240229-v1:0",
        "claude-3-sonnet": "anthropic.claude-3-sonnet-20240229-v1:0",
        "claude-3-haiku": "anthropic.claude-3-haiku-20240307-v1:0"
    }
    
    DEFAULT_MODEL = "claude-3-5-sonnet"
    
    @staticmethod
    def invoke_model(
        prompt: str,
        model_id: Optional[str] = None,
        max_tokens: int = 4096,
        temperature: float = 0.7,
        system_prompt: Optional[str] = None
    ) -> Dict:
        """
        Invoke Bedrock model with prompt
        Returns: dict with response text and metadata
        """
        if not is_aws_configured():
            # Fallback response
            return {
                "text": f"[Mock Response] Processing prompt: {prompt[:100]}...",
                "model": "fallback",
                "method": "mock"
            }
        
        bedrock_runtime = AWSServices.get_bedrock_runtime_client()
        
        # Handle model_id - can be short name or full model ID
        if model_id:
            # If it's a short name like "claude-3-haiku", look it up
            if model_id in BedrockService.CLAUDE_MODELS:
                model_id = BedrockService.CLAUDE_MODELS[model_id]
            # Otherwise assume it's already a full model ID
        else:
            # Use default model
            model_id = BedrockService.CLAUDE_MODELS.get(
                BedrockService.DEFAULT_MODEL,
                BedrockService.CLAUDE_MODELS["claude-3-5-sonnet"]
            )
        
        try:
            # Prepare request body for Claude models
            if model_id.startswith("anthropic.claude"):
                body = {
                    "anthropic_version": "bedrock-2023-05-31",
                    "max_tokens": max_tokens,
                    "temperature": temperature,
                    "messages": [
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ]
                }
                
                if system_prompt:
                    body["system"] = system_prompt
                
                # Check if bearer token is available for authentication
                bearer_token = AWSServices.get_bedrock_bearer_token() or AWS_BEARER_TOKEN_BEDROCK
                
                if bearer_token:
                    # Use bearer token authentication with direct HTTP request
                    region = AWS_REGION or "us-east-1"
                    # AWS Bedrock endpoint format - try different API paths
                    # Standard format: /model/{model_id}/invoke
                    # Alternative: /foundation-model/{model_id}/invoke
                    endpoint_url = f"https://bedrock-runtime.{region}.amazonaws.com/model/{model_id}/invoke"
                    
                    headers = {
                        'Content-Type': 'application/json',
                        'Authorization': f'Bearer {bearer_token}',
                        'Accept': 'application/json'
                    }
                    
                    # Make direct HTTP request
                    try:
                        http_response = requests.post(
                            endpoint_url,
                            headers=headers,
                            json=body,
                            timeout=30
                        )
                        
                        # Capture error details if request failed
                        if http_response.status_code != 200:
                            error_msg = f"HTTP {http_response.status_code}"
                            try:
                                error_body = http_response.json()
                                error_msg += f": {json.dumps(error_body)}"
                            except:
                                error_text = http_response.text or http_response.content.decode('utf-8', errors='ignore') or str(http_response.content[:500])
                                error_msg += f": {error_text}"
                            
                            # Create exception with response object attached
                            exc = requests.exceptions.RequestException(error_msg)
                            exc.response = http_response  # Attach response for later inspection
                            raise exc
                        
                        response_body = http_response.json()
                        
                        # Extract response text from AWS Bedrock API format
                        if isinstance(response_body, dict):
                            if 'content' in response_body:
                                # Standard Bedrock response format
                                content_list = response_body.get('content', [])
                                if content_list and isinstance(content_list, list) and len(content_list) > 0:
                                    response_text = content_list[0].get('text', '')
                                else:
                                    response_text = ''
                            else:
                                # Alternative format
                                response_text = response_body.get('text', '') or response_body.get('message', '') or str(response_body)
                        else:
                            response_text = str(response_body)
                        
                        return {
                            "text": response_text,
                            "model": model_id,
                            "method": "aws_bedrock_bearer",
                            "stop_reason": response_body.get('stop_reason', '') if isinstance(response_body, dict) else '',
                            "usage": response_body.get('usage', {}) if isinstance(response_body, dict) else {}
                        }
                    except requests.exceptions.RequestException as e:
                        # Get more details from the error response
                        error_details = str(e)
                        if hasattr(e, 'response') and e.response is not None:
                            try:
                                error_body = e.response.text or e.response.content.decode('utf-8', errors='ignore')
                                if error_body:
                                    error_details += f" | Response: {error_body[:500]}"
                            except:
                                pass
                        # If bearer token request fails, raise error with details
                        raise Exception(f"Bearer token authentication failed: {error_details}")
                    except Exception as e:
                        # If bearer token fails, provide detailed error
                        error_msg = f"Bearer token authentication failed: {str(e)}"
                        raise Exception(error_msg)
                else:
                    # Standard boto3 invocation with AWS credentials
                    response = bedrock_runtime.invoke_model(
                        modelId=model_id,
                        body=json.dumps(body)
                    )
                    response_body = json.loads(response['body'].read())
                    response_text = response_body.get('content', [{}])[0].get('text', '')
                    
                    return {
                        "text": response_text,
                        "model": model_id,
                        "method": "aws_bedrock",
                        "stop_reason": response_body.get('stop_reason', ''),
                        "usage": response_body.get('usage', {})
                    }
            else:
                raise ValueError(f"Unsupported model: {model_id}")
        except Exception as e:
            # Fallback on error
            return {
                "text": f"[Error] Could not invoke Bedrock model: {str(e)}",
                "model": model_id,
                "method": "error",
                "error": str(e)
            }
    
    @staticmethod
    def analyze_regulatory_document(document_text: str, document_type: str = "regulation") -> Dict:
        """
        Analyze regulatory document using Bedrock
        Returns: structured analysis with entities, measures, impact assessment
        """
        system_prompt = """You are an expert financial analyst specializing in regulatory impact assessment.
Analyze regulatory documents and extract key information for portfolio risk assessment.
Focus on identifying: entities affected, regulatory measures, dates, jurisdictions, and potential financial impacts."""
        
        # Limit document text to avoid token limits
        limited_text = document_text[:8000] if len(document_text) > 8000 else document_text
        
        user_prompt = f"""Analyze the following {document_type} document and extract structured information:

{limited_text}

Please provide a JSON response with:
1. regulation_name: Name or title of the regulation
2. regulation_type: Type (tariff, sanction, ban, subsidy, environmental, etc.)
3. jurisdiction: Country or region
4. effective_date: When it takes effect
5. entities_mentioned: Companies, sectors, or countries mentioned
6. key_measures: List of regulatory measures (tariffs, bans, requirements, etc.)
7. affected_sectors: List of sectors impacted
8. summary: Brief summary (2-3 sentences)
9. financial_impact_assessment: Assessment of potential financial impacts"""
        
        response = BedrockService.invoke_model(
            prompt=user_prompt,
            system_prompt=system_prompt,
            max_tokens=2048,
            temperature=0.3  # Lower temperature for more factual responses
        )
        
        # Try to parse JSON from response
        response_text = response.get("text", "")
        try:
            # Extract JSON from response if wrapped in markdown
            if "```json" in response_text:
                json_start = response_text.find("```json") + 7
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()
            elif "```" in response_text:
                json_start = response_text.find("```") + 3
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()
            
            parsed_analysis = json.loads(response_text)
            parsed_analysis["method"] = "aws_bedrock"
            parsed_analysis["model"] = response.get("model", "")
            return parsed_analysis
        except json.JSONDecodeError:
            # Return text response if JSON parsing fails
            return {
                "method": "aws_bedrock",
                "analysis": response_text,
                "model": response.get("model", ""),
                "parsed": False
            }
    
    @staticmethod
    def generate_impact_explanation(
        company_name: str,
        regulation_summary: str,
        risk_score: float,
        factors: Dict
    ) -> str:
        """Generate human-readable explanation of impact assessment"""
        prompt = f"""Explain why {company_name} has a risk score of {risk_score:.1f}/100 given the following regulation:

Regulation: {regulation_summary}

Risk Factors:
- Supply Chain: {factors.get('supply_chain_score', 0)}/100
- Geographic: {factors.get('geographic_score', 0)}/100
- Sector: {factors.get('sector_score', 0)}/100
- Product: {factors.get('product_score', 0)}/100

Provide a clear, concise explanation (2-3 sentences) that an investor could understand."""
        
        response = BedrockService.invoke_model(
            prompt=prompt,
            max_tokens=500,
            temperature=0.5
        )
        
        return response.get("text", "")
    
    @staticmethod
    def compare_with_10k(regulation_text: str, company_10k_summary: str) -> Dict:
        """Compare regulatory requirements with company 10-K filing to assess impact"""
        prompt = f"""Compare the following regulation with a company's 10-K filing to assess potential impact:

REGULATION:
{regulation_text[:4000]}

COMPANY 10-K SUMMARY:
{company_10k_summary[:4000]}

Provide an assessment:
1. Direct impacts on company operations
2. Supply chain vulnerabilities
3. Geographic exposure
4. Revenue impact estimate (%)
5. Recommended actions"""
        
        response = BedrockService.invoke_model(
            prompt=prompt,
            max_tokens=1500,
            temperature=0.4
        )
        
        return {
            "assessment": response.get("text", ""),
            "method": "aws_bedrock",
            "model": response.get("model", "")
        }

