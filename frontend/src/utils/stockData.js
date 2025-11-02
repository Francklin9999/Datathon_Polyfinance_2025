/**
 * Utility service to fetch stock data from jeu_de_donnees folder
 * This data is automatically included in LLM prompts when analyzing stocks
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Extract stock tickers from a query string
 * Looks for common ticker patterns (e.g., "AAPL", "$AAPL", "Apple (AAPL)")
 * @param {string} query - Query string to search for tickers
 * @returns {string[]} Array of ticker symbols found
 */
export function extractTickersFromQuery(query) {
  if (!query) return [];
  
  // Common ticker patterns:
  // - Standalone tickers (AAPL, MSFT, etc.) - 2-5 uppercase letters
  // - Tickers with $ prefix ($AAPL)
  // - Tickers in parentheses (Apple (AAPL))
  const tickerPattern = /\$?([A-Z]{2,5})\b|\(([A-Z]{2,5})\)/g;
  const tickers = new Set();
  
  let match;
  while ((match = tickerPattern.exec(query)) !== null) {
    const ticker = match[1] || match[2];
    if (ticker && ticker.length >= 2 && ticker.length <= 5) {
      tickers.add(ticker.toUpperCase());
    }
  }
  
  return Array.from(tickers);
}

/**
 * Fetch formatted stock data from backend for use in LLM prompts
 * @param {string} ticker - Stock ticker symbol
 * @returns {Promise<string|null>} Formatted stock data string or null if not found
 */
export async function getStockDataForPrompt(ticker) {
  if (!ticker) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/stocks/stock/${ticker.toUpperCase()}/formatted`);
    
    if (response.status === 404) {
      // Stock not found in dataset - this is okay, we'll just not include the data
      return null;
    }

    if (!response.ok) {
      console.warn(`Failed to fetch stock data for ${ticker}:`, response.statusText);
      return null;
    }

    const data = await response.json();
    return data.formatted_data || null;
  } catch (error) {
    // Silently fail - if we can't fetch stock data, we'll just proceed without it
    console.warn(`Error fetching stock data for ${ticker}:`, error);
    return null;
  }
}

/**
 * Check if a stock exists in the dataset
 * @param {string} ticker - Stock ticker symbol
 * @returns {Promise<boolean>} True if stock exists in dataset
 */
export async function stockExistsInDataset(ticker) {
  if (!ticker) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/stocks/stock/${ticker.toUpperCase()}`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Get raw stock data from dataset
 * @param {string} ticker - Stock ticker symbol
 * @returns {Promise<object|null>} Stock data object or null if not found
 */
export async function getStockData(ticker) {
  if (!ticker) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/stocks/stock/${ticker.toUpperCase()}`);
    
    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.data || null;
  } catch (error) {
    console.warn(`Error fetching stock data for ${ticker}:`, error);
    return null;
  }
}

/**
 * Fetch stock data for all tickers mentioned in a query
 * @param {string} query - Query string that may contain tickers
 * @returns {Promise<string>} Combined formatted stock data for all found tickers
 */
export async function getStockDataForQuery(query) {
  const tickers = extractTickersFromQuery(query);
  
  if (tickers.length === 0) {
    return null;
  }
  
  const stockDataPromises = tickers.map(ticker => getStockDataForPrompt(ticker));
  const stockDataResults = await Promise.all(stockDataPromises);
  
  // Combine all non-null results
  const combinedData = stockDataResults
    .filter(data => data !== null)
    .join('\n\n---\n\n');
  
  return combinedData || null;
}

/**
 * Get list of all available stocks from jeu_de_donnees
 * @returns {Promise<Array>} Array of stock objects with ticker and company_name
 */
export async function getAllAvailableStocks() {
  try {
    const response = await fetch(`${API_BASE_URL}/stocks/list`);
    
    if (!response.ok) {
      console.warn('Failed to fetch stock list:', response.statusText);
      return [];
    }

    const data = await response.json();
    return data.stocks || [];
  } catch (error) {
    console.warn('Error fetching stock list:', error);
    return [];
  }
}

