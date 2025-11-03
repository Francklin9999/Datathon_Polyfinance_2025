import React, { useState, useRef, useEffect } from 'react';
import { api } from '@/api/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Search,
  AlertTriangle,
  TrendingUp,
  Loader2,
  ExternalLink,
  FileText,
  BarChart3,
  Info,
  CheckCircle,
  XCircle,
  Activity,
  Download
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePortfolio } from '@/contexts/PortfolioContext';
import PortfolioPill from '@/components/PortfolioPill';

export default function MarketResearch() {
  const { portfolio, getPortfolioStats } = usePortfolio();
  const [ticker, setTicker] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isResearching, setIsResearching] = useState(false);
  const [researchResult, setResearchResult] = useState(null);
  const [error, setError] = useState(null);
  const [followupQuestion, setFollowupQuestion] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [secAnalysis, setSecAnalysis] = useState(null);
  const conversationEndRef = useRef(null);

  const stats = getPortfolioStats();
  const tickers = stats?.tickers || [];

  const handleResearch = async () => {
    if (!ticker) {
      setError('Please enter a ticker symbol');
      return;
    }

    setIsResearching(true);
    setError(null);
    setResearchResult(null);
    setSecAnalysis(null);
    setConversationHistory([]); // Reset conversation history

    try {
      const result = await api.marketResearch.research(
        ticker.toUpperCase(),
        companyName || null,
        20,
        true
      );
      setResearchResult(result);
      // Add initial research message to conversation
      setConversationHistory([{
        role: 'assistant',
        content: `Research completed for ${result.company_name} (${result.ticker}). I've analyzed filings, web sources, and generated a quantitative research report. You can ask me questions about the company.`
      }]);
      
      // Load SEC analysis from cache
      try {
        const secData = await api.nlpCache.getTicker(ticker.toUpperCase());
        setSecAnalysis(secData);
      } catch (secErr) {
        console.warn('Could not load SEC analysis from cache:', secErr);
        setSecAnalysis(null);
      }
    } catch (err) {
      console.error('Market research error:', err);
      setError(err.message || 'Failed to conduct market research');
    } finally {
      setIsResearching(false);
    }
  };

  const handleFollowup = async () => {
    if (!followupQuestion.trim() || !researchResult) {
      return;
    }

    setIsAnswering(true);
    const question = followupQuestion.trim();
    setFollowupQuestion('');
    
    // Add user question to conversation
    const userMessage = { role: 'user', content: question };
    setConversationHistory(prev => [...prev, userMessage]);

    try {
      const result = await api.marketResearch.followup(
        researchResult.ticker,
        question,
        researchResult.company_name,
        researchResult,
        conversationHistory
      );
      
      // Add assistant answer to conversation
      const assistantMessage = { role: 'assistant', content: result.answer };
      setConversationHistory(prev => [...prev, assistantMessage]);
      
      // Scroll to bottom
      setTimeout(() => {
        conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error('Follow-up error:', err);
      const errorMessage = { role: 'assistant', content: `Error: ${err.message || 'Failed to answer question'}` };
      setConversationHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsAnswering(false);
    }
  };

  useEffect(() => {
    // Auto-scroll to bottom when conversation updates
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationHistory]);

  const getRecommendationColor = (recommendation) => {
    switch (recommendation) {
      case 'HIGH_RISK':
        return 'text-red-400 bg-red-400/20 border-red-400/50';
      case 'MODERATE_RISK':
        return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/50';
      case 'LOW_RISK':
        return 'text-green-400 bg-green-400/20 border-green-400/50';
      default:
        return 'text-gray-400 bg-gray-400/20 border-gray-400/50';
    }
  };

  const getRecommendationIcon = (recommendation) => {
    switch (recommendation) {
      case 'HIGH_RISK':
        return <XCircle className="w-5 h-5" />;
      case 'MODERATE_RISK':
        return <AlertTriangle className="w-5 h-5" />;
      case 'LOW_RISK':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Search className="w-8 h-8 text-blue-400" />
              Market Research
            </h1>
            <p className="text-gray-400 mt-1">
              AI-powered web research to identify risks and opportunities for stocks
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

        {/* Search Form */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Search className="w-5 h-5" />
              Research Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm text-gray-400 mb-2 block">Ticker Symbol *</label>
                <Input
                  placeholder="Enter ticker (e.g., AAPL)"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleResearch();
                    }
                  }}
                  className="bg-gray-900 border-gray-700 text-white"
                  list="ticker-list"
                />
                <datalist id="ticker-list">
                  {tickers.slice(0, 100).map(t => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </div>
              <div className="flex-1">
                <label className="text-sm text-gray-400 mb-2 block">Company Name (Optional)</label>
                <Input
                  placeholder="Company name (auto-detected if not provided)"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>
              <Button
                onClick={handleResearch}
                disabled={!ticker || isResearching}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isResearching ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Researching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Research
                  </>
                )}
              </Button>
            </div>
            {error && (
              <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
                <AlertTriangle className="w-5 h-5 inline mr-2" />
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {researchResult && (
          <div className="space-y-6">
            {/* Summary Card */}
            <Card className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-blue-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-3">
                  <BarChart3 className="w-6 h-6" />
                  Research Summary: {researchResult.company_name} ({researchResult.ticker})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-400">Risk Score</div>
                    <div className={`text-3xl font-bold ${
                      researchResult.risk_score > 70 ? 'text-red-400' :
                      researchResult.risk_score > 50 ? 'text-yellow-400' :
                      'text-green-400'
                    }`}>
                      {researchResult.risk_score.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-500">out of 100</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Recommendation</div>
                    <Badge className={getRecommendationColor(researchResult.recommendation)}>
                      {getRecommendationIcon(researchResult.recommendation)}
                      <span className="ml-1">{researchResult.recommendation.replace('_', ' ')}</span>
                    </Badge>
                    {researchResult.nlp_recommendation && researchResult.nlp_recommendation !== researchResult.recommendation && (
                      <div className="mt-1">
                        <Badge variant="outline" className="text-xs border-blue-500/50 text-blue-300">
                          NLP: {researchResult.nlp_recommendation}
                          {researchResult.filing_analysis?.cached && (
                            <span className="ml-1 text-green-400">(Cached)</span>
                          )}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Risks Found</div>
                    <div className="text-2xl font-bold text-red-400">
                      {researchResult.risks?.length || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Opportunities Found</div>
                    <div className="text-2xl font-bold text-green-400">
                      {researchResult.opportunities?.length || 0}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Results */}
            <Tabs defaultValue="risks" className="space-y-4">
              <TabsList className="bg-gray-800 border-gray-700">
                <TabsTrigger value="risks" className="text-gray-300 data-[state=active]:text-white">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Risks ({researchResult.risks?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="opportunities" className="text-gray-300 data-[state=active]:text-white">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Opportunities ({researchResult.opportunities?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="findings" className="text-gray-300 data-[state=active]:text-white">
                  <Info className="w-4 h-4 mr-2" />
                  Key Findings ({researchResult.key_findings?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="filing" className="text-gray-300 data-[state=active]:text-white">
                  <FileText className="w-4 h-4 mr-2" />
                  Filing Analysis
                </TabsTrigger>
                {researchResult.quantitative_analysis && (
                  <TabsTrigger value="quantitative" className="text-gray-300 data-[state=active]:text-white">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Quantitative Research
                  </TabsTrigger>
                )}
                {researchResult.nlp_analysis && (
                  <TabsTrigger value="nlp" className="text-gray-300 data-[state=active]:text-white">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    NLP Analysis
                  </TabsTrigger>
                )}
                <TabsTrigger value="chat" className="text-gray-300 data-[state=active]:text-white">
                  <Info className="w-4 h-4 mr-2" />
                  Ask Questions
                </TabsTrigger>
              </TabsList>

              {/* Risks Tab */}
              <TabsContent value="risks" className="space-y-4">
                {/* SEC Analysis Risks */}
                {secAnalysis?.analysis?.nlp_analysis?.risk_analysis && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Badge variant="outline" className="border-blue-600/50 text-blue-300/80">
                        SEC Filing Analysis
                      </Badge>
                      {secAnalysis.filing_date && (
                        <span className="text-xs text-gray-500">Filing Date: {secAnalysis.filing_date}</span>
                      )}
                    </div>
                    
                    {/* Risk Categories */}
                    {secAnalysis.analysis.nlp_analysis.risk_analysis.risk_categories && 
                     secAnalysis.analysis.nlp_analysis.risk_analysis.risk_categories.length > 0 && (
                      <Card className="bg-red-900/20 border-red-700/50 mb-4">
                        <CardHeader>
                          <CardTitle className="text-white text-sm">Risk Categories</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {secAnalysis.analysis.nlp_analysis.risk_analysis.risk_categories.map((category, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2 bg-red-900/10 rounded">
                                <span className="text-gray-300 text-sm capitalize">
                                  {category.category.replace('_', ' ')}
                                </span>
                                <Badge variant="outline" className="border-red-600 text-red-300">
                                  {category.count}
                                </Badge>
                              </div>
                            ))}
                          </div>
                          {secAnalysis.analysis.nlp_analysis.risk_analysis.severity_score !== undefined && (
                            <div className="mt-3 pt-3 border-t border-red-700/50">
                              <div className="text-sm text-gray-400">Risk Severity Score</div>
                              <div className={`text-xl font-bold ${
                                secAnalysis.analysis.nlp_analysis.risk_analysis.severity_score > 50 ? 'text-red-400' :
                                secAnalysis.analysis.nlp_analysis.risk_analysis.severity_score > 30 ? 'text-yellow-400' :
                                'text-green-400'
                              }`}>
                                {secAnalysis.analysis.nlp_analysis.risk_analysis.severity_score.toFixed(1)}%
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                    
                    {/* Key Risks */}
                    {secAnalysis.analysis.nlp_analysis.risk_analysis.key_risks && 
                     secAnalysis.analysis.nlp_analysis.risk_analysis.key_risks.length > 0 && (
                      <div className="grid gap-4">
                        {secAnalysis.analysis.nlp_analysis.risk_analysis.key_risks.map((risk, index) => (
                          <Card key={index} className="bg-red-900/20 border-red-700/50">
                            <CardContent className="p-4">
                              <div className="flex items-start gap-2 mb-2">
                                <AlertTriangle className="w-5 h-5 text-red-400" />
                                <h3 className="font-semibold text-white">{risk.title || risk.description || `Risk ${index + 1}`}</h3>
                              </div>
                              {(risk.description || risk.summary) && (
                                <p className="text-gray-300 text-sm mb-2">{risk.description || risk.summary}</p>
                              )}
                              {risk.category && (
                                <Badge variant="outline" className="mt-2 border-red-600/50 text-red-300/80 text-xs">
                                  {risk.category.replace('_', ' ')}
                                </Badge>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Original Research Risks */}
                {researchResult.risks && researchResult.risks.length > 0 ? (
                  <div>
                    {secAnalysis && (
                      <div className="flex items-center gap-2 mb-4">
                        <Badge variant="outline" className="border-gray-600/50 text-gray-300/80">
                          Web Research Results
                        </Badge>
                      </div>
                    )}
                    <div className="grid gap-4">
                      {researchResult.risks.map((risk, index) => (
                        <Card key={index} className="bg-red-900/20 border-red-700/50">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <AlertTriangle className="w-5 h-5 text-red-400" />
                                  <h3 className="font-semibold text-white">{risk.title}</h3>
                                  <Badge variant="outline" className="border-red-600 text-red-300">
                                    Risk Score: {risk.risk_score}
                                  </Badge>
                                </div>
                                <p className="text-gray-300 text-sm mb-2">{risk.snippet}</p>
                                {risk.context && (
                                  <p className="text-gray-400 text-xs italic">{risk.context}</p>
                                )}
                                {risk.source === "SEC Filing" && (
                                  <Badge variant="outline" className="mt-2 border-blue-600/50 text-blue-300/80 text-xs">
                                    From SEC Filing
                                  </Badge>
                                )}
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {risk.detected_keywords?.slice(0, 5).map((keyword, idx) => (
                                    <Badge key={idx} variant="outline" className="border-red-600/50 text-red-300/80 text-xs">
                                      {keyword}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              {risk.url && (
                                <a
                                  href={risk.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ml-4 text-blue-400 hover:text-blue-300"
                                >
                                  <ExternalLink className="w-5 h-5" />
                                </a>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : !secAnalysis?.analysis?.nlp_analysis?.risk_analysis && (
                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-8 text-center">
                      <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                      <p className="text-gray-400">No significant risks detected in recent research</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Opportunities Tab */}
              <TabsContent value="opportunities" className="space-y-4">
                {/* SEC Analysis Forward-Looking Statements */}
                {secAnalysis?.analysis?.nlp_analysis?.forward_looking_statements && 
                 secAnalysis.analysis.nlp_analysis.forward_looking_statements.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Badge variant="outline" className="border-blue-600/50 text-blue-300/80">
                        SEC Filing Analysis
                      </Badge>
                      {secAnalysis.filing_date && (
                        <span className="text-xs text-gray-500">Filing Date: {secAnalysis.filing_date}</span>
                      )}
                      <span className="text-xs text-gray-500">
                        {secAnalysis.analysis.nlp_analysis.forward_looking_statements.length} forward-looking statements
                      </span>
                    </div>
                    
                    <div className="grid gap-4">
                      {secAnalysis.analysis.nlp_analysis.forward_looking_statements
                        .filter(stmt => stmt.statement && stmt.statement.trim().length > 20)
                        .slice(0, 15)
                        .map((stmt, index) => (
                        <Card key={index} className="bg-green-900/20 border-green-700/50">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-2 mb-2">
                              <TrendingUp className="w-5 h-5 text-green-400" />
                              <div className="flex-1">
                                <p className="text-gray-300 text-sm">{stmt.statement}</p>
                                {stmt.sentiment !== undefined && (
                                  <div className="mt-2 flex items-center gap-2">
                                    <Badge variant="outline" className={`text-xs ${
                                      stmt.sentiment > 0.1 ? 'border-green-600/50 text-green-300/80' :
                                      stmt.sentiment < -0.1 ? 'border-red-600/50 text-red-300/80' :
                                      'border-yellow-600/50 text-yellow-300/80'
                                    }`}>
                                      Sentiment: {stmt.sentiment.toFixed(3)}
                                    </Badge>
                                    {stmt.pattern && (
                                      <Badge variant="outline" className="border-gray-600/50 text-gray-300/80 text-xs">
                                        Pattern: {stmt.pattern.replace(/\\s\+.*/, '').replace(/[\\_]/g, ' ')}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Original Research Opportunities */}
                {researchResult.opportunities && researchResult.opportunities.length > 0 ? (
                  <div>
                    {secAnalysis && (
                      <div className="flex items-center gap-2 mb-4">
                        <Badge variant="outline" className="border-gray-600/50 text-gray-300/80">
                          Web Research Results
                        </Badge>
                      </div>
                    )}
                    <div className="grid gap-4">
                      {researchResult.opportunities.map((opp, index) => (
                        <Card key={index} className="bg-green-900/20 border-green-700/50">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <TrendingUp className="w-5 h-5 text-green-400" />
                                  <h3 className="font-semibold text-white">{opp.title}</h3>
                                  <Badge variant="outline" className="border-green-600 text-green-300">
                                    Score: {opp.opportunity_score}
                                  </Badge>
                                </div>
                                <p className="text-gray-300 text-sm">{opp.snippet}</p>
                                {opp.source === "SEC Filing" && (
                                  <Badge variant="outline" className="mt-2 border-blue-600/50 text-blue-300/80 text-xs">
                                    From SEC Filing
                                  </Badge>
                                )}
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {opp.detected_keywords?.slice(0, 5).map((keyword, idx) => (
                                    <Badge key={idx} variant="outline" className="border-green-600/50 text-green-300/80 text-xs">
                                      {keyword}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              {opp.url && (
                                <a
                                  href={opp.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ml-4 text-blue-400 hover:text-blue-300"
                                >
                                  <ExternalLink className="w-5 h-5" />
                                </a>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : !secAnalysis?.analysis?.nlp_analysis?.forward_looking_statements && (
                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-8 text-center">
                      <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400">No significant opportunities detected in recent research</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Key Findings Tab */}
              <TabsContent value="findings" className="space-y-4">
                {/* SEC Analysis Key Findings */}
                {secAnalysis?.analysis && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Badge variant="outline" className="border-blue-600/50 text-blue-300/80">
                        SEC Filing Analysis
                      </Badge>
                      {secAnalysis.filing_date && (
                        <span className="text-xs text-gray-500">Filing Date: {secAnalysis.filing_date}</span>
                      )}
                    </div>
                    
                    {/* Trading Signals Summary */}
                    {secAnalysis.analysis.trading_signals && (
                      <Card className="bg-gray-800 border-gray-700 mb-4">
                        <CardHeader>
                          <CardTitle className="text-white text-sm">Trading Signals</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div>
                              <div className="text-sm text-gray-400">Recommendation</div>
                              <Badge className={
                                secAnalysis.analysis.trading_signals.recommendation === 'BUY' ? 'bg-green-500/20 text-green-400 border-green-500/50' :
                                secAnalysis.analysis.trading_signals.recommendation === 'SELL' ? 'bg-red-500/20 text-red-400 border-red-500/50' :
                                'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                              }>
                                {secAnalysis.analysis.trading_signals.recommendation || 'HOLD'}
                              </Badge>
                            </div>
                            <div>
                              <div className="text-sm text-gray-400">Confidence</div>
                              <div className="text-xl font-bold text-white">
                                {((secAnalysis.analysis.trading_signals.confidence || 0) * 100).toFixed(1)}%
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-400">Strategy Score</div>
                              <div className={`text-xl font-bold ${
                                (secAnalysis.analysis.strategy_score || 0) > 50 ? 'text-green-400' :
                                (secAnalysis.analysis.strategy_score || 0) > 30 ? 'text-yellow-400' :
                                'text-red-400'
                              }`}>
                                {(secAnalysis.analysis.strategy_score || 0).toFixed(1)}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-400">Signal Strength</div>
                              <div className="text-xl font-bold text-white">
                                {(secAnalysis.analysis.trading_signals.strength || 0).toFixed(1)}%
                              </div>
                            </div>
                          </div>
                          {secAnalysis.analysis.trading_signals.rationale && 
                           secAnalysis.analysis.trading_signals.rationale.length > 0 && (
                            <div className="pt-3 border-t border-gray-700">
                              <div className="text-sm text-gray-400 mb-2">Rationale</div>
                              <ul className="list-disc list-inside space-y-1">
                                {secAnalysis.analysis.trading_signals.rationale.map((r, idx) => (
                                  <li key={idx} className="text-gray-300 text-sm">{r}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                    
                    {/* Sentiment Scores */}
                    {secAnalysis.analysis.nlp_analysis?.sentiment_scores && (
                      <Card className="bg-gray-800 border-gray-700 mb-4">
                        <CardHeader>
                          <CardTitle className="text-white text-sm">Sentiment Analysis</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {secAnalysis.analysis.nlp_analysis.sentiment_scores.overall_sentiment !== undefined && (
                              <div>
                                <div className="text-sm text-gray-400">Overall Sentiment</div>
                                <div className={`text-xl font-bold ${
                                  secAnalysis.analysis.nlp_analysis.sentiment_scores.overall_sentiment > 0.1 ? 'text-green-400' :
                                  secAnalysis.analysis.nlp_analysis.sentiment_scores.overall_sentiment < -0.1 ? 'text-red-400' :
                                  'text-yellow-400'
                                }`}>
                                  {secAnalysis.analysis.nlp_analysis.sentiment_scores.overall_sentiment.toFixed(3)}
                                </div>
                              </div>
                            )}
                            {secAnalysis.analysis.nlp_analysis.sentiment_scores.financial_sentiment !== undefined && (
                              <div>
                                <div className="text-sm text-gray-400">Financial Sentiment</div>
                                <div className={`text-xl font-bold ${
                                  secAnalysis.analysis.nlp_analysis.sentiment_scores.financial_sentiment > 0.1 ? 'text-green-400' :
                                  secAnalysis.analysis.nlp_analysis.sentiment_scores.financial_sentiment < -0.1 ? 'text-red-400' :
                                  'text-yellow-400'
                                }`}>
                                  {secAnalysis.analysis.nlp_analysis.sentiment_scores.financial_sentiment.toFixed(3)}
                                </div>
                              </div>
                            )}
                            {secAnalysis.analysis.nlp_analysis.sentiment_scores.uncertainty_score !== undefined && (
                              <div>
                                <div className="text-sm text-gray-400">Uncertainty Score</div>
                                <div className="text-xl font-bold text-yellow-400">
                                  {secAnalysis.analysis.nlp_analysis.sentiment_scores.uncertainty_score.toFixed(1)}%
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
                
                {/* Original Research Key Findings */}
                {researchResult.key_findings && researchResult.key_findings.length > 0 ? (
                  <div>
                    {secAnalysis && (
                      <div className="flex items-center gap-2 mb-4">
                        <Badge variant="outline" className="border-gray-600/50 text-gray-300/80">
                          Web Research Results
                        </Badge>
                      </div>
                    )}
                    <div className="grid gap-4">
                      {researchResult.key_findings.map((finding, index) => (
                        <Card key={index} className={`bg-gray-800 border-gray-700 ${
                          finding.type === 'RISK' ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-green-500'
                        }`}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge className={
                                    finding.type === 'RISK' 
                                      ? 'bg-red-500/20 text-red-400 border-red-500/50'
                                      : 'bg-green-500/20 text-green-400 border-green-500/50'
                                  }>
                                    {finding.type}
                                  </Badge>
                                  <h3 className="font-semibold text-white">{finding.title}</h3>
                                </div>
                                <p className="text-gray-300 text-sm">{finding.summary}</p>
                                {finding.source === "SEC Filing" && (
                                  <Badge variant="outline" className="mt-2 border-blue-600/50 text-blue-300/80 text-xs">
                                    From SEC Filing
                                  </Badge>
                                )}
                              </div>
                              {finding.url && (
                                <a
                                  href={finding.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ml-4 text-blue-400 hover:text-blue-300"
                                >
                                  <ExternalLink className="w-5 h-5" />
                                </a>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ) : !secAnalysis?.analysis && (
                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-8 text-center">
                      <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400">No key findings available</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Filing Analysis Tab */}
              <TabsContent value="filing" className="space-y-4">
                {(secAnalysis || researchResult.filing_analysis) ? (
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white flex items-center gap-2">
                          <FileText className="w-5 h-5" />
                          SEC Filing Analysis
                        </CardTitle>
                        {((secAnalysis?.filing_filename || researchResult.filing_analysis?.filing_filename) && researchResult?.ticker) && (
                          <Button
                            onClick={() => api.stocks.downloadFiling(researchResult.ticker, secAnalysis?.filing_filename || researchResult.filing_analysis.filing_filename)}
                            variant="outline"
                            size="sm"
                            className="border-blue-600 text-blue-400 hover:bg-blue-900/20"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download Filing
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Filing Date - prefer secAnalysis, fallback to filing_analysis */}
                        {(secAnalysis?.filing_date || researchResult.filing_analysis?.filing_date) && (
                          <div>
                            <div className="text-sm text-gray-400">Filing Date</div>
                            <div className="text-white font-semibold">{secAnalysis?.filing_date || researchResult.filing_analysis.filing_date}</div>
                          </div>
                        )}
                        
                        {/* Recommendation - prefer secAnalysis trading_signals, fallback to filing_analysis */}
                        {((secAnalysis?.analysis?.trading_signals?.recommendation) || researchResult.filing_analysis?.recommendation) && (
                          <div>
                            <div className="text-sm text-gray-400">Recommendation</div>
                            <Badge className={
                              (secAnalysis?.analysis?.trading_signals?.recommendation || researchResult.filing_analysis?.recommendation) === 'BUY' ? 'bg-green-500/20 text-green-400 border-green-500/50' :
                              (secAnalysis?.analysis?.trading_signals?.recommendation || researchResult.filing_analysis?.recommendation) === 'SELL' ? 'bg-red-500/20 text-red-400 border-red-500/50' :
                              'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                            }>
                              {secAnalysis?.analysis?.trading_signals?.recommendation || researchResult.filing_analysis?.recommendation || 'HOLD'}
                            </Badge>
                          </div>
                        )}
                        
                        {/* Confidence - prefer secAnalysis, fallback to filing_analysis */}
                        {(secAnalysis?.analysis?.trading_signals?.confidence !== undefined || researchResult.filing_analysis?.confidence !== undefined) && (
                          <div>
                            <div className="text-sm text-gray-400">Confidence</div>
                            <div className="text-xl font-bold text-white">
                              {((secAnalysis?.analysis?.trading_signals?.confidence || researchResult.filing_analysis?.confidence || 0) * 100).toFixed(1)}%
                            </div>
                          </div>
                        )}
                        
                        {/* Strategy Score - prefer secAnalysis, fallback to filing_analysis */}
                        {(secAnalysis?.analysis?.strategy_score !== undefined || researchResult.filing_analysis?.strategy_score !== undefined) && (
                          <div>
                            <div className="text-sm text-gray-400">Strategy Score</div>
                            <div className={`text-xl font-bold ${
                              (secAnalysis?.analysis?.strategy_score ?? researchResult.filing_analysis?.strategy_score ?? 0) > (secAnalysis?.analysis?.strategy_score !== undefined ? 50 : 0.3) ? 'text-green-400' :
                              (secAnalysis?.analysis?.strategy_score ?? researchResult.filing_analysis?.strategy_score ?? 0) > (secAnalysis?.analysis?.strategy_score !== undefined ? 30 : -0.3) ? 'text-yellow-400' :
                              'text-red-400'
                            }`}>
                              {(secAnalysis?.analysis?.strategy_score ?? researchResult.filing_analysis?.strategy_score ?? 0).toFixed(secAnalysis?.analysis?.strategy_score !== undefined ? 1 : 3)}
                            </div>
                          </div>
                        )}
                        
                        {/* Overall Sentiment - from secAnalysis */}
                        {secAnalysis?.analysis?.nlp_analysis?.sentiment_scores?.overall_sentiment !== undefined && (
                          <div>
                            <div className="text-sm text-gray-400">Overall Sentiment</div>
                            <div className={`text-xl font-bold ${
                              secAnalysis.analysis.nlp_analysis.sentiment_scores.overall_sentiment > 0.1 ? 'text-green-400' :
                              secAnalysis.analysis.nlp_analysis.sentiment_scores.overall_sentiment < -0.1 ? 'text-red-400' :
                              'text-yellow-400'
                            }`}>
                              {secAnalysis.analysis.nlp_analysis.sentiment_scores.overall_sentiment.toFixed(3)}
                            </div>
                          </div>
                        )}
                        
                        {/* Sentiment Score - from filing_analysis (different from overall_sentiment) */}
                        {researchResult.filing_analysis?.sentiment_score !== undefined && (
                          <div>
                            <div className="text-sm text-gray-400">Sentiment Score</div>
                            <div className={`text-xl font-bold ${
                              researchResult.filing_analysis.sentiment_score > 0.1 ? 'text-green-400' :
                              researchResult.filing_analysis.sentiment_score < -0.1 ? 'text-red-400' :
                              'text-yellow-400'
                            }`}>
                              {researchResult.filing_analysis.sentiment_score.toFixed(3)}
                            </div>
                            {researchResult.nlp_analysis?.enhanced_descriptions?.sentiment_description && (
                              <div className="mt-2 p-2 bg-gray-700/30 rounded text-xs text-gray-300">
                                {researchResult.nlp_analysis.enhanced_descriptions.sentiment_description}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Financial Sentiment - from secAnalysis */}
                        {secAnalysis?.analysis?.nlp_analysis?.sentiment_scores?.financial_sentiment !== undefined && (
                          <div>
                            <div className="text-sm text-gray-400">Financial Sentiment</div>
                            <div className={`text-xl font-bold ${
                              secAnalysis.analysis.nlp_analysis.sentiment_scores.financial_sentiment > 0.1 ? 'text-green-400' :
                              secAnalysis.analysis.nlp_analysis.sentiment_scores.financial_sentiment < -0.1 ? 'text-red-400' :
                              'text-yellow-400'
                            }`}>
                              {secAnalysis.analysis.nlp_analysis.sentiment_scores.financial_sentiment.toFixed(3)}
                            </div>
                          </div>
                        )}
                        
                        {/* Uncertainty Score - from secAnalysis */}
                        {secAnalysis?.analysis?.nlp_analysis?.sentiment_scores?.uncertainty_score !== undefined && (
                          <div>
                            <div className="text-sm text-gray-400">Uncertainty Score</div>
                            <div className="text-xl font-bold text-yellow-400">
                              {secAnalysis.analysis.nlp_analysis.sentiment_scores.uncertainty_score.toFixed(1)}%
                            </div>
                          </div>
                        )}
                        
                        {/* Risk Categories/Count - prefer secAnalysis, fallback to filing_analysis */}
                        {(secAnalysis?.analysis?.nlp_analysis?.risk_analysis?.risk_categories?.length !== undefined || researchResult.filing_analysis?.risk_factors_count !== undefined) && (
                          <div>
                            <div className="text-sm text-gray-400">Risk {secAnalysis?.analysis?.nlp_analysis?.risk_analysis ? 'Categories' : 'Factors'}</div>
                            <div className="text-xl font-bold text-white">
                              {secAnalysis?.analysis?.nlp_analysis?.risk_analysis?.risk_categories?.length || researchResult.filing_analysis.risk_factors_count || 0}
                            </div>
                          </div>
                        )}
                        
                        {/* Risk Severity Score - from secAnalysis */}
                        {secAnalysis?.analysis?.nlp_analysis?.risk_analysis?.severity_score !== undefined && (
                          <div>
                            <div className="text-sm text-gray-400">Risk Severity Score</div>
                            <div className={`text-xl font-bold ${
                              secAnalysis.analysis.nlp_analysis.risk_analysis.severity_score > 50 ? 'text-red-400' :
                              secAnalysis.analysis.nlp_analysis.risk_analysis.severity_score > 30 ? 'text-yellow-400' :
                              'text-green-400'
                            }`}>
                              {secAnalysis.analysis.nlp_analysis.risk_analysis.severity_score.toFixed(1)}%
                            </div>
                          </div>
                        )}
                        
                        {/* Forward-Looking Statements - prefer secAnalysis, fallback to filing_analysis */}
                        {(secAnalysis?.analysis?.nlp_analysis?.forward_looking_statements?.length !== undefined || researchResult.filing_analysis?.forward_looking_statements_count !== undefined) && (
                          <div>
                            <div className="text-sm text-gray-400">Forward-Looking Statements</div>
                            <div className="text-xl font-bold text-white">
                              {secAnalysis?.analysis?.nlp_analysis?.forward_looking_statements?.length || researchResult.filing_analysis.forward_looking_statements_count || 0}
                            </div>
                          </div>
                        )}
                        
                        {/* Summary - from filing_analysis */}
                        {researchResult.filing_analysis?.summary && (
                          <div>
                            <div className="text-sm text-gray-400 mb-2">Summary</div>
                            <p className="text-gray-300 text-sm">{researchResult.filing_analysis.summary}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-8 text-center">
                      <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400">No filing analysis available. 10-K/10-Q filing may not be found for this ticker.</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* NLP Analysis Tab */}
              {researchResult.nlp_analysis && (
                <TabsContent value="nlp" className="space-y-4">
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        NLP Analysis from Cached Data
                        {researchResult.filing_analysis?.cached && (
                          <Badge className="ml-2 bg-green-500/20 text-green-400 border-green-500/50">
                            Cached
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {researchResult.nlp_analysis.analysis ? (
                        <div className="space-y-6">
                          {/* Executive Summary */}
                          {researchResult.nlp_analysis.enhanced_descriptions?.executive_summary && (
                            <div>
                              <h3 className="text-lg font-semibold text-white mb-3">Executive Summary</h3>
                              <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                                <p className="text-gray-200 leading-relaxed">
                                  {researchResult.nlp_analysis.enhanced_descriptions.executive_summary}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Trading Signals */}
                          {researchResult.nlp_analysis.analysis.trading_signals && (
                            <div>
                              <h3 className="text-lg font-semibold text-white mb-3">Trading Signals</h3>
                              {researchResult.nlp_analysis.enhanced_descriptions?.trading_signal_description && (
                                <div className="mb-4 p-3 bg-blue-900/20 rounded-lg border border-blue-700/50">
                                  <p className="text-gray-200 text-sm leading-relaxed">
                                    {researchResult.nlp_analysis.enhanced_descriptions.trading_signal_description}
                                  </p>
                                </div>
                              )}
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <div className="text-sm text-gray-400">Recommendation</div>
                                  <Badge className={
                                    researchResult.nlp_recommendation === 'BUY' ? 'bg-green-500/20 text-green-400 border-green-500/50' :
                                    researchResult.nlp_recommendation === 'SELL' ? 'bg-red-500/20 text-red-400 border-red-500/50' :
                                    'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                                  }>
                                    {researchResult.nlp_recommendation || researchResult.nlp_analysis.analysis.trading_signals.recommendation || 'HOLD'}
                                  </Badge>
                                </div>
                                <div>
                                  <div className="text-sm text-gray-400">Confidence</div>
                                  <div className="text-xl font-bold text-white">
                                    {((researchResult.nlp_confidence || researchResult.nlp_analysis.analysis.trading_signals.confidence || 0) * 100).toFixed(1)}%
                                  </div>
                                </div>
                                <div>
                                  <div className="text-sm text-gray-400">Strategy Score</div>
                                  <div className={`text-xl font-bold ${
                                    (researchResult.nlp_analysis.analysis.strategy_score || 0) > 0.3 ? 'text-green-400' :
                                    (researchResult.nlp_analysis.analysis.strategy_score || 0) < -0.3 ? 'text-red-400' :
                                    'text-yellow-400'
                                  }`}>
                                    {(researchResult.nlp_analysis.analysis.strategy_score || 0).toFixed(3)}
                                  </div>
                                </div>
                                {researchResult.nlp_analysis.filing_date && (
                                  <div>
                                    <div className="text-sm text-gray-400">Filing Date</div>
                                    <div className="text-white font-semibold">{researchResult.nlp_analysis.filing_date}</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Sentiment Scores */}
                          {researchResult.nlp_analysis.analysis.nlp_analysis?.sentiment_scores && (
                            <div>
                              <h3 className="text-lg font-semibold text-white mb-3">Sentiment Analysis</h3>
                              {researchResult.nlp_analysis.enhanced_descriptions?.sentiment_description && (
                                <div className="mb-4 p-3 bg-purple-900/20 rounded-lg border border-purple-700/50">
                                  <p className="text-gray-200 text-sm leading-relaxed">
                                    {researchResult.nlp_analysis.enhanced_descriptions.sentiment_description}
                                  </p>
                                </div>
                              )}
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <div className="text-sm text-gray-400">Overall Sentiment</div>
                                  <div className={`text-xl font-bold ${
                                    (researchResult.nlp_analysis.analysis.nlp_analysis.sentiment_scores.overall_sentiment || 0) > 0.1 ? 'text-green-400' :
                                    (researchResult.nlp_analysis.analysis.nlp_analysis.sentiment_scores.overall_sentiment || 0) < -0.1 ? 'text-red-400' :
                                    'text-yellow-400'
                                  }`}>
                                    {(researchResult.nlp_analysis.analysis.nlp_analysis.sentiment_scores.overall_sentiment || 0).toFixed(3)}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-sm text-gray-400">Financial Sentiment</div>
                                  <div className={`text-xl font-bold ${
                                    (researchResult.nlp_analysis.analysis.nlp_analysis.sentiment_scores.financial_sentiment || 0) > 0.1 ? 'text-green-400' :
                                    (researchResult.nlp_analysis.analysis.nlp_analysis.sentiment_scores.financial_sentiment || 0) < -0.1 ? 'text-red-400' :
                                    'text-yellow-400'
                                  }`}>
                                    {(researchResult.nlp_analysis.analysis.nlp_analysis.sentiment_scores.financial_sentiment || 0).toFixed(3)}
                                  </div>
                                </div>
                                {researchResult.nlp_analysis.analysis.nlp_analysis.sentiment_scores.uncertainty_score !== undefined && (
                                  <div>
                                    <div className="text-sm text-gray-400">Uncertainty Score</div>
                                    <div className="text-xl font-bold text-yellow-400">
                                      {researchResult.nlp_analysis.analysis.nlp_analysis.sentiment_scores.uncertainty_score.toFixed(1)}%
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Risk Analysis */}
                          {researchResult.nlp_analysis.analysis.nlp_analysis?.risk_analysis && (
                            <div>
                              <h3 className="text-lg font-semibold text-white mb-3">Risk Analysis</h3>
                              {researchResult.nlp_analysis.enhanced_descriptions?.risk_description && (
                                <div className="mb-4 p-3 bg-red-900/20 rounded-lg border border-red-700/50">
                                  <p className="text-gray-200 text-sm leading-relaxed">
                                    {researchResult.nlp_analysis.enhanced_descriptions.risk_description}
                                  </p>
                                </div>
                              )}
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <div className="text-sm text-gray-400">Risk Factors Count</div>
                                  <div className="text-xl font-bold text-white">
                                    {researchResult.nlp_analysis.analysis.nlp_analysis.risk_analysis.risk_factors?.length || 0}
                                  </div>
                                </div>
                                {researchResult.nlp_analysis.analysis.nlp_analysis.risk_analysis.severity !== undefined && (
                                  <div>
                                    <div className="text-sm text-gray-400">Risk Severity</div>
                                    <div className={`text-xl font-bold ${
                                      researchResult.nlp_analysis.analysis.nlp_analysis.risk_analysis.severity > 50 ? 'text-red-400' :
                                      researchResult.nlp_analysis.analysis.nlp_analysis.risk_analysis.severity > 30 ? 'text-yellow-400' :
                                      'text-green-400'
                                    }`}>
                                      {researchResult.nlp_analysis.analysis.nlp_analysis.risk_analysis.severity.toFixed(1)}%
                                    </div>
                                  </div>
                                )}
                              </div>
                              {researchResult.nlp_analysis.analysis.nlp_analysis.risk_analysis.risk_factors && 
                               researchResult.nlp_analysis.analysis.nlp_analysis.risk_analysis.risk_factors.length > 0 && (
                                <div className="mt-3">
                                  <div className="text-sm text-gray-400 mb-2">Top Risk Keywords</div>
                                  <div className="flex flex-wrap gap-2">
                                    {researchResult.nlp_analysis.analysis.nlp_analysis.risk_analysis.risk_factors.slice(0, 10).map((risk, idx) => (
                                      <Badge key={idx} variant="outline" className="border-red-600/50 text-red-300/80">
                                        {risk}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Forward-Looking Statements */}
                          {researchResult.nlp_analysis.analysis.nlp_analysis?.forward_looking_statements && (
                            <div>
                              <h3 className="text-lg font-semibold text-white mb-3">
                                Forward-Looking Statements ({researchResult.nlp_analysis.analysis.nlp_analysis.forward_looking_statements.length})
                              </h3>
                              {researchResult.nlp_analysis.enhanced_descriptions?.forward_statements_summary && (
                                <div className="mb-4 p-3 bg-green-900/20 rounded-lg border border-green-700/50">
                                  <p className="text-gray-200 text-sm leading-relaxed">
                                    {researchResult.nlp_analysis.enhanced_descriptions.forward_statements_summary}
                                  </p>
                                </div>
                              )}
                              <div className="space-y-2 max-h-64 overflow-y-auto">
                                {researchResult.nlp_analysis.analysis.nlp_analysis.forward_looking_statements.slice(0, 5).map((statement, idx) => (
                                  <div key={idx} className="p-3 bg-gray-700/50 rounded border border-gray-600">
                                    <p className="text-gray-300 text-sm">{statement.statement || statement}</p>
                                    {statement.sentiment !== undefined && (
                                      <div className="mt-1 text-xs text-gray-400">
                                        Sentiment: {statement.sentiment.toFixed(3)}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Cache Info */}
                          {researchResult.nlp_analysis.cached_at && (
                            <div className="pt-4 border-t border-gray-700">
                              <div className="text-xs text-gray-500">
                                Cached at: {new Date(researchResult.nlp_analysis.cached_at).toLocaleString()}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-400">No NLP analysis data available</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {/* Quantitative Research Tab */}
              {researchResult.quantitative_analysis && (
                <TabsContent value="quantitative" className="space-y-4">
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Quantitative Research Analysis
                        {researchResult.quantitative_analysis.method === 'aws_bedrock' && (
                          <Badge className="ml-2 bg-blue-500/20 text-blue-400 border-blue-500/50">
                            AI-Generated
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-invert max-w-none">
                        <div className="whitespace-pre-wrap text-gray-200 leading-relaxed">
                          {researchResult.quantitative_analysis.explanation}
                        </div>
                        {researchResult.quantitative_analysis.sources_count !== undefined && (
                          <div className="mt-4 pt-4 border-t border-gray-700">
                            <div className="text-xs text-gray-500">
                              Sources analyzed: {researchResult.quantitative_analysis.sources_count} pages,
                              Search results: {researchResult.quantitative_analysis.search_results_count || 0}
                              {researchResult.quantitative_analysis.model && (
                                <span> • Model: {researchResult.quantitative_analysis.model}</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {/* Chat/Questions Tab */}
              <TabsContent value="chat" className="space-y-4">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Info className="w-5 h-5" />
                      Ask Questions About {researchResult.company_name} ({researchResult.ticker})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Conversation History */}
                    <div className="space-y-4 mb-4 max-h-96 overflow-y-auto pr-2">
                      {conversationHistory.length === 0 ? (
                        <div className="text-center py-8">
                          <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-400">
                            Ask me questions about {researchResult.company_name} ({researchResult.ticker})
                          </p>
                          <p className="text-gray-500 text-sm mt-2">
                            I can answer based on the research I've done. Try asking about risks, opportunities, financials, or recent news.
                          </p>
                        </div>
                      ) : (
                        conversationHistory.map((msg, idx) => (
                          <div
                            key={idx}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-lg p-3 ${
                                msg.role === 'user'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-700 text-gray-200'
                              }`}
                            >
                              <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                            </div>
                          </div>
                        ))
                      )}
                      {isAnswering && (
                        <div className="flex justify-start">
                          <div className="bg-gray-700 text-gray-200 rounded-lg p-3">
                            <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                            Thinking...
                          </div>
                        </div>
                      )}
                      <div ref={conversationEndRef} />
                    </div>

                    {/* Question Input */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Ask a question about the company..."
                        value={followupQuestion}
                        onChange={(e) => setFollowupQuestion(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleFollowup();
                          }
                        }}
                        className="bg-gray-900 border-gray-700 text-white flex-1"
                        disabled={isAnswering || !researchResult}
                      />
                      <Button
                        onClick={handleFollowup}
                        disabled={!followupQuestion.trim() || isAnswering || !researchResult}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {isAnswering ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Answering...
                          </>
                        ) : (
                          <>
                            <Search className="w-4 h-4 mr-2" />
                            Ask
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Empty State */}
        {!researchResult && !isResearching && !error && (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="pt-12 pb-12 text-center">
              <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Start Market Research</h3>
              <p className="text-gray-400">
                Enter a ticker symbol above to conduct AI-powered market research.
                Our system will search the web for risks, opportunities, and key findings.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

