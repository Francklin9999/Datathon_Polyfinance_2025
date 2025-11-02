
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Cpu, Activity, TrendingUp, TrendingDown, AlertCircle, Zap } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';

export default function MarketMicrostructure() {
  const [symbol, setSymbol] = useState('AAPL');

  // Level 3 Order Book Data
  const orderBookDepth = {
    bids: Array.from({ length: 20 }, (_, i) => ({
      price: 185.50 - (i * 0.01),
      quantity: Math.floor(Math.random() * 5000) + 1000,
      orders: Math.floor(Math.random() * 20) + 5,
      cumulative: 0
    })),
    asks: Array.from({ length: 20 }, (_, i) => ({
      price: 185.51 + (i * 0.01),
      quantity: Math.floor(Math.random() * 5000) + 1000,
      orders: Math.floor(Math.random() * 20) + 5,
      cumulative: 0
    }))
  };

  // Calculate cumulative quantities
  let cumBid = 0;
  orderBookDepth.bids.forEach(bid => {
    cumBid += bid.quantity;
    bid.cumulative = cumBid;
  });

  let cumAsk = 0;
  orderBookDepth.asks.forEach(ask => {
    cumAsk += ask.quantity;
    ask.cumulative = cumAsk;
  });

  // Order flow imbalance over time
  const orderFlowImbalance = Array.from({ length: 60 }, (_, i) => ({
    time: i,
    imbalance: (Math.random() - 0.5) * 100,
    price: 185.50 + (Math.random() - 0.5) * 2,
    volume: Math.random() * 10000
  }));

  // Spread analysis
  const spreadAnalysis = {
    bidAskSpread: 0.01,
    spreadBps: 0.54,
    effectiveSpread: 0.012,
    realizedSpread: 0.008,
    priceImpact: 0.004
  };

  // Order flow toxicity
  const flowToxicity = Array.from({ length: 30 }, (_, i) => ({
    minute: i,
    vpin: Math.random() * 100,
    kyle: Math.random() * 0.5,
    adverse: Math.random() * 0.3
  }));

  // Microstructure metrics
  const metrics = {
    effectiveSpread: 0.012,
    realizedSpread: 0.008,
    priceImpact: 0.004,
    orderToxicity: 0.32,
    kyleLambda: 0.15,
    vpin: 42.3,
    rollingVolatility: 1.8,
    tickPressure: 1.25
  };

  // Trade size distribution
  const tradeSizeDistribution = [
    { size: '< 100', count: 2450, percentage: 45 },
    { size: '100-500', count: 1520, percentage: 28 },
    { size: '500-1000', count: 780, percentage: 14 },
    { size: '1000-5000', count: 520, percentage: 10 },
    { size: '> 5000', count: 180, percentage: 3 }
  ];

  // Liquidity provision
  const liquidityProvision = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    making: 1000 + Math.random() * 500,
    taking: 900 + Math.random() * 600,
    net: (Math.random() - 0.5) * 200
  }));

  // Hidden liquidity estimates
  const hiddenLiquidity = {
    icebergOrders: 15,
    darkPoolVolume: 28.5,
    hiddenDepth: 45000,
    percentageOfTotal: 32.1
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Cpu className="w-8 h-8 text-yellow-400" />
            Market Microstructure Analytics
          </h1>
          <p className="text-gray-400 mt-1">Level 3 order book analysis, order flow toxicity, and high-frequency market impact models</p>
        </div>

        {/* Real-Time Metrics */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <p className="text-xs text-gray-400 mb-1">Effective Spread</p>
              <p className="text-2xl font-bold text-white">{metrics.effectiveSpread}%</p>
              <p className="text-xs text-green-400 mt-1">Below average</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <p className="text-xs text-gray-400 mb-1">Price Impact</p>
              <p className="text-2xl font-bold text-white">{metrics.priceImpact}%</p>
              <p className="text-xs text-gray-400 mt-1">Per $1M traded</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <p className="text-xs text-gray-400 mb-1">VPIN</p>
              <p className="text-2xl font-bold text-yellow-400">{metrics.vpin}</p>
              <p className="text-xs text-yellow-400 mt-1">Moderate toxicity</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <p className="text-xs text-gray-400 mb-1">Kyle's Lambda</p>
              <p className="text-2xl font-bold text-white">{metrics.kyleLambda}</p>
              <p className="text-xs text-gray-400 mt-1">Market impact coef</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Order Book Depth Chart */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Order Book Depth (Level 3)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" domain={[185.30, 185.70]} stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
                  <Legend />
                  <Area 
                    data={orderBookDepth.bids} 
                    type="stepAfter" 
                    dataKey="cumulative" 
                    fill="#10B981" 
                    stroke="#10B981"
                    fillOpacity={0.3}
                    name="Bid Depth"
                  />
                  <Area 
                    data={orderBookDepth.asks} 
                    type="stepBefore" 
                    dataKey="cumulative" 
                    fill="#EF4444" 
                    stroke="#EF4444"
                    fillOpacity={0.3}
                    name="Ask Depth"
                  />
                </ComposedChart>
              </ResponsiveContainer>

              <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                <div className="bg-gray-900/50 p-3 rounded">
                  <p className="text-gray-400">Bid-Ask Spread</p>
                  <p className="text-xl font-bold text-white">${spreadAnalysis.bidAskSpread}</p>
                </div>
                <div className="bg-gray-900/50 p-3 rounded">
                  <p className="text-gray-400">Spread (bps)</p>
                  <p className="text-xl font-bold text-white">{spreadAnalysis.spreadBps}</p>
                </div>
                <div className="bg-gray-900/50 p-3 rounded">
                  <p className="text-gray-400">Total Depth</p>
                  <p className="text-xl font-bold text-white">{(cumBid + cumAsk).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Flow Imbalance */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Order Flow Imbalance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={orderFlowImbalance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="time" stroke="#9CA3AF" />
                  <YAxis yAxisId="left" stroke="#9CA3AF" />
                  <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="imbalance" fill="#8B5CF6" name="Imbalance %" />
                  <Line yAxisId="right" type="monotone" dataKey="price" stroke="#3B82F6" name="Price" />
                </ComposedChart>
              </ResponsiveContainer>

              <div className="mt-4 p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                <p className="text-sm text-purple-300">
                  <Activity className="w-4 h-4 inline mr-1" />
                  Strong buy-side imbalance detected. Suggests institutional accumulation over last 60 minutes.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Flow Toxicity */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Order Flow Toxicity Indicators</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={flowToxicity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="minute" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
                <Legend />
                <Line type="monotone" dataKey="vpin" stroke="#F59E0B" name="VPIN" />
                <Line type="monotone" dataKey="kyle" stroke="#EF4444" name="Kyle's Lambda" />
                <Line type="monotone" dataKey="adverse" stroke="#8B5CF6" name="Adverse Selection" />
              </LineChart>
            </ResponsiveContainer>

            <div className="grid md:grid-cols-3 gap-4 mt-4">
              <div className="p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                <p className="text-xs text-yellow-400 font-semibold mb-1">VPIN (Volume-Sync PIN)</p>
                <p className="text-sm text-gray-300">
                  Measures informed trading probability. Current level: {metrics.vpin} (Moderate). 
                  Values &gt; 70 indicate high toxicity.
                </p>
              </div>
              <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                <p className="text-xs text-red-400 font-semibold mb-1">Kyle's Lambda</p>
                <p className="text-sm text-gray-300">
                  Market impact coefficient: {metrics.kyleLambda}. Lower values indicate better liquidity. 
                  Expect {(metrics.kyleLambda * 100).toFixed(1)} bps impact per $1M.
                </p>
              </div>
              <div className="p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                <p className="text-xs text-purple-400 font-semibold mb-1">Adverse Selection</p>
                <p className="text-sm text-gray-300">
                  Realized vs effective spread ratio: {metrics.orderToxicity.toFixed(2)}. 
                  Higher values suggest informed traders are present.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Trade Size Distribution */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Trade Size Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={tradeSizeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="size" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
                  <Bar dataKey="count" fill="#3B82F6" name="Trade Count" />
                </BarChart>
              </ResponsiveContainer>

              <div className="mt-4 space-y-2">
                {tradeSizeDistribution.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">{item.size} shares</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500" 
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      <span className="text-white font-semibold w-12 text-right">{item.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Liquidity Provision */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Liquidity Provision (Making vs Taking)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={liquidityProvision}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="hour" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
                  <Legend />
                  <Area type="monotone" dataKey="making" stackId="1" stroke="#10B981" fill="#10B981" name="Making" />
                  <Area type="monotone" dataKey="taking" stackId="1" stroke="#EF4444" fill="#EF4444" name="Taking" />
                </AreaChart>
              </ResponsiveContainer>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="p-3 bg-green-900/20 border border-green-500/30 rounded">
                  <p className="text-xs text-green-400">Liquidity Making</p>
                  <p className="text-xl font-bold text-white">52.3%</p>
                </div>
                <div className="p-3 bg-red-900/20 border border-red-500/30 rounded">
                  <p className="text-xs text-red-400">Liquidity Taking</p>
                  <p className="text-xl font-bold text-white">47.7%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Hidden Liquidity */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Hidden Liquidity Estimates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="p-4 bg-gray-900/50 rounded-lg">
                <p className="text-sm text-gray-400 mb-2">Iceberg Orders</p>
                <p className="text-3xl font-bold text-white">{hiddenLiquidity.icebergOrders}</p>
                <p className="text-xs text-gray-500 mt-1">Detected in book</p>
              </div>
              <div className="p-4 bg-gray-900/50 rounded-lg">
                <p className="text-sm text-gray-400 mb-2">Dark Pool Volume</p>
                <p className="text-3xl font-bold text-white">{hiddenLiquidity.darkPoolVolume}%</p>
                <p className="text-xs text-gray-500 mt-1">Of total volume</p>
              </div>
              <div className="p-4 bg-gray-900/50 rounded-lg">
                <p className="text-sm text-gray-400 mb-2">Hidden Depth</p>
                <p className="text-3xl font-bold text-white">{hiddenLiquidity.hiddenDepth.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Estimated shares</p>
              </div>
              <div className="p-4 bg-gray-900/50 rounded-lg">
                <p className="text-sm text-gray-400 mb-2">% of Total</p>
                <p className="text-3xl font-bold text-white">{hiddenLiquidity.percentageOfTotal}%</p>
                <p className="text-xs text-gray-500 mt-1">Hidden vs visible</p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-300">
                <Zap className="w-4 h-4 inline mr-1" />
                <strong>Hidden Liquidity Alert:</strong> Significant iceberg orders detected at $185.45 bid (est. 25K shares). 
                Dark pool volume elevated at 28.5% - institutional block trades likely. Consider TWAP execution to minimize impact.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Insights */}
        <Card className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border-yellow-500/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-white font-semibold mb-1">Microstructure Analysis Summary</h4>
                <p className="text-sm text-gray-300">
                  Order book shows balanced depth with tight spreads (0.54 bps). VPIN at 42.3 indicates moderate informed trading. 
                  Liquidity provision ratio (52/48) is healthy. Hidden liquidity estimates suggest 32% of true depth is not visible - 
                  use limit orders near mid-point to minimize adverse selection costs. Optimal execution: VWAP with 20-minute participation rate.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
