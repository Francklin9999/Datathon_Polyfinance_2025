# IntelliRisk

A comprehensive financial analytics platform that combines regulatory analysis, portfolio optimization, risk assessment, and AI-powered insights. The platform enables financial institutions to assess regulatory impacts on portfolios, optimize allocations with regulatory constraints, and generate quantitative trading strategies using NLP analysis of SEC filings.

## Table of Contents

- [Executive Summary](#executive-summary)
- [Architecture Overview](#architecture-overview)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Core Modules](#core-modules)
- [API Endpoints](#api-endpoints)
- [Frontend Pages](#frontend-pages)
- [Services & Components](#services--components)
- [AWS Integration](#aws-integration)
- [Implementation Status](#implementation-status)
- [Project Structure](#project-structure)

---

## Executive Summary

IntelliRisk is an end-to-end financial analytics platform that:

- **Analyzes Regulatory Documents** - Extracts entities, measures, and provisions from multi-format documents (PDF, HTML, XML, DOCX)
- **Assesses Portfolio Impact** - Calculates company-level risk scores and portfolio-level impacts using ML-based models
- **Optimizes Portfolios** - Provides ML-based portfolio optimization with regulatory constraints
- **Generates Trading Signals** - Uses NLP analysis of 10-K/10Q filings to generate quantitative trading strategies
- **Simulates Scenarios** - Runs multi-scenario simulations with Monte Carlo analysis
- **Market Research** - AI-powered market research and analysis for tickers
- **Stock Analysis** - Comprehensive stock data, filings analysis, and relationship graphs
- **AI Voice Chat** - AWS-powered voice transcription and text-to-speech for natural conversations

---

## Architecture Overview

### System Architecture

**Backend (Python/FastAPI)**
- RESTful API with FastAPI framework
- Microservices architecture with 14 modular routers
- AWS integration (Bedrock, Comprehend, Textract, S3, OpenSearch, Transcribe, Polly)
- ML/NLP models (spaCy, Transformers, scikit-learn)
- Document parsing (PDF, HTML, XML, DOCX)
- NLP analysis caching system

**Frontend (React/Vite)**
- React 18 with React Router
- TailwindCSS for styling
- Recharts for data visualization
- Lucide React for icons
- Component-based architecture
- Portfolio context for state management
- Real-time notifications system

### Technology Stack

**Backend Dependencies:**
- FastAPI 0.104.1 - Web framework
- NumPy, scikit-learn, scipy - ML/Analytics
- spaCy, NLTK, Transformers - NLP
- sentence-transformers - Embeddings
- boto3, botocore - AWS SDK
- opensearch-py - OpenSearch client
- yfinance - Stock data
- BeautifulSoup4, PyPDF2, pdfplumber, python-docx - Document parsing
- httpx - HTTP client

**Frontend Dependencies:**
- React 18.2.0
- React Router 6.20.0
- Recharts 2.10.3 - Charts
- TailwindCSS 3.3.6
- @tanstack/react-query 5.12.0 - Data fetching
- Lucide React - Icons
- jspdf - PDF generation
- date-fns - Date utilities

---

## Getting Started

### Prerequisites

- Python 3.9+
- Node.js 18+
- AWS account (optional, for enhanced features)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Install spaCy model:
```bash
python -m spacy download en_core_web_sm
```

5. Create necessary directories:
```bash
mkdir -p uploads
```

6. (Optional) Set up AWS credentials in `.env` (copy from `env.template`):
```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=intellirisk-temp
OPENSEARCH_ENDPOINT=your_opensearch_endpoint
```

7. Start the backend server:
```bash
python main.py
# Or use the start script:
./start.sh
```

The API will be available at `http://localhost:8000`
API documentation at `http://localhost:8000/docs`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173` (or the port specified by Vite)

---

## Core Modules

### 1. Regulatory Analysis Module

**Purpose:** Analyze regulatory documents and assess impact on companies

**Key Service:** `RegulatoryAnalyzer` (`backend/app/services/regulatory_analyzer.py`)

**Features:**
- Multi-format document parsing (PDF, HTML, XML, DOCX)
- Entity extraction using spaCy NER (tickers, countries, organizations)
- Measure extraction (tariffs, taxes, subsidies, quotas)
- Supply chain impact analysis
- Semantic classification using embeddings
- S&P 500 portfolio impact analysis
- Monte Carlo simulation
- Missing elements search

**API Endpoints:**
- `POST /api/regulatory/analyze-document` - Analyze regulatory document
- `POST /api/regulatory/company-impact` - Assess company impact
- `POST /api/regulatory/analyze-sp500-impact` - Analyze S&P 500 portfolio impact
- `POST /api/regulatory/simulate-scenarios` - Simulate regulatory scenarios
- `POST /api/regulatory/monte-carlo` - Monte Carlo analysis
- `POST /api/regulatory/explain-impact` - Explain regulatory impact
- `GET /api/regulatory/sp500-portfolio` - Get S&P 500 portfolio
- `POST /api/regulatory/search-missing-elements` - Search for missing elements

### 2. Impact Modeling Module

**Purpose:** Calculate regulatory impact on individual companies

**Key Service:** `ImpactModeler` (`backend/app/services/impact_modeler.py`)

**Risk Score Calculation:**
```
Risk Score = 0.35 × Supply Chain Risk + 
             0.30 × Geographic Exposure + 
             0.20 × Sector Match Score + 
             0.15 × Measure Impact
```

**Components:**
- Supply Chain Risk (0-100): Based on affected supplier dependencies
- Geographic Exposure (0-100): % of revenue in affected regions
- Sector Match Score (0-100): Semantic similarity to affected sectors
- Measure Impact (0-100): Sum of applicable measure rates

### 3. Portfolio Optimization Module

**Purpose:** Optimize portfolio allocations with regulatory constraints

**Key Service:** `PortfolioOptimizer` (`backend/app/services/portfolio_optimizer.py`)

**Features:**
- ML-based optimization (Sharpe Ratio, Return Maximization, Risk Minimization, ESG)
- Regulatory constraint integration
- Efficient frontier generation
- Before/after comparison metrics
- Equal-weight portfolio initialization
- Risk dashboard
- Portfolio adjustments

**API Endpoints:**
- `POST /api/portfolio/optimize` - Optimize portfolio allocation
- `POST /api/portfolio/init-equal-weight` - Build equal-weight portfolio
- `GET /api/portfolio/risk-dashboard` - Get risk dashboard
- `POST /api/portfolio/get-adjustments` - Get portfolio adjustments
- `GET /api/portfolio/metrics` - Get portfolio metrics

### 4. Scenario Simulation Module

**Purpose:** Simulate multiple regulatory scenarios and their portfolio impacts

**Key Service:** `ScenarioSimulator` (`backend/app/services/scenario_simulator.py`)

**Features:**
- Multi-scenario simulation with severity multipliers
- Time-weighted impact calculations
- Monte Carlo analysis
- Risk rating classification (Critical, High, Medium, Low, Minimal)
- Scenario generation from text

**API Endpoints:**
- `POST /api/scenarios/run` - Run scenario simulation
- `POST /api/scenarios/generate-from-text` - Generate scenario from text

### 5. NLP Quantitative Strategy Module

**Purpose:** Generate trading signals from 10K/10Q filings using NLP

**Key Service:** `NLPQuantStrategy` (`backend/app/services/nlp_quant_strategy.py`)

**Features:**
- Sentiment analysis (NLTK VADER, FinBERT)
- Key metrics extraction (forward-looking statements, risk factors)
- Change detection vs previous filings
- Trading signal generation (Bullish/Bearish/Neutral)
- Cached analysis system for performance

**API Endpoints:**
- `POST /api/analytics/nlp-quant-strategy` - Generate NLP trading signals
- `POST /api/analytics/tenk-analyze` - Analyze 10-K filing
- `GET /api/analytics/sentiment` - Get sentiment analysis
- `GET /api/analytics/trends` - Get trend analysis

### 6. Document Analysis Module

**Purpose:** Consolidated document analysis with portfolio impact

**Key Service:** `DocumentAnalyzerService` (`backend/app/services/document_analyzer_service.py`)

**Features:**
- Multi-format document parsing
- Portfolio-aware impact analysis
- AI-generated interpretations
- Citation tracking

**API Endpoints:**
- `POST /api/documents/analyze` - Analyze documents with portfolio impact
- `POST /api/documents/generate-interpretation` - Generate AI interpretation

### 7. Portfolio Services

**Key Services:**
- `PortfolioService` - Equal-weight universe builder from filings
- `PortfolioRiskService` - Risk analysis and metrics
- `CalibrationService` - Ridge regression for component weights
- `RecommendationsService` - Hedge menu generation

**API Endpoints:**
- `POST /api/portfolio/init-equal-weight` - Build equal-weight portfolio
- `GET /api/company/sentiment` - Company sentiment assessment
- `POST /api/recommendations/compute` - Hedge and diversification recommendations

### 8. Stock Analysis Module

**Purpose:** Comprehensive stock data and filings analysis

**Features:**
- Stock information retrieval
- SEC filings listing and download
- Filing analysis
- Formatted stock data

**API Endpoints:**
- `GET /api/stocks/list` - List available stocks
- `GET /api/stocks/stock/{ticker}` - Get stock data
- `GET /api/stocks/stock/{ticker}/filings` - Get stock filings
- `GET /api/stocks/stock/{ticker}/filings/{filename}/download` - Download filing
- `GET /api/stocks/stock/{ticker}/filings/{filename}/analyze` - Analyze filing
- `GET /api/stocks/stock/{ticker}/formatted` - Get formatted stock data

### 9. Stock Graphs Module

**Purpose:** Stock correlation and dependency analysis

**Features:**
- Correlation analysis between stocks
- Dependency graph generation
- Relationship visualization
- Portfolio-level analysis

**API Endpoints:**
- `POST /api/stock-graphs/correlation` - Analyze stock correlations
- `POST /api/stock-graphs/dependency` - Analyze stock dependencies
- `GET /api/stock-graphs/relationships/{ticker}` - Get stock relationships
- `GET /api/stock-graphs/portfolio/correlation` - Portfolio correlation
- `GET /api/stock-graphs/portfolio/dependency` - Portfolio dependency

### 10. Market Research Module

**Purpose:** AI-powered market research and analysis

**Features:**
- Ticker-specific research
- Follow-up question handling
- AI-generated insights

**API Endpoints:**
- `POST /api/market-research/research` - Research a ticker
- `GET /api/market-research/research/{ticker}` - Get research results
- `POST /api/market-research/followup` - Ask follow-up questions

### 11. NLP Cache Module

**Purpose:** Cached NLP analysis for performance

**Features:**
- Ticker-level caching
- Top signals extraction
- Metadata tracking
- Description generation

**API Endpoints:**
- `GET /api/nlp-cache/all` - Get all cached analyses
- `GET /api/nlp-cache/ticker/{ticker}` - Get ticker analysis
- `GET /api/nlp-cache/top-signals` - Get top trading signals
- `GET /api/nlp-cache/metadata` - Get cache metadata
- `POST /api/nlp-cache/ticker/{ticker}/descriptions` - Generate descriptions

### 12. AI Module

**Purpose:** LLM-powered analysis and voice chat

**Features:**
- Custom LLM invocation
- Summary generation
- AWS voice transcription
- Text-to-speech synthesis
- 10-K RAG analysis

**API Endpoints:**
- `POST /api/ai/invoke-llm` - Invoke LLM with custom prompt
- `POST /api/ai/generate-summary` - Generate AI summary
- `GET /api/ai/aws-voice/config` - Get voice chat configuration
- `POST /api/ai/aws-voice/transcribe` - Transcribe audio to text
- `POST /api/ai/aws-voice/synthesize` - Convert text to speech
- `POST /api/ai/tenk-rag-analysis` - 10-K RAG analysis

### 13. Entity Management

**Purpose:** CRUD operations for financial entities

**Features:**
- Market snapshot management
- Risk metrics tracking
- News item storage
- Position management
- Order tracking
- Event logging

**API Endpoints:**
- Entity CRUD for MarketSnapshot, RiskMetrics, NewsItem, Position, Order, EventItem

### 14. File Management

**Purpose:** File upload and retrieval

**API Endpoints:**
- `POST /api/files/upload` - Upload file
- `GET /api/files/{file_id}` - Get file

---

## API Endpoints

### Regulatory Endpoints (`/api/regulatory`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/analyze-document` | POST | Analyze regulatory document |
| `/company-impact` | POST | Assess company impact |
| `/analyze-sp500-impact` | POST | Analyze S&P 500 portfolio impact |
| `/simulate-scenarios` | POST | Simulate regulatory scenarios |
| `/monte-carlo` | POST | Monte Carlo analysis |
| `/explain-impact` | POST | Explain regulatory impact |
| `/sp500-portfolio` | GET | Get S&P 500 portfolio |
| `/search-missing-elements` | POST | Search for missing elements |

### Portfolio Endpoints (`/api/portfolio`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/optimize` | POST | Optimize portfolio allocation |
| `/init-equal-weight` | POST | Build equal-weight portfolio |
| `/risk-dashboard` | GET | Get risk dashboard |
| `/get-adjustments` | POST | Get portfolio adjustments |
| `/metrics` | GET | Get portfolio metrics |

### Document Endpoints (`/api/documents`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/analyze` | POST | Analyze documents with portfolio impact |
| `/generate-interpretation` | POST | Generate AI interpretation |

### Scenario Endpoints (`/api/scenarios`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/run` | POST | Run scenario simulation |
| `/generate-from-text` | POST | Generate scenario from text |

### Analytics Endpoints (`/api/analytics`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/nlp-quant-strategy` | POST | Generate NLP trading signals |
| `/tenk-analyze` | POST | Analyze 10-K filing |
| `/sentiment` | GET | Get sentiment analysis |
| `/trends` | GET | Get trend analysis |

### Stock Endpoints (`/api/stocks`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/list` | GET | List available stocks |
| `/stock/{ticker}` | GET | Get stock data |
| `/stock/{ticker}/filings` | GET | Get stock filings |
| `/stock/{ticker}/filings/{filename}/download` | GET | Download filing |
| `/stock/{ticker}/filings/{filename}/analyze` | GET | Analyze filing |
| `/stock/{ticker}/formatted` | GET | Get formatted stock data |

### Stock Graphs Endpoints (`/api/stock-graphs`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/correlation` | POST | Analyze stock correlations |
| `/dependency` | POST | Analyze stock dependencies |
| `/relationships/{ticker}` | GET | Get stock relationships |
| `/portfolio/correlation` | GET | Portfolio correlation |
| `/portfolio/dependency` | GET | Portfolio dependency |

### Market Research Endpoints (`/api/market-research`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/research` | POST | Research a ticker |
| `/research/{ticker}` | GET | Get research results |
| `/followup` | POST | Ask follow-up questions |

### NLP Cache Endpoints (`/api/nlp-cache`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/all` | GET | Get all cached analyses |
| `/ticker/{ticker}` | GET | Get ticker analysis |
| `/top-signals` | GET | Get top trading signals |
| `/metadata` | GET | Get cache metadata |
| `/ticker/{ticker}/descriptions` | POST | Generate descriptions |

### AI Endpoints (`/api/ai`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/invoke-llm` | POST | Invoke LLM with custom prompt |
| `/generate-summary` | POST | Generate AI summary |
| `/aws-voice/config` | GET | Get voice chat configuration |
| `/aws-voice/transcribe` | POST | Transcribe audio to text |
| `/aws-voice/synthesize` | POST | Convert text to speech |
| `/tenk-rag-analysis` | POST | 10-K RAG analysis |

### Company Endpoints (`/api/company`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/sentiment` | GET | Company sentiment assessment |

### Recommendations Endpoints (`/api/recommendations`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/compute` | POST | Hedge and diversification recommendations |

### Entity Endpoints (`/api/entities`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/MarketSnapshot` | GET/POST | Market snapshot CRUD |
| `/RiskMetrics` | GET/POST | Risk metrics CRUD |
| `/NewsItem` | GET/POST | News item CRUD |
| `/Position` | GET/POST | Position CRUD |
| `/Order` | GET/POST | Order CRUD |
| `/EventItem` | GET/POST | Event item CRUD |

### File Endpoints (`/api/files`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/upload` | POST | Upload file |
| `/{file_id}` | GET | Get file |

---

## Frontend Pages

### Main Navigation Pages

1. **Home** (`/`) - Landing page with project overview
2. **Document Analyzer** (`/document-analyzer`) - Upload and analyze regulatory documents
3. **Company Assessment** (`/company-assessment`) - Sentiment analysis vs peers
4. **Portfolio Risk Dashboard** (`/portfolio-risk-dashboard`) - Portfolio-first risk analysis
5. **Scenario Simulator** (`/scenario-simulator`) - Multi-scenario simulation with P5/P50/P95 charts
6. **Market Research** (`/market-research`) - AI-powered market research

### Additional Pages

7. **Regulatory Analyzer** (`/regulatory-analyzer`) - Legacy regulatory analysis page
8. **Company Impact Assessment** (`/company-impact-assessment`) - Company impact analysis
9. **Portfolio Dashboard** (`/portfolio-dashboard`) - Portfolio management
10. **Recommendations Engine** (`/recommendations-engine`) - Hedge and diversification recommendations
11. **Ten-K Intelligence** (`/tenk-intelligence`) - 10-K filing analysis
12. **NLP Quant Strategy** (`/nlp-quant-strategy`) - NLP-based trading signals

### Global Components

- **Chat Assistant** - AI-powered chat assistant available on all pages (WebSocket + HTTP)
- **Notification Center** - Real-time notifications and background job tracking
- **Portfolio Pill** - Global portfolio context display

---

## Services & Components

### Backend Services

**Core Services:**
- `RegulatoryAnalyzer` - Regulatory document analysis
- `ImpactModeler` - Impact calculation
- `PortfolioOptimizer` - Portfolio optimization
- `ScenarioSimulator` - Scenario simulation
- `DocumentAnalyzerService` - Consolidated document analysis
- `PortfolioService` - Portfolio management
- `PortfolioRiskService` - Risk analysis
- `CalibrationService` - Model calibration
- `RecommendationsService` - Hedge recommendations

**Stock & Market Services:**
- `NLPQuantStrategy` - NLP-based trading signals
- `MarketResearchService` - Market research
- `StockGraphService` - Correlation/dependency analysis
- `SocialSentimentService` - Social sentiment analysis
- `RedditService` - Reddit data scraping
- `NewsAPIService` - News API integration
- `CourtListenerService` - Legal data integration
- `SECEnforcementService` - SEC enforcement data

**NLP Services:**
- `NLPAnalysisCache` - Cached NLP analysis
- `TenKParser` - 10-K filing parser
- `DocumentParser` - Multi-format document parser
- `HTMLParser` - HTML parsing

**AWS Services:**
- `BedrockService` - AWS Bedrock LLM integration
- `ComprehendService` - AWS Comprehend NLP
- `TextractService` - AWS Textract OCR
- `S3Service` - AWS S3 storage
- `OpenSearchService` - AWS OpenSearch RAG

**Utility Services:**
- `WebScraperService` - Web scraping
- `SearXNGService` - Search engine integration

### Frontend Components

**UI Components:**
- `Card`, `Button`, `Badge`, `Input`, `Textarea` - Basic UI components
- `Dialog`, `Popover`, `Tooltip` - Interactive components
- `Tabs`, `Select`, `Slider` - Form components
- `Command` - Command palette

**Application Components:**
- `Navigation` - Main navigation bar
- `PortfolioPill` - Portfolio context display
- `ChatAssistant` - AI chat interface
- `NotificationCenter` - Notification system
- `NotificationToast` - Toast notifications
- `ProvenanceDrawer` - Source tracking
- `SourceExplorer` - Source exploration
- `RecommendationExplanation` - Recommendation details
- `ErrorDisplay` - Error handling
- `VAPIChat` - Voice API chat

**Context Providers:**
- `PortfolioProvider` - Portfolio state management
- `AnalysisProvider` - Analysis state and notifications

---

## AWS Integration

### AWS Services Used

1. **AWS Bedrock** - Advanced document analysis with Claude models (Claude 3.5 Sonnet, Opus, Haiku)
2. **AWS Comprehend** - Entity extraction, key phrase extraction, sentiment analysis
3. **AWS Textract** - Document text extraction (OCR)
4. **AWS S3** - Document storage and retrieval
5. **AWS OpenSearch** - Document search and retrieval (RAG)
6. **AWS Transcribe** - Speech-to-text for voice chat
7. **AWS Polly** - Text-to-speech for voice responses

### Fallback Strategy

The system gracefully degrades if AWS services are unavailable:
- AWS Bedrock unavailable → Basic extraction with local models
- AWS Comprehend unavailable → spaCy NER
- AWS Textract unavailable → PyPDF2/pdfplumber
- AWS S3 unavailable → Local file storage
- AWS OpenSearch unavailable → Basic search
- AWS Transcribe/Polly unavailable → Text-only chat

### Configuration

AWS services are configured via environment variables:
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `AWS_REGION` - AWS region (default: us-east-1)
- `AWS_BEARER_TOKEN_BEDROCK` - Optional Bedrock bearer token
- `S3_BUCKET_NAME` - S3 bucket name
- `OPENSEARCH_ENDPOINT` - OpenSearch endpoint URL

---

## Key Calculations & Formulas

### Risk Score Calculation

```
Risk Score = 0.35 × Supply Chain Risk + 
             0.30 × Geographic Exposure + 
             0.20 × Sector Match Score + 
             0.15 × Measure Impact
```

### Revenue Impact Estimation

```
Revenue Impact % = (Risk Score × 0.01) + 
                   (Geographic Exposure / 100 × 0.02) + 
                   (Measure Impact / 100 × 0.01)
```

### Portfolio Expected Return

```
Expected Return = (Equities × 10%) + 
                  (Fixed Income × 4%) + 
                  (Alternatives × 8%) + 
                  (Cash × 2%)
```

### Sharpe Ratio

```
Sharpe Ratio = (Expected Return - Risk_Free_Rate) / Portfolio Risk
where Risk_Free_Rate = 2% (default)
```

---

## Machine Learning & NLP Models

### Models Used

1. **Sentence Transformers**
   - Model: `sentence-transformers/all-mpnet-base-v2`
   - Fallback: `all-MiniLM-L6-v2`
   - Purpose: Semantic similarity, embeddings

2. **spaCy NER**
   - Model: `en_core_web_sm`
   - Purpose: Named Entity Recognition (Organizations, Locations, Tickers)

3. **NLTK Sentiment Analyzer**
   - Model: VADER Sentiment Intensity Analyzer
   - Purpose: General sentiment analysis

4. **Financial Domain Models**
   - Model: `ProsusAI/finbert` (if available)
   - Purpose: Financial-specific sentiment

5. **Scikit-learn**
   - RandomForestClassifier: Exposure level classification
   - Ridge Regression: Component weight calibration

6. **AWS Bedrock Models**
   - Claude 3.5 Sonnet (default)
   - Claude 3 Opus
   - Claude 3 Haiku
   - Purpose: Advanced document analysis and generation

---

## Implementation Status

### ✅ Completed Backend

- ✅ 14 API routers with comprehensive endpoints
- ✅ 30+ services covering all core functionality
- ✅ Data models (Portfolio, CompanyRisk, PortfolioImpact, Scenario, etc.)
- ✅ Portfolio Service (equal-weight universe builder)
- ✅ Calibration Service (Ridge regression)
- ✅ Document Analyzer Service (consolidated analysis)
- ✅ Recommendations Service (hedge menu generation)
- ✅ NLP analysis cache system
- ✅ Market research service
- ✅ Stock graphs and relationship analysis
- ✅ AWS integration (all services)
- ✅ Voice chat capabilities (Transcribe + Polly)
- ✅ WebSocket support for real-time chat

### ✅ Completed Frontend

- ✅ 12 pages implemented
- ✅ API client with all methods
- ✅ Main routing structure
- ✅ Portfolio Risk Dashboard
- ✅ Document Analyzer
- ✅ Company Assessment
- ✅ Scenario Simulator
- ✅ Market Research page
- ✅ NLP Quant Strategy page
- ✅ Global portfolio pill component
- ✅ Provenance drawer component
- ✅ Source explorer side panel
- ✅ Portfolio context for state management
- ✅ Notification system
- ✅ Chat assistant (WebSocket + HTTP)
- ✅ Error handling

### 🔄 Enhancement Opportunities

- Real-time market data integration
- Historical backtesting engine
- Advanced risk models (VaR, CVaR)
- Multi-asset class optimization
- ESG scoring integration
- Real-time regulatory news monitoring
- Performance optimization for large portfolios
- Additional visualization types

---

## Performance Considerations

### Optimization Strategies

1. **Lazy Model Loading** - NLP models loaded on first use, cached for subsequent requests
2. **Document Chunking** - Large documents split into chunks for parallel processing
3. **Embedding Caching** - Sentence embeddings cached to reduce redundant calculations
4. **Batch Processing** - Portfolio calculations batched with parallel company impact calculations
5. **NLP Analysis Cache** - Pre-computed analyses cached by ticker
6. **Connection Pooling** - HTTP client connection pooling

### Scalability

- **Horizontal Scaling:** Stateless API design
- **Caching:** Model caching, embedding caching, NLP analysis cache
- **Async Processing:** FastAPI async/await throughout
- **Database:** Ready for PostgreSQL/MongoDB integration
- **Message Queue:** Can integrate Redis/RabbitMQ for background jobs

---

## Project Structure

```
intellirisk/
├── backend/
│   ├── app/
│   │   ├── models/              # Data models (types.py, entities.py, requests.py)
│   │   ├── routers/              # 14 API route handlers
│   │   │   ├── ai.py
│   │   │   ├── analytics.py
│   │   │   ├── company.py
│   │   │   ├── documents.py
│   │   │   ├── entities.py
│   │   │   ├── files.py
│   │   │   ├── market_research.py
│   │   │   ├── nlp_cache.py
│   │   │   ├── portfolio.py
│   │   │   ├── recommendations.py
│   │   │   ├── regulatory.py
│   │   │   ├── scenarios.py
│   │   │   ├── stock_graphs.py
│   │   │   └── stocks.py
│   │   └── services/             # 30+ business logic services
│   │       ├── aws_*.py          # AWS service integrations
│   │       ├── regulatory_analyzer.py
│   │       ├── impact_modeler.py
│   │       ├── portfolio_*.py
│   │       ├── nlp_*.py
│   │       └── ...
│   ├── main.py                   # FastAPI application entry point
│   ├── requirements.txt          # Python dependencies
│   ├── start.sh                  # Quick start script
│   └── env.template              # Environment variables template
├── frontend/
│   ├── src/
│   │   ├── api/                  # API clients (apiClient.js, base44Client.js)
│   │   ├── components/           # Reusable components
│   │   │   ├── ui/               # UI component library
│   │   │   ├── ChatAssistant.jsx
│   │   │   ├── Navigation.jsx
│   │   │   ├── PortfolioPill.jsx
│   │   │   └── ...
│   │   ├── contexts/             # React contexts
│   │   │   ├── PortfolioContext.jsx
│   │   │   └── AnalysisContext.jsx
│   │   ├── services/             # Frontend services
│   │   │   ├── cacheService.js
│   │   │   └── notificationService.js
│   │   ├── Pages/                # 12 page components
│   │   └── App.jsx               # Main app component
│   ├── package.json              # Node dependencies
│   └── index.html
├── data/                          # Data files and cache
├── fillings/                      # SEC filings data
├── jeu_de_donnees/               # Dataset files
├── terraform/                    # Infrastructure as code
│   ├── main.tf
│   ├── variables.tf
│   ├── providers.tf
│   └── deploy.sh
└── README.md                     # This file
```

---

## Future Enhancements

### Planned Features

- Real-time market data integration
- Historical backtesting engine
- Advanced risk models (VaR, CVaR)
- Multi-asset class optimization
- ESG scoring integration
- Real-time regulatory news monitoring
- User authentication and multi-tenant support
- Export/import functionality
- Report generation (PDF/Excel)

### Model Improvements

- Fine-tune models on financial domain data
- Implement reinforcement learning for portfolio optimization
- Add transformer-based impact prediction
- Expand to multi-language support
- Custom model training pipeline

### Infrastructure

- Docker containerization
- Kubernetes deployment
- CI/CD pipeline
- Monitoring and logging (CloudWatch, DataDog)
- Database integration (PostgreSQL/MongoDB)
- Redis caching layer

---

## License

[Add your license information here]

---

## Contributing

[Add contribution guidelines here]

---

**Document Version:** 2.0  
**Last Updated:** 2024
