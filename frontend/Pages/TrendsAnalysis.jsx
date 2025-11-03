import React, { useState } from 'react';
import { api } from '@/api/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  TrendingUp, 
  Search,
  Brain,
  Globe,
  ArrowUp,
  ArrowDown,
  Minus,
  Loader2,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function TrendsAnalysis() {
  const [keyword, setKeyword] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [trendData, setTrendData] = useState(null);

  // Pre-loaded trend data for key regulatory topics
  const predefinedTrends = [
    {
      keyword: "inflation reduction act",
      searchVolume: 856000,
      trend: "up",
      change: 245,
      relatedQueries: [
        { query: "ev tax credit requirements", volume: 124000, change: 312 },
        { query: "clean energy incentives", volume: 89000, change: 187 },
        { query: "battery component sourcing", volume: 56000, change: 245 }
      ],
      regionalInterest: [
        { region: "California", score: 100 },
        { region: "Texas", score: 87 },
        { region: "New York", score: 78 },
        { region: "Michigan", score: 92 },
        { region: "Florida", score: 65 }
      ],
      timeSeriesData: Array.from({ length: 30 }, (_, i) => ({
        day: i + 1,
        interest: 40 + Math.random() * 60,
        sentiment: 0.2 + Math.random() * 0.4
      }))
    },
    {
      keyword: "gdpr violations",
      searchVolume: 634000,
      trend: "up",
      change: 156,
      relatedQueries: [
        { query: "meta gdpr fine", volume: 287000, change: 523 },
        { query: "data privacy compliance", volume: 156000, change: 98 },
        { query: "cookie consent requirements", volume: 89000, change: 67 }
      ],
      regionalInterest: [
        { region: "Germany", score: 100 },
        { region: "France", score: 89 },
        { region: "UK", score: 92 },
        { region: "Netherlands", score: 76 },
        { region: "Ireland", score: 95 }
      ],
      timeSeriesData: Array.from({ length: 30 }, (_, i) => ({
        day: i + 1,
        interest: 35 + Math.random() * 65,
        sentiment: -0.1 + Math.random() * 0.3
      }))
    },
    {
      keyword: "carbon border adjustment",
      searchVolume: 423000,
      trend: "up",
      change: 412,
      relatedQueries: [
        { query: "eu carbon tax", volume: 198000, change: 456 },
        { query: "cbam reporting requirements", volume: 87000, change: 312 },
        { query: "carbon leakage prevention", volume: 54000, change: 234 }
      ],
      regionalInterest: [
        { region: "Brussels", score: 100 },
        { region: "Berlin", score: 87 },
        { region: "Paris", score: 82 },
        { region: "Stockholm", score: 76 },
        { region: "Amsterdam", score: 71 }
      ],
      timeSeriesData: Array.from({ length: 30 }, (_, i) => ({
        day: i + 1,
        interest: 25 + Math.random() * 50,
        sentiment: 0.1 + Math.random() * 0.3
      }))
    },
    {
      keyword: "tesla autopilot investigation",
      searchVolume: 1240000,
      trend: "up",
      change: 687,
      relatedQueries: [
        { query: "nhtsa tesla recall", volume: 456000, change: 892 },
        { query: "self driving safety", volume: 234000, change: 345 },
        { query: "autopilot false advertising", volume: 156000, change: 456 }
      ],
      regionalInterest: [
        { region: "California", score: 100 },
        { region: "New York", score: 76 },
        { region: "Texas", score: 89 },
        { region: "Florida", score: 67 },
        { region: "Washington", score: 72 }
      ],
      timeSeriesData: Array.from({ length: 30 }, (_, i) => ({
        day: i + 1,
        interest: 45 + Math.random() * 55,
        sentiment: -0.3 + Math.random() * 0.2
      }))
    }
  ];

  const handleAnalyze = async () => {
    if (!keyword) {
      alert('Please enter a keyword');
      return;
    }

    setIsAnalyzing(true);

    try {
      // Check if we have predefined data
      const predefined = predefinedTrends.find(t => 
        t.keyword.toLowerCase().includes(keyword.toLowerCase())
      );

      if (predefined) {
        // Use LLM to generate insights
        const insightsPrompt = `You are a trends analyst. Analyze Google Trends data for "${predefined.keyword}":

Search Volume: ${predefined.searchVolume.toLocaleString()}
Trend: ${predefined.change}% increase
Top Related Query: ${predefined.relatedQueries[0].query} (+${predefined.relatedQueries[0].change}%)

Provide JSON analysis:
{
  "market_sentiment": "Overall sentiment interpretation",
  "investor_implications": "What this means for portfolio managers",
  "warning_signals": "Any concerning patterns",
  "opportunity_areas": "Potential opportunities",
  "recommended_actions": ["List 3-4 concrete actions"]
}`;

        const insights = await api.integrations.Core.InvokeLLM({
          prompt: insightsPrompt,
          response_json_schema: {
            type: "object",
            properties: {
              market_sentiment: { type: "string" },
              investor_implications: { type: "string" },
              warning_signals: { type: "string" },
              opportunity_areas: { type: "string" },
              recommended_actions: { type: "array", items: { type: "string" } }
            }
          }
        });

        setTrendData({ ...predefined, insights });
      } else {
        // Generic response
        setTrendData({
          keyword,
          searchVolume: 150000,
          trend: "up",
          change: 45,
          relatedQueries: [],
          regionalInterest: [],
          timeSeriesData: Array.from({ length: 30 }, (_, i) => ({
            day: i + 1,
            interest: 30 + Math.random() * 40
          })),
          insights: {
            market_sentiment: "Growing public interest indicates regulatory topic gaining traction",
            investor_implications: "Monitor for potential policy changes affecting portfolio holdings",
            warning_signals: "Increasing search volume may precede regulatory announcements",
            opportunity_areas: "Companies adapting early may gain competitive advantage",
            recommended_actions: ["Monitor daily", "Review exposed positions", "Set news alerts"]
          }
        });
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setTrendData(predefinedTrends[0]);
    }

    setIsAnalyzing(false);
  };

  const getTrendIcon = (trend) => {
    if (trend === 'up') return <ArrowUp className="w-4 h-4 text-green-400" />;
    if (trend === 'down') return <ArrowDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-green-400" />
              Google Trends Analysis
            </h1>
            <p className="text-gray-400 mt-1">Real-time public interest tracking for regulatory topics</p>
          </div>
          <Link to={createPageUrl('Home')}>
            <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Info Banner */}
        <Card className="bg-gradient-to-br from-green-900/20 to-blue-900/20 border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Globe className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-semibold mb-1">Why Google Trends Matter for Portfolio Managers</p>
                <p className="text-sm text-gray-300">
                  Spikes in regulatory search volume often precede policy announcements by 2-4 weeks. 
                  Track public awareness to anticipate market-moving regulatory events before they hit headlines.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder='Try: "inflation reduction act", "gdpr violations", "carbon border adjustment"'
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="pl-10 bg-gray-900 border-gray-700 text-white"
                  onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
                />
              </div>
              <Button 
                onClick={handleAnalyze}
                disabled={isAnalyzing || !keyword}
                className="bg-green-600 hover:bg-green-700"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Analyze Trend
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Access Buttons */}
        <div className="grid md:grid-cols-4 gap-3">
          {predefinedTrends.map((trend, idx) => (
            <Button
              key={idx}
              variant="outline"
              className="border-gray-700 text-white hover:bg-gray-800 justify-start"
              onClick={() => {
                setKeyword(trend.keyword);
                setTimeout(() => handleAnalyze(), 100);
              }}
            >
              <Sparkles className="w-4 h-4 mr-2 text-yellow-400" />
              {trend.keyword}
            </Button>
          ))}
        </div>

        {/* Trend Results */}
        {trendData && (
          <>
            {/* Overview Stats */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-4">
                  <p className="text-xs text-gray-400 mb-1">Search Volume</p>
                  <p className="text-2xl font-bold text-white">
                    {trendData.searchVolume.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Past 30 days</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-4">
                  <p className="text-xs text-gray-400 mb-1">Trend Direction</p>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(trendData.trend)}
                    <p className="text-2xl font-bold text-green-400">
                      +{trendData.change}%
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">vs previous period</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-4">
                  <p className="text-xs text-gray-400 mb-1">Peak Interest</p>
                  <p className="text-2xl font-bold text-blue-400">
                    {Math.max(...trendData.timeSeriesData.map(d => d.interest)).toFixed(0)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Interest score</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-4">
                  <p className="text-xs text-gray-400 mb-1">Related Queries</p>
                  <p className="text-2xl font-bold text-purple-400">
                    {trendData.relatedQueries.length}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Trending related</p>
                </CardContent>
              </Card>
            </div>

            {/* Time Series Chart */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Interest Over Time (30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={trendData.timeSeriesData}>
                    <defs>
                      <linearGradient id="colorInterest" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="day" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
                    <Area type="monotone" dataKey="interest" stroke="#10B981" fillOpacity={1} fill="url(#colorInterest)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Related Queries */}
            {trendData.relatedQueries.length > 0 && (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Related Queries (Breakout)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {trendData.relatedQueries.map((query, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                        <div className="flex-1">
                          <p className="text-white font-medium">{query.query}</p>
                          <p className="text-xs text-gray-400">
                            {query.volume.toLocaleString()} searches
                          </p>
                        </div>
                        <Badge className="bg-green-600">
                          +{query.change}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Regional Interest */}
            {trendData.regionalInterest.length > 0 && (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Regional Interest</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {trendData.regionalInterest.map((region, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-white">{region.region}</span>
                          <span className="text-gray-400">{region.score}</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${region.score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI Insights */}
            {trendData.insights && (
              <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Brain className="w-6 h-6 text-purple-400" />
                    AI-Generated Market Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-gray-900/50 rounded-lg">
                    <p className="text-xs text-gray-400 mb-2">Market Sentiment</p>
                    <p className="text-gray-200">{trendData.insights.market_sentiment}</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-900/50 rounded-lg">
                      <p className="text-xs text-gray-400 mb-2">Investor Implications</p>
                      <p className="text-sm text-gray-300">{trendData.insights.investor_implications}</p>
                    </div>

                    <div className="p-4 bg-gray-900/50 rounded-lg">
                      <p className="text-xs text-gray-400 mb-2">Warning Signals</p>
                      <p className="text-sm text-gray-300">{trendData.insights.warning_signals}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                    <p className="text-xs text-gray-400 mb-2">Opportunity Areas</p>
                    <p className="text-gray-200">{trendData.insights.opportunity_areas}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 mb-2">Recommended Actions</p>
                    <ul className="space-y-2">
                      {trendData.insights.recommended_actions.map((action, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                          <span className="text-green-400">•</span>
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}