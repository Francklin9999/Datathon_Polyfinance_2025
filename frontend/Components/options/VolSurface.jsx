
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe } from 'lucide-react';

export default function OptionsVolSurface({ risk }) {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Volatility Surface</h2>
          <p className="text-sm text-gray-400">3D implied volatility across strikes and maturities</p>
        </div>
      </div>

      {/* Vol Term Structure */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Implied Vol Term Structure</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end justify-around gap-2">
            {[
              { label: '1W', vol: risk?.vix * 0.85 },
              { label: '1M', vol: risk?.vix * 0.9 },
              { label: '3M', vol: risk?.vix },
              { label: '6M', vol: risk?.vix * 1.05 },
              { label: '1Y', vol: risk?.vix * 1.1 },
              { label: '2Y', vol: risk?.vix * 1.15 }
            ].map((point, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t-lg transition-all"
                  style={{ height: `${(point.vol / (risk?.vix * 1.2 || 20)) * 100}%` }}
                />
                <p className="text-xs text-gray-400 mt-2">{point.label}</p>
                <p className="text-sm font-bold text-white">{point.vol?.toFixed(1)}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Smile/Skew */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Volatility Smile (30D Expiry)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-5 gap-3">
            {[
              { strike: '90%', label: 'Deep OTM Put', vol: 22.5, color: 'bg-red-500' },
              { strike: '95%', label: 'OTM Put', vol: 18.2, color: 'bg-orange-500' },
              { strike: '100%', label: 'ATM', vol: 15.3, color: 'bg-yellow-500' },
              { strike: '105%', label: 'OTM Call', vol: 16.8, color: 'bg-blue-500' },
              { strike: '110%', label: 'Deep OTM Call', vol: 19.5, color: 'bg-purple-500' }
            ].map((point, idx) => (
              <div key={idx} className="p-4 bg-gray-900/50 rounded-lg border border-gray-700 text-center">
                <p className="text-xs text-gray-400 mb-1">{point.label}</p>
                <p className="text-sm font-mono text-white mb-2">{point.strike}</p>
                <div className={`h-20 ${point.color} rounded-t-lg`} style={{ opacity: point.vol / 30 }} />
                <p className="text-lg font-bold text-white mt-2">{point.vol}%</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Put/Call Skew Analysis */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Put Skew Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                <p className="text-sm text-gray-400">25-Delta Put IV</p>
                <p className="text-2xl font-bold text-white">{((risk?.vix || 15) * 1.15).toFixed(1)}%</p>
              </div>
              <div className="p-3 bg-gray-900/50 rounded-lg">
                <p className="text-sm text-gray-400">ATM IV</p>
                <p className="text-2xl font-bold text-white">{risk?.vix?.toFixed(1) || 'N/A'}%</p>
              </div>
              <div className="p-3 bg-gray-900/50 rounded-lg">
                <p className="text-sm text-gray-400">Skew Premium</p>
                <p className="text-xl font-bold text-red-400">+{((risk?.vix || 15) * 0.15).toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Call Skew Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-gray-400">25-Delta Call IV</p>
                <p className="text-2xl font-bold text-white">{((risk?.vix || 15) * 0.95).toFixed(1)}%</p>
              </div>
              <div className="p-3 bg-gray-900/50 rounded-lg">
                <p className="text-sm text-gray-400">ATM IV</p>
                <p className="text-2xl font-bold text-white">{risk?.vix?.toFixed(1) || 'N/A'}%</p>
              </div>
              <div className="p-3 bg-gray-900/50 rounded-lg">
                <p className="text-sm text-gray-400">Skew Discount</p>
                <p className="text-xl font-bold text-blue-400">-{((risk?.vix || 15) * 0.05).toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
