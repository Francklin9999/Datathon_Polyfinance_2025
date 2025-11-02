import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Activity, TrendingUp, Shield } from 'lucide-react';

export default function RiskMetricsPanel({ positions, metrics }) {
  const calculateVaR = () => {
    // Simplified VaR calculation
    const totalExposure = metrics.totalExposure;
    const historicalVol = 0.015; // 1.5% daily vol assumption
    return totalExposure * historicalVol * 1.65; // 95% confidence
  };

  const calculateSharpe = () => {
    const avgReturn = metrics.totalPnL / metrics.totalMarketValue;
    const vol = 0.015; // Simplified
    return (avgReturn / vol).toFixed(2);
  };

  const calculateConcentration = () => {
    if (positions.length === 0) return 0;
    const sorted = [...positions].sort((a, b) => Math.abs(b.exposure) - Math.abs(a.exposure));
    const top5Exposure = sorted.slice(0, 5).reduce((sum, p) => sum + Math.abs(p.exposure), 0);
    return (top5Exposure / metrics.totalExposure) * 100;
  };

  const var95 = calculateVaR();
  const sharpe = calculateSharpe();
  const concentration = calculateConcentration();

  const riskLimits = {
    var95: { limit: 5000000, used: var95 },
    netExposure: { limit: 100000000, used: Math.abs(metrics.netExposure) },
    concentration: { limit: 60, used: concentration },
  };

  return (
    <Card className="bg-gray-800/90 border-gray-700 h-full flex flex-col">
      <CardHeader className="py-2 px-4 border-b border-gray-700">
        <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-yellow-400" />
          RISK METRICS
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-3 space-y-3 overflow-auto">
        {/* VaR */}
        <div className="p-3 bg-gray-900/50 rounded border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">Value at Risk (95%)</span>
            <AlertTriangle className="w-3 h-3 text-red-400" />
          </div>
          <p className="text-lg font-bold text-red-400">
            ${(riskLimits.var95.used / 1000000).toFixed(2)}M
          </p>
          <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-red-500"
              style={{ width: `${(riskLimits.var95.used / riskLimits.var95.limit) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Limit: ${(riskLimits.var95.limit / 1000000).toFixed(1)}M
          </p>
        </div>

        {/* Sharpe Ratio */}
        <div className="p-3 bg-gray-900/50 rounded border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">Sharpe Ratio</span>
            <Activity className="w-3 h-3 text-blue-400" />
          </div>
          <p className="text-lg font-bold text-white">{sharpe}</p>
          <p className="text-xs text-gray-500 mt-1">
            {sharpe > 1 ? 'Strong' : sharpe > 0.5 ? 'Moderate' : 'Weak'} risk-adj. return
          </p>
        </div>

        {/* Concentration Risk */}
        <div className="p-3 bg-gray-900/50 rounded border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">Top 5 Concentration</span>
            <TrendingUp className="w-3 h-3 text-yellow-400" />
          </div>
          <p className="text-lg font-bold text-white">{concentration.toFixed(1)}%</p>
          <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`h-full ${concentration > 60 ? 'bg-red-500' : concentration > 40 ? 'bg-yellow-500' : 'bg-green-500'}`}
              style={{ width: `${(concentration / 100) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {concentration > 60 ? 'High' : concentration > 40 ? 'Moderate' : 'Low'} concentration
          </p>
        </div>

        {/* Net Exposure Limit */}
        <div className="p-3 bg-gray-900/50 rounded border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">Net Exposure Limit</span>
            <Shield className="w-3 h-3 text-green-400" />
          </div>
          <p className="text-lg font-bold text-white">
            ${(Math.abs(metrics.netExposure) / 1000000).toFixed(1)}M
          </p>
          <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500"
              style={{ width: `${(riskLimits.netExposure.used / riskLimits.netExposure.limit) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Limit: ${(riskLimits.netExposure.limit / 1000000).toFixed(0)}M
          </p>
        </div>

        {/* Desk Breakdown */}
        <div className="p-3 bg-gray-900/50 rounded border border-gray-700">
          <span className="text-xs text-gray-400 block mb-2">Exposure by Desk</span>
          <div className="space-y-2">
            {['Equities', 'FixedIncome', 'FX', 'Commodities'].map(desk => {
              const deskPositions = positions.filter(p => p.desk === desk);
              const deskExposure = deskPositions.reduce((sum, p) => sum + Math.abs(p.exposure || 0), 0);
              const percentage = (deskExposure / metrics.totalExposure) * 100;
              
              return (
                <div key={desk} className="flex items-center justify-between">
                  <span className="text-xs text-gray-300">{desk}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${percentage}%` }} />
                    </div>
                    <span className="text-xs text-white font-mono w-10 text-right">
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}