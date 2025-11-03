import React, { useState, useEffect } from 'react';
import { api } from '@/api/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Brain,
  TrendingUp,
  TrendingDown,
  Loader2,
  AlertCircle,
  CheckCircle,
  Zap,
  Sparkles,
  Activity,
  RefreshCw,
  Info,
  BarChart3,
  Share2,
  Download,
  Copy,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, 
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';
import { usePortfolio } from '@/contexts/PortfolioContext';
import PortfolioPill from '@/components/PortfolioPill';

export default function NLPQuantStrategy() {
  const { portfolio, getPortfolioStats } = usePortfolio();
  const [selectedTicker, setSelectedTicker] = useState('');
  const [nlpAnalysis, setNlpAnalysis] = useState(null);
  const [topSignals, setTopSignals] = useState([]);
  const [cacheMetadata, setCacheMetadata] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [descriptions, setDescriptions] = useState(null);
  const [loadingDescriptions, setLoadingDescriptions] = useState(false);

  const stats = getPortfolioStats();
  const tickers = stats?.tickers || [];

  // Load cache metadata and top signals on mount
  useEffect(() => {
    loadCacheMetadata();
    loadTopSignals();
  }, []);

  const loadCacheMetadata = async () => {
    try {
      const metadata = await api.nlpCache.getMetadata();
      setCacheMetadata(metadata);
    } catch (err) {
      console.error('Error loading cache metadata:', err);
    }
  };

  const loadTopSignals = async () => {
    try {
      const result = await api.nlpCache.getTopSignals(20);
      setTopSignals(result.signals || []);
    } catch (err) {
      console.error('Error loading top signals:', err);
    }
  };

  const loadTickerAnalysis = async (ticker) => {
    if (!ticker) return;

    setLoading(true);
    setError(null);
    setNlpAnalysis(null);
    setDescriptions(null);

    try {
      const result = await api.nlpCache.getTicker(ticker.toUpperCase());
      setNlpAnalysis(result);
      
      // Generate descriptions in the background
      loadDescriptions(ticker.toUpperCase());
    } catch (err) {
      console.error('Error loading NLP analysis:', err);
      setError(err.message || 'Failed to load NLP analysis for this ticker');
    } finally {
      setLoading(false);
    }
  };

  const loadDescriptions = async (ticker) => {
    if (!ticker) return;
    
    setLoadingDescriptions(true);
    try {
      const result = await api.nlpCache.generateDescriptions(ticker);
      setDescriptions(result.descriptions || {});
    } catch (err) {
      console.error('Error loading descriptions:', err);
      // Don't set error state - descriptions are optional
    } finally {
      setLoadingDescriptions(false);
    }
  };

  const handleTickerSelect = (ticker) => {
    setSelectedTicker(ticker);
    loadTickerAnalysis(ticker);
  };

  const handleRefresh = () => {
    loadCacheMetadata();
    loadTopSignals();
    if (selectedTicker) {
      loadTickerAnalysis(selectedTicker);
    }
  };

  const getSignalColor = (signal) => {
    if (signal === 'BUY') return 'text-green-400 bg-green-400/20 border-green-400/50';
    if (signal === 'SELL') return 'text-red-400 bg-red-400/20 border-red-400/50';
    return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/50';
  };

  const getSignalIcon = (signal) => {
    if (signal === 'BUY') return <TrendingUp className="w-5 h-5" />;
    if (signal === 'SELL') return <TrendingDown className="w-5 h-5" />;
    return <Activity className="w-5 h-5" />;
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const analysis = nlpAnalysis?.analysis;

  // Export/Share functions
  const exportAsJSON = () => {
    if (!nlpAnalysis) return;
    
    const dataStr = JSON.stringify(nlpAnalysis, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NLP_Analysis_${nlpAnalysis.ticker}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportAsText = () => {
    if (!nlpAnalysis || !analysis) return;

    let text = `NLP QUANTITATIVE STRATEGY ANALYSIS REPORT\n`;
    text += `=============================================\n\n`;
    text += `Ticker: ${nlpAnalysis.ticker}\n`;
    text += `Filing Date: ${nlpAnalysis.filing_date || 'N/A'}\n`;
    text += `Cached At: ${new Date(nlpAnalysis.cached_at).toLocaleString()}\n`;
    text += `File: ${nlpAnalysis.filing_filename || 'N/A'}\n\n`;

    // Add overall description if available
    if (descriptions?.overview) {
      text += `OVERVIEW\n`;
      text += `--------\n`;
      text += `${descriptions.overview}\n\n`;
    }

    // Trading Signal - check both structures
    const tradingSignal = analysis.trading_signals || analysis.trading_signal;
    if (tradingSignal) {
      text += `TRADING SIGNAL\n`;
      text += `--------------\n`;
      
      // Add description if available
      if (descriptions?.trading_signal) {
        text += `${descriptions.trading_signal}\n\n`;
      }
      
      text += `Recommendation: ${tradingSignal.recommendation || analysis.recommendation || 'N/A'}\n`;
      text += `Signal Strength: ${tradingSignal.strength || analysis.signal_strength || analysis.strategy_score ? (tradingSignal.strength || analysis.signal_strength || analysis.strategy_score).toFixed(2) : 'N/A'}\n`;
      text += `Confidence: ${tradingSignal.confidence ? (tradingSignal.confidence * 100).toFixed(1) + '%' : (analysis.confidence ? (analysis.confidence * 100).toFixed(1) + '%' : 'N/A')}\n`;
      text += `Overall Score: ${analysis.strategy_score?.toFixed(2) || 'N/A'}\n`;
      if (tradingSignal.rationale && tradingSignal.rationale.length > 0) {
        text += `Rationale:\n`;
        tradingSignal.rationale.forEach((r, i) => {
          text += `  ${i + 1}. ${r}\n`;
        });
      } else if (tradingSignal.reasoning) {
        text += `Reasoning: ${tradingSignal.reasoning}\n`;
      }
      text += `\n`;
    }

    // Sentiment Analysis - check both structures
    const sentimentScores = analysis.sentiment_scores || analysis.nlp_analysis?.sentiment_scores;
    if (sentimentScores) {
      text += `SENTIMENT ANALYSIS\n`;
      text += `------------------\n`;
      
      // Add description if available
      if (descriptions?.sentiment) {
        text += `${descriptions.sentiment}\n\n`;
      }
      
      text += `Overall Sentiment: ${sentimentScores.overall_sentiment?.toFixed(3) || sentimentScores.compound?.toFixed(3) || 'N/A'}\n`;
      text += `Financial Sentiment: ${sentimentScores.financial_sentiment?.toFixed(3) || 'N/A'}\n`;
      text += `Positive Score: ${sentimentScores.positive_score?.toFixed(3) || sentimentScores.pos?.toFixed(3) || 'N/A'}\n`;
      text += `Negative Score: ${sentimentScores.negative_score?.toFixed(3) || sentimentScores.neg?.toFixed(3) || 'N/A'}\n`;
      text += `Neutral Score: ${sentimentScores.neu?.toFixed(3) || 'N/A'}\n`;
      text += `Uncertainty Score: ${sentimentScores.uncertainty_score?.toFixed(2) || 'N/A'}\n`;
      text += `\n`;
    }

    // Forward-Looking Statements - check both structures
    const forwardLooking = analysis.forward_looking_statements || analysis.nlp_analysis?.forward_looking_statements;
    if (forwardLooking && forwardLooking.length > 0) {
      text += `FORWARD-LOOKING STATEMENTS\n`;
      text += `--------------------------\n`;
      
      // Add description if available
      if (descriptions?.forward_looking) {
        text += `${descriptions.forward_looking}\n\n`;
      }
      
      forwardLooking.slice(0, 10).forEach((stmt, i) => {
        const statementText = typeof stmt === 'string' ? stmt : (stmt.statement || stmt);
        text += `${i + 1}. ${statementText}\n\n`;
      });
      text += `\n`;
    }

    // Risk Analysis
    const riskAnalysis = analysis.risk_analysis || analysis.nlp_analysis?.risk_analysis;
    if (riskAnalysis) {
      text += `RISK ANALYSIS\n`;
      text += `--------------\n`;
      
      // Add description if available
      if (descriptions?.risk_analysis) {
        text += `${descriptions.risk_analysis}\n\n`;
      }
      
      if (typeof riskAnalysis === 'object' && !Array.isArray(riskAnalysis)) {
        text += `Risk Count: ${riskAnalysis.risk_count || 0}\n`;
        text += `Severity Score: ${riskAnalysis.severity_score?.toFixed(2) || 'N/A'}\n`;
        if (riskAnalysis.risk_categories && riskAnalysis.risk_categories.length > 0) {
          text += `Risk Categories:\n`;
          riskAnalysis.risk_categories.forEach(cat => {
            text += `  - ${cat.category}: ${cat.count} mentions\n`;
          });
        }
      }
      text += `\n`;
    } else if (analysis.risk_factors && analysis.risk_factors.length > 0) {
      text += `RISK FACTORS\n`;
      text += `------------\n`;
      
      // Add description if available
      if (descriptions?.risk_analysis) {
        text += `${descriptions.risk_analysis}\n\n`;
      }
      
      analysis.risk_factors.slice(0, 10).forEach((risk, i) => {
        const riskText = typeof risk === 'string' ? risk : (risk.factor || risk);
        text += `${i + 1}. ${riskText}\n`;
        if (risk.severity) {
          text += `   Severity: ${risk.severity}\n`;
        }
        text += `\n`;
      });
      text += `\n`;
    }

    // Tone Analysis - check both structures
    const toneAnalysis = analysis.tone_analysis || analysis.nlp_analysis?.tone_analysis;
    if (toneAnalysis) {
      text += `TONE ANALYSIS\n`;
      text += `-------------\n`;
      
      // Add description if available
      if (descriptions?.tone_analysis) {
        text += `${descriptions.tone_analysis}\n\n`;
      }
      
      text += `Formality Score: ${toneAnalysis.formality_score?.toFixed(2) || toneAnalysis.formality?.toFixed(2) || 'N/A'}\n`;
      text += `Certainty Score: ${toneAnalysis.certainty_score?.toFixed(2) || toneAnalysis.certainty?.toFixed(2) || 'N/A'}\n`;
      text += `Readability Score: ${toneAnalysis.readability_score?.toFixed(2) || toneAnalysis.readability?.toFixed(2) || 'N/A'}\n`;
      text += `Uncertainty Score: ${toneAnalysis.uncertainty_score?.toFixed(2) || 'N/A'}\n`;
      text += `\n`;
    }

    // Key Metrics
    if (analysis.nlp_analysis?.entities?.financial_metrics && analysis.nlp_analysis.entities.financial_metrics.length > 0) {
      text += `KEY FINANCIAL METRICS MENTIONED\n`;
      text += `------------------------------\n`;
      const metrics = {};
      analysis.nlp_analysis.entities.financial_metrics.forEach(metric => {
        const name = metric.metric || 'unknown';
        metrics[name] = (metrics[name] || 0) + 1;
      });
      Object.entries(metrics).sort((a, b) => b[1] - a[1]).forEach(([metric, count]) => {
        text += `  - ${metric}: ${count} mentions\n`;
      });
      text += `\n`;
    }

    // Trading Signals Components
    const tradingSignals = analysis.trading_signals || analysis.trading_signal;
    if (tradingSignals?.components) {
      text += `SIGNAL COMPONENTS\n`;
      text += `-----------------\n`;
      const comp = tradingSignals.components;
      text += `Sentiment: ${comp.sentiment?.toFixed(2) || 'N/A'}\n`;
      text += `Forward Looking: ${comp.forward_looking?.toFixed(2) || 'N/A'}\n`;
      text += `Risk: ${comp.risk?.toFixed(2) || 'N/A'}\n`;
      text += `Certainty: ${comp.certainty?.toFixed(2) || 'N/A'}\n`;
      text += `Momentum: ${comp.momentum?.toFixed(2) || 'N/A'}\n`;
      text += `\n`;
    }

    // Quant Metrics
    if (tradingSignals?.quant_metrics) {
      text += `QUANTITATIVE METRICS\n`;
      text += `-------------------\n`;
      
      // Add description if available
      if (descriptions?.quantitative_metrics) {
        text += `${descriptions.quantitative_metrics}\n\n`;
      }
      
      const quant = tradingSignals.quant_metrics;
      text += `Composite Signal: ${quant.composite_signal?.toFixed(4) || 'N/A'}\n`;
      text += `Risk Adjusted Signal: ${quant.risk_adjusted_signal?.toFixed(4) || 'N/A'}\n`;
      text += `Expected Return (Annualized): ${quant.expected_return_annualized ? (quant.expected_return_annualized * 100).toFixed(2) + '%' : 'N/A'}\n`;
      text += `Signal Sharpe Ratio: ${quant.signal_sharpe_ratio?.toFixed(4) || 'N/A'}\n`;
      text += `Information Coefficient: ${quant.information_coefficient?.toFixed(4) || 'N/A'}\n`;
      text += `Statistically Significant: ${quant.statistically_significant ? 'Yes' : 'No'}\n`;
      text += `\n`;
    }

    text += `=============================================\n`;
    text += `Generated: ${new Date().toLocaleString()}\n`;

    const dataBlob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NLP_Analysis_${nlpAnalysis.ticker}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    if (!nlpAnalysis || !analysis) return;

    const tradingSignal = analysis.trading_signals || analysis.trading_signal;
    const sentimentScores = analysis.sentiment_scores || analysis.nlp_analysis?.sentiment_scores;

    let text = `NLP Analysis Report for ${nlpAnalysis.ticker}\n\n`;
    text += `Trading Signal: ${tradingSignal?.recommendation || analysis.recommendation || 'N/A'}\n`;
    text += `Signal Strength: ${tradingSignal?.strength || analysis.signal_strength || analysis.strategy_score ? (tradingSignal?.strength || analysis.signal_strength || analysis.strategy_score).toFixed(2) : 'N/A'}\n`;
    text += `Confidence: ${tradingSignal?.confidence ? (tradingSignal.confidence * 100).toFixed(1) + '%' : (analysis.confidence ? (analysis.confidence * 100).toFixed(1) + '%' : 'N/A')}\n\n`;
    
    if (sentimentScores) {
      text += `Sentiment: ${sentimentScores.financial_sentiment?.toFixed(3) || sentimentScores.compound?.toFixed(3) || 'N/A'}\n`;
      text += `Uncertainty: ${sentimentScores.uncertainty_score?.toFixed(2) || 'N/A'}\n\n`;
    }

    text += `Filing Date: ${nlpAnalysis.filing_date || 'N/A'}\n`;
    text += `Analysis Date: ${new Date(nlpAnalysis.cached_at).toLocaleString()}\n`;

    try {
      await navigator.clipboard.writeText(text);
      alert('Analysis summary copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy to clipboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Brain className="w-8 h-8 text-purple-400" />
              NLP Quantitative Strategy
            </h1>
            <p className="text-gray-400 mt-1">
              Pre-computed NLP analysis results from 10-K/10-Q filings
            </p>
            {cacheMetadata && (
              <div className="flex items-center gap-2 mt-2">
                <Badge 
                  variant="outline" 
                  className={
                    cacheMetadata.status === 'completed' ? 'border-green-600 text-green-300' :
                    cacheMetadata.status === 'running' ? 'border-yellow-600 text-yellow-300' :
                    'border-red-600 text-red-300'
                  }
                >
                  {cacheMetadata.status === 'completed' ? '✓' : cacheMetadata.status === 'running' ? '~' : '⚠'} 
                  {' '}
                  {cacheMetadata.status === 'completed' ? 'Cache Ready' : 
                   cacheMetadata.status === 'running' ? 'Analyzing...' : 
                   'Cache Error'}
                </Badge>
                {cacheMetadata.cache_size !== undefined && (
                  <Badge variant="outline" className="border-gray-600 text-gray-300">
                    {cacheMetadata.cache_size} tickers analyzed
                  </Badge>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <PortfolioPill />
            <Button
              variant="outline"
              onClick={handleRefresh}
              className="border-gray-700 text-white hover:bg-gray-800"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Link to="/">
              <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>

        {/* Cache Status */}
        {cacheMetadata && (
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Info className="w-5 h-5" />
                Cache Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-400">Status</div>
                  <div className="text-white font-semibold capitalize">{cacheMetadata.status}</div>
                </div>
                <div>
                  <div className="text-gray-400">Total Analyzed</div>
                  <div className="text-white font-semibold">{cacheMetadata.total_analyzed || 0}</div>
                </div>
                <div>
                  <div className="text-gray-400">Cache Size</div>
                  <div className="text-white font-semibold">{cacheMetadata.cache_size || 0}</div>
                </div>
                <div>
                  <div className="text-gray-400">Last Updated</div>
                  <div className="text-white font-semibold text-xs">
                    {cacheMetadata.last_updated ? new Date(cacheMetadata.last_updated).toLocaleString() : 'N/A'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Trading Signals */}
        {topSignals.length > 0 && (
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                Top Trading Signals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left text-gray-300 p-2">Rank</th>
                      <th className="text-left text-gray-300 p-2">Ticker</th>
                      <th className="text-left text-gray-300 p-2">Signal</th>
                      <th className="text-left text-gray-300 p-2">Strength</th>
                      <th className="text-left text-gray-300 p-2">Confidence</th>
                      <th className="text-left text-gray-300 p-2">Sentiment</th>
                      <th className="text-left text-gray-300 p-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topSignals.map((signal, index) => (
                      <tr 
                        key={index} 
                        className="border-b border-gray-700 hover:bg-gray-900 cursor-pointer"
                        onClick={() => handleTickerSelect(signal.ticker)}
                      >
                        <td className="text-white p-2">
                          <Badge variant="outline" className="border-gray-600 text-gray-300">
                            #{index + 1}
                          </Badge>
                        </td>
                        <td className="text-white font-mono font-semibold p-2">{signal.ticker}</td>
                        <td className="p-2">
                          <Badge className={getSignalColor(signal.signal)}>
                            {getSignalIcon(signal.signal)}
                            <span className="ml-1">{signal.signal}</span>
                          </Badge>
                        </td>
                        <td className="text-white p-2">{signal.strength?.toFixed(2) || 'N/A'}</td>
                        <td className="text-white p-2">{signal.confidence ? (signal.confidence * 100).toFixed(0) + '%' : 'N/A'}</td>
                        <td className="p-2">
                          <Badge 
                            variant="outline" 
                            className={signal.sentiment_score > 0 ? 'border-green-600 text-green-300' : 'border-red-600 text-red-300'}
                          >
                            {signal.sentiment_score?.toFixed(2) || 'N/A'}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTickerSelect(signal.ticker);
                            }}
                            className="text-white hover:bg-gray-700"
                          >
                            View Analysis
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ticker Selector */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Select Ticker to View Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm text-gray-400 mb-2 block">Ticker Symbol</label>
                <Input
                  placeholder="Enter ticker (e.g., AAPL)"
                  value={selectedTicker}
                  onChange={(e) => setSelectedTicker(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      loadTickerAnalysis(selectedTicker);
                    }
                  }}
                  className="bg-gray-900 border-gray-700 text-white"
                  list="ticker-list"
                />
                <datalist id="ticker-list">
                  {tickers.slice(0, 100).map(ticker => (
                    <option key={ticker} value={ticker} />
                  ))}
                </datalist>
              </div>
              <Button
                onClick={() => loadTickerAnalysis(selectedTicker)}
                disabled={!selectedTicker || loading}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    Load Analysis
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="bg-red-900/20 border-red-700">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analysis Results */}
        {nlpAnalysis && analysis && (
          <div className="space-y-6">
            {loadingDescriptions && (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="pt-6 pb-6 text-center">
                  <Loader2 className="w-5 h-5 animate-spin text-purple-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Generating AI-powered descriptions...</p>
                </CardContent>
              </Card>
            )}
            
            {/* Trading Signal / Strategy */}
            {(analysis.trading_signal || analysis.trading_signals) && (() => {
              const tradingSignal = analysis.trading_signals || analysis.trading_signal;
              const recommendation = tradingSignal?.recommendation || tradingSignal?.signal || analysis.recommendation;
              const signalStrength = tradingSignal?.strength || tradingSignal?.signal_strength || analysis.signal_strength || analysis.strategy_score;
              const confidence = tradingSignal?.confidence || analysis.confidence;
              const overallScore = tradingSignal?.overall_score || analysis.strategy_score;
              const rationale = tradingSignal?.rationale || [];
              const reasoning = tradingSignal?.reasoning;
              
              return (
                <>
                  <Card className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 border-purple-500/30">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        {getSignalIcon(recommendation)}
                        <span>Trading Strategy: {recommendation}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {descriptions?.trading_signal && (
                        <div className="mb-4 p-3 bg-gray-900/50 rounded border border-purple-500/30">
                          <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                            <Brain className="w-3 h-3 text-purple-400" />
                            AI Explanation
                          </div>
                          <div className="text-sm text-gray-300">{descriptions.trading_signal}</div>
                        </div>
                      )}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <div className="text-sm text-gray-400">Signal Strength</div>
                          <div className="text-2xl font-bold text-white">
                            {signalStrength ? signalStrength.toFixed(2) : 'N/A'}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-400">Overall Score</div>
                          <div className="text-2xl font-bold text-white">
                            {overallScore ? overallScore.toFixed(2) : 'N/A'}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-400">Confidence</div>
                          <div className="text-2xl font-bold text-white">
                            {confidence ? (confidence * 100).toFixed(0) + '%' : 'N/A'}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-400">Risk Level</div>
                          <div className="text-2xl font-bold text-white">
                            {tradingSignal?.risk_level || 'N/A'}
                          </div>
                        </div>
                      </div>
                      
                      {/* Strategy Rationale */}
                      {rationale && rationale.length > 0 && (
                        <div className="mt-4 p-4 bg-gray-900/50 rounded border border-purple-500/30">
                          <div className="text-sm text-gray-400 mb-2 font-semibold">Strategy Rationale</div>
                          <ul className="space-y-2">
                            {rationale.map((r, i) => (
                              <li key={i} className="text-white text-sm flex items-start gap-2">
                                <span className="text-purple-400 mt-1">•</span>
                                <span>{r}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {reasoning && (
                        <div className="mt-4 p-4 bg-gray-900/50 rounded border border-gray-700">
                          <div className="text-sm text-gray-400 mb-1">Reasoning</div>
                          <div className="text-white">{reasoning}</div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Signal Components */}
                  {tradingSignal?.components && (
                    <Card className="bg-gray-800 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <BarChart3 className="w-5 h-5" />
                          Signal Components
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {descriptions?.signal_components && (
                          <div className="mb-4 p-3 bg-gray-900/50 rounded border border-gray-700">
                            <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                              <Brain className="w-3 h-3 text-purple-400" />
                              AI Explanation
                            </div>
                            <div className="text-sm text-gray-300">{descriptions.signal_components}</div>
                          </div>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                          {Object.entries(tradingSignal.components).map(([key, value]) => (
                            <div key={key} className="p-4 bg-gray-900 rounded border border-gray-700">
                              <div className="text-sm text-gray-400 mb-2 capitalize">
                                {key.replace('_', ' ')}
                              </div>
                              <div className="text-2xl font-bold text-white mb-2">
                                {typeof value === 'number' ? value.toFixed(2) : value}
                              </div>
                              <div className="w-full bg-gray-700 rounded-full h-2">
                                <div
                                  className="bg-purple-500 h-2 rounded-full"
                                  style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                        {/* Component Chart */}
                        <div className="mt-6">
                          <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={Object.entries(tradingSignal.components).map(([name, value]) => ({
                              name: name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                              value: typeof value === 'number' ? value : 0
                            }))}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                              <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} />
                              <YAxis stroke="#9CA3AF" fontSize={12} />
                              <Tooltip
                                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '6px' }}
                                labelStyle={{ color: '#9CA3AF' }}
                              />
                              <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Quantitative Metrics */}
                  {tradingSignal?.quant_metrics && (
                    <Card className="bg-gray-800 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <TrendingUp className="w-5 h-5" />
                          Quantitative Metrics
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {descriptions?.quantitative_metrics && (
                          <div className="mb-4 p-3 bg-gray-900/50 rounded border border-gray-700">
                            <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                              <Brain className="w-3 h-3 text-purple-400" />
                              AI Explanation
                            </div>
                            <div className="text-sm text-gray-300">{descriptions.quantitative_metrics}</div>
                          </div>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="p-4 bg-gray-900 rounded border border-gray-700">
                            <div className="text-sm text-gray-400 mb-1">Composite Signal</div>
                            <div className="text-xl font-bold text-white">
                              {tradingSignal.quant_metrics.composite_signal?.toFixed(4) || 'N/A'}
                            </div>
                          </div>
                          <div className="p-4 bg-gray-900 rounded border border-gray-700">
                            <div className="text-sm text-gray-400 mb-1">Risk Adjusted Signal</div>
                            <div className="text-xl font-bold text-white">
                              {tradingSignal.quant_metrics.risk_adjusted_signal?.toFixed(4) || 'N/A'}
                            </div>
                          </div>
                          <div className="p-4 bg-gray-900 rounded border border-gray-700">
                            <div className="text-sm text-gray-400 mb-1">Expected Return (Annualized)</div>
                            <div className="text-xl font-bold text-green-400">
                              {tradingSignal.quant_metrics.expected_return_annualized 
                                ? (tradingSignal.quant_metrics.expected_return_annualized * 100).toFixed(2) + '%' 
                                : 'N/A'}
                            </div>
                          </div>
                          <div className="p-4 bg-gray-900 rounded border border-gray-700">
                            <div className="text-sm text-gray-400 mb-1">Signal Sharpe Ratio</div>
                            <div className="text-xl font-bold text-white">
                              {tradingSignal.quant_metrics.signal_sharpe_ratio?.toFixed(4) || 'N/A'}
                            </div>
                          </div>
                          <div className="p-4 bg-gray-900 rounded border border-gray-700">
                            <div className="text-sm text-gray-400 mb-1">Information Coefficient</div>
                            <div className="text-xl font-bold text-white">
                              {tradingSignal.quant_metrics.information_coefficient?.toFixed(4) || 'N/A'}
                            </div>
                          </div>
                          <div className="p-4 bg-gray-900 rounded border border-gray-700">
                            <div className="text-sm text-gray-400 mb-1">Statistically Significant</div>
                            <div className="text-xl font-bold">
                              <Badge 
                                variant="outline" 
                                className={
                                  tradingSignal.quant_metrics.statistically_significant 
                                    ? 'border-green-600 text-green-300' 
                                    : 'border-red-600 text-red-300'
                                }
                              >
                                {tradingSignal.quant_metrics.statistically_significant ? 'Yes' : 'No'}
                              </Badge>
                            </div>
                          </div>
                          {tradingSignal.quant_metrics.t_statistic !== undefined && (
                            <div className="p-4 bg-gray-900 rounded border border-gray-700">
                              <div className="text-sm text-gray-400 mb-1">T-Statistic</div>
                              <div className="text-xl font-bold text-white">
                                {tradingSignal.quant_metrics.t_statistic?.toFixed(4) || 'N/A'}
                              </div>
                            </div>
                          )}
                          {tradingSignal.quant_metrics.p_value !== undefined && (
                            <div className="p-4 bg-gray-900 rounded border border-gray-700">
                              <div className="text-sm text-gray-400 mb-1">P-Value</div>
                              <div className="text-xl font-bold text-white">
                                {tradingSignal.quant_metrics.p_value?.toFixed(4) || 'N/A'}
                              </div>
                            </div>
                          )}
                          {tradingSignal.quant_metrics.factor_portfolio_volatility !== undefined && (
                            <div className="p-4 bg-gray-900 rounded border border-gray-700">
                              <div className="text-sm text-gray-400 mb-1">Factor Portfolio Volatility</div>
                              <div className="text-xl font-bold text-white">
                                {tradingSignal.quant_metrics.factor_portfolio_volatility?.toFixed(4) || 'N/A'}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Statistical Significance */}
                  {tradingSignal?.statistical_significance && (
                    <Card className="bg-gray-800 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <Activity className="w-5 h-5" />
                          Statistical Significance
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="p-4 bg-gray-900 rounded border border-gray-700">
                            <div className="text-sm text-gray-400 mb-1">T-Statistic</div>
                            <div className="text-xl font-bold text-white">
                              {tradingSignal.statistical_significance.t_statistic?.toFixed(4) || 'N/A'}
                            </div>
                          </div>
                          <div className="p-4 bg-gray-900 rounded border border-gray-700">
                            <div className="text-sm text-gray-400 mb-1">P-Value</div>
                            <div className="text-xl font-bold text-white">
                              {tradingSignal.statistical_significance.p_value?.toFixed(4) || 'N/A'}
                            </div>
                          </div>
                          <div className="p-4 bg-gray-900 rounded border border-gray-700">
                            <div className="text-sm text-gray-400 mb-1">Significant</div>
                            <div className="text-xl font-bold">
                              <Badge 
                                variant="outline" 
                                className={
                                  tradingSignal.statistical_significance.significant 
                                    ? 'border-green-600 text-green-300' 
                                    : 'border-red-600 text-red-300'
                                }
                              >
                                {tradingSignal.statistical_significance.significant ? 'Yes' : 'No'}
                              </Badge>
                            </div>
                          </div>
                          <div className="p-4 bg-gray-900 rounded border border-gray-700">
                            <div className="text-sm text-gray-400 mb-1">Factor Count</div>
                            <div className="text-xl font-bold text-white">
                              {tradingSignal.statistical_significance.factor_count || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Factor Loadings */}
                  {tradingSignal?.factor_loadings && Object.keys(tradingSignal.factor_loadings).length > 0 && (
                    <Card className="bg-gray-800 border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <BarChart3 className="w-5 h-5" />
                          Factor Loadings
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                          {Object.entries(tradingSignal.factor_loadings).map(([key, value]) => (
                            <div key={key} className="p-4 bg-gray-900 rounded border border-gray-700">
                              <div className="text-sm text-gray-400 mb-2 capitalize">
                                {key.replace('_', ' ')}
                              </div>
                              <div className={`text-2xl font-bold ${
                                value > 0 ? 'text-green-400' : value < 0 ? 'text-red-400' : 'text-white'
                              }`}>
                                {typeof value === 'number' ? value.toFixed(3) : value}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              );
            })()}

            {/* Sentiment Analysis */}
            {analysis.sentiment_scores && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Sentiment Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  {descriptions?.sentiment && (
                    <div className="mb-4 p-3 bg-gray-900/50 rounded border border-gray-700">
                      <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                        <Brain className="w-3 h-3 text-purple-400" />
                        AI Explanation
                      </div>
                      <div className="text-sm text-gray-300">{descriptions.sentiment}</div>
                    </div>
                  )}
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-gray-400">Compound</div>
                      <div className={`text-2xl font-bold ${analysis.sentiment_scores.compound > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {analysis.sentiment_scores.compound?.toFixed(3) || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Positive</div>
                      <div className="text-2xl font-bold text-green-400">
                        {analysis.sentiment_scores.pos?.toFixed(3) || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Neutral</div>
                      <div className="text-2xl font-bold text-yellow-400">
                        {analysis.sentiment_scores.neu?.toFixed(3) || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Negative</div>
                      <div className="text-2xl font-bold text-red-400">
                        {analysis.sentiment_scores.neg?.toFixed(3) || 'N/A'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Forward-Looking Statements */}
            {analysis.forward_looking_statements && analysis.forward_looking_statements.length > 0 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Forward-Looking Statements</CardTitle>
                </CardHeader>
                <CardContent>
                  {descriptions?.forward_looking && (
                    <div className="mb-4 p-3 bg-gray-900/50 rounded border border-gray-700">
                      <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                        <Brain className="w-3 h-3 text-purple-400" />
                        AI Explanation
                      </div>
                      <div className="text-sm text-gray-300">{descriptions.forward_looking}</div>
                    </div>
                  )}
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {analysis.forward_looking_statements.slice(0, 10).map((statement, index) => (
                      <div key={index} className="p-3 bg-gray-900 rounded border border-gray-700">
                        <p className="text-sm text-gray-300">{statement}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Risk Factors */}
            {analysis.risk_factors && analysis.risk_factors.length > 0 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Risk Factors</CardTitle>
                </CardHeader>
                <CardContent>
                  {descriptions?.risk_analysis && (
                    <div className="mb-4 p-3 bg-gray-900/50 rounded border border-gray-700">
                      <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                        <Brain className="w-3 h-3 text-purple-400" />
                        AI Explanation
                      </div>
                      <div className="text-sm text-gray-300">{descriptions.risk_analysis}</div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    {analysis.risk_factors.slice(0, 10).map((risk, index) => (
                      <div key={index} className="p-3 bg-gray-900 rounded border border-gray-700">
                        <div className="text-sm text-white font-semibold mb-1">{risk.factor || risk}</div>
                        {risk.severity && (
                          <Badge 
                            variant="outline" 
                            className={risk.severity === 'High' ? 'border-red-600 text-red-300' : 
                                       risk.severity === 'Medium' ? 'border-yellow-600 text-yellow-300' : 
                                       'border-green-600 text-green-300'}
                          >
                            {risk.severity}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tone Analysis */}
            {analysis.tone_analysis && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Tone Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  {descriptions?.tone_analysis && (
                    <div className="mb-4 p-3 bg-gray-900/50 rounded border border-gray-700">
                      <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                        <Brain className="w-3 h-3 text-purple-400" />
                        AI Explanation
                      </div>
                      <div className="text-sm text-gray-300">{descriptions.tone_analysis}</div>
                    </div>
                  )}
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <div className="text-sm text-gray-400">Certainty</div>
                      <div className="text-xl font-bold text-white">
                        {analysis.tone_analysis.certainty?.toFixed(2) || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Formality</div>
                      <div className="text-xl font-bold text-white">
                        {analysis.tone_analysis.formality?.toFixed(2) || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Readability</div>
                      <div className="text-xl font-bold text-white">
                        {analysis.tone_analysis.readability?.toFixed(2) || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Uncertainty</div>
                      <div className="text-xl font-bold text-white">
                        {analysis.tone_analysis.uncertainty_score?.toFixed(2) || 'N/A'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Cached Info */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-sm">Analysis Information</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyToClipboard}
                      className="border-gray-700 text-white hover:bg-gray-700"
                      title="Copy summary to clipboard"
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy Summary
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportAsText}
                      className="border-gray-700 text-white hover:bg-gray-700"
                      title="Export as text file"
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      Export Text
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportAsJSON}
                      className="border-gray-700 text-white hover:bg-gray-700"
                      title="Export as JSON file"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Export JSON
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-400 space-y-1">
                  <div>Ticker: <span className="text-white font-mono">{nlpAnalysis.ticker}</span></div>
                  <div>Cached at: <span className="text-white">{new Date(nlpAnalysis.cached_at).toLocaleString()}</span></div>
                  {nlpAnalysis.filing_date && nlpAnalysis.filing_date !== 'unknown' && (
                    <div>Filing Date: <span className="text-white font-semibold">{nlpAnalysis.filing_date}</span></div>
                  )}
                  {nlpAnalysis.previous_filing_date ? (
                    <div>
                      <div>Previous Filing: <span className="text-white">{nlpAnalysis.previous_filing_date}</span></div>
                      <Badge variant="outline" className="border-green-600 text-green-300 mt-2">
                        ✓ Has Comparison
                      </Badge>
                    </div>
                  ) : null}
                  {nlpAnalysis.filing_filename && (
                    <div className="text-xs text-gray-500 mt-2">
                      File: {nlpAnalysis.filing_filename}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {!nlpAnalysis && !loading && !error && (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="pt-12 pb-12 text-center">
              <Brain className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Select a Ticker</h3>
              <p className="text-gray-400">
                Choose a ticker from the portfolio or enter a ticker symbol above to view pre-computed NLP analysis results.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
