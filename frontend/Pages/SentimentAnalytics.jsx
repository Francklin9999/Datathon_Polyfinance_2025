
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, MessageSquare, Twitter, Newspaper, Radio, AlertCircle, Activity, Target } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';

export default function SentimentAnalytics() {
  const [selectedAsset, setSelectedAsset] = useState('SPX');

  // Overall Market Sentiment
  const marketSentiment = {
    score: 68,
    change: 5.2,
    level: 'Bullish',
    sources: {
      news: 72,
      social: 65,
      analyst: 70,
      options: 66
    }
  };

  // Sentiment Time Series
  const sentimentHistory = Array.from({ length: 30 }, (_, i) => ({
    date: `Day ${i + 1}`,
    sentiment: 50 + Math.sin(i / 3) * 15 + Math.random() * 10,
    volume: 1000 + Math.random() * 500,
    priceChange: Math.sin(i / 3) * 2 + Math.random() * 1
  }));

  // News Sentiment
  const newsItems = [
    { 
      headline: 'Fed signals potential rate pause in Q2 2025', 
      source: 'Bloomberg', 
      sentiment: 0.85, 
      impact: 'High',
      time: '2 hours ago',
      entities: ['Fed', 'Interest Rates', 'Monetary Policy']
    },
    { 
      headline: 'Tech sector rallies on strong earnings beats', 
      source: 'Reuters', 
      sentiment: 0.72, 
      impact: 'High',
      time: '3 hours ago',
      entities: ['Technology', 'Earnings', 'Equities']
    },
    { 
      headline: 'Geopolitical tensions ease in key oil regions', 
      source: 'WSJ', 
      sentiment: 0.65, 
      impact: 'Medium',
      time: '5 hours ago',
      entities: ['Geopolitics', 'Oil', 'Energy']
    },
    { 
      headline: 'European banks face regulatory headwinds', 
      source: 'FT', 
      sentiment: -0.48, 
      impact: 'Medium',
      time: '6 hours ago',
      entities: ['Banking', 'Regulation', 'Europe']
    },
    { 
      headline: 'Emerging markets show signs of recovery', 
      source: 'CNBC', 
      sentiment: 0.58, 
      impact: 'Low',
      time: '8 hours ago',
      entities: ['Emerging Markets', 'Growth', 'FX']
    }
  ];

  // Social Media Sentiment
  const socialSentiment = [
    { platform: 'Twitter/X', mentions: 45234, sentiment: 0.62, change: 12 },
    { platform: 'Reddit', mentions: 23451, sentiment: 0.71, change: 8 },
    { platform: 'StockTwits', mentions: 18923, sentiment: 0.58, change: -3 },
    { platform: 'LinkedIn', mentions: 12456, sentiment: 0.75, change: 15 }
  ];

  // Analyst Sentiment
  const analystSentiment = [
    { rating: 'Strong Buy', count: 12, percentage: 24 },
    { rating: 'Buy', count: 23, percentage: 46 },
    { rating: 'Hold', count: 10, percentage: 20 },
    { rating: 'Sell', count: 4, percentage: 8 },
    { rating: 'Strong Sell', count: 1, percentage: 2 }
  ];

  // Sector Sentiment Breakdown
  const sectorSentiment = [
    { sector: 'Technology', sentiment: 78, volume: 450000, trend: 'up' },
    { sector: 'Healthcare', sentiment: 65, volume: 320000, trend: 'up' },
    { sector: 'Financials', sentiment: 52, volume: 280000, trend: 'neutral' },
    { sector: 'Energy', sentiment: 48, volume: 190000, trend: 'down' },
    { sector: 'Consumer', sentiment: 71, volume: 360000, trend: 'up' },
    { sector: 'Industrials', sentiment: 55, volume: 240000, trend: 'neutral' }
  ];

  const getSentimentColor = (sentiment) => {
    if (sentiment > 0.6) return 'text-green-400';
    if (sentiment < -0.6) return 'text-red-400';
    if (sentiment > 0.2) return 'text-green-300';
    if (sentiment < -0.2) return 'text-red-300';
    return 'text-yellow-400';
  };

  const getSentimentBadge = (sentiment) => {
    if (sentiment > 0.6) return <Badge className="bg-green-600">Very Bullish</Badge>;
    if (sentiment < -0.6) return <Badge className="bg-red-600">Very Bearish</Badge>;
    if (sentiment > 0.2) return <Badge className="bg-green-500">Bullish</Badge>;
    if (sentiment < -0.2) return <Badge className="bg-red-500">Bearish</Badge>;
    return <Badge className="bg-yellow-600">Neutral</Badge>;
  };

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#6B7280'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Radio className="w-8 h-8 text-blue-400" />
            Market Sentiment Analytics
          </h1>
          <p className="text-gray-400 mt-1">AI-powered sentiment analysis across news, social media, and analyst reports</p>
        </div>

        {/* Overall Sentiment Gauge */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Overall Market Sentiment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-5 gap-6">
              <div className="md:col-span-2">
                <div className="flex items-center justify-center">
                  <div className="relative w-48 h-48">
                    <svg className="transform -rotate-90 w-48 h-48">
                      <circle
                        cx="96"
                        cy="96"
                        r="80"
                        stroke="#374151"
                        strokeWidth="12"
                        fill="none"
                      />
                      <circle
                        cx="96"
                        cy="96"
                        r="80"
                        stroke="#10B981"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${(marketSentiment.score / 100) * 502.4} 502.4`}
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-5xl font-bold text-white">{marketSentiment.score}</p>
                      <p className="text-sm text-gray-400">Sentiment Score</p>
                      <Badge className="mt-2 bg-green-600">{marketSentiment.level}</Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="md:col-span-3 grid grid-cols-2 gap-4">
                <Card className="bg-gray-900/50 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Newspaper className="w-4 h-4 text-blue-400" />
                      <p className="text-xs text-gray-400">News Sentiment</p>
                    </div>
                    <p className="text-2xl font-bold text-white">{marketSentiment.sources.news}</p>
                    <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${marketSentiment.sources.news}%` }} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Twitter className="w-4 h-4 text-cyan-400" />
                      <p className="text-xs text-gray-400">Social Media</p>
                    </div>
                    <p className="text-2xl font-bold text-white">{marketSentiment.sources.social}</p>
                    <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-500" style={{ width: `${marketSentiment.sources.social}%` }} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-purple-400" />
                      <p className="text-xs text-gray-400">Analyst Reports</p>
                    </div>
                    <p className="text-2xl font-bold text-white">{marketSentiment.sources.analyst}</p>
                    <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500" style={{ width: `${marketSentiment.sources.analyst}%` }} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900/50 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-orange-400" />
                      <p className="text-xs text-gray-400">Options Flow</p>
                    </div>
                    <p className="text-2xl font-bold text-white">{marketSentiment.sources.options}</p>
                    <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500" style={{ width: `${marketSentiment.sources.options}%` }} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sentiment Time Series */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Sentiment Trend (30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={sentimentHistory}>
                <defs>
                  <linearGradient id="colorSentiment" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
                <Area type="monotone" dataKey="sentiment" stroke="#10B981" fillOpacity={1} fill="url(#colorSentiment)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* News Sentiment */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-blue-400" />
                Real-Time News Sentiment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {newsItems.map((item, idx) => (
                  <div key={idx} className="p-4 bg-gray-900/50 rounded-lg border-l-4" style={{
                    borderColor: item.sentiment > 0.5 ? '#10B981' : item.sentiment < 0 ? '#EF4444' : '#F59E0B'
                  }}>
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-white font-semibold text-sm flex-1">{item.headline}</h4>
                      {getSentimentBadge(item.sentiment)}
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">{item.source}</span>
                        <span>•</span>
                        <span>{item.time}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {item.impact} Impact
                      </Badge>
                    </div>
                    <div className="flex gap-2 mt-2">
                      {item.entities.map((entity, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {entity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Social Media Sentiment */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Twitter className="w-5 h-5 text-cyan-400" />
                Social Media Sentiment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {socialSentiment.map((platform, idx) => (
                  <div key={idx} className="p-4 bg-gray-900/50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-white font-semibold">{platform.platform}</p>
                        <p className="text-xs text-gray-400">{platform.mentions.toLocaleString()} mentions</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-white">{(platform.sentiment * 100).toFixed(0)}</p>
                        <div className="flex items-center gap-1">
                          {platform.change >= 0 ? (
                            <TrendingUp className="w-3 h-3 text-green-400" />
                          ) : (
                            <TrendingDown className="w-3 h-3 text-red-400" />
                          )}
                          <p className={`text-xs ${platform.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {platform.change >= 0 ? '+' : ''}{platform.change}%
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-cyan-500" 
                        style={{ width: `${platform.sentiment * 100}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Analyst Sentiment */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Analyst Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={analystSentiment}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ rating, percentage }) => `${rating}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analystSentiment.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {analystSentiment.map((rating, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">{rating.rating}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full" 
                          style={{ 
                            width: `${rating.percentage}%`,
                            backgroundColor: COLORS[idx % COLORS.length]
                          }} 
                        />
                      </div>
                      <span className="text-white font-semibold w-12 text-right">{rating.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Sector Sentiment */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Sector Sentiment Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sectorSentiment.map((sector, idx) => (
                  <div key={idx} className="p-3 bg-gray-900/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">{sector.sector}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-white">{sector.sentiment}</span>
                        {sector.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-400" />}
                        {sector.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-400" />}
                        {sector.trend === 'neutral' && <Activity className="w-4 h-4 text-gray-400" />}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            sector.sentiment > 60 ? 'bg-green-500' :
                            sector.sentiment < 40 ? 'bg-red-500' :
                            'bg-yellow-500'
                          }`}
                          style={{ width: `${sector.sentiment}%` }} 
                        />
                      </div>
                      <span className="text-xs text-gray-400">{(sector.volume / 1000).toFixed(0)}K vol</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alert Section */}
        <Card className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border-yellow-500/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-white font-semibold mb-1">Sentiment Alert</h4>
                <p className="text-sm text-gray-300">
                  Technology sector sentiment has increased 12% in the last 24 hours driven by positive earnings reports. 
                  Social media mentions up 45% with predominantly bullish tone. Consider reviewing tech positions for tactical opportunities.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
