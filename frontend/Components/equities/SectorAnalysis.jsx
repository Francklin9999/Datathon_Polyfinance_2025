import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, PieChart } from 'lucide-react';
import HeatmapChart from '../charts/HeatmapChart';

export default function EquitiesSectorAnalysis({ snapshot }) {
  // Mock sector data
  const sectors = [
    { name: 'Technology', weight: 28.5, chg1D: 0.85, chg1M: 4.2, ytd: 8.7 },
    { name: 'Financials', weight: 13.2, chg1D: 0.32, chg1M: 2.1, ytd: 5.3 },
    { name: 'Healthcare', weight: 12.8, chg1D: -0.15, chg1M: 1.5, ytd: 3.9 },
    { name: 'Consumer Discretionary', weight: 10.9, chg1D: 0.58, chg1M: 3.8, ytd: 6.2 },
    { name: 'Industrials', weight: 9.1, chg1D: 0.21, chg1M: 1.9, ytd: 4.5 },
    { name: 'Communication Services', weight: 8.7, chg1D: 0.42, chg1M: 2.8, ytd: 5.1 },
    { name: 'Consumer Staples', weight: 6.5, chg1D: -0.08, chg1M: 0.9, ytd: 2.3 },
    { name: 'Energy', weight: 4.3, chg1D: -1.23, chg1M: -2.5, ytd: -1.8 },
    { name: 'Utilities', weight: 3.2, chg1D: 0.12, chg1M: 1.2, ytd: 3.1 },
    { name: 'Real Estate', weight: 2.8, chg1D: -0.25, chg1M: 0.5, ytd: 1.9 }
  ];

  const heatmapData = sectors.map(s => ({
    name: s.name.split(' ')[0],
    value: s.weight,
    change: s.chg1D
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Sector Analysis</h2>
          <p className="text-sm text-gray-400">Sector rotation, themes, and relative performance</p>
        </div>
      </div>

      {/* Sector Heatmap */}
      <HeatmapChart title="Sector Performance Heatmap (1D Change)" data={heatmapData} />

      {/* Sector Performance Table */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Detailed Sector Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>
                <th className="text-left p-3 text-gray-400 font-semibold">SECTOR</th>
                <th className="text-right p-3 text-gray-400 font-semibold">WEIGHT</th>
                <th className="text-right p-3 text-gray-400 font-semibold">1D CHG</th>
                <th className="text-right p-3 text-gray-400 font-semibold">1M CHG</th>
                <th className="text-right p-3 text-gray-400 font-semibold">YTD</th>
                <th className="text-left p-3 text-gray-400 font-semibold">SIGNAL</th>
              </tr>
            </thead>
            <tbody>
              {sectors.map((sector, idx) => (
                <tr key={idx} className="border-b border-gray-800 hover:bg-gray-700/50">
                  <td className="p-3 font-semibold text-white">{sector.name}</td>
                  <td className="p-3 text-right font-mono text-white">{sector.weight}%</td>
                  <td className={`p-3 text-right font-mono font-bold ${sector.chg1D >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {sector.chg1D >= 0 ? '+' : ''}{sector.chg1D.toFixed(2)}%
                  </td>
                  <td className={`p-3 text-right font-mono ${sector.chg1M >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {sector.chg1M >= 0 ? '+' : ''}{sector.chg1M.toFixed(2)}%
                  </td>
                  <td className={`p-3 text-right font-mono ${sector.ytd >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {sector.ytd >= 0 ? '+' : ''}{sector.ytd.toFixed(2)}%
                  </td>
                  <td className="p-3">
                    {sector.chg1M > 3 && sector.chg1D > 0 ? (
                      <span className="text-green-400">▲ Strong Buy</span>
                    ) : sector.chg1M < -2 && sector.chg1D < 0 ? (
                      <span className="text-red-400">▼ Weak</span>
                    ) : (
                      <span className="text-gray-400">— Neutral</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Rotation Analysis */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Sector Rotation Signals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
              <p className="text-sm font-semibold text-green-300 mb-2">Momentum Leaders</p>
              <ul className="space-y-1 text-xs text-gray-300">
                {sectors.filter(s => s.chg1M > 3).map(s => (
                  <li key={s.name}>• {s.name} (+{s.chg1M.toFixed(1)}%)</li>
                ))}
              </ul>
            </div>
            <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
              <p className="text-sm font-semibold text-yellow-300 mb-2">Consolidating</p>
              <ul className="space-y-1 text-xs text-gray-300">
                {sectors.filter(s => s.chg1M >= 0 && s.chg1M <= 3).map(s => (
                  <li key={s.name}>• {s.name} (+{s.chg1M.toFixed(1)}%)</li>
                ))}
              </ul>
            </div>
            <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
              <p className="text-sm font-semibold text-red-300 mb-2">Under Pressure</p>
              <ul className="space-y-1 text-xs text-gray-300">
                {sectors.filter(s => s.chg1M < 0).map(s => (
                  <li key={s.name}>• {s.name} ({s.chg1M.toFixed(1)}%)</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}