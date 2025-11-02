
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GitBranch, TrendingUp, TrendingDown, Target, AlertCircle, Play } from 'lucide-react';
import { LineChart, Line, ScatterChart, Scatter, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Area, AreaChart } from 'recharts';

export default function StatisticalArbitrage() {
  const [pairType, setPairType] = useState('cointegrated');

  // Active pairs
  const activePairs = [
    {
      pair: 'GM / F',
      type: 'Cointegrated',
      zscore: 2.8,
      halfLife: 4.2,
      sharpe: 1.9,
      status: 'LONG GM, SHORT F',
      entryDate: '2024-12-10',
      pnl: 4850,
      exposure: 250000
    },
    {
      pair: 'KO / PEP',
      type: 'Cointegrated',
      zscore: -2.1,
      halfLife: 6.8,
      sharpe: 2.3,
      status: 'SHORT KO, LONG PEP',
      entryDate: '2024-12-12',
      pnl: 3200,
      exposure: 180000
    },
    {
      pair: 'XOM / CVX',
      type: 'Sector Neutral',
      zscore: 1.5,
      halfLife: 3.5,
      sharpe: 1.7,
      status: 'LONG XOM, SHORT CVX',
      entryDate: '2024-12-15',
      pnl: -850,
      exposure: 150000
    }
  ];

  // Pair spread analysis
  const spreadData = Array.from({ length: 120 }, (_, i) => ({
    day: i,
    spread: Math.sin(i / 10) * 2 + Math.random() * 0.5,
    upperBand: 2.0,
    lowerBand: -2.0,
    mean: 0
  }));

  // Cointegration test results
  const cointegrationTests = [
    { pair: 'JPM / BAC', adf: -3.82, criticalValue: -3.41, pValue: 0.003, halfLife: 5.2, correlation: 0.89, result: 'Pass' },
    { pair: 'MSFT / ORCL', adf: -4.15, criticalValue: -3.41, pValue: 0.001, halfLife: 4.8, correlation: 0.85, result: 'Pass' },
    { pair: 'WMT / TGT', adf: -3.95, criticalValue: -3.41, pValue: 0.002, halfLife: 6.1, correlation: 0.91, result: 'Pass' },
    { pair: 'BA / LMT', adf: -2.89, criticalValue: -3.41, pValue: 0.152, halfLife: null, correlation: 0.72, result: 'Fail' },
    { pair: 'DIS / NFLX', adf: -3.52, criticalValue: -3.41, pValue: 0.008, halfLife: 7.3, correlation: 0.78, result: 'Pass' }
  ];

  // Portfolio performance
  const portfolioPerformance = Array.from({ length: 252 }, (_, i) => ({
    day: i + 1,
    cumReturn: (1 + (0.12 / 252)) ** i * 100,
    drawdown: Math.min(0, -Math.random() * 5),
    sharpe: 1.5 + (Math.random() - 0.5) * 0.5
  }));

  // Mean reversion analysis
  const meanReversionMetrics = {
    avgHalfLife: 5.3,
    avgZScore: 1.85,
    winRate: 64.2,
    avgHoldingPeriod: 8.7,
    profitFactor: 2.1,
    maxDrawdown: -8.5
  };

  // Risk metrics
  const riskMetrics = {
    totalExposure: 580000,
    netExposure: 12000,
    grossExposure: 1160000,
    var95: 15200,
    cvar95: 22400,
    betaToMarket: 0.08
  };

  // Trade history
  const tradeHistory = [
    { date: '2024-12-01', pair: 'C / WFC', entry: 2.45, exit: 0.12, return: 8.5, duration: 12 },
    { date: '2024-11-28', pair: 'HD / LOW', entry: -2.82, exit: -0.45, return: 6.2, duration: 9 },
    { date: '2024-11-25', pair: 'PFE / MRK', entry: 3.15, exit: 0.85, return: 5.8, duration: 14 },
    { date: '2024-11-20', pair: 'UNH / CVS', entry: -1.95, exit: 0.25, return: 4.1, duration: 7 },
    { date: '2024-11-15', pair: 'V / MA', entry: 2.65, exit: -0.15, return: -2.3, duration: 6 }
  ];

  // Z-score distribution
  const zscoreDistribution = [
    { range: '< -3', count: 12, avgReturn: 9.2 },
    { range: '-3 to -2', count: 45, avgReturn: 6.8 },
    { range: '-2 to -1', count: 88, avgReturn: 3.2 },
    { range: '-1 to 1', count: 156, avgReturn: 0.5 },
    { range: '1 to 2', count: 92, avgReturn: 2.9 },
    { range: '2 to 3', count: 48, avgReturn: 6.5 },
    { range: '> 3', count: 15, avgReturn: 8.7 }
  ];

  const getStatusColor = (zscore) => {
    const abs = Math.abs(zscore);
    if (abs > 2.5) return 'bg-green-600';
    if (abs > 2.0) return 'bg-blue-600';
    if (abs > 1.5) return 'bg-yellow-600';
    return 'bg-gray-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <GitBranch className="w-8 h-8 text-orange-400" />
            Statistical Arbitrage
          </h1>
          <p className="text-gray-400 mt-1">Pairs trading, cointegration analysis, and market-neutral portfolio construction</p>
        </div>

        {/* Risk Metrics Summary */}
        <div className="grid md:grid-cols-6 gap-4">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <p className="text-xs text-gray-400 mb-1">Net Exposure</p>
              <p className="text-xl font-bold text-green-400">${(riskMetrics.netExposure / 1000).toFixed(0)}K</p>
              <p className="text-xs text-gray-500">Market neutral</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <p className="text-xs text-gray-400 mb-1">Gross Exposure</p>
              <p className="text-xl font-bold text-white">${(riskMetrics.grossExposure / 1000).toFixed(0)}K</p>
              <p className="text-xs text-gray-500">Total capital</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <p className="text-xs text-gray-400 mb-1">VaR (95%)</p>
              <p className="text-xl font-bold text-red-400">${(riskMetrics.var95 / 1000).toFixed(1)}K</p>
              <p className="text-xs text-gray-500">1-day</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <p className="text-xs text-gray-400 mb-1">Win Rate</p>
              <p className="text-xl font-bold text-white">{meanReversionMetrics.winRate}%</p>
              <p className="text-xs text-gray-500">All pairs</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <p className="text-xs text-gray-400 mb-1">Profit Factor</p>
              <p className="text-xl font-bold text-white">{meanReversionMetrics.profitFactor}x</p>
              <p className="text-xs text-gray-500">Wins/Losses</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <p className="text-xs text-gray-400 mb-1">Market Beta</p>
              <p className="text-xl font-bold text-white">{riskMetrics.betaToMarket}</p>
              <p className="text-xs text-green-500">Low correlation</p>
            </CardContent>
          </Card>
        </div>

        {/* Active Pairs */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Active Pairs Positions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activePairs.map((pair, idx) => (
                <div key={idx} className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h4 className="text-xl font-bold text-white">{pair.pair}</h4>
                      <Badge className={getStatusColor(pair.zscore)}>
                        Z-Score: {pair.zscore.toFixed(2)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {pair.type}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${pair.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {pair.pnl >= 0 ? '+' : ''}${pair.pnl.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400">P&L</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Position</p>
                      <p className="text-white font-semibold">{pair.status}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Half-Life</p>
                      <p className="text-white font-semibold">{pair.halfLife}d</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Sharpe</p>
                      <p className="text-white font-semibold">{pair.sharpe}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Entry Date</p>
                      <p className="text-white font-semibold">{pair.entryDate}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Exposure</p>
                      <p className="text-white font-semibold">${(pair.exposure / 1000).toFixed(0)}K</p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" className="border-gray-700 text-white">
                      Close Position
                    </Button>
                    <Button size="sm" variant="outline" className="border-gray-700 text-white">
                      Adjust Size
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Spread Analysis */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Pair Spread & Mean Reversion</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={spreadData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="day" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
                  <Legend />
                  <Line type="monotone" dataKey="upperBand" stroke="#EF4444" strokeDasharray="5 5" name="Upper Band (+2σ)" />
                  <Line type="monotone" dataKey="lowerBand" stroke="#EF4444" strokeDasharray="5 5" name="Lower Band (-2σ)" />
                  <Line type="monotone" dataKey="mean" stroke="#6B7280" strokeDasharray="3 3" name="Mean" />
                  <Line type="monotone" dataKey="spread" stroke="#3B82F6" strokeWidth={2} name="Spread Z-Score" />
                </ComposedChart>
              </ResponsiveContainer>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="bg-gray-900/50 p-3 rounded">
                  <p className="text-xs text-gray-400">Current Z-Score</p>
                  <p className="text-2xl font-bold text-white">2.45</p>
                </div>
                <div className="bg-gray-900/50 p-3 rounded">
                  <p className="text-xs text-gray-400">Half-Life</p>
                  <p className="text-2xl font-bold text-white">5.3d</p>
                </div>
                <div className="bg-gray-900/50 p-3 rounded">
                  <p className="text-xs text-gray-400">Mean Reversion</p>
                  <p className="text-2xl font-bold text-green-400">Strong</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Portfolio Performance */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Portfolio Cumulative Returns</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={portfolioPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="day" stroke="#9CA3AF" />
                  <YAxis yAxisId="left" stroke="#9CA3AF" />
                  <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
                  <Legend />
                  <Area yAxisId="left" type="monotone" dataKey="cumReturn" fill="#10B981" stroke="#10B981" fillOpacity={0.3} name="Cumulative Return" />
                  <Line yAxisId="right" type="monotone" dataKey="sharpe" stroke="#8B5CF6" name="Rolling Sharpe" />
                </ComposedChart>
              </ResponsiveContainer>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="bg-green-900/20 border border-green-500/30 p-3 rounded">
                  <p className="text-xs text-green-400">Total Return</p>
                  <p className="text-2xl font-bold text-white">+12.3%</p>
                </div>
                <div className="bg-gray-900/50 p-3 rounded">
                  <p className="text-xs text-gray-400">Sharpe Ratio</p>
                  <p className="text-2xl font-bold text-white">1.85</p>
                </div>
                <div className="bg-red-900/20 border border-red-500/30 p-3 rounded">
                  <p className="text-xs text-red-400">Max DD</p>
                  <p className="text-2xl font-bold text-white">-8.5%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cointegration Tests */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Cointegration Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-900 border-b border-gray-700">
                  <tr>
                    <th className="text-left p-3 text-gray-400 font-semibold">PAIR</th>
                    <th className="text-right p-3 text-gray-400 font-semibold">ADF STAT</th>
                    <th className="text-right p-3 text-gray-400 font-semibold">CRITICAL</th>
                    <th className="text-right p-3 text-gray-400 font-semibold">P-VALUE</th>
                    <th className="text-right p-3 text-gray-400 font-semibold">HALF-LIFE</th>
                    <th className="text-right p-3 text-gray-400 font-semibold">CORRELATION</th>
                    <th className="text-center p-3 text-gray-400 font-semibold">RESULT</th>
                  </tr>
                </thead>
                <tbody>
                  {cointegrationTests.map((test, idx) => (
                    <tr key={idx} className="border-b border-gray-800 hover:bg-gray-700/50">
                      <td className="p-3 font-mono font-bold text-white">{test.pair}</td>
                      <td className="p-3 text-right font-mono text-white">{test.adf.toFixed(2)}</td>
                      <td className="p-3 text-right font-mono text-gray-400">{test.criticalValue.toFixed(2)}</td>
                      <td className="p-3 text-right font-mono text-white">{test.pValue.toFixed(3)}</td>
                      <td className="p-3 text-right font-mono text-white">
                        {test.halfLife ? `${test.halfLife.toFixed(1)}d` : 'N/A'}
                      </td>
                      <td className="p-3 text-right font-mono text-white">{test.correlation.toFixed(2)}</td>
                      <td className="p-3 text-center">
                        <Badge className={test.result === 'Pass' ? 'bg-green-600' : 'bg-red-600'}>
                          {test.result}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-300">
                <Target className="w-4 h-4 inline mr-1" />
                <strong>Cointegration Note:</strong> ADF statistic must be more negative than critical value for pairs to be cointegrated. 
                P-value {'<'} 0.05 indicates statistical significance. Half-life shows expected mean-reversion time.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Z-Score Distribution */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Entry Z-Score Distribution & Returns</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={zscoreDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="range" stroke="#9CA3AF" />
                  <YAxis yAxisId="left" stroke="#9CA3AF" />
                  <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="count" fill="#6B7280" name="Trade Count" />
                  <Bar yAxisId="right" dataKey="avgReturn" fill="#10B981" name="Avg Return %" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Trade History */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Recent Closed Trades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {tradeHistory.map((trade, idx) => (
                  <div key={idx} className="p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-bold text-white">{trade.pair}</span>
                      <span className={`text-lg font-bold ${trade.return >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {trade.return >= 0 ? '+' : ''}{trade.return}%
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div>
                        <p className="text-gray-400">Entry Z</p>
                        <p className="text-white font-semibold">{trade.entry.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Exit Z</p>
                        <p className="text-white font-semibold">{trade.exit.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Duration</p>
                        <p className="text-white font-semibold">{trade.duration}d</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Date</p>
                        <p className="text-white font-semibold">{trade.date}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Strategy Summary */}
        <Card className="bg-gradient-to-r from-orange-900/20 to-red-900/20 border-orange-500/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-white font-semibold mb-1">Statistical Arbitrage Strategy Performance</h4>
                <p className="text-sm text-gray-300">
                  Market-neutral portfolio with {riskMetrics.betaToMarket} beta delivering consistent returns. 
                  Win rate of {meanReversionMetrics.winRate}% with {meanReversionMetrics.profitFactor}x profit factor. 
                  Average half-life of {meanReversionMetrics.avgHalfLife} days suggests efficient mean reversion. 
                  Current exposure ${(riskMetrics.grossExposure / 1000000).toFixed(1)}M with net market exposure of just ${(riskMetrics.netExposure / 1000).toFixed(0)}K - true market neutrality achieved.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
