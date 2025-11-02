// Base44 API Client
// Updated to use FastAPI backend

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Generic fetch wrapper
 * Now properly throws errors so they can be caught and displayed
 */
async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  console.log(`[API] Requesting: ${url}`, config); // Debug log
  try {
    const response = await fetch(url, config);
    console.log(`[API] Response status: ${response.status} for ${url}`); // Debug log
    
    if (!response.ok) {
      let errorDetail;
      try {
        const errorText = await response.text();
        try {
          errorDetail = JSON.parse(errorText);
        } catch {
          errorDetail = errorText || `HTTP ${response.status}`;
        }
      } catch {
        errorDetail = `HTTP ${response.status}`;
      }
      
      const error = new Error(`HTTP error! status: ${response.status}`);
      error.response = { status: response.status, data: errorDetail };
      error.status = response.status;
      console.error(`[API] Error response body:`, errorDetail); // Debug log
      throw error;
    }
    
    return await response.json();
  } catch (error) {
    // If it's already our formatted error, re-throw it
    if (error.response || error.status) {
      throw error;
    }
    
    // Network or other errors
    console.error(`API Error at ${endpoint}:`, error);
    const networkError = new Error(`Network error: ${error.message}`);
    networkError.originalError = error;
    networkError.isNetworkError = true;
    throw networkError;
  }
}

