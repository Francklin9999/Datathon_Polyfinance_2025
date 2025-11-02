
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';

export default function OptionsGreeks({ risk }) {
  const portfolioGreeks = [
    { symbol: 'SPY_C6000', delta: 0.55, gamma: 0.0012, theta: -15.2, vega: 23.5, exposure: 1250000 },
    { symbol: 'QQQ_P480', delta: -0.42, gamma: 0.0015, theta: -12.8, vega: 19.2, exposure: 850000 },
    { symbol: 'IWM_C220', delta: 0.68, gamma: 0.0008, theta: -8.5, vega: 15.3, exposure: 450000 }
  ];

  const totalDelta = portfolioGreeks.reduce((sum, g) => sum + g.delta * g.exposure, 0);
  const totalGamma = portfolioGreeks.reduce((sum, g) => sum + g.gamma * g.exposure, 0);
  const totalTheta = portfolioGreeks.reduce((sum, g) => sum + g.theta, 0);
  const totalVega = portfolioGreeks.reduce((sum, g) => sum + g.vega, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Greeks Dashboard</h2>
          <p className="text-sm text-gray-400">Portfolio-level Greeks aggregation and risk</p>
        </div>
      </div>

      {/* Aggregate Greeks */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <p className="text-xs text-gray-400 mb-2">Portfolio Delta</p>
            <p className="text-3xl font-bold text-blue-400">{(totalDelta / 1000000).toFixed(2)}M</p>
            <p className="text-xs text-gray-400 mt-1">Directional exposure</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <p className="text-xs text-gray-400 mb-2">Portfolio Gamma</p>
            <p className="text-3xl font-bold text-purple-400">{totalGamma.toFixed(0)}</p>
            <p className="text-xs text-gray-400 mt-1">Curvature risk</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <p className="text-xs text-gray-400 mb-2">Portfolio Theta</p>
            <p className="text-3xl font-bold text-red-400">{totalTheta.toFixed(1)}</p>
            <p className="text-xs text-gray-400 mt-1">Daily time decay</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <p className="text-xs text-gray-400 mb-2">Portfolio Vega</p>
            <p className="text-3xl font-bold text-green-400">{totalVega.toFixed(1)}</p>
            <p className="text-xs text-gray-400 mt-1">Vol sensitivity</p>
          </CardContent>
        </Card>
      </div>

      {/* Position-Level Greeks */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Position-Level Greeks</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>
                <th className="text-left p-3 text-gray-400 font-semibold">SYMBOL</th>
                <th className="text-right p-3 text-gray-400 font-semibold">DELTA</th>
                <th className="text-right p-3 text-gray-400 font-semibold">GAMMA</th>
                <th className="text-right p-3 text-gray-400 font-semibold">THETA</th>
                <th className="text-right p-3 text-gray-400 font-semibold">VEGA</th>
                <th className="text-right p-3 text-gray-400 font-semibold">EXPOSURE</th>
              </tr>
            </thead>
            <tbody>
              {portfolioGreeks.map((pos, idx) => (
                <tr key={idx} className="border-b border-gray-800 hover:bg-gray-700/50">
                  <td className="p-3 font-mono font-bold text-white">{pos.symbol}</td>
                  <td className={`p-3 text-right font-mono ${pos.delta >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>
                    {pos.delta.toFixed(3)}
                  </td>
                  <td className="p-3 text-right font-mono text-purple-400">{pos.gamma.toFixed(4)}</td>
                  <td className="p-3 text-right font-mono text-red-400">{pos.theta.toFixed(2)}</td>
                  <td className="p-3 text-right font-mono text-green-400">{pos.vega.toFixed(2)}</td>
                  <td className="p-3 text-right font-mono text-white">${(pos.exposure / 1000).toFixed(0)}K</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Greeks Interpretation */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Risk Interpretation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <p className="text-blue-300 font-semibold mb-1">Delta Exposure</p>
                <p className="text-gray-400 text-xs">
                  Portfolio is {totalDelta > 0 ? 'net long' : 'net short'} with ${(Math.abs(totalDelta) / 1000000).toFixed(2)}M directional exposure. 
                  A 1% move in underlying = ${(totalDelta * 0.01 / 1000).toFixed(0)}K P&L impact.
                </p>
              </div>
              <div className="p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                <p className="text-purple-300 font-semibold mb-1">Gamma Risk</p>
                <p className="text-gray-400 text-xs">
                  Portfolio gamma of {totalGamma.toFixed(0)} indicates {totalGamma > 1000 ? 'high' : 'moderate'} curvature risk. 
                  Delta will change significantly with large price moves.
                </p>
              </div>
              <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                <p className="text-red-300 font-semibold mb-1">Time Decay</p>
                <p className="text-gray-400 text-xs">
                  Portfolio losing ${Math.abs(totalTheta).toFixed(1)} per day to theta decay. 
                  {totalTheta < -20 ? ' Significant time decay - monitor closely.' : ' Manageable decay rate.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Hedging Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-300 font-semibold mb-1">Delta Hedge</p>
                <p className="text-gray-400 text-xs">
                  {totalDelta > 0 ? 'Sell' : 'Buy'} {Math.abs(totalDelta / 100).toFixed(0)} shares of SPY to neutralize delta.
                </p>
              </div>
              <div className="p-3 bg-cyan-900/20 border border-cyan-500/30 rounded-lg">
                <p className="text-cyan-300 font-semibold mb-1">Vega Hedge</p>
                <p className="text-gray-400 text-xs">
                  Portfolio vega of {totalVega.toFixed(1)} means 1% IV change = ${(totalVega / 100).toFixed(0)} P&L impact.
                </p>
              </div>
              <div className="p-3 bg-indigo-900/20 border border-indigo-500/30 rounded-lg">
                <p className="text-indigo-300 font-semibold mb-1">Gamma Scalping</p>
                <p className="text-gray-400 text-xs">
                  {totalGamma > 1000 ? 'High gamma enables profitable scalping in volatile markets.' : 'Gamma too low for effective scalping.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
