import React, { useState } from 'react';
import { api } from '@/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, TrendingDown, Activity, Zap, Target } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, ScatterChart, Scatter } from 'recharts';
import ErrorDisplay from '@/components/ErrorDisplay';

export default function RiskAnalytics() {
  const [stressScenario, setStressScenario] = useState('baseline');
  
  // Fetch stress test data from backend
  const { data: stressData, error: stressError, isLoading: isLoadingStress, refetch: refetchStress } = useQuery({
    queryKey: ['stress-test', stressScenario],
    queryFn: () => api.risk.stressTest({
      positions: [],
      stressScenario: stressScenario
    }),
    enabled: !!stressScenario,
  });

  // Fetch correlation matrix
  const { data: correlationData, error: correlationError, isLoading: isLoadingCorrelation, refetch: refetchCorrelation } = useQuery({
    queryKey: ['correlation'],
    queryFn: () => api.risk.getCorrelation(),
    initialData: [],
  });

  // Default fallback data
  const defaultMonteCarloData = Array.from({ length: 50 }, (_, i) => ({
    day: i,
    p5: 95 + Math.random() * 5 - i * 0.3,
    p25: 98 + Math.random() * 3 - i * 0.2,
    p50: 100 - i * 0.1 + Math.sin(i / 5) * 2,
    p75: 102 + Math.random() * 3 + i * 0.1,
    p95: 105 + Math.random() * 5 + i * 0.2
  }));

  const defaultVarData = Array.from({ length: 20 }, (_, i) => ({
    return: -10 + i,
    frequency: Math.exp(-Math.pow(i - 10, 2) / 20) * 100
  }));

  const defaultCorrelationData = [
    { asset: 'Equities', equities: 1.0, bonds: -0.3, fx: 0.2, commodities: 0.5, re: 0.4 },
    { asset: 'Bonds', equities: -0.3, bonds: 1.0, fx: -0.1, commodities: -0.2, re: 0.1 },
    { asset: 'FX', equities: 0.2, bonds: -0.1, fx: 1.0, commodities: 0.3, re: 0.2 },
    { asset: 'Commodities', equities: 0.5, bonds: -0.2, fx: 0.3, commodities: 1.0, re: 0.3 },
    { asset: 'Real Estate', equities: 0.4, bonds: 0.1, fx: 0.2, commodities: 0.3, re: 1.0 }
  ];

  const defaultStressScenarios = {
    baseline: { var95: 12.3, cvar: 15.8, sharpe: 1.45, beta: 1.12 },
    recession: { var95: 24.7, cvar: 32.1, sharpe: 0.68, beta: 1.35 },
    'rate-hike': { var95: 18.5, cvar: 23.4, sharpe: 0.95, beta: 1.22 },
    'market-crash': { var95: 35.2, cvar: 45.6, sharpe: 0.32, beta: 1.58 }
  };

  // Use fetched data or fallback to defaults
  const monteCarloData = stressData?.monteCarlo || stressData?.monteCarloData || defaultMonteCarloData;
  const varData = stressData?.varDistribution || stressData?.varData || defaultVarData;
  const finalCorrelationData = correlationData && correlationData.length > 0 ? correlationData : defaultCorrelationData;
  const scenario = stressData?.metrics || defaultStressScenarios[stressScenario];
  const stressScenarios = {
    baseline: { var95: 12.3, cvar: 15.8, sharpe: 1.45, beta: 1.12 },
    recession: { var95: 24.7, cvar: 32.1, sharpe: 0.68, beta: 1.35 },
    'rate-hike': { var95: 18.5, cvar: 23.4, sharpe: 0.95, beta: 1.22 },
    'market-crash': { var95: 35.2, cvar: 45.6, sharpe: 0.32, beta: 1.58 }
  };

  // Tail Risk Data
  const defaultTailRiskData = Array.from({ length: 100 }, (_, i) => ({
    percentile: i,
    loss: Math.pow((100 - i) / 10, 2.5) * -1
  }));
  
  const tailRiskData = stressData?.tailRisk || stressData?.tailRiskData || defaultTailRiskData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-red-400" />
            Advanced Risk Analytics
          </h1>
          <p className="text-gray-400 mt-1">Real-time portfolio risk monitoring with ML-powered predictions</p>
        </div>

        {/* Risk Metrics */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-400">VaR (95%)</p>
                <AlertTriangle className="w-4 h-4 text-red-400" />
              </div>
              <p className="text-2xl font-bold text-white">{scenario.var95}%</p>
              <p className="text-xs text-gray-400 mt-1">1-day holding period</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-400">CVaR (Expected Shortfall)</p>
                <TrendingDown className="w-4 h-4 text-orange-400" />
              </div>
              <p className="text-2xl font-bold text-white">{scenario.cvar}%</p>
              <p className="text-xs text-gray-400 mt-1">Tail risk measure</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-400">Sharpe Ratio</p>
                <Target className="w-4 h-4 text-green-400" />
              </div>
              <p className="text-2xl font-bold text-white">{scenario.sharpe}</p>
              <p className="text-xs text-gray-400 mt-1">Risk-adjusted return</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-400">Portfolio Beta</p>
                <Activity className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-white">{scenario.beta}</p>
              <p className="text-xs text-gray-400 mt-1">Market sensitivity</p>
            </CardContent>
          </Card>
        </div>

        {/* Stress Test Scenarios */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Stress Test Scenarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 mb-6">
              {Object.keys(stressScenarios).map((scenario) => (
                <Button
                  key={scenario}
                  variant={stressScenario === scenario ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStressScenario(scenario)}
                  className={stressScenario === scenario ? 'bg-red-600' : 'border-gray-700 text-white'}
                >
                  {scenario.replace('-', ' ').toUpperCase()}
                </Button>
              ))}
            </div>
            {/* Error Display */}
            {(stressError || correlationError) && (
              <div className="mb-4">
                {stressError && (
                  <ErrorDisplay error={stressError} onRetry={refetchStress} title="Error Loading Stress Test Data" />
                )}
                {correlationError && (
                  <ErrorDisplay error={correlationError} onRetry={refetchCorrelation} title="Error Loading Correlation Data" />
                )}
              </div>
            )}

            {/* Loading State */}
            {(isLoadingStress || isLoadingCorrelation) && !stressError && !correlationError && (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                <span className="ml-3 text-gray-400">Loading risk data...</span>
              </div>
            )}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-white font-semibold mb-3">Scenario Impact Analysis</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-900/50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-400">Expected Loss</span>
                      <Badge className="bg-red-600">{scenario.var95}%</Badge>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500" style={{ width: `${(scenario.var95 / 40) * 100}%` }} />
                    </div>
                  </div>
                  <div className="p-3 bg-gray-900/50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-400">Tail Risk (CVaR)</span>
                      <Badge className="bg-orange-600">{scenario.cvar}%</Badge>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500" style={{ width: `${(scenario.cvar / 50) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-3">Risk-Adjusted Performance</h4>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={[
                    { name: 'Baseline', value: stressScenarios.baseline.sharpe },
                    { name: 'Current', value: scenario.sharpe }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
                    <Bar dataKey="value" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monte Carlo Simulation */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Monte Carlo Simulation (10,000 scenarios)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monteCarloData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="day" stroke="#9CA3AF" label={{ value: 'Trading Days', position: 'insideBottom', offset: -5 }} />
                <YAxis stroke="#9CA3AF" label={{ value: 'Portfolio Value (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
                <Area type="monotone" dataKey="p5" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.1} />
                <Area type="monotone" dataKey="p25" stackId="1" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.2} />
                <Area type="monotone" dataKey="p50" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.4} />
                <Area type="monotone" dataKey="p75" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.2} />
                <Area type="monotone" dataKey="p95" stackId="1" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.1} />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* VaR Distribution */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Value at Risk Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={varData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="return" stroke="#9CA3AF" label={{ value: 'Return (%)', position: 'insideBottom', offset: -5 }} />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
                  <Bar dataKey="frequency" fill="#EF4444" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-300">
                  <AlertTriangle className="w-4 h-4 inline mr-1" />
                  95% VaR: Maximum expected loss of <strong>{scenario.var95}%</strong> under normal market conditions
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tail Risk Analysis */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Tail Risk Exposure</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={tailRiskData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="percentile" stroke="#9CA3AF" label={{ value: 'Percentile', position: 'insideBottom', offset: -5 }} />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
                  <Line type="monotone" dataKey="loss" stroke="#EF4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-4 p-3 bg-orange-900/20 border border-orange-500/30 rounded-lg">
                <p className="text-sm text-orange-300">
                  Expected Shortfall (CVaR): <strong>{scenario.cvar}%</strong> - Average loss in worst 5% of scenarios
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Correlation Matrix */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Cross-Asset Correlation Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="p-2 text-left text-gray-400 text-sm"></th>
                    <th className="p-2 text-center text-gray-400 text-sm font-mono">EQUITIES</th>
                    <th className="p-2 text-center text-gray-400 text-sm font-mono">BONDS</th>
                    <th className="p-2 text-center text-gray-400 text-sm font-mono">FX</th>
                    <th className="p-2 text-center text-gray-400 text-sm font-mono">COMMODITIES</th>
                    <th className="p-2 text-center text-gray-400 text-sm font-mono">REAL ESTATE</th>
                  </tr>
                </thead>
                <tbody>
                  {finalCorrelationData.map((row, i) => (
                    <tr key={i}>
                      <td className="p-2 text-gray-400 font-mono text-sm">{row.asset.toUpperCase()}</td>
                      {['equities', 'bonds', 'fx', 'commodities', 're'].map((asset, j) => {
                        const value = row[asset];
                        const color = value > 0.5 ? 'bg-green-500' : value < -0.3 ? 'bg-red-500' : 'bg-yellow-500';
                        const opacity = Math.abs(value) * 0.7 + 0.3;
                        return (
                          <td
                            key={j}
                            className={`p-2 text-center text-sm ${color}`}
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
      </div>
    </div>
  );
}