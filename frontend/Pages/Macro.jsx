import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Globe2, TrendingUp, TrendingDown, Sparkles, Activity } from 'lucide-react';

export default function Macro() {
  const [summary, setSummary] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: snapshots = [] } = useQuery({
    queryKey: ['snapshots'],
    queryFn: () => base44.entities.MarketSnapshot.list(),
    initialData: [],
  });

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => base44.entities.EventItem.list('eventDate', 20),
    initialData: [],
  });

  const { data: riskMetrics = [] } = useQuery({
    queryKey: ['risk'],
    queryFn: () => base44.entities.RiskMetrics.list(),
    initialData: [],
  });

  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a macro strategist. Provide a comprehensive (5-7 sentences) summary of global macro conditions: ${JSON.stringify({ snapshots, events: events.slice(0, 5), riskMetrics })}. Focus on: central bank policy divergence, growth/inflation dynamics, geopolitical risks, cross-asset implications. Senior institutional tone.`,
      });
      setSummary({ text: result, timestamp: new Date() });
    } catch {
      const avgYield = riskMetrics.reduce((sum, r) => sum + (r.yield10s || 0), 0) / (riskMetrics.length || 1);
      const avgVol = riskMetrics.reduce((sum, r) => sum + (r.volatility20d || 0), 0) / (riskMetrics.length || 1);
      setSummary({ 
        text: `Global growth showing divergent patterns across regions. Central bank policy remains ${avgYield > 4 ? 'restrictive' : 'accommodative'} with 10Y yields averaging ${avgYield.toFixed(2)}%. Cross-asset volatility at ${avgVol.toFixed(1)}% suggests ${avgVol > 20 ? 'elevated uncertainty' : 'stable risk appetite'}. ${events.length > 0 ? `Key events ahead: ${events[0].label}.` : ''} Geopolitical tensions and inflation dynamics remain primary macro drivers.`, 
        timestamp: new Date() 
      });
    }
    setIsGenerating(false);
  };

  const getGlobalMetrics = () => {
    const allIndices = snapshots.flatMap(s => s.indices || []);
    const avgChange = allIndices.reduce((sum, i) => sum + (i.chg1D || 0), 0) / (allIndices.length || 1);
    const avgYtd = allIndices.reduce((sum, i) => sum + (i.ytd || 0), 0) / (allIndices.length || 1);
    const avgVol = riskMetrics.reduce((sum, r) => sum + (r.volatility20d || 0), 0) / (riskMetrics.length || 1);
    const avgYield = riskMetrics.reduce((sum, r) => sum + (r.yield10s || 0), 0) / (riskMetrics.length || 1);
    
    return { avgChange, avgYtd, avgVol, avgYield };
  };

  const metrics = getGlobalMetrics();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Globe2 className="w-8 h-8 text-indigo-400" />
            Macro Strategy Desk
          </h1>
          <p className="text-gray-400 mt-1">Global economics, policy, geopolitics, cross-asset strategy</p>
        </div>
        <Button onClick={handleGenerateSummary} disabled={isGenerating} className="bg-purple-600 hover:bg-purple-700">
          <Sparkles className="w-4 h-4 mr-2" />
          {isGenerating ? 'Generating...' : 'AI Summary'}
        </Button>
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

      {/* Global Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-400">Global Equities</p>
              {metrics.avgChange > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400" />
              )}
            </div>
            <p className={`text-3xl font-bold ${metrics.avgChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {metrics.avgChange >= 0 ? '+' : ''}{metrics.avgChange.toFixed(2)}%
            </p>
            <p className="text-xs text-gray-400 mt-1">Avg 1D change</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-400">YTD Performance</p>
              <Activity className="w-4 h-4 text-blue-400" />
            </div>
            <p className={`text-3xl font-bold ${metrics.avgYtd >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {metrics.avgYtd >= 0 ? '+' : ''}{metrics.avgYtd.toFixed(2)}%
            </p>
            <p className="text-xs text-gray-400 mt-1">Global avg</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <p className="text-xs text-gray-400 mb-2">Global Vol Regime</p>
            <p className="text-3xl font-bold text-white">{metrics.avgVol.toFixed(1)}%</p>
            <p className="text-xs text-gray-400 mt-1">
              {metrics.avgVol < 15 ? 'Low' : metrics.avgVol < 25 ? 'Normal' : 'Elevated'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <p className="text-xs text-gray-400 mb-2">Avg 10Y Yield</p>
            <p className="text-3xl font-bold text-white">{metrics.avgYield.toFixed(2)}%</p>
            <p className="text-xs text-gray-400 mt-1">
              {metrics.avgYield > 4 ? 'Restrictive' : 'Accommodative'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Regional Comparison */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Regional Macro Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {snapshots.map((snapshot, idx) => {
              const regionRisk = riskMetrics.find(r => r.region === snapshot.region);
              const mainIndex = snapshot.indices?.[0];
              
              return (
                <div key={idx} className="p-4 bg-gray-900/50 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-white">{snapshot.region}</h3>
                    <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      snapshot.status === 'OPEN' ? 'bg-green-500/20 text-green-300' :
                      snapshot.status === 'PREOPEN' ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-gray-500/20 text-gray-300'
                    }`}>
                      {snapshot.status}
                    </div>
                  </div>
                  <div className="grid grid-cols-5 gap-4">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Equity Index</p>
                      <p className={`text-lg font-bold ${mainIndex?.chg1D >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {mainIndex?.chg1D >= 0 ? '+' : ''}{mainIndex?.chg1D?.toFixed(2)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">10Y Yield</p>
                      <p className="text-lg font-bold text-white">{regionRisk?.yield10s?.toFixed(2)}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">2s10s Slope</p>
                      <p className={`text-lg font-bold ${regionRisk?.slope2s10s > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {regionRisk?.slope2s10s?.toFixed(0)}bp
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Volatility</p>
                      <p className="text-lg font-bold text-white">{regionRisk?.volatility20d?.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Policy Stance</p>
                      <p className="text-lg font-bold text-white">
                        {regionRisk?.yield10s > 4 ? '🔴' : regionRisk?.yield10s > 2 ? '🟡' : '🟢'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Economic Calendar */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Key Economic Events (Next 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {events.slice(0, 10).map((event, idx) => (
              <div key={idx} className={`flex items-center justify-between p-3 rounded-lg border ${
                event.importance === 'high' ? 'bg-red-900/20 border-red-500/30' :
                event.importance === 'medium' ? 'bg-yellow-900/20 border-yellow-500/30' :
                'bg-blue-900/20 border-blue-500/30'
              }`}>
                <div className="flex-1">
                  <p className="font-semibold text-white">{event.label}</p>
                  <p className="text-sm text-gray-400">{event.description}</p>
                </div>
                <div className="text-right mr-8">
                  <p className="text-sm text-gray-300">{event.region}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(event.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  event.importance === 'high' ? 'bg-red-500/20 text-red-300' :
                  event.importance === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                  'bg-blue-500/20 text-blue-300'
                }`}>
                  {event.importance}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Policy Divergence Matrix */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Central Bank Policy Divergence</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {riskMetrics.map((risk, idx) => {
              const stance = risk.yield10s > 4 ? 'Restrictive' : risk.yield10s > 2 ? 'Neutral' : 'Accommodative';
              const color = risk.yield10s > 4 ? 'text-red-400' : risk.yield10s > 2 ? 'text-yellow-400' : 'text-green-400';
              
              return (
                <div key={idx} className="p-4 bg-gray-900/50 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-3">{risk.region}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Policy Rate</span>
                      <span className="text-sm font-bold text-white">{risk.yield2s?.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Stance</span>
                      <span className={`text-sm font-bold ${color}`}>{stance}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Curve Signal</span>
                      <span className="text-sm font-bold text-white">
                        {risk.slope2s10s > 50 ? 'Steepening' : risk.slope2s10s > 0 ? 'Positive' : 'Inverted'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Macro Themes */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Current Macro Themes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-lg">
              <p className="text-sm font-semibold text-indigo-300 mb-2">Inflation Dynamics</p>
              <p className="text-xs text-gray-400">
                Core inflation moderating but services sticky. Central banks maintaining vigilance.
              </p>
            </div>
            <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <p className="text-sm font-semibold text-blue-300 mb-2">Growth Divergence</p>
              <p className="text-xs text-gray-400">
                US resilience vs Europe/Asia slowdown. Labor markets remain tight across DM.
              </p>
            </div>
            <div className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
              <p className="text-sm font-semibold text-purple-300 mb-2">Geopolitical Risk</p>
              <p className="text-xs text-gray-400">
                Trade tensions, energy security, and policy uncertainty weighing on sentiment.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}