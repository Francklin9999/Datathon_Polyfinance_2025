import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function BollingerBands({ symbol }) {
  // Generate mock price data with Bollinger Bands
  const generateData = () => {
    const data = [];
    let price = 100;
    const period = 20;
    
    for (let i = 0; i < 90; i++) {
      price += (Math.random() - 0.5) * 2;
      data.push({ price });
    }

    // Calculate Bollinger Bands
    return data.map((point, i) => {
      if (i < period - 1) {
        return { ...point, sma: null, upper: null, lower: null };
      }

      const slice = data.slice(i - period + 1, i + 1);
      const sma = slice.reduce((sum, d) => sum + d.price, 0) / period;
      const variance = slice.reduce((sum, d) => sum + Math.pow(d.price - sma, 2), 0) / period;
      const std = Math.sqrt(variance);
      
      return {
        ...point,
        sma,
        upper: sma + 2 * std,
        lower: sma - 2 * std
      };
    });
  };

  const data = generateData();
  const maxPrice = Math.max(...data.map(d => d.upper || d.price));
  const minPrice = Math.min(...data.map(d => d.lower || d.price));
  const range = maxPrice - minPrice;

  const getY = (price) => {
    return ((maxPrice - price) / range) * 100;
  };

  const currentPrice = data[data.length - 1].price;
  const currentUpper = data[data.length - 1].upper;
  const currentLower = data[data.length - 1].lower;
  const bandwidth = ((currentUpper - currentLower) / currentPrice) * 100;

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <span>Bollinger Bands (20, 2)</span>
          <div className="text-right">
            <p className="text-xl font-bold text-white">{currentPrice.toFixed(2)}</p>
            <p className="text-xs text-gray-400">Bandwidth: {bandwidth.toFixed(1)}%</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 relative">
          <svg className="w-full h-full">
            {/* Upper band */}
            <polyline
              fill="none"
              stroke="#ef4444"
              strokeWidth="1"
              strokeDasharray="4"
              points={data.map((d, i) => {
                if (!d.upper) return '';
                const x = (i / (data.length - 1)) * 100;
                const y = getY(d.upper);
                return `${x}%,${y}%`;
              }).join(' ')}
            />

            {/* SMA (middle band) */}
            <polyline
              fill="none"
              stroke="#8b5cf6"
              strokeWidth="2"
              points={data.map((d, i) => {
                if (!d.sma) return '';
                const x = (i / (data.length - 1)) * 100;
                const y = getY(d.sma);
                return `${x}%,${y}%`;
              }).join(' ')}
            />

            {/* Lower band */}
            <polyline
              fill="none"
              stroke="#10b981"
              strokeWidth="1"
              strokeDasharray="4"
              points={data.map((d, i) => {
                if (!d.lower) return '';
                const x = (i / (data.length - 1)) * 100;
                const y = getY(d.lower);
                return `${x}%,${y}%`;
              }).join(' ')}
            />

            {/* Price line */}
            <polyline
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              points={data.map((d, i) => {
                const x = (i / (data.length - 1)) * 100;
                const y = getY(d.price);
                return `${x}%,${y}%`;
              }).join(' ')}
            />

            {/* Band fill */}
            <polygon
              fill="rgba(139, 92, 246, 0.1)"
              points={
                data.map((d, i) => {
                  if (!d.upper) return '';
                  const x = (i / (data.length - 1)) * 100;
                  const y = getY(d.upper);
                  return `${x}%,${y}%`;
                }).join(' ') + ' ' +
                data.slice().reverse().map((d, i) => {
                  if (!d.lower) return '';
                  const x = ((data.length - 1 - i) / (data.length - 1)) * 100;
                  const y = getY(d.lower);
                  return `${x}%,${y}%`;
                }).join(' ')
              }
            />
          </svg>

          {/* Legend */}
          <div className="absolute top-2 left-2 bg-gray-900/90 p-2 rounded text-xs space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-red-500"></div>
              <span className="text-white">Upper: {currentUpper?.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-purple-500"></div>
              <span className="text-white">SMA: {data[data.length - 1].sma?.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-green-500"></div>
              <span className="text-white">Lower: {currentLower?.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-blue-500"></div>
              <span className="text-white">Price: {currentPrice.toFixed(2)}</span>
            </div>
          </div>

          {/* Price labels */}
          <div className="absolute right-0 top-0 text-xs text-gray-400 space-y-12">
            <div>${maxPrice.toFixed(2)}</div>
            <div>${((maxPrice + minPrice) / 2).toFixed(2)}</div>
            <div>${minPrice.toFixed(2)}</div>
          </div>
        </div>

        {/* Signal */}
        <div className="mt-4 p-3 bg-gray-900/50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Volatility Signal:</span>
            <span className={`font-bold ${
              bandwidth < 5 ? 'text-yellow-400' : 
              bandwidth > 15 ? 'text-red-400' : 
              'text-green-400'
            }`}>
              {bandwidth < 5 ? 'Squeeze (Breakout Coming)' : 
               bandwidth > 15 ? 'High Volatility' : 
               'Normal Range'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}