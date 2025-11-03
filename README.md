# PolyFinance 2025

A comprehensive financial analytics platform that combines regulatory analysis, portfolio optimization, risk assessment, and AI-powered insights. The platform enables financial institutions to assess regulatory impacts on portfolios, optimize allocations with regulatory constraints, and generate quantitative trading strategies using NLP analysis of SEC filings.

## Table of Contents

- [Executive Summary](#executive-summary)
- [Architecture Overview](#architecture-overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Core Modules](#core-modules)
- [API Endpoints](#api-endpoints)
- [Frontend Pages](#frontend-pages)
- [Implementation Status](#implementation-status)

---

## Executive Summary

PolyFinance 2025 is an end-to-end financial analytics platform that:

- **Analyzes Regulatory Documents** - Extracts entities, measures, and provisions from multi-format documents (PDF, HTML, XML, DOCX)
- **Assesses Portfolio Impact** - Calculates company-level risk scores and portfolio-level impacts using ML-based models
- **Optimizes Portfolios** - Provides ML-based portfolio optimization with regulatory constraints
- **Generates Trading Signals** - Uses NLP analysis of 10-K/10Q filings to generate quantitative trading strategies
- **Simulates Scenarios** - Runs multi-scenario simulations with Monte Carlo analysis

---

## Architecture Overview

### System Architecture

**Backend (Python/FastAPI)**
- RESTful API with FastAPI framework
- Microservices architecture with modular routers
- AWS integration (Bedrock, Comprehend, Textract, S3, OpenSearch)
- ML/NLP models (spaCy, Transformers, scikit-learn)
- Document parsing (PDF, HTML, XML, DOCX)

**Frontend (React/Vite)**
- React 18 with React Router
- TailwindCSS for styling
- Recharts for data visualization
- Lucide React for icons
- Component-based architecture

### Technology Stack

**Backend Dependencies:**
- FastAPI 0.104.1 - Web framework
- NumPy, scikit-learn - ML/Analytics
- spaCy, NLTK, Transformers - NLP
- sentence-transformers - Embeddings
- boto3 - AWS SDK
- yfinance - Stock data
- BeautifulSoup4, PyPDF2, pdfplumber - Document parsing

**Frontend Dependencies:**
- React 18.2.0
- React Router 6.20.0
- Recharts 2.10.3 - Charts
- TailwindCSS 3.3.6
- @tanstack/react-query - Data fetching
- Lucide React - Icons

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

4. Create necessary directories:
```bash
mkdir -p uploads
```

5. (Optional) Set up AWS credentials in `.env`:
```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
```

6. Start the backend server:
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

**API Endpoint:** `POST /api/regulatory/analyze-document`

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

**API Endpoint:** `POST /api/regulatory/company-impact`

### 3. Portfolio Optimization Module

**Purpose:** Optimize portfolio allocations with regulatory constraints

**Key Service:** `PortfolioOptimizer` (`backend/app/services/portfolio_optimizer.py`)

**Features:**
- ML-based optimization (Sharpe Ratio, Return Maximization, Risk Minimization, ESG)
- Regulatory constraint integration
- Efficient frontier generation
- Before/after comparison metrics

**Optimization Objectives:**
- **Sharpe Ratio:** Equities 52%, Fixed Income 25%, Alternatives 18%, Cash 5%
- **Return Maximization:** Equities 60%, Fixed Income 20%, Alternatives 15%, Cash 5%
- **Risk Minimization:** Equities 35%, Fixed Income 40%, Alternatives 15%, Cash 10%
- **ESG:** Equities 48%, Fixed Income 30%, Alternatives 17%, Cash 5%

**API Endpoint:** `POST /api/portfolio/optimize`

### 4. Scenario Simulation Module

**Purpose:** Simulate multiple regulatory scenarios and their portfolio impacts

**Key Service:** `ScenarioSimulator` (`backend/app/services/scenario_simulator.py`)

**Features:**
- Multi-scenario simulation with severity multipliers
- Time-weighted impact calculations
- Monte Carlo analysis
- Risk rating classification (Critical, High, Medium, Low, Minimal)

**API Endpoint:** `POST /api/scenarios/run`

### 5. NLP Quantitative Strategy Module

**Purpose:** Generate trading signals from 10K/10Q filings using NLP

**Key Service:** `NLPQuantStrategy` (`backend/app/services/nlp_quant_strategy.py`)

**Features:**
- Sentiment analysis (NLTK VADER, FinBERT)
- Key metrics extraction (forward-looking statements, risk factors)
- Change detection vs previous filings
- Trading signal generation (Bullish/Bearish/Neutral)

**API Endpoint:** `POST /api/analytics/nlp-quant-strategy`

### 6. Portfolio Risk & Document Analysis

**Key Services:**
- `PortfolioService` - Equal-weight universe builder from filings
- `DocumentAnalyzerService` - Consolidated document analysis
- `CalibrationService` - Ridge regression for component weights
- `RecommendationsService` - Hedge menu generation

**API Endpoints:**
- `POST /api/portfolio/init-equal-weight` - Build equal-weight portfolio
- `POST /api/documents/analyze` - Analyze documents with portfolio impact
- `GET /api/company/sentiment` - Company sentiment assessment
- `POST /api/recommendations/compute` - Hedge and diversification recommendations

---

## API Endpoints

### Regulatory Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/regulatory/analyze-document` | POST | Analyze regulatory document |
| `/api/regulatory/company-impact` | POST | Assess company impact |
| `/api/regulatory/analyze-sp500-impact` | POST | Analyze S&P 500 portfolio impact |
| `/api/regulatory/simulate-scenarios` | POST | Simulate regulatory scenarios |

### Portfolio Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/portfolio/optimize` | POST | Optimize portfolio allocation |
| `/api/portfolio/init-equal-weight` | POST | Build equal-weight portfolio |
| `/api/portfolio/optimize-regulatory` | POST | Optimize with regulatory constraints |

### Document & Analysis Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/documents/analyze` | POST | Consolidated document analyzer |
| `/api/scenarios/run` | POST | Scenario simulation |
| `/api/recommendations/compute` | POST | Hedge and diversification recommendations |
| `/api/company/sentiment` | GET | Company sentiment assessment |

### Analytics Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analytics/nlp-quant-strategy` | POST | Generate NLP trading signals |
| `/api/analytics/tenk-analyze` | POST | Analyze 10-K filing |
| `/api/analytics/sentiment` | GET | Get sentiment analysis |
| `/api/analytics/trends` | GET | Get trend analysis |

### AI Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ai/generate-summary` | POST | Generate AI summary |
| `/api/integrations/Core/InvokeLLM` | POST | Invoke LLM with custom prompt |

### Market Data Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/stocks/stock/{ticker}` | GET | Get stock data |
| `/api/equities/index/{region}` | GET | Get index overview |
| `/api/fixed-income/yield-curve` | GET | Get yield curve |
| `/api/options/price` | POST | Calculate option price |
| `/api/options/greeks` | POST | Calculate option Greeks |

---

## Frontend Pages

### Main Pages

1. **Document Analyzer** (`/document-analyzer`) - Upload and analyze regulatory documents
2. **Company Assessment** (`/company-assessment`) - Sentiment analysis vs peers
3. **Portfolio Risk Dashboard** (`/portfolio-risk-dashboard`) - Portfolio-first risk analysis
4. **Scenario Simulator** (`/scenario-simulator`) - Multi-scenario simulation with P5/P50/P95 charts

### Market Data Pages

- **Equities** - Equity market analysis
- **Fixed Income** - Yield curves, credit spreads
- **Options** - Options pricing, Greeks, strategies
- **FX** - Foreign exchange analysis
- **Commodities** - Commodity market data

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

---

## AWS Integration

### AWS Services Used

1. **AWS Bedrock** - Advanced document analysis
2. **AWS Comprehend** - Entity extraction, key phrase extraction
3. **AWS Textract** - Document text extraction
4. **AWS S3** - Document storage
5. **AWS OpenSearch** - Document search and retrieval (RAG)

### Fallback Strategy

The system gracefully degrades if AWS services are unavailable:
- AWS Bedrock unavailable → Basic extraction
- AWS Comprehend unavailable → spaCy NER
- AWS Textract unavailable → PyPDF2/pdfplumber

---

## Implementation Status

### ✅ Completed Backend

- ✅ New data models (Portfolio, CompanyRisk, PortfolioImpact, Scenario, etc.)
- ✅ Portfolio Service (equal-weight universe builder)
- ✅ Calibration Service (Ridge regression)
- ✅ Document Analyzer Service (consolidated analysis)
- ✅ Recommendations Service (hedge menu generation)
- ✅ All API endpoints functional
- ✅ NLP analysis cache system

### ✅ Completed Frontend

- ✅ API client with all methods
- ✅ Main routing structure
- ✅ Market data pages (Equities, Fixed Income, Options, FX, Commodities)
- ✅ Portfolio Risk Dashboard

### 🔄 In Progress / Remaining Frontend Work

- ⏳ Update Document Analyzer page to use new endpoint
- ⏳ Create/Update Company Assessment page
- ⏳ Update Scenario Simulator page
- ⏳ Create global portfolio pill component
- ⏳ Implement provenance drawer
- ⏳ Create source explorer side panel
- ⏳ Implement portfolio context for state management

---

## Performance Considerations

### Optimization Strategies

1. **Lazy Model Loading** - NLP models loaded on first use, cached for subsequent requests
2. **Document Chunking** - Large documents split into chunks for parallel processing
3. **Embedding Caching** - Sentence embeddings cached to reduce redundant calculations
4. **Batch Processing** - Portfolio calculations batched with parallel company impact calculations

### Scalability

- **Horizontal Scaling:** Stateless API design
- **Caching:** Model caching, embedding caching
- **Async Processing:** FastAPI async/await
- **Database:** Ready for PostgreSQL/MongoDB integration

---

## Project Structure

```
polyfinance2025/
├── backend/
│   ├── app/
│   │   ├── models/          # Data models (types.py, entities.py, requests.py)
│   │   ├── routers/          # API route handlers
│   │   ├── services/         # Business logic services
│   │   └── ...
│   ├── main.py              # FastAPI application entry point
│   ├── requirements.txt     # Python dependencies
│   └── start.sh             # Quick start script
├── frontend/
│   ├── src/
│   │   ├── api/             # API client
│   │   ├── components/      # Reusable components
│   │   ├── Pages/           # Page components
│   │   └── ...
│   ├── package.json         # Node dependencies
│   └── ...
├── data/                     # Data files and cache
├── terraform/               # Infrastructure as code
└── README.md                # This file
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

### Model Improvements

- Fine-tune models on financial domain data
- Implement reinforcement learning for portfolio optimization
- Add transformer-based impact prediction
- Expand to multi-language support

---

## License

[Add your license information here]

---

## Contributing

[Add contribution guidelines here]

---

**Document Version:** 1.0  
**Last Updated:** 2024

