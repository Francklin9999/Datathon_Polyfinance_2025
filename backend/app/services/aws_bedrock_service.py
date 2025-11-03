"""
AWS Bedrock Service
LLM-powered analysis using AWS Bedrock
"""

import json
import requests
from typing import Dict, Optional, List

from app.services.aws_config import AWSServices, is_aws_configured, AWS_BEARER_TOKEN_BEDROCK, AWS_REGION

try:
    from sentence_transformers import SentenceTransformer
    from sklearn.metrics.pairwise import cosine_similarity
    import numpy as np
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False


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
    def analyze_10k_filing(filing_text: str, ticker: str, company_name: str) -> Dict:
        """
        Analyze 10-K filing using LLM for deeper insights and analysis
        Extracts business model, risks, opportunities, and strategic insights
        """
        system_prompt = """You are an expert financial analyst specializing in SEC 10-K filing analysis.
Analyze 10-K filings to extract key business insights, risk factors, strategic positioning, and competitive advantages.
Provide structured, actionable analysis for investors."""
        
        # Limit filing text to avoid token limits (keep most important sections)
        limited_text = filing_text[:20000] if len(filing_text) > 20000 else filing_text
        
        user_prompt = f"""Analyze the following 10-K filing for {company_name} ({ticker}):

{filing_text[:20000]}

Please provide a comprehensive analysis covering:

1. **Business Model Summary**: Core business model and revenue streams in 2-3 sentences
2. **Key Strengths**: Main competitive advantages and strengths (3-5 points)
3. **Major Risks**: Top 5 most significant risk factors and their potential impact
4. **Strategic Opportunities**: Growth opportunities and strategic initiatives mentioned
5. **Financial Highlights**: Key financial metrics or trends mentioned
6. **Market Position**: Competitive positioning and market share indicators
7. **Regulatory Concerns**: Regulatory risks or compliance issues mentioned
8. **Supply Chain Insights**: Key suppliers, dependencies, or supply chain risks
9. **Geographic Exposure**: Regional revenue breakdown and geographic risks
10. **Forward-Looking Statements**: Summary of forward-looking guidance or projections

Provide the analysis in a structured format that's easy to understand."""
        
        response = BedrockService.invoke_model(
            prompt=user_prompt,
            system_prompt=system_prompt,
            max_tokens=3000,
            temperature=0.3  # Lower temperature for more factual analysis
        )
        
        return {
            "analysis": response.get("text", ""),
            "method": "aws_bedrock_llm",
            "model": response.get("model", ""),
            "ticker": ticker,
            "company_name": company_name
        }
    
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
    
    @staticmethod
    def _classify_prompt_type(prompt: str) -> Optional[str]:
        """
        Classify prompt type using NLP embeddings instead of hardcoded keyword matching
        Returns: 'regulatory', 'filing', 'portfolio', or None
        """
        try:
            if TRANSFORMERS_AVAILABLE:
                if not hasattr(BedrockService, '_embedding_model'):
                    try:
                        # Use better prebuilt transformer for prompt classification
                        BedrockService._embedding_model = SentenceTransformer('sentence-transformers/all-mpnet-base-v2')
                    except:
                        try:
                            BedrockService._embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
                        except:
                            BedrockService._embedding_model = None
                
                if BedrockService._embedding_model:
                    # Define prompt type templates
                    type_templates = {
                        "regulatory": [
                            "analyze regulatory document",
                            "regulation analysis",
                            "regulatory impact assessment",
                            "government policy document",
                            "legal regulation document"
                        ],
                        "filing": [
                            "analyze 10-K filing",
                            "company filing analysis",
                            "SEC filing document",
                            "10-Q filing analysis",
                            "financial filing document"
                        ],
                        "portfolio": [
                            "portfolio recommendations",
                            "portfolio optimization",
                            "sector rotation strategy",
                            "portfolio allocation adjustments",
                            "investment portfolio analysis"
                        ],
                        "general": [
                            "market summary",
                            "financial analysis",
                            "market conditions",
                            "general market update"
                        ]
                    }
                    
                    # Embed prompt
                    prompt_embedding = BedrockService._embedding_model.encode(
                        [prompt], convert_to_numpy=True
                    )
                    
                    # Embed all templates
                    best_match = None
                    best_score = 0.0
                    
                    for prompt_type, templates in type_templates.items():
                        template_embeddings = BedrockService._embedding_model.encode(
                            templates, convert_to_numpy=True
                        )
                        
                        # Calculate similarity
                        similarities = cosine_similarity(prompt_embedding, template_embeddings)[0]
                        max_similarity = float(np.max(similarities))
                        
                        if max_similarity > best_score:
                            best_score = max_similarity
                            best_match = prompt_type
                    
                    # Return type if similarity is above threshold (0.6)
                    if best_score > 0.6 and best_match != "general":
                        return best_match
        except:
            pass
        
        return None
    
    @staticmethod
    def _classify_prompt_type_fallback(prompt: str) -> str:
        """
        Fallback classification using keyword matching when embeddings are unavailable
        Returns: 'regulatory', 'filing', 'portfolio', or 'general'
        """
        prompt_lower = prompt.lower()
        
        # Regulatory indicators
        regulatory_indicators = ["regulatory document", "regulation", "regulatory", "policy", "legal document"]
        if any(indicator in prompt_lower for indicator in regulatory_indicators):
            return "regulatory"
        
        # Filing indicators
        filing_indicators = ["10-k", "10-q", "filing", "sec filing", "10k", "10q"]
        if any(indicator in prompt_lower for indicator in filing_indicators):
            return "filing"
        
        # Portfolio indicators
        portfolio_indicators = ["portfolio manager", "portfolio adjustments", "sector rotation", 
                               "portfolio recommendations", "portfolio optimization"]
        if any(indicator in prompt_lower for indicator in portfolio_indicators):
            return "portfolio"
        
        return "general"
    
    @staticmethod
    def generate_nlp_section_descriptions(analysis_data: Dict, ticker: str) -> Dict:
        """
        Generate AI-powered descriptions for each section of NLP analysis
        
        Args:
            analysis_data: Complete NLP analysis data
            ticker: Stock ticker symbol
            
        Returns:
            Dictionary with descriptions for each section
        """
        system_prompt = """You are an expert financial analyst specializing in NLP-based quantitative analysis of SEC filings.
Your role is to provide clear, insightful descriptions that explain what each section of the analysis means for investors.
Write in a professional but accessible tone, suitable for both technical and non-technical investors.
Keep descriptions concise (2-4 sentences) but informative."""
        
        descriptions = {}
        analysis = analysis_data.get("analysis", {})
        
        # Get trading signal data
        trading_signals = analysis.get("trading_signals") or analysis.get("trading_signal") or {}
        nlp_analysis = analysis.get("nlp_analysis", {})
        
        sections_to_describe = [
            {
                "name": "trading_signal",
                "data": {
                    "recommendation": trading_signals.get("recommendation") or analysis.get("recommendation"),
                    "strength": trading_signals.get("strength") or analysis.get("signal_strength") or analysis.get("strategy_score"),
                    "confidence": trading_signals.get("confidence") or analysis.get("confidence"),
                    "components": trading_signals.get("components", {}),
                    "quant_metrics": trading_signals.get("quant_metrics", {})
                },
                "prompt_template": "Trading Signal Analysis for {ticker}:\nRecommendation: {recommendation}\nSignal Strength: {strength}\nConfidence: {confidence}\n\nExplain what this trading signal means, what the recommendation suggests, and why the confidence level matters."
            },
            {
                "name": "sentiment",
                "data": nlp_analysis.get("sentiment_scores", {}),
                "prompt_template": "Sentiment Analysis for {ticker}:\nOverall Sentiment: {overall_sentiment}\nFinancial Sentiment: {financial_sentiment}\nUncertainty Score: {uncertainty_score}\n\nExplain what these sentiment metrics indicate about the company's outlook and tone in their filing."
            },
            {
                "name": "forward_looking",
                "data": {
                    "count": len(nlp_analysis.get("forward_looking_statements", [])),
                    "sample": nlp_analysis.get("forward_looking_statements", [])[:3]
                },
                "prompt_template": "Forward-Looking Statements for {ticker}:\nFound {count} forward-looking statements in the filing.\n\nExplain what forward-looking statements are, why they matter, and what investors should pay attention to."
            },
            {
                "name": "risk_analysis",
                "data": nlp_analysis.get("risk_analysis", {}),
                "prompt_template": "Risk Analysis for {ticker}:\nRisk Categories: {risk_categories}\nSeverity Score: {severity_score}\n\nExplain what this risk analysis reveals about the company's risk profile and what types of risks were identified."
            },
            {
                "name": "tone_analysis",
                "data": nlp_analysis.get("tone_analysis", {}),
                "prompt_template": "Tone Analysis for {ticker}:\nCertainty: {certainty_score}\nFormality: {formality_score}\nReadability: {readability_score}\n\nExplain what these tone metrics reveal about the company's communication style and management's confidence."
            },
            {
                "name": "entities",
                "data": {
                    "financial_metrics": nlp_analysis.get("entities", {}).get("financial_metrics", []),
                    "metrics_summary": {}
                },
                "prompt_template": "Financial Metrics Extracted for {ticker}:\nKey metrics mentioned in the filing.\n\nExplain what these financial metrics indicate and why tracking them is important for investors."
            },
            {
                "name": "quantitative_metrics",
                "data": trading_signals.get("quant_metrics", {}),
                "prompt_template": "Quantitative Metrics for {ticker}:\nComposite Signal: {composite_signal}\nExpected Return: {expected_return}\nSharpe Ratio: {signal_sharpe_ratio}\nInformation Coefficient: {information_coefficient}\n\nExplain what these quantitative metrics mean and how they inform the trading recommendation."
            }
        ]
        
        # Generate descriptions for each section
        last_model = None
        for section in sections_to_describe:
            try:
                # Prepare prompt
                section_data = section["data"]
                
                # Format prompt with actual data - use safe formatting
                try:
                    prompt = section["prompt_template"].format(
                        ticker=ticker,
                        **{k: str(v) if v is not None else "N/A" for k, v in section_data.items()}
                    )
                except KeyError:
                    # Fallback if template has missing keys
                    prompt = f"Analysis section for {ticker}: {section['name']}\n\nExplain what this section means for investors."
                
                # Add data summary to prompt
                if section_data:
                    try:
                        data_summary = json.dumps(section_data, indent=2, default=str)[:1000]
                        prompt += f"\n\nAnalysis Data Summary:\n{data_summary}"
                    except:
                        pass
                
                # Generate description
                response = BedrockService.invoke_model(
                    prompt=prompt,
                    system_prompt=system_prompt,
                    max_tokens=500,
                    temperature=0.5
                )
                
                descriptions[section["name"]] = response.get("text", "").strip()
                if response.get("model"):
                    last_model = response.get("model")
            except Exception as e:
                # If generation fails, provide a basic description
                descriptions[section["name"]] = f"Description unavailable for {section['name']} section: {str(e)}"
        
        return {
            "descriptions": descriptions,
            "ticker": ticker,
            "method": "aws_bedrock",
            "model": last_model or "unknown"
        }

