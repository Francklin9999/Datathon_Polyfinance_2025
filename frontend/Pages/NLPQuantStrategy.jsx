import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
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
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, 
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';

export default function NLPQuantStrategy() {
  const [ticker, setTicker] = useState('');
  const [documentText, setDocumentText] = useState('');
  const [previousFiling, setPreviousFiling] = useState('');
  const [benchmarkTickers, setBenchmarkTickers] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    if (!ticker) {
      setError('Ticker symbol is required');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const benchmarkList = benchmarkTickers 
        ? benchmarkTickers.split(',').map(t => t.trim().toUpperCase()).filter(Boolean)
        : [];

      const result = await base44.analytics.nlpQuantStrategy(
        ticker.toUpperCase(),
        documentText || undefined, // Document text is optional - will auto-find from disk
        previousFiling || undefined,
        benchmarkList.length > 0 ? benchmarkList : undefined
      );

      setAnalysis(result);
    } catch (err) {
      console.error('NLP analysis error:', err);
      setError(err.message || 'Failed to perform NLP analysis');
    } finally {
      setIsAnalyzing(false);
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
              Advanced NLP analysis using spaCy, NLTK, and HuggingFace embeddings
            </p>
          </div>
          <Link to={createPageUrl('Home')}>
            <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Input Section */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">10K/10Q Filing Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Ticker Symbol *
                </label>
                <Input
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value)}
                  placeholder="e.g., AAPL"
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">
                  Benchmark Tickers (comma-separated)
                </label>
                <Input
                  value={benchmarkTickers}
                  onChange={(e) => setBenchmarkTickers(e.target.value)}
                  placeholder="e.g., MSFT, GOOGL, AMZN"
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Document Text (10K/10Q) - Optional
              </label>
              <p className="text-xs text-gray-500 mb-2">
                If not provided, the system will automatically search for 10K/10Q files on disk for the specified ticker.
              </p>
              <Textarea
                value={documentText}
                onChange={(e) => setDocumentText(e.target.value)}
                placeholder="Paste 10K or 10Q filing text here (optional - will auto-find from disk if blank)..."
                className="bg-gray-900 border-gray-700 text-white min-h-[200px] font-mono text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Previous Filing Text (Optional - for comparison)
              </label>
              <Textarea
                value={previousFiling}
                onChange={(e) => setPreviousFiling(e.target.value)}
                placeholder="Paste previous year's filing for comparison..."
                className="bg-gray-900 border-gray-700 text-white min-h-[150px] font-mono text-sm"
              />
            </div>

            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !ticker}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing with NLP...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Run NLP Strategy Analysis
                </>
              )}
            </Button>

            {error && (
              <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
                <AlertCircle className="w-5 h-5 inline mr-2" />
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {analysis && (
          <Tabs defaultValue="signals" className="space-y-4">
            <TabsList className="bg-gray-800 border-gray-700">
              <TabsTrigger value="signals" className="text-gray-300 data-[state=active]:text-white">
                Trading Signals
              </TabsTrigger>
              <TabsTrigger value="sentiment" className="text-gray-300 data-[state=active]:text-white">
                Sentiment Analysis
              </TabsTrigger>
              <TabsTrigger value="entities" className="text-gray-300 data-[state=active]:text-white">
                Entity Extraction
              </TabsTrigger>
              <TabsTrigger value="risk" className="text-gray-300 data-[state=active]:text-white">
                Risk Analysis
              </TabsTrigger>
              <TabsTrigger value="methodology" className="text-gray-300 data-[state=active]:text-white">
                Methodology
              </TabsTrigger>
            </TabsList>

            {/* Trading Signals Tab */}
            <TabsContent value="signals" className="space-y-4">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-purple-400" />
                    Trading Signals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analysis.trading_signals && (
                    <div className="space-y-6">
                      {/* Signal Card */}
                      <div className={`p-6 rounded-lg border-2 ${getSignalColor(analysis.trading_signals.signal)}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getSignalIcon(analysis.trading_signals.signal)}
                            <div>
                              <h3 className="text-2xl font-bold">
                                {analysis.trading_signals.signal}
                              </h3>
                              <p className="text-sm opacity-80">
                                {analysis.trading_signals.recommendation}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold">
                              {analysis.strategy_score?.toFixed(1) || '0.0'}
                            </div>
                            <div className="text-sm opacity-80">Strategy Score</div>
                            <div className="text-sm opacity-60 mt-1">
                              Confidence: {analysis.confidence?.toFixed(1) || '0'}%
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Component Scores */}
                      <div>
                        <h4 className="text-white font-semibold mb-4">Component Scores</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {Object.entries(analysis.trading_signals.components || {}).map(([key, value]) => (
                            <Card key={key} className="bg-gray-900 border-gray-700">
                              <CardContent className="p-4">
                                <div className="text-sm text-gray-400 capitalize mb-2">
                                  {key.replace('_', ' ')}
                                </div>
                                <div className="text-2xl font-bold text-white">
                                  {typeof value === 'number' ? value.toFixed(1) : value}
                                </div>
                                <div className="mt-2">
                                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-purple-500 transition-all"
                                      style={{ width: `${Math.max(0, Math.min(100, typeof value === 'number' ? value : 0))}%` }}
                                    />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>

                      {/* Rationale */}
                      {analysis.trading_signals.rationale && analysis.trading_signals.rationale.length > 0 && (
                        <div>
                          <h4 className="text-white font-semibold mb-3">Rationale</h4>
                          <div className="space-y-2">
                            {analysis.trading_signals.rationale.map((rationale, idx) => (
                              <div key={idx} className="flex items-start gap-2 p-3 bg-gray-900 rounded-lg">
                                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                                <span className="text-gray-300">{rationale}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Sentiment Analysis Tab */}
            <TabsContent value="sentiment" className="space-y-4">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Sentiment Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  {analysis.nlp_analysis?.sentiment_scores && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="bg-gray-900 border-gray-700">
                          <CardContent className="p-4 text-center">
                            <div className="text-sm text-gray-400 mb-2">Overall Sentiment</div>
                            <div className={`text-2xl font-bold ${
                              analysis.nlp_analysis.sentiment_scores.overall_sentiment > 0 
                                ? 'text-green-400' 
                                : analysis.nlp_analysis.sentiment_scores.overall_sentiment < 0 
                                  ? 'text-red-400' 
                                  : 'text-yellow-400'
                            }`}>
                              {analysis.nlp_analysis.sentiment_scores.overall_sentiment?.toFixed(3) || '0.000'}
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="bg-gray-900 border-gray-700">
                          <CardContent className="p-4 text-center">
                            <div className="text-sm text-gray-400 mb-2">Financial Sentiment</div>
                            <div className={`text-2xl font-bold ${
                              analysis.nlp_analysis.sentiment_scores.financial_sentiment > 0 
                                ? 'text-green-400' 
                                : 'text-red-400'
                            }`}>
                              {analysis.nlp_analysis.sentiment_scores.financial_sentiment?.toFixed(3) || '0.000'}
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="bg-gray-900 border-gray-700">
                          <CardContent className="p-4 text-center">
                            <div className="text-sm text-gray-400 mb-2">Uncertainty Score</div>
                            <div className="text-2xl font-bold text-yellow-400">
                              {analysis.nlp_analysis.sentiment_scores.uncertainty_score?.toFixed(1) || '0.0'}
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="bg-gray-900 border-gray-700">
                          <CardContent className="p-4 text-center">
                            <div className="text-sm text-gray-400 mb-2">Sentiment Volatility</div>
                            <div className="text-2xl font-bold text-purple-400">
                              {analysis.nlp_analysis.sentiment_scores.sentiment_volatility?.toFixed(3) || '0.000'}
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* VADER Scores */}
                      {analysis.nlp_analysis.sentiment_scores.vader_scores && (
                        <div>
                          <h4 className="text-white font-semibold mb-3">VADER Sentiment Scores</h4>
                          <div className="grid grid-cols-4 gap-4">
                            {Object.entries(analysis.nlp_analysis.sentiment_scores.vader_scores).map(([key, value]) => (
                              <Card key={key} className="bg-gray-900 border-gray-700">
                                <CardContent className="p-4">
                                  <div className="text-sm text-gray-400 capitalize mb-1">{key}</div>
                                  <div className="text-xl font-bold text-white">
                                    {typeof value === 'number' ? value.toFixed(3) : value}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Forward-Looking Statements */}
                      {analysis.nlp_analysis.forward_looking_statements && 
                       analysis.nlp_analysis.forward_looking_statements.length > 0 && (
                        <div>
                          <h4 className="text-white font-semibold mb-3">
                            Forward-Looking Statements ({analysis.nlp_analysis.forward_looking_statements.length})
                          </h4>
                          <div className="space-y-3 max-h-[400px] overflow-y-auto">
                            {analysis.nlp_analysis.forward_looking_statements.map((stmt, idx) => (
                              <Card key={idx} className="bg-gray-900 border-gray-700">
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between gap-4">
                                    <p className="text-gray-300 text-sm flex-1">{stmt.statement}</p>
                                    <Badge className={
                                      stmt.sentiment > 0 ? 'bg-green-500' : 
                                      stmt.sentiment < 0 ? 'bg-red-500' : 
                                      'bg-yellow-500'
                                    }>
                                      {stmt.sentiment?.toFixed(2) || '0.00'}
                                    </Badge>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Entity Extraction Tab */}
            <TabsContent value="entities" className="space-y-4">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Entity Extraction</CardTitle>
                </CardHeader>
                <CardContent>
                  {analysis.nlp_analysis?.entities && (
                    <div className="space-y-6">
                      {/* Companies */}
                      {analysis.nlp_analysis.entities.companies && 
                       analysis.nlp_analysis.entities.companies.length > 0 && (
                        <div>
                          <h4 className="text-white font-semibold mb-3">
                            Companies/Organizations ({analysis.nlp_analysis.entities.companies.length})
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {analysis.nlp_analysis.entities.companies.slice(0, 20).map((ent, idx) => (
                              <Badge key={idx} className="bg-blue-500/20 text-blue-300 border-blue-500/50">
                                {ent.text}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Financial Metrics */}
                      {analysis.nlp_analysis.entities.financial_metrics && 
                       analysis.nlp_analysis.entities.financial_metrics.length > 0 && (
                        <div>
                          <h4 className="text-white font-semibold mb-3">
                            Financial Metrics ({analysis.nlp_analysis.entities.financial_metrics.length})
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {analysis.nlp_analysis.entities.financial_metrics.slice(0, 10).map((metric, idx) => (
                              <Card key={idx} className="bg-gray-900 border-gray-700">
                                <CardContent className="p-3">
                                  <div className="text-sm font-semibold text-purple-400 capitalize mb-1">
                                    {metric.metric}
                                  </div>
                                  <div className="text-xs text-gray-400">{metric.context}</div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Amounts */}
                      {analysis.nlp_analysis.entities.amounts && 
                       analysis.nlp_analysis.entities.amounts.length > 0 && (
                        <div>
                          <h4 className="text-white font-semibold mb-3">
                            Financial Amounts ({analysis.nlp_analysis.entities.amounts.length})
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {analysis.nlp_analysis.entities.amounts.slice(0, 30).map((amt, idx) => (
                              <Badge key={idx} className="bg-green-500/20 text-green-300 border-green-500/50">
                                {amt.text}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Risk Analysis Tab */}
            <TabsContent value="risk" className="space-y-4">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Risk Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  {analysis.nlp_analysis?.risk_analysis && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <Card className="bg-gray-900 border-gray-700">
                          <CardContent className="p-4 text-center">
                            <div className="text-sm text-gray-400 mb-2">Risk Count</div>
                            <div className="text-3xl font-bold text-red-400">
                              {analysis.nlp_analysis.risk_analysis.risk_count || 0}
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="bg-gray-900 border-gray-700">
                          <CardContent className="p-4 text-center">
                            <div className="text-sm text-gray-400 mb-2">Severity Score</div>
                            <div className="text-3xl font-bold text-orange-400">
                              {analysis.nlp_analysis.risk_analysis.severity_score?.toFixed(1) || '0.0'}
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="bg-gray-900 border-gray-700">
                          <CardContent className="p-4 text-center">
                            <div className="text-sm text-gray-400 mb-2">Key Risks</div>
                            <div className="text-3xl font-bold text-yellow-400">
                              {analysis.nlp_analysis.risk_analysis.key_risks?.length || 0}
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Risk Categories */}
                      {analysis.nlp_analysis.risk_analysis.risk_categories && 
                       analysis.nlp_analysis.risk_analysis.risk_categories.length > 0 && (
                        <div>
                          <h4 className="text-white font-semibold mb-3">Risk Categories</h4>
                          <div className="space-y-2">
                            {analysis.nlp_analysis.risk_analysis.risk_categories.map((cat, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                                <span className="text-gray-300 capitalize">{cat.category.replace('_', ' ')}</span>
                                <Badge className="bg-red-500/20 text-red-300 border-red-500/50">
                                  {cat.count} mentions
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Key Risks */}
                      {analysis.nlp_analysis.risk_analysis.key_risks && 
                       analysis.nlp_analysis.risk_analysis.key_risks.length > 0 && (
                        <div>
                          <h4 className="text-white font-semibold mb-3">Key Risk Factors</h4>
                          <div className="space-y-3">
                            {analysis.nlp_analysis.risk_analysis.key_risks.map((risk, idx) => (
                              <Card key={idx} className="bg-gray-900 border-gray-700">
                                <CardContent className="p-4">
                                  <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                                    <p className="text-gray-300 text-sm">{risk}</p>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Anomalies */}
                      {analysis.nlp_analysis.anomalies && 
                       analysis.nlp_analysis.anomalies.length > 0 && (
                        <div>
                          <h4 className="text-white font-semibold mb-3">
                            Detected Anomalies ({analysis.nlp_analysis.anomalies.length})
                          </h4>
                          <div className="space-y-3">
                            {analysis.nlp_analysis.anomalies.map((anomaly, idx) => (
                              <Card key={idx} className="bg-yellow-500/10 border-yellow-500/50">
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <AlertCircle className="w-5 h-5 text-yellow-400" />
                                        <span className="font-semibold text-yellow-300 capitalize">
                                          {anomaly.type?.replace('_', ' ')}
                                        </span>
                                        <Badge className={
                                          anomaly.severity === 'high' ? 'bg-red-500' : 'bg-yellow-500'
                                        }>
                                          {anomaly.severity}
                                        </Badge>
                                      </div>
                                      {anomaly.context && (
                                        <p className="text-gray-300 text-sm mt-2">{anomaly.context}</p>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Methodology Tab */}
            <TabsContent value="methodology" className="space-y-4">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">NLP Methodology</CardTitle>
                </CardHeader>
                <CardContent>
                  {analysis.methodology && (
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-white font-semibold mb-3">NLP Libraries Used</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {Object.entries(analysis.methodology.nlp_libraries || {}).map(([lib, desc]) => (
                            <Card key={lib} className="bg-gray-900 border-gray-700">
                              <CardContent className="p-4">
                                <div className="text-lg font-bold text-purple-400 mb-2 capitalize">{lib}</div>
                                <div className="text-sm text-gray-400">{desc}</div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-white font-semibold mb-3">Techniques Applied</h4>
                        <div className="space-y-2">
                          {(analysis.methodology.techniques || []).map((technique, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-3 bg-gray-900 rounded-lg">
                              <Sparkles className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-300">{technique}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

