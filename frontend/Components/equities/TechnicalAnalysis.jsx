import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, TrendingUp, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import CandlestickChart from '../charts/CandlestickChart';
import BollingerBands from '../charts/BollingerBands';
import RSIIndicator from '../charts/RSIIndicator';
import MACDIndicator from '../charts/MACDIndicator';

export default function EquitiesTechnicalAnalysis({ snapshot }) {
  const [selectedSymbol, setSelectedSymbol] = useState('SPX');

  const technicals = {
    SPX: {
      price: 5987.37,
      sma50: 5845.23,
      sma200: 5632.45,
      rsi: 58.4,
      macd: 12.5,
      support: [5850, 5720, 5650],
      resistance: [6050, 6150, 6280]
    }
  };

  const tech = technicals[selectedSymbol];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Technical Analysis</h2>
          <p className="text-sm text-gray-400">Charts, indicators, support/resistance levels</p>
        </div>
      </div>

      {/* Advanced Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <CandlestickChart symbol={selectedSymbol} />
        <BollingerBands symbol={selectedSymbol} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <RSIIndicator symbol={selectedSymbol} />
        <MACDIndicator symbol={selectedSymbol} />
      </div>

      {/* Technical Indicators Summary */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <p className="text-xs text-gray-400 mb-2">RSI (14)</p>
            <p className="text-3xl font-bold text-white">{tech.rsi}</p>
            <p className="text-xs text-gray-400 mt-1">
              {tech.rsi > 70 ? 'Overbought' : tech.rsi < 30 ? 'Oversold' : 'Neutral'}
            </p>
            <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full ${tech.rsi > 70 ? 'bg-red-500' : tech.rsi < 30 ? 'bg-green-500' : 'bg-yellow-500'}`}
                style={{ width: `${tech.rsi}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <p className="text-xs text-gray-400 mb-2">MACD</p>
            <p className={`text-3xl font-bold ${tech.macd >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {tech.macd >= 0 ? '+' : ''}{tech.macd}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {tech.macd > 0 ? 'Bullish' : 'Bearish'} momentum
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <p className="text-xs text-gray-400 mb-2">Price vs SMA50</p>
            <p className={`text-3xl font-bold ${tech.price > tech.sma50 ? 'text-green-400' : 'text-red-400'}`}>
              {((tech.price - tech.sma50) / tech.sma50 * 100).toFixed(2)}%
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {tech.price > tech.sma50 ? 'Above' : 'Below'} average
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <p className="text-xs text-gray-400 mb-2">Trend Strength</p>
            <p className="text-3xl font-bold text-blue-400">Strong</p>
            <p className="text-xs text-gray-400 mt-1">Uptrend intact</p>
          </CardContent>
        </Card>
      </div>

      {/* Support & Resistance */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Support Levels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tech.support.map((level, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                  <span className="text-gray-400">S{idx + 1}</span>
                  <span className="text-xl font-bold text-green-400">{level}</span>
                  <span className="text-xs text-gray-400">
                    {((tech.price - level) / tech.price * 100).toFixed(1)}% below
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Resistance Levels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tech.resistance.map((level, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                  <span className="text-gray-400">R{idx + 1}</span>
                  <span className="text-xl font-bold text-red-400">{level}</span>
                  <span className="text-xs text-gray-400">
                    {((level - tech.price) / tech.price * 100).toFixed(1)}% above
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}