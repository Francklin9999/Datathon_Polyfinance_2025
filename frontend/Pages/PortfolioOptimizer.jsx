import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, TrendingUp, Sliders, Zap, Download, Play } from 'lucide-react';
import { PieChart, Pie, Cell, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ScatterChart, Scatter } from 'recharts';

export default function PortfolioOptimizer() {
  const [objective, setObjective] = useState('sharpe');
  const [riskTolerance, setRiskTolerance] = useState('moderate');
  const [isOptimizing, setIsOptimizing] = useState(false);

  const currentAllocation = [
    { name: 'Equities', value: 45, color: '#10B981' },
    { name: 'Fixed Income', value: 30, color: '#3B82F6' },
    { name: 'Alternatives', value: 15, color: '#F59E0B' },
    { name: 'Cash', value: 10, color: '#6B7280' }
  ];

  const optimizedAllocation = [
    { name: 'Equities', value: 52, color: '#10B981' },
    { name: 'Fixed Income', value: 25, color: '#3B82F6' },
    { name: 'Alternatives', value: 18, color: '#F59E0B' },
    { name: 'Cash', value: 5, color: '#6B7280' }
  ];

  const efficientFrontier = Array.from({ length: 50 }, (_, i) => ({
    risk: 5 + i * 0.4,
    return: Math.sqrt(i * 2) + 3 + Math.random() * 0.5,
    optimal: i === 25
  }));

  const performanceComparison = [
    { metric: 'Expected Return', current: 7.2, optimized: 9.8 },
    { metric: 'Volatility', current: 12.5, optimized: 11.2 },
    { metric: 'Sharpe Ratio', current: 0.58, optimized: 0.88 },
    { metric: 'Max Drawdown', current: -15.3, optimized: -12.1 }
  ];

  const sectorExposure = [
    { sector: 'Technology', current: 28, optimized: 32, max: 35 },
    { sector: 'Healthcare', current: 15, optimized: 18, max: 25 },
    { sector: 'Financials', current: 12, optimized: 14, max: 20 },
    { sector: 'Consumer', current: 18, optimized: 16, max: 25 },
    { sector: 'Energy', current: 8, optimized: 6, max: 15 },
    { sector: 'Industrials', current: 10, optimized: 9, max: 20 },
    { sector: 'Other', current: 9, optimized: 5, max: 15 }
  ];

  const riskContribution = [
    { asset: 'Equities', contribution: 65 },
    { asset: 'Fixed Income', contribution: 15 },
    { asset: 'Alternatives', contribution: 18 },
    { asset: 'Cash', contribution: 2 }
  ];

  const constraintsData = [
    { subject: 'Return', current: 75, optimized: 95, fullMark: 100 },
    { subject: 'Risk Control', current: 60, optimized: 85, fullMark: 100 },
    { subject: 'Diversification', current: 70, optimized: 90, fullMark: 100 },
    { subject: 'ESG Score', current: 65, optimized: 80, fullMark: 100 },
    { subject: 'Liquidity', current: 80, optimized: 85, fullMark: 100 }
  ];

  const handleOptimize = () => {
    setIsOptimizing(true);
    setTimeout(() => setIsOptimizing(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Target className="w-8 h-8 text-blue-400" />
            Portfolio Optimizer
          </h1>
          <p className="text-gray-400 mt-1">AI-powered mean-variance optimization with ML constraints</p>
        </div>

        {/* Optimization Controls */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Optimization Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Objective Function</label>
                <Select value={objective} onValueChange={setObjective}>
                  <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sharpe">Maximize Sharpe Ratio</SelectItem>
                    <SelectItem value="return">Maximize Return</SelectItem>
                    <SelectItem value="risk">Minimize Risk</SelectItem>
                    <SelectItem value="esg">ESG-Optimized</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Risk Tolerance</label>
                <Select value={riskTolerance} onValueChange={setRiskTolerance}>
                  <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conservative">Conservative</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="aggressive">Aggressive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Time Horizon</label>
                <Select defaultValue="5">
                  <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Year</SelectItem>
                    <SelectItem value="3">3 Years</SelectItem>
                    <SelectItem value="5">5 Years</SelectItem>
                    <SelectItem value="10">10+ Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={handleOptimize}
                disabled={isOptimizing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isOptimizing ? (
                  <>
                    <Zap className="w-4 h-4 mr-2 animate-pulse" />
                    Optimizing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run Optimization
                  </>
                )}
              </Button>
              <Button variant="outline" className="border-gray-700 text-white">
                <Sliders className="w-4 h-4 mr-2" />
                Advanced Constraints
              </Button>
              <Button variant="outline" className="border-gray-700 text-white ml-auto">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <p className="text-xs text-gray-400 mb-2">Expected Return</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-white">9.8%</p>
                <Badge className="bg-green-600">+2.6%</Badge>
              </div>
              <p className="text-xs text-gray-400 mt-1">vs current: 7.2%</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <p className="text-xs text-gray-400 mb-2">Risk (Volatility)</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-white">11.2%</p>
                <Badge className="bg-green-600">-1.3%</Badge>
              </div>
              <p className="text-xs text-gray-400 mt-1">vs current: 12.5%</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <p className="text-xs text-gray-400 mb-2">Sharpe Ratio</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-white">0.88</p>
                <Badge className="bg-green-600">+52%</Badge>
              </div>
              <p className="text-xs text-gray-400 mt-1">vs current: 0.58</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <p className="text-xs text-gray-400 mb-2">ESG Score</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-white">80/100</p>
                <Badge className="bg-green-600">+15</Badge>
              </div>
              <p className="text-xs text-gray-400 mt-1">vs current: 65</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Allocation Comparison */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Asset Allocation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-400 mb-3 text-center">Current</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={currentAllocation} dataKey="value" cx="50%" cy="50%" outerRadius={80}>
                        {currentAllocation.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-3 text-center">Optimized</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={optimizedAllocation} dataKey="value" cx="50%" cy="50%" outerRadius={80}>
                        {optimizedAllocation.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {optimizedAllocation.map((asset, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: asset.color }} />
                      <span className="text-gray-300">{asset.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400">{currentAllocation[idx].value}%</span>
                      <span className="text-gray-500">→</span>
                      <span className="text-white font-semibold">{asset.value}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Efficient Frontier */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Efficient Frontier</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="risk" 
                    stroke="#9CA3AF" 
                    label={{ value: 'Risk (Volatility %)', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    dataKey="return" 
                    stroke="#9CA3AF"
                    label={{ value: 'Expected Return (%)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
                  <Scatter 
                    data={efficientFrontier.filter(d => !d.optimal)} 
                    fill="#3B82F6" 
                  />
                  <Scatter 
                    data={efficientFrontier.filter(d => d.optimal)} 
                    fill="#10B981" 
                    shape="star"
                  />
                </ScatterChart>
              </ResponsiveContainer>
              <div className="mt-3 p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                <p className="text-sm text-green-300">
                  ⭐ Optimal Portfolio: 9.8% return at 11.2% risk (Sharpe: 0.88)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sector Exposure */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Sector Exposure Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sectorExposure}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="sector" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" label={{ value: 'Exposure (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
                <Legend />
                <Bar dataKey="current" fill="#6B7280" name="Current" />
                <Bar dataKey="optimized" fill="#3B82F6" name="Optimized" />
                <Bar dataKey="max" fill="#EF4444" name="Max Limit" fillOpacity={0.3} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Risk Contribution */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Risk Contribution Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {riskContribution.map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-300">{item.asset}</span>
                      <span className="text-white font-semibold">{item.contribution}%</span>
                    </div>
                    <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                        style={{ width: `${item.contribution}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <p className="text-xs text-blue-300">
                  Optimized portfolio reduces equity risk contribution while maintaining target return
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Constraints Radar */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Optimization Constraints</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={constraintsData}>
                  <PolarGrid stroke="#374151" />
                  <PolarAngleAxis dataKey="subject" stroke="#9CA3AF" />
                  <PolarRadiusAxis stroke="#9CA3AF" />
                  <Radar name="Current" dataKey="current" stroke="#6B7280" fill="#6B7280" fillOpacity={0.3} />
                  <Radar name="Optimized" dataKey="optimized" stroke="#10B981" fill="#10B981" fillOpacity={0.5} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Performance Comparison Table */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Detailed Performance Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full">
              <thead className="bg-gray-900 border-b border-gray-700">
                <tr>
                  <th className="text-left p-3 text-gray-400 font-semibold">METRIC</th>
                  <th className="text-right p-3 text-gray-400 font-semibold">CURRENT</th>
                  <th className="text-right p-3 text-gray-400 font-semibold">OPTIMIZED</th>
                  <th className="text-right p-3 text-gray-400 font-semibold">IMPROVEMENT</th>
                </tr>
              </thead>
              <tbody>
                {performanceComparison.map((row, idx) => {
                  const improvement = ((row.optimized - row.current) / Math.abs(row.current) * 100);
                  return (
                    <tr key={idx} className="border-b border-gray-800">
                      <td className="p-3 text-white font-medium">{row.metric}</td>
                      <td className="p-3 text-right font-mono text-gray-300">{row.current.toFixed(2)}</td>
                      <td className="p-3 text-right font-mono text-white font-bold">{row.optimized.toFixed(2)}</td>
                      <td className={`p-3 text-right font-mono font-semibold ${improvement > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {improvement > 0 ? '+' : ''}{improvement.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}