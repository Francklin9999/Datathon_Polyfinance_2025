import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/api/apiClient';
import StorageService from '@/services/storageService';

const PortfolioContext = createContext(null);

export function PortfolioProvider({ children }) {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize portfolio on mount - try to load from storage first
  useEffect(() => {
    const storedPortfolio = StorageService.getPortfolio();
    if (storedPortfolio) {
      setPortfolio(storedPortfolio);
      // Still refresh in background
      initializePortfolio(18, false);
    } else {
      initializePortfolio();
    }
  }, []);

  // Save portfolio to storage whenever it changes
  useEffect(() => {
    if (portfolio) {
      StorageService.savePortfolio(portfolio);
    }
  }, [portfolio]);

  const initializePortfolio = async (universeCutoffMonths = 18, showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    setError(null);
    try {
      const result = await api.portfolio.initEqualWeight(universeCutoffMonths);
      if (result.portfolio) {
        setPortfolio(result.portfolio);
        StorageService.savePortfolio(result.portfolio);
      }
    } catch (err) {
      console.error('Error initializing portfolio:', err);
      setError(err.message || 'Failed to initialize portfolio');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const updatePortfolio = (updatedPortfolio) => {
    setPortfolio(updatedPortfolio);
    StorageService.savePortfolio(updatedPortfolio);
  };

  const updateHoldings = (newHoldings) => {
    if (!portfolio) return;
    
    const updatedPortfolio = {
      ...portfolio,
      holdings: newHoldings
    };
    updatePortfolio(updatedPortfolio);
  };

  const getPortfolioStats = () => {
    if (!portfolio) return null;
    
    const holdings = portfolio.holdings || {};
    const numHoldings = Object.keys(holdings).length;
    const totalWeight = Object.values(holdings).reduce((sum, w) => sum + w, 0);
    const equalWeight = numHoldings > 0 ? 1.0 / numHoldings : 0;
    
    return {
      numHoldings,
      totalWeight,
      equalWeight,
      tickers: Object.keys(holdings).sort()
    };
  };

  const value = {
    portfolio,
    loading,
    error,
    initializePortfolio,
    updatePortfolio,
    updateHoldings,
    getPortfolioStats,
    isEqualWeight: portfolio?.meta?.source === 'equal_weight_universe'
  };

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
}

