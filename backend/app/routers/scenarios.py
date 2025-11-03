"""
Scenarios router - Scenario simulation endpoint
"""

from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel
import json
import logging

logger = logging.getLogger(__name__)

from app.models.types import Portfolio, Scenario, ScenarioResult
from app.models.requests import LLMRequest
from app.services.scenario_simulator import ScenarioSimulator
from app.services.aws_bedrock_service import BedrockService
from app.services.aws_config import is_aws_configured
import numpy as np


router = APIRouter()


class ScenarioRunRequest(BaseModel):
    """Request model for scenario simulation"""
    portfolio: Portfolio
    scenarios: List[Scenario]
    company_risks: Optional[List[dict]] = None  # CompanyRisk dicts from document analyzer


class ScenarioGenerateRequest(BaseModel):
    """Request model for generating scenarios from text"""
    user_request: str


@router.post("/run")
async def run_scenarios(request: ScenarioRunRequest):
    """
    Run scenario simulations and return P5/P50/P95 portfolio impact
    
    Args:
        portfolio: Current portfolio
        scenarios: List of scenarios to simulate
        company_risks: Optional list of company risk assessments
        
    Returns:
        {
            "results": List[ScenarioResult],
            "summary": Dict
        }
    """
    try:
        portfolio_holdings = request.portfolio.holdings
        
        # Convert CompanyRisk dicts to impact format if provided
        if request.company_risks:
            company_impacts = [
                {
                    "ticker": risk.get("ticker"),
                    "risk_score": risk.get("total_score", 50.0),
                    "revenue_impact_pct": risk.get("price_impact_bps", 0.0) / 100.0,  # Convert bps to pct
                    "components": risk.get("components", [])
                }
                for risk in request.company_risks
            ]
        else:
            # Fallback: create mock impacts from portfolio
            company_impacts = [
                {
                    "ticker": ticker,
                    "risk_score": 50.0,
                    "revenue_impact_pct": 0.0
                }
                for ticker in portfolio_holdings.keys()
            ]
        
        # Convert scenarios to dict format
        scenario_dicts = [s.dict() for s in request.scenarios]
        
        # Run scenario simulation
        results = ScenarioSimulator.simulate_scenarios(
            base_portfolio=portfolio_holdings,
            company_impacts=company_impacts,
            scenarios=scenario_dicts,
            time_horizon_days=90
        )
        
        # Enhance with log-normal sampling for P5/P50/P95
        enhanced_results = []
        for idx, scenario_result in enumerate(results["scenarios"]):
            # Use log-normal distribution for uncertainty
            mean_impact = scenario_result.get("expected_portfolio_impact_pct", 0.0)
            
            # Estimate volatility from scenario severity and component uncertainty
            # Higher severity = higher volatility
            severity = scenario_result.get("severity", 1.0)
            sigma = 0.25 * severity  # Base volatility scaled by severity (reduced from 0.3)
            
            # Generate log-normal samples with better handling of small values
            np.random.seed(42 + idx)  # Different seed per scenario for variation
            
            if abs(mean_impact) < 0.01:
                # For very small impacts, use normal distribution instead
                samples = np.random.normal(
                    loc=mean_impact,
                    scale=abs(mean_impact) * 0.5 + 0.1,  # Scale based on mean
                    size=1000
                )
            else:
                # Use log-normal for larger impacts
                log_mean = np.log(max(0.001, abs(mean_impact)))
                samples = np.random.lognormal(
                    mean=log_mean,
                    sigma=sigma,
                    size=1000
                )
                # Adjust sign based on mean_impact
                if mean_impact < 0:
                    samples = -samples
            
            # Convert to basis points for display
            p5 = float(np.percentile(samples, 5)) * 100  # Convert % to bps
            p50 = float(np.percentile(samples, 50)) * 100
            p95 = float(np.percentile(samples, 95)) * 100
            
            enhanced_result = {
                **scenario_result,
                "p5": p5,
                "p50": p50,
                "p95": p95
            }
            
            enhanced_results.append(enhanced_result)
        
        return {
            "results": enhanced_results,
            "summary": results.get("summary", {})
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error running scenarios: {str(e)}")


# Reference scenario presets for LLM context
SCENARIO_PRESETS_REFERENCE = [
    {
        "name": "Tariff - China",
        "scenario_type": "tariff",
        "severity": 0.7,
        "duration_days": 90,
        "parameters": {"rate_pct": 25, "target_region": "China", "target_sector": None}
    },
    {
        "name": "Export Ban - Technology",
        "scenario_type": "ban",
        "severity": 0.8,
        "duration_days": 180,
        "parameters": {"target_region": "China", "target_sector": "Technology"}
    },
    {
        "name": "Sanction - EU",
        "scenario_type": "sanction",
        "severity": 0.6,
        "duration_days": 120,
        "parameters": {"target_region": "EU"}
    },
    {
        "name": "Carbon Tax Step-up",
        "scenario_type": "carbon_tax",
        "severity": 0.5,
        "duration_days": 365,
        "parameters": {"rate_increase_pct": 50}
    },
    {
        "name": "Supply Chain Disruption",
        "scenario_type": "supply_chain_disruption",
        "severity": 0.75,
        "duration_days": 60,
        "parameters": {"country": "China", "disruption_pct": 30}
    },
    {
        "name": "FX Shock - DXY",
        "scenario_type": "fx_shock",
        "severity": 0.4,
        "duration_days": 30,
        "parameters": {"currency": "DXY", "shock_pct": 10}
    }
]


@router.post("/generate-from-text")
async def generate_scenario_from_text(request: ScenarioGenerateRequest):
    """
    Generate scenario parameters from user's natural language description using LLM
    
    Args:
        user_request: Natural language description of the scenario
        
    Returns:
        {
            "scenarios": List[Scenario] - Generated scenario(s) with parameters
        }
    """
    try:
        # Build prompt for LLM
        prompt = f"""You are a financial scenario modeling assistant. Based on the user's request below, generate a scenario definition that matches one of the reference scenario types.

USER REQUEST: "{request.user_request}"

REFERENCE SCENARIO TYPES:
{json.dumps(SCENARIO_PRESETS_REFERENCE, indent=2)}

TASK:
1. Identify the scenario type from the user request (must be one of: tariff, sanction, ban, subsidy_removal, carbon_tax, fx_shock, supply_chain_disruption, litigation, regulatory_delay)
2. Extract relevant parameters from the user request:
   - For tariff: rate_pct (tariff rate as percentage), target_region, target_sector (optional)
   - For ban: target_region, target_sector
   - For sanction: target_region
   - For carbon_tax: rate_increase_pct (percentage increase)
   - For supply_chain_disruption: country, disruption_pct (percentage of disruption)
   - For fx_shock: currency, shock_pct (percentage shock)
3. Infer severity (0.0 to 1.0) based on the magnitude of the scenario
4. Infer duration_days based on time mentioned or reasonable defaults
5. Generate an appropriate name for the scenario

IMPORTANT:
- Extract numbers from the user request (tariff rates, durations, percentages, etc.)
- Use reasonable defaults if specific values aren't mentioned:
  - severity: 0.5 (moderate), 0.7-0.8 (high), 0.3-0.4 (low)
  - duration_days: 30 (short-term), 90 (medium-term), 180-365 (long-term)
- Return ONLY valid JSON in this exact format (no markdown, no explanations):

{{
  "scenarios": [
    {{
      "name": "Generated scenario name",
      "scenario_type": "tariff|sanction|ban|carbon_tax|fx_shock|supply_chain_disruption|etc",
      "severity": 0.7,
      "duration_days": 90,
      "parameters": {{}}
    }}
  ]
}}

Return the JSON object with the scenario definition. If multiple scenarios could be inferred, return multiple items in the array."""

        # Call LLM
        if is_aws_configured():
            try:
                llm_response = BedrockService.invoke_model(
                    prompt=prompt,
                    max_tokens=2048,
                    temperature=0.3  # Lower temperature for more deterministic output
                )
                response_text = llm_response.get("text", "")
            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"Error calling LLM: {str(e)}"
                )
        else:
            # Fallback: simple parsing without LLM
            fallback_data = _parse_scenario_fallback(request.user_request)
            response_text = json.dumps(fallback_data)

        # Parse JSON response
        json_data = None
        
        # Try to extract JSON from response
        if "```json" in response_text:
            json_start = response_text.find("```json") + 7
            json_end = response_text.find("```", json_start)
            if json_end > json_start:
                json_text = response_text[json_start:json_end].strip()
                try:
                    json_data = json.loads(json_text)
                except json.JSONDecodeError:
                    pass
        
        # Try to find JSON object in text
        if json_data is None:
            json_start = response_text.find("{")
            json_end = response_text.rfind("}")
            if json_start >= 0 and json_end > json_start:
                json_text = response_text[json_start:json_end + 1]
                try:
                    json_data = json.loads(json_text)
                except json.JSONDecodeError:
                    pass
        
        # Fallback parsing if JSON parsing fails
        if json_data is None or "scenarios" not in json_data:
            logger.warning(f"JSON parsing failed, using fallback parser. Response was: {response_text[:200]}")
            json_data = _parse_scenario_fallback(request.user_request)

        # Validate and convert to Scenario objects
        scenarios = []
        validation_errors = []
        
        for idx, scenario_dict in enumerate(json_data.get("scenarios", [])):
            try:
                # Validate scenario type
                valid_types = [
                    "tariff", "sanction", "ban", "subsidy_removal",
                    "carbon_tax", "fx_shock", "supply_chain_disruption",
                    "litigation", "regulatory_delay"
                ]
                scenario_type = scenario_dict.get("scenario_type", "tariff")
                if scenario_type not in valid_types:
                    scenario_type = "tariff"  # Default fallback

                # Clean parameters - remove None values
                parameters = scenario_dict.get("parameters", {})
                if parameters:
                    parameters = {k: v for k, v in parameters.items() if v is not None}
                if not parameters:
                    parameters = None

                # Ensure name is valid
                scenario_name = scenario_dict.get("name", f"Generated Scenario {idx + 1}")
                if not scenario_name or len(scenario_name.strip()) == 0:
                    scenario_name = f"Generated Scenario {idx + 1}"

                # Ensure severity is valid
                severity = scenario_dict.get("severity", 0.5)
                try:
                    severity = float(severity)
                    severity = max(0.0, min(1.0, severity))
                except (ValueError, TypeError):
                    severity = 0.5

                # Ensure duration_days is valid
                duration_days = scenario_dict.get("duration_days", 90)
                try:
                    duration_days = int(duration_days) if duration_days is not None else 90
                    duration_days = max(1, duration_days)
                except (ValueError, TypeError):
                    duration_days = 90

                # Create Scenario object
                scenario = Scenario(
                    name=scenario_name,
                    scenario_type=scenario_type,
                    severity=severity,
                    duration_days=duration_days,
                    parameters=parameters
                )
                scenarios.append(scenario)
            except Exception as e:
                # Log validation error but continue
                validation_errors.append(f"Scenario {idx}: {str(e)}")
                continue

        if not scenarios:
            error_msg = "Could not generate valid scenario from text. Please provide more details."
            if validation_errors:
                error_msg += f" Validation errors: {'; '.join(validation_errors)}"
            raise HTTPException(
                status_code=400,
                detail=error_msg
            )

        return {
            "scenarios": [s.dict() for s in scenarios]
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating scenario from text: {str(e)}"
        )


