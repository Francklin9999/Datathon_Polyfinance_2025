import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Activity, Sparkles, DollarSign } from 'lucide-react';
import CandlestickChart from '../charts/CandlestickChart';
import RSIIndicator from '../charts/RSIIndicator';
import MACDIndicator from '../charts/MACDIndicator';

export default function EquitiesIndexOverview({ snapshot, risk }) {
  const [summary, setSummary] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    const { api } = await import('@/api/apiClient');
    try {
      const result = await api.integrations.Core.InvokeLLM({
        prompt: `You are an equity desk analyst. Provide a brief (3-5 sentences) summary of equity market conditions based on this data: ${JSON.stringify({ snapshot, risk })}. Focus on: index performance, sector rotation signals, volatility regime, correlation breakdown. Use institutional tone, no advice.`,
      });
      setSummary({ text: result, timestamp: new Date() });
    } catch {
      setSummary({ 
        text: `Equities ${snapshot?.indices?.[0]?.chg1D > 0 ? 'advanced' : 'declined'} with broad-based ${Math.abs(snapshot?.indices?.[0]?.chg1D) > 1 ? 'strong' : 'moderate'} moves. Volatility at ${risk?.volatility20d?.toFixed(1)}% suggests ${risk?.volatility20d < 15 ? 'benign' : 'elevated'} risk regime. Correlation structure indicates ${risk?.correlation?.matrix?.[0]?.[1] < -0.3 ? 'defensive rotation' : 'risk-on sentiment'}.`, 
        timestamp: new Date() 
      });
    }
    setIsGenerating(false);
  };

  const getTopMovers = () => {
    if (!snapshot?.indices) return { gainers: [], losers: [] };
    const sorted = [...snapshot.indices].sort((a, b) => b.chg1D - a.chg1D);
    return {
      gainers: sorted.slice(0, 3),
      losers: sorted.slice(-3).reverse()
    };
  };

  const { gainers, losers } = getTopMovers();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Index Overview</h2>
          <p className="text-sm text-gray-400">Major benchmark indices and performance metrics</p>
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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-400">Benchmark</p>
              {snapshot?.indices?.[0]?.chg1D > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400" />
              )}
            </div>
            <p className="text-2xl font-bold text-white">{snapshot?.indices?.[0]?.symbol || 'N/A'}</p>
            <p className={`text-lg font-semibold ${snapshot?.indices?.[0]?.chg1D >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {snapshot?.indices?.[0]?.chg1D >= 0 ? '+' : ''}{snapshot?.indices?.[0]?.chg1D?.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-400">20D Volatility</p>
              <Activity className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-white">{risk?.volatility20d?.toFixed(2) || 'N/A'}%</p>
            <p className="text-xs text-gray-400">
              {risk?.volatility20d < 15 ? 'Low regime' : risk?.volatility20d < 25 ? 'Normal' : 'Elevated'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-400">Max Drawdown</p>
              <TrendingDown className="w-4 h-4 text-red-400" />
            </div>
            <p className="text-2xl font-bold text-red-400">{risk?.maxDrawdown?.toFixed(2) || 'N/A'}%</p>
            <p className="text-xs text-gray-400">From peak</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-400">YTD Performance</p>
              <DollarSign className="w-4 h-4 text-yellow-400" />
            </div>
            <p className={`text-2xl font-bold ${snapshot?.indices?.[0]?.ytd >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {snapshot?.indices?.[0]?.ytd >= 0 ? '+' : ''}{snapshot?.indices?.[0]?.ytd?.toFixed(2) || 'N/A'}%
            </p>
            <p className="text-xs text-gray-400">Year to date</p>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <CandlestickChart symbol={snapshot?.indices?.[0]?.symbol || 'SPX'} />
        <div className="space-y-4">
          <RSIIndicator symbol={snapshot?.indices?.[0]?.symbol || 'SPX'} />
          <MACDIndicator symbol={snapshot?.indices?.[0]?.symbol || 'SPX'} />
        </div>
      </div>

      {/* Top Movers */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              Top Gainers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {gainers.map((index, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-green-900/20 rounded-lg border border-green-500/30">
                <div>
                  <p className="font-semibold text-white">{index.symbol}</p>
                  <p className="text-xs text-gray-400">{index.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-400">+{index.chg1D?.toFixed(2)}%</p>
                  <p className="text-xs text-gray-400">{index.price?.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-400" />
              Top Losers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {losers.map((index, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-red-900/20 rounded-lg border border-red-500/30">
                <div>
                  <p className="font-semibold text-white">{index.symbol}</p>
                  <p className="text-xs text-gray-400">{index.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-red-400">{index.chg1D?.toFixed(2)}%</p>
                  <p className="text-xs text-gray-400">{index.price?.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* All Indices Table */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">All Indices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900 border-b border-gray-700">
                <tr>
                  <th className="text-left p-3 text-gray-400 font-semibold">SYMBOL</th>
                  <th className="text-left p-3 text-gray-400 font-semibold">NAME</th>
                  <th className="text-right p-3 text-gray-400 font-semibold">PRICE</th>
                  <th className="text-right p-3 text-gray-400 font-semibold">1D CHG</th>
                  <th className="text-right p-3 text-gray-400 font-semibold">5D CHG</th>
                  <th className="text-right p-3 text-gray-400 font-semibold">YTD</th>
                </tr>
              </thead>
              <tbody>
                {snapshot?.indices?.map((index, idx) => (
                  <tr key={idx} className="border-b border-gray-800 hover:bg-gray-700/50">
                    <td className="p-3 font-semibold text-white font-mono">{index.symbol}</td>
                    <td className="p-3 text-gray-300">{index.name}</td>
                    <td className="p-3 text-right font-mono text-white">{index.price?.toLocaleString()}</td>
                    <td className={`p-3 text-right font-mono font-bold ${index.chg1D >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {index.chg1D >= 0 ? '+' : ''}{index.chg1D?.toFixed(2)}%
                    </td>
                    <td className={`p-3 text-right font-mono ${index.chg5D >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {index.chg5D >= 0 ? '+' : ''}{index.chg5D?.toFixed(2)}%
                    </td>
                    <td className={`p-3 text-right font-mono ${index.ytd >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {index.ytd >= 0 ? '+' : ''}{index.ytd?.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Correlation Matrix */}
      {risk?.correlation && (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Cross-Asset Correlation (60D)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="p-2 text-left text-gray-400 text-sm"></th>
                    {risk.correlation.labels.map((label, idx) => (
                      <th key={idx} className="p-2 text-center text-gray-400 text-sm font-mono">{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {risk.correlation.matrix.map((row, i) => (
                    <tr key={i}>
                      <td className="p-2 text-gray-400 font-mono text-sm">{risk.correlation.labels[i]}</td>
                      {row.map((value, j) => {
                        const intensity = Math.abs(value);
                        const color = value > 0 ? 'bg-green-500' : 'bg-red-500';
                        const opacity = intensity * 0.7 + 0.3;
                        return (
                          <td
                            key={j}
                            className={`p-2 text-center text-sm text-white ${color}`}
                            style={{ opacity }}
                          >
                            {value.toFixed(2)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}