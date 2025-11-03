import React, { useState } from 'react';
import { api } from '@/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, TrendingUp, TrendingDown, Sparkles, AlertTriangle } from 'lucide-react';

export default function Credit() {
  const [region, setRegion] = useState('US');
  const [summary, setSummary] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: riskMetrics = [] } = useQuery({
    queryKey: ['risk', region],
    queryFn: () => api.entities.RiskMetrics.filter({ region }),
    initialData: [],
  });

  const risk = riskMetrics[0];

  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    try {
      const result = await api.integrations.Core.InvokeLLM({
        prompt: `You are a credit desk analyst. Provide a brief (3-5 sentences) summary of ${region} credit market conditions based on: yield levels ${risk?.yield10s}, volatility ${risk?.volatility20d}, spreads dynamics. Focus on: credit spreads, default risk, corporate vs sovereign, high yield trends. Institutional tone.`,
      });
      setSummary({ text: result, timestamp: new Date() });
    } catch {
      setSummary({ 
        text: `${region} credit markets show ${risk?.volatility20d > 20 ? 'elevated' : 'contained'} volatility at ${risk?.volatility20d?.toFixed(1)}%. Investment grade spreads ${risk?.yield10s > 4.5 ? 'widening on rate concerns' : 'stable'}. High yield showing ${risk?.volatility20d > 25 ? 'stress signals' : 'resilient performance'}. Overall credit quality remains ${risk?.volatility20d < 20 ? 'healthy' : 'under pressure'}.`, 
        timestamp: new Date() 
      });
    }
    setIsGenerating(false);
  };

  // Mock credit spread data
  const creditSpreads = [
    { rating: 'AAA', spread: 45, chg: -2, risk: 'Minimal' },
    { rating: 'AA', spread: 75, chg: -1, risk: 'Very Low' },
    { rating: 'A', spread: 110, chg: 3, risk: 'Low' },
    { rating: 'BBB', spread: 165, chg: 8, risk: 'Moderate' },
    { rating: 'BB', spread: 325, chg: 15, risk: 'Elevated' },
    { rating: 'B', spread: 485, chg: 25, risk: 'High' },
    { rating: 'CCC', spread: 875, chg: 65, risk: 'Very High' }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-red-400" />
            Credit Desk
          </h1>
          <p className="text-gray-400 mt-1">Corporate bonds, spreads, default risk, ratings</p>
        </div>
        <div className="flex gap-3">
          <Tabs value={region} onValueChange={setRegion}>
            <TabsList className="bg-gray-800">
              <TabsTrigger value="US">US</TabsTrigger>
              <TabsTrigger value="EU">Europe</TabsTrigger>
              <TabsTrigger value="ASIA">Asia</TabsTrigger>
            </TabsList>
          </Tabs>
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <p className="text-xs text-gray-400 mb-2">IG Spread (BBB)</p>
            <p className="text-3xl font-bold text-white">165bp</p>
            <p className="text-sm text-green-400">-3bp today</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <p className="text-xs text-gray-400 mb-2">HY Spread (BB)</p>
            <p className="text-3xl font-bold text-white">325bp</p>
            <p className="text-sm text-red-400">+15bp today</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <p className="text-xs text-gray-400 mb-2">Default Rate</p>
            <p className="text-3xl font-bold text-white">2.1%</p>
            <p className="text-xs text-gray-400">12M trailing</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <p className="text-xs text-gray-400 mb-2">Credit Vol Index</p>
            <p className="text-3xl font-bold text-white">{risk?.volatility20d?.toFixed(1) || 'N/A'}%</p>
            <p className="text-xs text-gray-400">20-day measure</p>
          </CardContent>
        </Card>
      </div>

      {/* Credit Spread Curve */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Credit Spread Curve by Rating</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {creditSpreads.map((item, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="w-16 text-center">
                  <span className={`text-sm font-bold px-2 py-1 rounded ${
                    ['AAA', 'AA', 'A'].includes(item.rating) ? 'bg-green-900/30 text-green-300' :
                    item.rating === 'BBB' ? 'bg-yellow-900/30 text-yellow-300' :
                    'bg-red-900/30 text-red-300'
                  }`}>
                    {item.rating}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="flex-1 h-8 bg-gray-700 rounded-lg overflow-hidden">
                      <div 
                        className={`h-full ${
                          ['AAA', 'AA', 'A'].includes(item.rating) ? 'bg-green-600' :
                          item.rating === 'BBB' ? 'bg-yellow-600' : 'bg-red-600'
                        }`}
                        style={{ width: `${(item.spread / 1000) * 100}%` }}
                      />
                    </div>
                    <div className="w-24 text-right">
                      <p className="text-lg font-bold text-white">{item.spread}bp</p>
                    </div>
                    <div className="w-24 text-right">
                      <p className={`text-sm font-semibold ${item.chg > 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {item.chg > 0 ? '+' : ''}{item.chg}bp
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 ml-2">Risk Level: {item.risk}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* IG vs HY */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              Investment Grade (IG)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-semibold text-green-300">Average Spread</p>
                  <p className="text-2xl font-bold text-white">98bp</p>
                </div>
                <p className="text-xs text-gray-400">
                  Corporate IG spreads tightening on strong fundamentals
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-2">Sector Breakdown</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Financials</span>
                    <span className="text-white">85bp</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Industrials</span>
                    <span className="text-white">95bp</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Utilities</span>
                    <span className="text-white">105bp</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              High Yield (HY)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm font-semibold text-red-300">Average Spread</p>
                  <p className="text-2xl font-bold text-white">412bp</p>
                </div>
                <p className="text-xs text-gray-400">
                  HY spreads widening on refinancing concerns
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-2">Risk Tiers</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">BB (Upper HY)</span>
                    <span className="text-white">325bp</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">B (Core HY)</span>
                    <span className="text-white">485bp</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">CCC (Distressed)</span>
                    <span className="text-white">875bp</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Default Risk Monitor */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Default Risk Monitor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-900/50 rounded-lg">
              <p className="text-sm text-gray-400 mb-2">1-Year Default Probability</p>
              <div className="flex items-end gap-2">
                <p className="text-3xl font-bold text-white">2.1%</p>
                <p className="text-sm text-green-400 mb-1">-0.3% vs last month</p>
              </div>
              <div className="mt-3 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-500" style={{ width: '21%' }} />
              </div>
            </div>

            <div className="p-4 bg-gray-900/50 rounded-lg">
              <p className="text-sm text-gray-400 mb-2">Distressed Ratio</p>
              <div className="flex items-end gap-2">
                <p className="text-3xl font-bold text-white">4.7%</p>
                <p className="text-sm text-red-400 mb-1">+0.8% vs last month</p>
              </div>
              <div className="mt-3 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-red-500" style={{ width: '47%' }} />
              </div>
            </div>

            <div className="p-4 bg-gray-900/50 rounded-lg">
              <p className="text-sm text-gray-400 mb-2">Recovery Rate</p>
              <div className="flex items-end gap-2">
                <p className="text-3xl font-bold text-white">42%</p>
                <p className="text-sm text-gray-400 mb-1">Historical avg</p>
              </div>
              <div className="mt-3 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: '42%' }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trading Signals */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Credit Trading Signals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <p className="text-sm font-semibold text-blue-300 mb-2">IG Overweight</p>
              <p className="text-xs text-gray-400">
                Spreads attractive vs duration risk. Quality bias supported by macro backdrop.
              </p>
            </div>
            <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
              <p className="text-sm font-semibold text-yellow-300 mb-2">HY Selective</p>
              <p className="text-xs text-gray-400">
                Favor BB/B over CCC. Watch refinancing calendar and maturity walls.
              </p>
            </div>
            <div className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
              <p className="text-sm font-semibold text-purple-300 mb-2">Duration Neutral</p>
              <p className="text-xs text-gray-400">
                Barbell strategy: combine short corporates with long treasuries.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}