const base44 = {
  entities: {
    MarketSnapshot: {
      list: async (sort, limit) => {
        const params = new URLSearchParams();
        if (sort) params.append('sort', sort);
        if (limit) params.append('limit', limit);
        const query = params.toString() ? `?${params.toString()}` : '';
        return fetchAPI(`/entities/MarketSnapshot${query}`);
      },
      filter: async (filters) => {
        const params = new URLSearchParams();
        if (filters.region) params.append('region', filters.region);
        if (filters.sort) params.append('sort', filters.sort);
        if (filters.limit) params.append('limit', filters.limit);
        const query = params.toString() ? `?${params.toString()}` : '';
        return fetchAPI(`/entities/MarketSnapshot${query}`);
      },
    },
    RiskMetrics: {
      list: async (sort, limit) => {
        const params = new URLSearchParams();
        if (sort) params.append('sort', sort);
        if (limit) params.append('limit', limit);
        const query = params.toString() ? `?${params.toString()}` : '';
        return fetchAPI(`/entities/RiskMetrics${query}`);
      },
      filter: async (filters) => {
        const params = new URLSearchParams();
        if (filters.region) params.append('region', filters.region);
        if (filters.sort) params.append('sort', filters.sort);
        if (filters.limit) params.append('limit', filters.limit);
        const query = params.toString() ? `?${params.toString()}` : '';
        return fetchAPI(`/entities/RiskMetrics${query}`);
      },
    },
    NewsItem: {
      list: async (sort, limit) => {
        const params = new URLSearchParams();
        if (sort) params.append('sort', sort || '-publishedDate');
        if (limit) params.append('limit', limit);
        const query = params.toString() ? `?${params.toString()}` : '';
        return fetchAPI(`/entities/NewsItem${query}`);
      },
    },
    Position: {
      list: async (sort, limit) => {
        const params = new URLSearchParams();
        if (sort) params.append('sort', sort);
        if (limit) params.append('limit', limit);
        const query = params.toString() ? `?${params.toString()}` : '';
        return fetchAPI(`/entities/Position${query}`);
      },
    },
    Order: {
      list: async (sort, limit) => {
        const params = new URLSearchParams();
        if (sort) params.append('sort', sort);
        if (limit) params.append('limit', limit);
        const query = params.toString() ? `?${params.toString()}` : '';
        return fetchAPI(`/entities/Order${query}`);
      },
    },
    EventItem: {
      list: async (sort, limit) => {
        const params = new URLSearchParams();
        if (sort) params.append('sort', sort);
        if (limit) params.append('limit', limit);
        const query = params.toString() ? `?${params.toString()}` : '';
        return fetchAPI(`/entities/EventItem${query}`);
      },
    },
  },
  integrations: {
    Core: {
      InvokeLLM: async ({ prompt, add_context_from_internet = false, response_json_schema = null }) => {
        return fetchAPI('/ai/invoke-llm', {
          method: 'POST',
          body: JSON.stringify({ prompt, add_context_from_internet, response_json_schema }),
        });
      },
      UploadFile: async ({ file }) => {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch(`${API_BASE_URL}/files/upload`, {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
      },
    },
  },
  // Additional API methods for other features
  portfolio: {
    optimize: async (params) => {
      return fetchAPI('/portfolio/optimize', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    },
    getMetrics: async () => {
      return fetchAPI('/portfolio/metrics');
    },
  },
  regulatory: {
    analyzeDocument: async (params) => {
      return fetchAPI('/regulatory/analyze-document', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    },
    assessCompanyImpact: async (params) => {
      return fetchAPI('/regulatory/company-impact', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    },
    getSP500Portfolio: async () => {
      return fetchAPI('/regulatory/sp500-portfolio', {
        method: 'GET',
      });
    },
    analyzeSP500Impact: async (params) => {
      return fetchAPI('/regulatory/analyze-sp500-impact', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    },
  },
  risk: {
    stressTest: async (params) => {
      return fetchAPI('/risk/stress-test', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    },
    calculateVaR: async (confidenceLevel = 0.95, holdingPeriod = 1) => {
      const params = new URLSearchParams();
      params.append('confidence_level', confidenceLevel);
      params.append('holding_period', holdingPeriod);
      return fetchAPI(`/risk/var?${params.toString()}`);
    },
    getCorrelation: async () => {
      return fetchAPI('/risk/correlation');
    },
  },
  options: {
    calculatePrice: async (params) => {
      return fetchAPI('/options/price', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    },
    calculateGreeks: async (params) => {
      return fetchAPI('/options/greeks', {
        method: 'POST',
        body: JSON.stringify(params),
      });
    },
    getVolSurface: async (symbol = 'SPX', expirationDates = null) => {
      const params = new URLSearchParams();
      params.append('symbol', symbol);
      if (expirationDates) params.append('expiration_dates', expirationDates);
      return fetchAPI(`/options/vol-surface?${params.toString()}`);
    },
    getStrategies: async () => {
      return fetchAPI('/options/strategies');
    },
  },
  fixedIncome: {
    getYieldCurve: async (region = 'US', date = null) => {
      const params = new URLSearchParams();
      params.append('region', region);
      if (date) params.append('date', date);
      return fetchAPI(`/fixed-income/yield-curve?${params.toString()}`);
    },
    calculateDuration: async (params) => {
      const params_str = new URLSearchParams(params).toString();
      return fetchAPI(`/fixed-income/duration?${params_str}`);
    },
    getCreditSpreads: async (region = 'US', rating = null) => {
      const params = new URLSearchParams();
      params.append('region', region);
      if (rating) params.append('rating', rating);
      return fetchAPI(`/fixed-income/credit-spreads?${params.toString()}`);
    },
  },
  equities: {
    getIndexOverview: async (region) => {
      return fetchAPI(`/equities/index/${region}`);
    },
    getSectorAnalysis: async (region = 'US') => {
      const params = new URLSearchParams();
      params.append('region', region);
      return fetchAPI(`/equities/sectors?${params.toString()}`);
    },
    getTechnicalIndicators: async (symbol) => {
      return fetchAPI(`/equities/technical/${symbol}`);
    },
  },
  analytics: {
    getSentiment: async (symbol = null, region = null) => {
      const params = new URLSearchParams();
      if (symbol) params.append('symbol', symbol);
      if (region) params.append('region', region);
      const query = params.toString() ? `?${params.toString()}` : '';
      return fetchAPI(`/analytics/sentiment${query}`);
    },
    getTrends: async (category = null, timePeriod = '7d') => {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      params.append('time_period', timePeriod);
      return fetchAPI(`/analytics/trends?${params.toString()}`);
    },
    analyzeTenK: async (ticker) => {
      return fetchAPI('/analytics/tenk-analyze', {
        method: 'POST',
        body: JSON.stringify({ ticker }),
      });
    },
    nlpQuantStrategy: async (ticker, documentText, previousFiling, benchmarkTickers) => {
      return fetchAPI('/analytics/nlp-quant-strategy', {
        method: 'POST',
        body: JSON.stringify({
          ticker,
          documentText,
          previousFiling,
          benchmarkTickers: benchmarkTickers || []
        }),
      });
    },
  },
  ai: {
    generateSummary: async (data, type = 'market') => {
      return fetchAPI('/ai/generate-summary', {
        method: 'POST',
        body: JSON.stringify({ data, type }),
      });
    },
  },
};

export { base44 };