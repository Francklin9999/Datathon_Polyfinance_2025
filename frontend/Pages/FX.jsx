import React, { useState } from 'react';
import { api } from '@/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, TrendingUp, TrendingDown, Sparkles, DollarSign } from 'lucide-react';

export default function FX() {
  const [summary, setSummary] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: snapshots = [] } = useQuery({
    queryKey: ['snapshots'],
    queryFn: () => api.entities.MarketSnapshot.list(),
    initialData: [],
  });

  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    try {
      const allFx = snapshots.flatMap(s => s.fx || []);
      const result = await api.integrations.Core.InvokeLLM({
        prompt: `You are an FX desk analyst. Provide a brief (3-5 sentences) summary of global FX market conditions: ${JSON.stringify(allFx)}. Focus on: major pair moves, USD strength/weakness, cross-currency dynamics, carry trade conditions. Institutional tone.`,
      });
      setSummary({ text: result, timestamp: new Date() });
    } catch {
      const dxy = snapshots[0]?.fx?.find(f => f.symbol === 'DXY');
      setSummary({ 
        text: `USD ${dxy?.chg1D > 0 ? 'strengthened' : 'weakened'} ${Math.abs(dxy?.chg1D || 0).toFixed(2)}% with DXY at ${dxy?.price?.toFixed(2)}. EUR and JPY showing ${dxy?.chg1D > 0 ? 'defensive' : 'offensive'} positioning. Cross-currency volatility ${Math.abs(dxy?.chg1D || 0) > 0.5 ? 'elevated' : 'contained'}, suggesting ${Math.abs(dxy?.chg1D || 0) > 0.5 ? 'active' : 'range-bound'} trading conditions.`, 
        timestamp: new Date() 
      });
    }
    setIsGenerating(false);
  };

  const getAllFXPairs = () => {
    const pairs = [];
    snapshots.forEach(snapshot => {
      if (snapshot.fx) {
        snapshot.fx.forEach(fx => {
          if (!pairs.find(p => p.symbol === fx.symbol)) {
            pairs.push({ ...fx, region: snapshot.region });
          }
        });
      }
    });
    return pairs;
  };

  const fxPairs = getAllFXPairs();
  const sortedByChange = [...fxPairs].sort((a, b) => Math.abs(b.chg1D) - Math.abs(a.chg1D));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Coins className="w-8 h-8 text-yellow-400" />
            FX Desk
          </h1>
          <p className="text-gray-400 mt-1">Currency pairs, carry trades, G10 flows</p>
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

      {/* Key Pairs Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {fxPairs.slice(0, 6).map((fx, idx) => (
          <Card key={idx} className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-400">{fx.symbol}</p>
                {fx.chg1D > 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-400" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-400" />
                )}
              </div>
              <p className="text-2xl font-bold text-white">{fx.price?.toFixed(4)}</p>
              <p className={`text-lg font-semibold ${fx.chg1D >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {fx.chg1D >= 0 ? '+' : ''}{fx.chg1D?.toFixed(2)}%
              </p>
              <p className="text-xs text-gray-400 mt-1">{fx.name}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top Movers */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Biggest Movers (24h)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sortedByChange.slice(0, 8).map((fx, idx) => (
              <div key={idx} className={`flex items-center justify-between p-3 rounded-lg ${
                fx.chg1D > 0 ? 'bg-green-900/20 border border-green-500/30' : 'bg-red-900/20 border border-red-500/30'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    fx.chg1D > 0 ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}>
                    {fx.chg1D > 0 ? (
                      <TrendingUp className="w-5 h-5 text-green-400" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{fx.symbol}</p>
                    <p className="text-sm text-gray-400">{fx.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-white">{fx.price?.toFixed(4)}</p>
                  <p className={`text-lg font-bold ${fx.chg1D >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {fx.chg1D >= 0 ? '+' : ''}{fx.chg1D?.toFixed(2)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* FX Heatmap */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Currency Strength Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {fxPairs.map((fx, idx) => {
              const intensity = Math.abs(fx.chg1D || 0) * 10;
              const opacity = Math.min(intensity / 100, 0.7);
              const bgColor = fx.chg1D >= 0 ? '#22C55E' : '#EF4444';
              
              return (
                <div
                  key={idx}
                  className="p-4 rounded-lg border border-gray-700 hover:scale-105 transition-transform cursor-pointer"
                  style={{ backgroundColor: bgColor, opacity }}
                >
                  <p className="text-sm font-mono text-white font-bold">{fx.symbol}</p>
                  <p className="text-xs text-gray-200 mt-1">{fx.price?.toFixed(4)}</p>
                  <p className={`text-lg font-bold mt-2 ${fx.chg1D >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                    {fx.chg1D >= 0 ? '+' : ''}{fx.chg1D?.toFixed(2)}%
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Carry Trade Monitor */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-yellow-400" />
              Carry Trade Signals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                <p className="text-sm font-semibold text-yellow-300">High Yield Currencies</p>
                <p className="text-xs text-gray-400 mt-1">
                  Monitor rate differentials for optimal carry opportunities
                </p>
              </div>
              <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <p className="text-sm font-semibold text-blue-300">Funding Currencies</p>
                <p className="text-xs text-gray-400 mt-1">
                  JPY and CHF remain primary funding choices
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">USD Index (DXY)</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const dxy = fxPairs.find(f => f.symbol === 'DXY');
              return dxy ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-5xl font-bold text-white">{dxy.price?.toFixed(2)}</p>
                    <p className={`text-2xl font-bold mt-2 ${dxy.chg1D >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {dxy.chg1D >= 0 ? '+' : ''}{dxy.chg1D?.toFixed(2)}%
                    </p>
                  </div>
                  <div className="mt-4 p-3 bg-gray-900/50 rounded-lg">
                    <p className="text-sm text-gray-400">
                      USD is {dxy.chg1D > 0 ? 'strengthening' : 'weakening'} against major currencies. 
                      Current level {dxy.price > 105 ? 'above' : 'below'} key technical threshold.
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400">DXY data unavailable</p>
              );
            })()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}