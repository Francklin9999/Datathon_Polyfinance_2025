
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, TrendingUp } from 'lucide-react';

export default function FixedIncomeCurveTrading({ risk }) {
  const trades = [
    { 
      name: 'Steepener (2s10s)', 
      position: 'Long 10Y, Short 2Y', 
      currentSlope: risk?.slope2s10s,
      target: 150,
      pnl: '+$125K',
      status: 'Working'
    },
    {
      name: 'Butterfly (2s5s10s)',
      position: 'Long 2Y+10Y, Short 2x 5Y',
      currentSlope: 85,
      target: 120,
      pnl: '+$68K',
      status: 'Working'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Curve Trading</h2>
          <p className="text-sm text-gray-400">Steepeners, flatteners, butterfly spreads</p>
        </div>
      </div>

      {/* Active Curve Trades */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            Active Curve Positions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {trades.map((trade, idx) => (
              <div key={idx} className="p-4 bg-gray-900/50 border border-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-bold text-white text-lg">{trade.name}</p>
                    <p className="text-sm text-gray-400">{trade.position}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-400">{trade.pnl}</p>
                    <p className="text-xs text-gray-400">{trade.status}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400 text-xs">Current Slope</p>
                    <p className="text-white font-mono">{trade.currentSlope}bp</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Target</p>
                    <p className="text-white font-mono">{trade.target}bp</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Distance</p>
                    <p className={`font-mono ${trade.currentSlope < trade.target ? 'text-green-400' : 'text-yellow-400'}`}>
                      {Math.abs(trade.target - trade.currentSlope)}bp
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Trading Ideas */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Steepener Opportunities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                <p className="text-sm font-semibold text-green-300">2s10s Steepener</p>
                <p className="text-xs text-gray-400 mt-1">
                  {risk?.slope2s10s < 50 ? 'Attractive entry - curve too flat' : 
                   risk?.slope2s10s > 100 ? 'Overextended - consider profit taking' :
                   'Monitor for better entry'}
                </p>
                <div className="mt-2 flex justify-between text-xs">
                  <span className="text-gray-400">Current:</span>
                  <span className="text-white font-mono">{risk?.slope2s10s?.toFixed(0)}bp</span>
                </div>
              </div>
              <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <p className="text-sm font-semibold text-blue-300">5s30s Steepener</p>
                <p className="text-xs text-gray-400 mt-1">
                  Long-end steepener captures term premium expansion
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Butterfly Spreads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                <p className="text-sm font-semibold text-purple-300">2s5s10s Butterfly</p>
                <p className="text-xs text-gray-400 mt-1">
                  {risk?.slope2s10s > 50 ? 'Belly underperforming - potential value' :
                   'Curve shape not favorable for butterfly'}
                </p>
              </div>
              <div className="p-3 bg-indigo-900/20 border border-indigo-500/30 rounded-lg">
                <p className="text-sm font-semibold text-indigo-300">5s10s30s Butterfly</p>
                <p className="text-xs text-gray-400 mt-1">
                  Long-end butterfly for convexity exposure
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Curve P&L Attribution */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Curve P&L Attribution (MTD)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-900/50 rounded-lg text-center">
              <p className="text-xs text-gray-400 mb-2">Carry</p>
              <p className="text-2xl font-bold text-green-400">+$45K</p>
            </div>
            <div className="p-4 bg-gray-900/50 rounded-lg text-center">
              <p className="text-xs text-gray-400 mb-2">Curve Move</p>
              <p className="text-2xl font-bold text-green-400">+$125K</p>
            </div>
            <div className="p-4 bg-gray-900/50 rounded-lg text-center">
              <p className="text-xs text-gray-400 mb-2">Parallel Shift</p>
              <p className="text-2xl font-bold text-red-400">-$32K</p>
            </div>
            <div className="p-4 bg-gray-900/50 rounded-lg text-center border border-blue-500/30">
              <p className="text-xs text-gray-400 mb-2">Total P&L</p>
              <p className="text-2xl font-bold text-blue-400">+$138K</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
