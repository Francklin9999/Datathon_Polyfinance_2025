import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function MACDIndicator({ symbol }) {
  // Generate mock MACD data
  const generateMACD = () => {
    const data = [];
    let macd = 0;
    let signal = 0;
    
    for (let i = 0; i < 90; i++) {
      macd += (Math.random() - 0.5) * 2;
      signal = signal * 0.9 + macd * 0.1;
      const histogram = macd - signal;
      data.push({ macd, signal, histogram });
    }
    return data;
  };

  const macdData = generateMACD();
  const current = macdData[macdData.length - 1];
  const maxVal = Math.max(...macdData.map(d => Math.max(Math.abs(d.macd), Math.abs(d.signal), Math.abs(d.histogram))));

  const getY = (val) => {
    return 50 - (val / maxVal) * 40;
  };

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <span>MACD (12, 26, 9)</span>
          <div className="text-right">
            <p className={`text-2xl font-bold ${current.macd > current.signal ? 'text-green-400' : 'text-red-400'}`}>
              {current.macd > current.signal ? 'Bullish' : 'Bearish'}
            </p>
            <p className="text-xs text-gray-400">Histogram: {current.histogram.toFixed(2)}</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-40 relative">
          <svg className="w-full h-full">
            {/* Zero line */}
            <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#6b7280" strokeWidth="1" />

            {/* Histogram */}
            {macdData.map((d, i) => {
              const x = (i / (macdData.length - 1)) * 100;
              const barHeight = Math.abs(d.histogram / maxVal) * 40;
              const y = d.histogram > 0 ? 50 - barHeight : 50;
              const color = d.histogram > 0 ? '#10b981' : '#ef4444';
              
              return (
                <rect
                  key={i}
                  x={`${x - 0.3}%`}
                  y={`${y}%`}
                  width="0.6%"
                  height={`${barHeight}%`}
                  fill={color}
                  opacity="0.6"
                />
              );
            })}

            {/* MACD line */}
            <polyline
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              points={macdData.map((d, i) => {
                const x = (i / (macdData.length - 1)) * 100;
                const y = getY(d.macd);
                return `${x}%,${y}%`;
              }).join(' ')}
            />

            {/* Signal line */}
            <polyline
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2"
              points={macdData.map((d, i) => {
                const x = (i / (macdData.length - 1)) * 100;
                const y = getY(d.signal);
                return `${x}%,${y}%`;
              }).join(' ')}
            />
          </svg>

          {/* Legend */}
          <div className="absolute top-2 left-2 bg-gray-900/90 p-2 rounded text-xs space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-blue-500"></div>
              <span className="text-white">MACD: {current.macd.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-orange-500"></div>
              <span className="text-white">Signal: {current.signal.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500"></div>
              <span className="text-white">Bullish</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500"></div>
              <span className="text-white">Bearish</span>
            </div>
          </div>
        </div>

        {/* Current values */}
        <div className="grid grid-cols-3 gap-4 mt-4 text-center">
          <div>
            <p className="text-xs text-gray-400">MACD</p>
            <p className="text-lg font-bold text-blue-400">{current.macd.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Signal</p>
            <p className="text-lg font-bold text-orange-400">{current.signal.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Histogram</p>
            <p className={`text-lg font-bold ${current.histogram > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {current.histogram.toFixed(2)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}