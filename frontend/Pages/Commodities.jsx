import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, TrendingUp, TrendingDown, Sparkles, Flame, Droplet } from 'lucide-react';

export default function Commodities() {
  const [summary, setSummary] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: snapshots = [] } = useQuery({
    queryKey: ['snapshots'],
    queryFn: () => base44.entities.MarketSnapshot.list(),
    initialData: [],
  });

  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    try {
      const allCommodities = snapshots.flatMap(s => s.commodities || []);
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a commodities desk analyst. Provide a brief (3-5 sentences) summary of commodity market conditions: ${JSON.stringify(allCommodities)}. Focus on: energy complex, precious metals, supply/demand dynamics, geopolitical factors. Institutional tone.`,
      });
      setSummary({ text: result, timestamp: new Date() });
    } catch {
      const gold = snapshots[0]?.commodities?.find(c => c.symbol === 'GC');
      const oil = snapshots[0]?.commodities?.find(c => c.symbol === 'CL' || c.symbol === 'BRENT');
      setSummary({ 
        text: `Energy complex ${oil?.chg1D > 0 ? 'rallied' : 'declined'} with WTI at $${oil?.price?.toFixed(2)}. Gold ${gold?.chg1D > 0 ? 'gained' : 'lost'} ${Math.abs(gold?.chg1D || 0).toFixed(2)}% to $${gold?.price?.toFixed(2)}, reflecting ${gold?.chg1D > 0 ? 'safe-haven demand' : 'risk-on sentiment'}. Broad commodity volatility ${Math.abs(oil?.chg1D || 0) > 2 ? 'elevated' : 'moderate'}.`, 
        timestamp: new Date() 
      });
    }
    setIsGenerating(false);
  };

  const getAllCommodities = () => {
    const commodities = [];
    snapshots.forEach(snapshot => {
      if (snapshot.commodities) {
        snapshot.commodities.forEach(comm => {
          if (!commodities.find(c => c.symbol === comm.symbol)) {
            commodities.push({ ...comm, region: snapshot.region });
          }
        });
      }
    });
    return commodities;
  };

  const commodities = getAllCommodities();
  const energy = commodities.filter(c => ['CL', 'BRENT', 'NG'].includes(c.symbol));
  const metals = commodities.filter(c => ['GC', 'SI', 'HG'].includes(c.symbol));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Package className="w-8 h-8 text-orange-400" />
            Commodities Desk
          </h1>
          <p className="text-gray-400 mt-1">Energy, metals, agriculture, supply chain dynamics</p>
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

      {/* All Commodities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {commodities.map((comm, idx) => (
          <Card key={idx} className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-400">{comm.symbol}</p>
                  {['CL', 'BRENT', 'NG'].includes(comm.symbol) && <Flame className="w-4 h-4 text-orange-400" />}
                  {['GC', 'SI'].includes(comm.symbol) && <Droplet className="w-4 h-4 text-yellow-400" />}
                </div>
                {comm.chg1D > 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-400" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-400" />
                )}
              </div>
              <p className="text-2xl font-bold text-white">${comm.price?.toFixed(2)}</p>
              <p className={`text-lg font-semibold ${comm.chg1D >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {comm.chg1D >= 0 ? '+' : ''}{comm.chg1D?.toFixed(2)}%
              </p>
              <p className="text-xs text-gray-400 mt-1">{comm.name}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Energy Complex */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400" />
            Energy Complex
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {energy.length > 0 ? energy.map((comm, idx) => (
              <div key={idx} className={`p-4 rounded-lg border ${
                comm.chg1D > 0 ? 'bg-green-900/20 border-green-500/30' : 'bg-red-900/20 border-red-500/30'
              }`}>
                <p className="text-sm font-semibold text-white mb-1">{comm.symbol}</p>
                <p className="text-xs text-gray-400 mb-3">{comm.name}</p>
                <p className="text-3xl font-bold text-white">${comm.price?.toFixed(2)}</p>
                <p className={`text-xl font-bold mt-2 ${comm.chg1D >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {comm.chg1D >= 0 ? '+' : ''}{comm.chg1D?.toFixed(2)}%
                </p>
              </div>
            )) : (
              <p className="text-gray-400 col-span-3">No energy data available</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Metals Complex */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Droplet className="w-5 h-5 text-yellow-400" />
            Precious & Industrial Metals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {metals.length > 0 ? metals.map((comm, idx) => (
              <div key={idx} className={`p-4 rounded-lg border ${
                comm.chg1D > 0 ? 'bg-green-900/20 border-green-500/30' : 'bg-red-900/20 border-red-500/30'
              }`}>
                <p className="text-sm font-semibold text-white mb-1">{comm.symbol}</p>
                <p className="text-xs text-gray-400 mb-3">{comm.name}</p>
                <p className="text-3xl font-bold text-white">${comm.price?.toFixed(2)}</p>
                <p className={`text-xl font-bold mt-2 ${comm.chg1D >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {comm.chg1D >= 0 ? '+' : ''}{comm.chg1D?.toFixed(2)}%
                </p>
              </div>
            )) : (
              <p className="text-gray-400 col-span-3">No metals data available</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Market Insights */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Supply/Demand Dynamics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(() => {
                const oil = commodities.find(c => c.symbol === 'CL' || c.symbol === 'BRENT');
                const gold = commodities.find(c => c.symbol === 'GC');
                
                return (
                  <>
                    {oil && (
                      <div className="p-3 bg-orange-900/20 border border-orange-500/30 rounded-lg">
                        <p className="text-sm font-semibold text-orange-300">Oil Market</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {oil.chg1D > 1 ? 'Strong demand signals or supply concerns' :
                           oil.chg1D < -1 ? 'Demand weakness or oversupply indicators' :
                           'Balanced market conditions'}
                        </p>
                      </div>
                    )}
                    {gold && (
                      <div className="p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                        <p className="text-sm font-semibold text-yellow-300">Gold Market</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {gold.chg1D > 0.5 ? 'Safe-haven flows supporting prices' :
                           gold.chg1D < -0.5 ? 'Risk-on environment pressuring gold' :
                           'Consolidation phase'}
                        </p>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Trading Signals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <p className="text-sm font-semibold text-blue-300">Contango/Backwardation</p>
                <p className="text-xs text-gray-400 mt-1">
                  Monitor futures curve for storage plays and roll strategies
                </p>
              </div>
              <div className="p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                <p className="text-sm font-semibold text-purple-300">Crack Spreads</p>
                <p className="text-xs text-gray-400 mt-1">
                  Refining margins suggest {commodities[0]?.chg1D > 0 ? 'improving' : 'weakening'} downstream demand
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Volatility Monitor */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Volatility Monitor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {commodities.map((comm, idx) => {
              const volatility = Math.abs(comm.chg1D || 0);
              const level = volatility > 3 ? 'High' : volatility > 1.5 ? 'Medium' : 'Low';
              const color = volatility > 3 ? 'bg-red-500' : volatility > 1.5 ? 'bg-yellow-500' : 'bg-green-500';
              
              return (
                <div key={idx}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-400">{comm.symbol} - {comm.name}</span>
                    <span className="text-sm text-white">{level}</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${color}`} 
                      style={{ width: `${Math.min(volatility * 20, 100)}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}