
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import YieldCurve3D from '../charts/YieldCurve3D';

export default function FixedIncomeYieldCurve({ snapshot, risk }) {
  const [summary, setSummary] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    const { base44 } = await import('@/api/base44Client');
    try {
      // Removed 'region' from the prompt as it's no longer a prop
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a fixed income desk analyst. Provide a brief (3-5 sentences) summary of bond market conditions: ${JSON.stringify({ bonds: snapshot?.bonds, risk })}. Focus on: yield curve shape (2s10s slope), rate moves, curve steepening/flattening, duration risk. Institutional tone.`,
      });
      setSummary({ text: result, timestamp: new Date() });
    } catch {
      const curveDirection = risk?.slope2s10s > 50 ? 'steep' : risk?.slope2s10s > 0 ? 'positive' : risk?.slope2s10s > -50 ? 'flat' : 'inverted';
      // Removed 'region' from the fallback summary text
      setSummary({ 
        text: `The yield curve is ${curveDirection} at ${risk?.slope2s10s?.toFixed(0)}bp. 10Y yield at ${risk?.yield10s?.toFixed(2)}% suggests ${risk?.yield10s > 4 ? 'restrictive' : 'accommodative'} policy stance. Duration risk ${risk?.volatility20d > 20 ? 'elevated' : 'contained'} with vol at ${risk?.volatility20d?.toFixed(1)}%.`, 
        timestamp: new Date() 
      });
    }
    setIsGenerating(false);
  };

  const getCurveSteepness = () => {
    if (!risk?.slope2s10s) return { label: 'N/A', color: 'text-gray-400' };
    if (risk.slope2s10s > 100) return { label: 'Very Steep', color: 'text-green-400' };
    if (risk.slope2s10s > 50) return { label: 'Steep', color: 'text-green-300' };
    if (risk.slope2s10s > 0) return { label: 'Positive', color: 'text-yellow-400' };
    if (risk.slope2s10s > -50) return { label: 'Flat', color: 'text-orange-400' };
    return { label: 'Inverted', color: 'text-red-400' };
  };

  const curveSteepness = getCurveSteepness();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Yield Curve Analysis</h2>
          <p className="text-sm text-gray-400">Curve shape, steepness, and term structure</p>
        </div>
        {/* Removed Tabs component */}
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
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <p className="text-xs text-gray-400 mb-2">2-Year Yield</p>
            <p className="text-3xl font-bold text-white">{risk?.yield2s?.toFixed(2) || 'N/A'}%</p>
            <p className="text-xs text-gray-400 mt-1">Short end</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <p className="text-xs text-gray-400 mb-2">10-Year Yield</p>
            <p className="text-3xl font-bold text-white">{risk?.yield10s?.toFixed(2) || 'N/A'}%</p>
            <p className="text-xs text-gray-400 mt-1">Long end</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <p className="text-xs text-gray-400 mb-2">2s10s Slope</p>
            <div className="flex items-center gap-2">
              <p className={`text-3xl font-bold ${curveSteepness.color}`}>
                {risk?.slope2s10s?.toFixed(0) || 'N/A'}bp
              </p>
              {risk?.slope2s10s > 0 ? (
                <TrendingUp className="w-5 h-5 text-green-400" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-400" />
              )}
            </div>
            <p className={`text-xs mt-1 ${curveSteepness.color}`}>{curveSteepness.label}</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <p className="text-xs text-gray-400 mb-2">Rate Volatility</p>
            <p className="text-3xl font-bold text-white">{risk?.volatility20d?.toFixed(2) || 'N/A'}%</p>
            <p className="text-xs text-gray-400 mt-1">20-day realized</p>
          </CardContent>
        </Card>
      </div>

      {/* 3D Yield Curve Evolution */}
      <YieldCurve3D title="Yield Curve Evolution (3D View)" />

      {/* Yield Curve Chart */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Yield Curve Shape</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-end justify-around gap-4 px-8">
            {[
              { label: '1M', yield: risk?.yield2s * 0.95 },
              { label: '3M', yield: risk?.yield2s * 0.97 },
              { label: '6M', yield: risk?.yield2s * 0.99 },
              { label: '1Y', yield: risk?.yield2s },
              { label: '2Y', yield: risk?.yield2s },
              { label: '5Y', yield: (risk?.yield2s + risk?.yield10s) / 2 },
              { label: '10Y', yield: risk?.yield10s },
              { label: '30Y', yield: risk?.yield10s * 1.05 }
            ].map((point, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-lg transition-all"
                  style={{ height: `${(point.yield / 6) * 100}%` }}
                />
                <p className="text-xs text-gray-400 mt-2">{point.label}</p>
                <p className="text-sm font-bold text-white">{point.yield?.toFixed(2)}%</p>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-gray-900/50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <div>
                <p className="text-gray-400">Curve Slope (2s10s):</p>
                <p className={`text-xl font-bold ${curveSteepness.color}`}>
                  {risk?.slope2s10s?.toFixed(0)}bp - {curveSteepness.label}
                </p>
              </div>
              <div className="text-right">
                <p className="text-gray-400">Market Signal:</p>
                <p className="text-white">
                  {risk?.slope2s10s > 50 
                    ? 'Growth expectations strong' 
                    : risk?.slope2s10s > 0 
                    ? 'Normal market conditions' 
                    : 'Potential recession signal'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bond Yields Table */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Government Bond Yields</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>
                <th className="text-left p-3 text-gray-400 font-semibold">MATURITY</th>
                <th className="text-left p-3 text-gray-400 font-semibold">NAME</th>
                <th className="text-right p-3 text-gray-400 font-semibold">YIELD</th>
                <th className="text-right p-3 text-gray-400 font-semibold">1D CHG</th>
                <th className="text-right p-3 text-gray-400 font-semibold">PRICE</th>
              </tr>
            </thead>
            <tbody>
              {snapshot?.bonds?.map((bond, idx) => (
                <tr key={idx} className="border-b border-gray-800 hover:bg-gray-700/50">
                  <td className="p-3 font-mono font-bold text-white">{bond.symbol}</td>
                  <td className="p-3 text-gray-300">{bond.name}</td>
                  <td className="p-3 text-right font-mono text-white text-lg">{bond.yield?.toFixed(2)}%</td>
                  <td className={`p-3 text-right font-mono font-bold ${bond.chg1D >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {bond.chg1D >= 0 ? '+' : ''}{bond.chg1D?.toFixed(2)}bp
                  </td>
                  <td className="p-3 text-right font-mono text-gray-400">{bond.price?.toFixed(3) || '--'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
