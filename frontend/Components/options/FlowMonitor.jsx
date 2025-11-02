
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

export default function OptionsFlowMonitor() {
  const unusualActivity = [
    { symbol: 'AAPL', strike: 190, expiry: '2025-02-21', type: 'CALL', volume: 25000, oi: 15000, ivRank: 85, premium: 125000, sentiment: 'BULLISH' },
    { symbol: 'TSLA', strike: 200, expiry: '2025-02-14', type: 'PUT', volume: 18000, oi: 8500, ivRank: 92, premium: 350000, sentiment: 'BEARISH' },
    { symbol: 'NVDA', strike: 900, expiry: '2025-03-21', type: 'CALL', volume: 12000, oi: 6000, ivRank: 78, premium: 280000, sentiment: 'BULLISH' },
    { symbol: 'SPY', strike: 600, expiry: '2025-02-28', type: 'CALL', volume: 45000, oi: 30000, ivRank: 65, premium: 950000, sentiment: 'BULLISH' }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Flow Monitor</h2>
          <p className="text-sm text-gray-400">Unusual options activity and smart money flows</p>
        </div>
      </div>

      {/* Unusual Activity */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            Unusual Options Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>
                <th className="text-left p-3 text-gray-400 font-semibold">SYMBOL</th>
                <th className="text-center p-3 text-gray-400 font-semibold">TYPE</th>
                <th className="text-right p-3 text-gray-400 font-semibold">STRIKE</th>
                <th className="text-left p-3 text-gray-400 font-semibold">EXPIRY</th>
                <th className="text-right p-3 text-gray-400 font-semibold">VOLUME</th>
                <th className="text-right p-3 text-gray-400 font-semibold">OI</th>
                <th className="text-right p-3 text-gray-400 font-semibold">PREMIUM</th>
                <th className="text-center p-3 text-gray-400 font-semibold">SENTIMENT</th>
              </tr>
            </thead>
            <tbody>
              {unusualActivity.map((activity, idx) => (
                <tr key={idx} className="border-b border-gray-800 hover:bg-gray-700/50">
                  <td className="p-3 font-mono font-bold text-white">{activity.symbol}</td>
                  <td className="p-3 text-center">
                    <Badge className={activity.type === 'CALL' ? 'bg-green-600' : 'bg-red-600'}>
                      {activity.type}
                    </Badge>
                  </td>
                  <td className="p-3 text-right font-mono text-white">${activity.strike}</td>
                  <td className="p-3 text-gray-400">{activity.expiry}</td>
                  <td className="p-3 text-right font-mono text-white">{activity.volume.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono text-gray-400">{activity.oi.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono text-cyan-400">${(activity.premium / 1000).toFixed(0)}K</td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {activity.sentiment === 'BULLISH' ? (
                        <TrendingUp className="w-4 h-4 text-green-400" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-400" />
                      )}
                      <span className={activity.sentiment === 'BULLISH' ? 'text-green-400' : 'text-red-400'}>
                        {activity.sentiment}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Flow Signals */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Put/Call Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-5xl font-bold text-white">0.82</p>
              <p className="text-sm text-gray-400 mt-2">Slightly Bullish</p>
              <div className="mt-4 space-y-2 text-xs text-gray-400">
                <div className="flex justify-between">
                  <span>Call Volume:</span>
                  <span className="text-green-400">12.5M</span>
                </div>
                <div className="flex justify-between">
                  <span>Put Volume:</span>
                  <span className="text-red-400">10.3M</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Smart Money Index</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-5xl font-bold text-blue-400">72</p>
              <p className="text-sm text-gray-400 mt-2">Bullish Bias</p>
              <p className="text-xs text-gray-500 mt-3">
                Large block trades showing strong conviction on upside
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-400" />
              Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="p-2 bg-yellow-900/20 border border-yellow-500/30 rounded text-xs">
                <p className="text-yellow-300 font-semibold">AAPL unusual call activity</p>
              </div>
              <div className="p-2 bg-red-900/20 border border-red-500/30 rounded text-xs">
                <p className="text-red-300 font-semibold">TSLA heavy put buying</p>
              </div>
              <div className="p-2 bg-blue-900/20 border border-blue-500/30 rounded text-xs">
                <p className="text-blue-300 font-semibold">SPY large spread order</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
