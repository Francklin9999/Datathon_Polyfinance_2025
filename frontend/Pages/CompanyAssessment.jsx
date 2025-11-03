import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { api } from '@/api/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Building2, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  FileText,
  Twitter,
  MessageCircle,
  Scale,
  BarChart3,
  Loader2,
  Info,
  Plus,
  X,
  Search
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import PortfolioPill from '@/components/PortfolioPill';
import SourceExplorer from '@/components/SourceExplorer';
import { getAllAvailableStocks } from '@/utils/stockData';

export default function CompanyAssessment() {
  const { portfolio, getPortfolioStats } = usePortfolio();
  const [sentimentData, setSentimentData] = useState({});
  const [loading, setLoading] = useState({});
  const [selectedTicker, setSelectedTicker] = useState(null);
  const [showSourceExplorer, setShowSourceExplorer] = useState(false);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [availableStocks, setAvailableStocks] = useState([]);
  const [searchTicker, setSearchTicker] = useState('');
  const [isLoadingStocks, setIsLoadingStocks] = useState(false);

  const stats = getPortfolioStats();
  const allPortfolioTickers = stats?.tickers || [];

  // Initialize with 5 companies from portfolio on mount
  useEffect(() => {
    const initializeCompanies = async () => {
      // Load available stocks for search
      setIsLoadingStocks(true);
      let stocks = [];
      try {
        stocks = await getAllAvailableStocks();
        setAvailableStocks(stocks);
      } catch (error) {
        console.error('Error fetching stocks:', error);
      } finally {
        setIsLoadingStocks(false);
      }

      // Initialize with first 5 portfolio tickers (or first 5 available stocks if no portfolio)
      if (allPortfolioTickers.length > 0) {
        const initialTickers = allPortfolioTickers.slice(0, 5).map(ticker => ({
          ticker: ticker.toUpperCase(),
          company_name: stocks.find(s => s.ticker === ticker.toUpperCase())?.company_name || ticker
        }));
        setSelectedCompanies(initialTickers);
      } else if (stocks.length > 0) {
        const initialTickers = stocks.slice(0, 5).map(stock => ({
          ticker: stock.ticker,
          company_name: stock.company_name || stock.ticker
        }));
        setSelectedCompanies(initialTickers);
      }
    };
    initializeCompanies();
  }, []);

  // Memoize ticker string for dependency tracking
  const tickerString = useMemo(() => 
    selectedCompanies.map(c => c.ticker).sort().join(','), 
    [selectedCompanies]
  );

  // Load sentiment data when selected companies change
  useEffect(() => {
    if (selectedCompanies.length > 0) {
      loadSentimentData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickerString, selectedCompanies.length]);

  const loadSentimentData = useCallback(async () => {
    const selectedTickers = selectedCompanies.map(c => c.ticker);
    
    // Set all companies to loading state
    const initialLoadingStates = {};
    selectedCompanies.forEach(company => {
      initialLoadingStates[company.ticker] = true;
    });
    setLoading(initialLoadingStates);

    // Run all requests in parallel (no sequential delays)
    const promises = selectedCompanies.map(async (company, index) => {
      const ticker = company.ticker;
      
      try {
        // Only include Reddit API calls for the first 5 companies to reduce API requests
        // Reddit makes 5 API calls per ticker (one per subreddit), so limiting to first 5 
        // prevents excessive API usage. Reddit results are cached in backend.
        const includeReddit = index < 5;
        
        // Pass only selected tickers for peer comparison
        const result = await api.company.getSentiment(ticker, selectedTickers, includeReddit);
        return { ticker, result, error: null };
      } catch (error) {
        console.error(`Error loading sentiment for ${ticker}:`, error);
        return {
          ticker,
          result: {
            ticker,
            sentiment_risk: { score: 50.0 },
            sources: {},
            peer_comparison: { z_score: 0, percentile: 50 }
          },
          error
        };
      }
    });

    // Wait for all requests to complete in parallel
    const results = await Promise.all(promises);

    // Build data object and update loading states
    const data = {};
    const finalLoadingStates = { ...initialLoadingStates };
    
    results.forEach(({ ticker, result }) => {
      data[ticker] = result;
      finalLoadingStates[ticker] = false;
    });

    setSentimentData(data);
    setLoading(finalLoadingStates);
  }, [selectedCompanies]);

  const handleAddCompany = () => {
    const ticker = searchTicker.trim().toUpperCase();
    if (!ticker) return;

    // Check if already added
    if (selectedCompanies.find(c => c.ticker === ticker)) {
      setSearchTicker('');
      return;
    }

    // Find company info from available stocks
    const stock = availableStocks.find(s => s.ticker === ticker);
    const newCompany = {
      ticker,
      company_name: stock?.company_name || ticker
    };

    setSelectedCompanies([...selectedCompanies, newCompany]);
    setSearchTicker('');
  };

  const handleRemoveCompany = (ticker) => {
    setSelectedCompanies(selectedCompanies.filter(c => c.ticker !== ticker));
    // Remove from sentiment data
    setSentimentData(prev => {
      const updated = { ...prev };
      delete updated[ticker];
      return updated;
    });
  };

  const getSentimentColor = (score) => {
    if (score > 70) return 'text-red-400';
    if (score > 50) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getSentimentBadge = (score) => {
    if (score > 70) return 'High Risk';
    if (score > 50) return 'Medium Risk';
    return 'Low Risk';
  };

  // Prepare data for peer comparison chart (only selected companies)
  const chartData = Object.values(sentimentData)
    .filter(item => selectedCompanies.find(c => c.ticker === item.ticker))
    .map(item => ({
      ticker: item.ticker,
      score: item.sentiment_risk?.score || 50,
      filing: item.sources?.filing_sentiment || 50,
      social: item.sources?.social_sentiment || 50,
      lawsuit: item.sources?.lawsuit_signal || 0,
      controversy: item.sources?.controversy_score || 0,
      zScore: item.peer_comparison?.z_score || 0,
      percentile: item.peer_comparison?.percentile || 50
    }))
    .sort((a, b) => b.score - a.score);
  const avgScore = chartData.length > 0 
    ? chartData.reduce((sum, item) => sum + item.score, 0) / chartData.length 
    : 50;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Building2 className="w-8 h-8 text-blue-400" />
                Company Assessment
              </h1>
              <p className="text-gray-400 mt-1">
                Compare selected companies by sentiment risk vs peers
              </p>
            </div>
            <div className="flex items-center gap-4">
              <PortfolioPill />
              <Link to="/">
                <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>

        {/* Company Selection */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Selected Companies ({selectedCompanies.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Add Company Input */}
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Enter ticker symbol (e.g., AAPL, MSFT)"
                    value={searchTicker}
                    onChange={(e) => setSearchTicker(e.target.value.toUpperCase())}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddCompany();
                      }
                    }}
                    className="pl-10 bg-gray-900 border-gray-700 text-white placeholder-gray-500"
                  />
                </div>
                <Button
                  onClick={handleAddCompany}
                  disabled={!searchTicker.trim() || isLoadingStocks}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>

              {/* Selected Companies List */}
              <div className="flex flex-wrap gap-2">
                {selectedCompanies.map((company) => (
                  <Badge
                    key={company.ticker}
                    variant="outline"
                    className="border-gray-600 text-gray-300 px-3 py-2 flex items-center gap-2"
                  >
                    <span className="font-mono font-semibold">{company.ticker}</span>
                    <button
                      onClick={() => handleRemoveCompany(company.ticker)}
                      className="hover:text-white transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              {selectedCompanies.length === 0 && (
                <p className="text-gray-400 text-sm">
                  No companies selected. Add companies to start analysis.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-white">{selectedCompanies.length}</div>
              <div className="text-sm text-gray-400">Companies Analyzed</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="pt-6">
              <div className={`text-2xl font-bold ${getSentimentColor(avgScore)}`}>
                {avgScore.toFixed(1)}
              </div>
              <div className="text-sm text-gray-400">Avg Sentiment Risk</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-400">
                {chartData.filter(item => item.score > 70).length}
              </div>
              <div className="text-sm text-gray-400">High Risk Companies</div>
            </CardContent>
          </Card>
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-400">
                {chartData.filter(item => item.score < 50).length}
              </div>
              <div className="text-sm text-gray-400">Low Risk Companies</div>
            </CardContent>
          </Card>
        </div>

        {/* Peer Comparison Chart */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Sentiment Risk vs Peers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(loading).some(key => loading[key]) && chartData.length === 0 ? (
              <div className="flex items-center justify-center h-[400px]">
                <Loader2 className="w-8 h-8 text-blue-400 animate-spin mr-3" />
                <span className="text-gray-400">Loading chart data...</span>
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex items-center justify-center h-[400px] text-gray-400">
                <Info className="w-6 h-6 mr-2" />
                <span>No data available. Add companies to see the chart.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="ticker" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '#374151', color: '#F9FAFB' }}
                  labelStyle={{ color: '#F9FAFB' }}
                />
                <Legend />
                <Bar 
                  dataKey="score" 
                  fill="#EF4444" 
                  name="Total Sentiment Risk"
                  onClick={(data) => {
                    setSelectedTicker(data.ticker);
                    setShowSourceExplorer(true);
                  }}
                  className="cursor-pointer"
                />
                <Bar 
                  dataKey="filing" 
                  fill="#3B82F6" 
                  name="Filing Sentiment"
                />
                <Bar 
                  dataKey="social" 
                  fill="#8B5CF6" 
                  name="Social Sentiment"
                />
                  <Bar 
                  dataKey="lawsuit" 
                  fill="#F59E0B" 
                  name="Lawsuit Signal"
                  maxBarSize={50}
                />
                <Bar 
                  dataKey="controversy" 
                  fill="#EC4899" 
                  name="Controversy"
                />
              </BarChart>
            </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Company List */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Detailed Sentiment Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {chartData.length === 0 && Object.keys(loading).some(key => loading[key]) && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-blue-400 animate-spin mr-3" />
                  <span className="text-gray-400">Loading sentiment data...</span>
                </div>
              )}
              {chartData.map((item, index) => {
                const isLoading = loading[item.ticker];
                return (
                  <div
                    key={item.ticker}
                    className={`flex items-center justify-between p-4 bg-gray-900 rounded border border-gray-700 ${isLoading ? 'opacity-50' : 'hover:border-gray-600 cursor-pointer'}`}
                    onClick={() => {
                      if (!isLoading) {
                        setSelectedTicker(item.ticker);
                        setShowSourceExplorer(true);
                      }
                    }}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <Badge variant="outline" className="border-gray-600 text-gray-300 w-8 text-center">
                        {index + 1}
                      </Badge>
                      <span className="text-white font-mono font-semibold text-lg w-20 flex items-center gap-2">
                        {item.ticker}
                        {isLoading && (
                          <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                        )}
                      </span>
                    <Badge 
                      variant="outline" 
                      className={item.score > 70 ? 'border-red-600 text-red-300' : 
                                 item.score > 50 ? 'border-yellow-600 text-yellow-300' : 
                                 'border-green-600 text-green-300'}
                    >
                      {item.score.toFixed(1)} - {getSentimentBadge(item.score)}
                    </Badge>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        <span>{item.filing.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Twitter className="w-3 h-3" />
                        <span>{item.social.toFixed(1)}</span>
                      </div>
                      {item.lawsuit > 0 && (
                        <div className="flex items-center gap-1">
                          <Scale className="w-3 h-3 text-red-400" />
                          <span>{item.lawsuit.toFixed(0)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-blue-600 text-blue-300">
                        Z-score: {item.zScore.toFixed(2)}
                      </Badge>
                      <Badge variant="outline" className="border-purple-600 text-purple-300">
                        {item.percentile.toFixed(0)}th percentile
                      </Badge>
                    </div>
                  </div>
                      <Info className="w-4 h-4 text-gray-400" />
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        {/* Source Information */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Info className="w-5 h-5" />
              Data Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>SEC Filings (section-level)</span>
              </div>
              <div className="flex items-center gap-2">
                <Twitter className="w-4 h-4" />
                <span>Twitter/X (rate-limited)</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                <span>Reddit (ticker subs)</span>
              </div>
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4" />
                <span>Lawsuits/News</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Source Explorer Side Panel */}
        <SourceExplorer
          ticker={selectedTicker}
          isOpen={showSourceExplorer}
          onClose={() => {
            setShowSourceExplorer(false);
            setSelectedTicker(null);
          }}
          onAddEvidence={(ticker, evidence) => {
            console.log('Add evidence:', ticker, evidence);
          }}
        />
      </div>
    </div>
  );
}

