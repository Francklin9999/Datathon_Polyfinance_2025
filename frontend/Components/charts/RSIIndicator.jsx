import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function RSIIndicator({ symbol, period = 14 }) {
  // Generate mock RSI data
  const generateRSI = () => {
    const data = [];
    let rsi = 50;
    for (let i = 0; i < 90; i++) {
      rsi += (Math.random() - 0.5) * 10;
      rsi = Math.max(0, Math.min(100, rsi));
      data.push(rsi);
    }
    return data;
  };

  const rsiData = generateRSI();
  const currentRSI = rsiData[rsiData.length - 1];

  const getStatus = (rsi) => {
    if (rsi > 70) return { label: 'Overbought', color: 'text-red-400', bg: 'bg-red-500' };
    if (rsi < 30) return { label: 'Oversold', color: 'text-green-400', bg: 'bg-green-500' };
    return { label: 'Neutral', color: 'text-yellow-400', bg: 'bg-yellow-500' };
  };

  const status = getStatus(currentRSI);

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <span>RSI ({period})</span>
          <div className="text-right">
            <p className={`text-3xl font-bold ${status.color}`}>{currentRSI.toFixed(1)}</p>
            <p className="text-xs text-gray-400">{status.label}</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-32 relative">
          <svg className="w-full h-full">
            {/* Reference lines */}
            <line x1="0" y1="25%" x2="100%" y2="25%" stroke="#ef4444" strokeWidth="1" strokeDasharray="4" />
            <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#6b7280" strokeWidth="1" strokeDasharray="4" />
            <line x1="0" y1="75%" x2="100%" y2="75%" stroke="#10b981" strokeWidth="1" strokeDasharray="4" />

            {/* RSI line */}
            <polyline
              fill="none"
              stroke="#8b5cf6"
              strokeWidth="2"
              points={rsiData.map((rsi, i) => {
                const x = (i / (rsiData.length - 1)) * 100;
                const y = 100 - rsi;
                return `${x}%,${y}%`;
              }).join(' ')}
            />

            {/* Current point */}
            <circle
              cx={`${((rsiData.length - 1) / (rsiData.length - 1)) * 100}%`}
              cy={`${100 - currentRSI}%`}
              r="4"
              fill="#8b5cf6"
            />
          </svg>

          {/* Labels */}
          <div className="absolute right-0 top-0 text-xs text-gray-400">
            <div>70</div>
            <div style={{ marginTop: '40px' }}>50</div>
            <div style={{ marginTop: '40px' }}>30</div>
          </div>
        </div>

        {/* RSI Bar */}
        <div className="mt-4">
          <div className="h-3 bg-gray-700 rounded-full overflow-hidden relative">
            <div className={`h-full ${status.bg} transition-all`} style={{ width: `${currentRSI}%` }} />
            <div className="absolute inset-0 flex items-center px-2 text-xs font-bold text-white">
              {currentRSI.toFixed(1)}
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Oversold</span>
            <span>Neutral</span>
            <span>Overbought</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}