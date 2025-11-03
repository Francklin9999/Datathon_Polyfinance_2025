"""
Market Research Service
AI-powered web research to identify risks and opportunities for stocks
Uses cached NLP analysis data when available
"""

from typing import Dict, List, Optional
from datetime import datetime
from pathlib import Path
import json
import re

from app.services.searxng_service import SearXNGService
from app.services.nlp_quant_strategy import NLPQuantStrategy
from app.routers.stocks import find_filings_for_ticker, get_filing_content
from app.services.aws_bedrock_service import BedrockService
from app.services.aws_config import is_aws_configured
from app.services.web_scraper_service import WebScraperService
from app.services.video_generation_service import VideoGenerationService