def _parse_scenario_fallback(user_request: str) -> dict:
    """
    Fallback scenario parsing without LLM - basic keyword matching
    Always returns a valid scenario structure
    """
    if not user_request or not user_request.strip():
        # Default scenario if input is empty
        return {
            "scenarios": [{
                "name": "Generic Regulatory Scenario",
                "scenario_type": "tariff",
                "severity": 0.5,
                "duration_days": 90,
                "parameters": None
            }]
        }
    
    request_lower = user_request.lower().strip()
    
    # Determine scenario type
    scenario_type = "tariff"
    if "ban" in request_lower or "export ban" in request_lower:
        scenario_type = "ban"
    elif "sanction" in request_lower:
        scenario_type = "sanction"
    elif "carbon" in request_lower or ("tax" in request_lower and "tariff" not in request_lower):
        scenario_type = "carbon_tax"
    elif "supply chain" in request_lower or "disruption" in request_lower:
        scenario_type = "supply_chain_disruption"
    elif "fx" in request_lower or "currency" in request_lower or "exchange" in request_lower:
        scenario_type = "fx_shock"
    
    # Extract numbers (tariff rate, duration, etc.)
    import re
    numbers = re.findall(r'\d+', user_request)
    
    # Extract regions/countries
    regions = ["china", "eu", "europe", "us", "usa", "japan", "asia"]
    target_region = None
    for region in regions:
        if region in request_lower:
            target_region = region.title()
            if target_region == "Us" or target_region == "Usa":
                target_region = "US"
            elif target_region == "Eu":
                target_region = "EU"
            break
    
    # Estimate severity and duration
    severity = 0.5
    duration_days = 90
    
    if numbers:
        # Use first number as potential tariff rate or percentage
        try:
            first_num = int(numbers[0])
            if first_num > 50:
                severity = 0.8
            elif first_num > 25:
                severity = 0.6
            else:
                severity = 0.4
            
            # Try to infer duration
            if "month" in request_lower:
                duration_days = 30 if first_num <= 3 else first_num * 30
            elif "day" in request_lower:
                if len(numbers) > 1:
                    try:
                        duration_days = int(numbers[1])
                    except (ValueError, IndexError):
                        duration_days = first_num if first_num < 365 else 90
                else:
                    duration_days = first_num if first_num < 365 else 90
            elif "year" in request_lower or "yr" in request_lower:
                duration_days = first_num * 365 if first_num <= 5 else 365
        except (ValueError, IndexError):
            pass  # Use defaults
    
    # Ensure duration_days is valid
    if duration_days < 1:
        duration_days = 90
    
    # Build parameters
    parameters = {}
    if scenario_type == "tariff" and numbers:
        try:
            parameters["rate_pct"] = int(numbers[0])
        except (ValueError, IndexError):
            parameters["rate_pct"] = 25  # Default tariff rate
    
    if target_region:
        if scenario_type in ["tariff", "ban", "sanction"]:
            parameters["target_region"] = target_region
        elif scenario_type == "supply_chain_disruption":
            parameters["country"] = target_region
    
    # If no parameters were set, set to None instead of empty dict
    if not parameters:
        parameters = None
    
    # Generate a reasonable scenario name
    scenario_name_parts = []
    if scenario_type == "tariff" and numbers:
        try:
            scenario_name_parts.append(f"{int(numbers[0])}% Tariff")
        except (ValueError, IndexError):
            scenario_name_parts.append("Tariff")
    elif scenario_type == "ban":
        scenario_name_parts.append("Export Ban")
    elif scenario_type == "sanction":
        scenario_name_parts.append("Sanction")
    elif scenario_type == "carbon_tax":
        scenario_name_parts.append("Carbon Tax")
    elif scenario_type == "supply_chain_disruption":
        scenario_name_parts.append("Supply Chain Disruption")
    elif scenario_type == "fx_shock":
        scenario_name_parts.append("FX Shock")
    else:
        scenario_name_parts.append("Regulatory Scenario")
    
    if target_region:
        scenario_name_parts.append(target_region)
    
    scenario_name = " - ".join(scenario_name_parts) if scenario_name_parts else f"Generated: {user_request[:50].strip()}"
    
    # Ensure name is not empty
    if not scenario_name or len(scenario_name.strip()) == 0:
        scenario_name = "Generated Scenario"
    
    return {
        "scenarios": [{
            "name": scenario_name,
            "scenario_type": scenario_type,
            "severity": float(severity),
            "duration_days": int(duration_days),
            "parameters": parameters
        }]
    }

