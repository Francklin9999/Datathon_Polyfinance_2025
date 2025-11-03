import React, { useState } from 'react';
import { api } from '@/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Globe, TrendingUp, AlertTriangle, Sparkles, Activity, DollarSign, Search, ArrowLeft } from 'lucide-react';
import QuickSearch from '../Components/atlas/QuickSearch';
import Watchlist from '../Components/atlas/Watchlist';
import MarketMovers from '../Components/atlas/MarketMovers';

export default function Overview() {
  const [summary, setSummary] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: snapshots = [] } = useQuery({
    queryKey: ['snapshots'],
    queryFn: () => api.entities.MarketSnapshot.list(),
    initialData: [],
  });

  const { data: riskMetrics = [] } = useQuery({
    queryKey: ['riskMetrics'],
    queryFn: () => api.entities.RiskMetrics.list(),
    initialData: [],
  });

  const { data: news = [] } = useQuery({
    queryKey: ['news'],
    queryFn: () => api.entities.NewsItem.list('-publishedDate', 10),
    initialData: [],
  });

  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    try {
      const result = await api.integrations.Core.InvokeLLM({
        prompt: `You are a senior trading floor analyst. Provide a brief (4-6 sentences) summary of global market conditions: ${JSON.stringify({ snapshots, riskMetrics, news: news.slice(0, 3) })}. Focus on: key moves across asset classes, risk sentiment, major drivers. Professional institutional tone.`,
      });
      setSummary({ text: result, timestamp: new Date() });
    } catch {
      const avgChange = snapshots.reduce((sum, s) => sum + (s.indices?.[0]?.chg1D || 0), 0) / (snapshots.length || 1);
      setSummary({ 
        text: `Global markets ${avgChange > 0 ? 'advanced' : 'declined'} with broad-based ${Math.abs(avgChange) > 1 ? 'strong' : 'moderate'} moves. Volatility remains ${riskMetrics[0]?.volatility20d > 20 ? 'elevated' : 'contained'} across regions. ${news[0]?.title || 'Market participants monitoring macro developments.'}`, 
        timestamp: new Date() 
      });
    }
    setIsGenerating(false);
  };

  const calculateGlobalRisk = () => {
    if (riskMetrics.length === 0) return { level: 'MEDIUM', score: 50, color: 'text-yellow-400' };
    const avgVol = riskMetrics.reduce((sum, m) => sum + (m.volatility20d || 0), 0) / riskMetrics.length;
    if (avgVol < 15) return { level: 'LOW', score: 30, color: 'text-green-400' };
    if (avgVol < 25) return { level: 'MEDIUM', score: 50, color: 'text-yellow-400' };
    return { level: 'HIGH', score: 75, color: 'text-red-400' };
  };

  const getRegionYTD = (region) => {
    const snapshot = snapshots.find(s => s.region === region);
    return snapshot?.indices?.[0]?.ytd || 0;
  };

  const globalRisk = calculateGlobalRisk();
  const regions = ['US', 'EU', 'ASIA'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
      {/* Back to Trading Floor */}
      <div className="border-b border-gray-800 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link 
            to={createPageUrl('TradingFloor')} 
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Trading Floor</span>
          </Link>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Header with Quick Search */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Globe className="w-8 h-8 text-blue-400" />
              Market Overview
            </h1>
            <p className="text-gray-400 mt-1">Real-time global market intelligence</p>
          </div>
          <div className="flex items-center gap-3">
            <QuickSearch snapshots={snapshots} />
            <Button onClick={handleGenerateSummary} disabled={isGenerating} className="bg-purple-600 hover:bg-purple-700">
              <Sparkles className="w-4 h-4 mr-2" />
              {isGenerating ? 'Generating...' : 'AI Summary'}
            </Button>
          </div>
        </div>

        {/* AI Summary */}
        {summary && (
          <Card className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/30">
            <CardContent className="p-4">
              <p className="text-gray-200 leading-relaxed">{summary.text}</p>
              <p className="text-xs text-gray-500 mt-2">Generated: {summary.timestamp.toLocaleTimeString()}</p>
            </CardContent>
          </Card>
        )}

        {/* Main Grid Layout */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Markets */}
          <div className="col-span-8 space-y-6">
            {/* Global Risk Gauge */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    Global Risk Sentiment
                  </span>
                  <Badge className={`${globalRisk.color}`}>{globalRisk.level}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        globalRisk.level === 'LOW' ? 'bg-green-500' :
                        globalRisk.level === 'MEDIUM' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${globalRisk.score}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Avg Volatility</p>
                      <p className="text-white font-semibold">
                        {(riskMetrics.reduce((sum, m) => sum + (m.volatility20d || 0), 0) / (riskMetrics.length || 1)).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">VIX Level</p>
                      <p className="text-white font-semibold">{riskMetrics[0]?.vix?.toFixed(1) || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Market Regime</p>
                      <p className={`font-semibold ${globalRisk.color}`}>{globalRisk.level}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Regional Snapshots */}
            <div className="grid grid-cols-3 gap-4">
              {regions.map((region) => {
                const snapshot = snapshots.find(s => s.region === region);
                const risk = riskMetrics.find(r => r.region === region);
                const mainIndex = snapshot?.indices?.[0];
                const ytd = getRegionYTD(region);

                return (
                  <Link key={region} to={createPageUrl('Equities')}>
                    <Card className="bg-gray-800/50 border-gray-700 hover:border-blue-500/50 transition-all cursor-pointer group">
                      <CardHeader>
                        <CardTitle className="text-white text-lg">{region}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-400">Main Index</p>
                          <p className="text-white font-semibold">{mainIndex?.symbol || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">1D Change</p>
                          <p className={`text-2xl font-bold ${mainIndex?.chg1D >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {mainIndex?.chg1D >= 0 ? '+' : ''}{mainIndex?.chg1D?.toFixed(2)}%
                          </p>
                        </div>
                        <div className="flex justify-between text-xs">
                          <div>
                            <p className="text-gray-400">YTD</p>
                            <p className={`font-semibold ${ytd >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {ytd >= 0 ? '+' : ''}{ytd?.toFixed(1)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400">Vol</p>
                            <p className="text-white font-semibold">{risk?.volatility20d?.toFixed(1)}%</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>

            {/* Market Movers */}
            <MarketMovers snapshots={snapshots} />

            {/* Asset Class Overview */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-400" />
                  Asset Class Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: 'Equities', change: 0.45, icon: TrendingUp, path: 'Equities' },
                    { name: 'Fixed Income', change: -0.12, icon: DollarSign, path: 'FixedIncome' },
                    { name: 'FX', change: 0.08, icon: Globe, path: 'FX' },
                    { name: 'Commodities', change: -0.23, icon: Activity, path: 'Commodities' }
                  ].map((asset, idx) => {
                    const Icon = asset.icon;
                    return (
                      <Link key={idx} to={createPageUrl(asset.path)}>
                        <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg hover:bg-gray-700/50 transition-all cursor-pointer">
                          <div className="flex items-center gap-3">
                            <Icon className="w-5 h-5 text-gray-400" />
                            <span className="text-white font-medium">{asset.name}</span>
                          </div>
                          <span className={`text-lg font-bold ${asset.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)}%
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Latest News */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Market News</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {news.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="p-3 bg-gray-900/50 rounded-lg hover:bg-gray-700/50 transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h4 className="text-white font-medium mb-1">{item.title}</h4>
                          <p className="text-xs text-gray-400">{item.summary}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {item.source}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(item.publishedDate).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Watchlist & Tools */}
          <div className="col-span-4 space-y-6">
            <Watchlist />
            
            {/* Quick Links */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Quick Access</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { name: 'Equities Desk', path: 'Equities' },
                  { name: 'Fixed Income', path: 'FixedIncome' },
                  { name: 'Options Trading', path: 'Options' },
                  { name: 'Positions & P/L', path: 'Positions' }
                ].map((link, idx) => (
                  <Link key={idx} to={createPageUrl(link.path)}>
                    <Button variant="outline" className="w-full justify-start text-white border-gray-700 hover:bg-gray-700">
                      {link.name}
                    </Button>
                  </Link>
                ))}
              </CardContent>
            </Card>

            {/* Market Status */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Market Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { market: 'NYSE', status: 'OPEN', color: 'text-green-400' },
                  { market: 'NASDAQ', status: 'OPEN', color: 'text-green-400' },
                  { market: 'LSE', status: 'CLOSED', color: 'text-gray-400' },
                  { market: 'TSE', status: 'CLOSED', color: 'text-gray-400' }
                ].map((m, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">{m.market}</span>
                    <Badge className={m.color}>{m.status}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}