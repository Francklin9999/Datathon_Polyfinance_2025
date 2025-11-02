import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CandlestickChart({ symbol, data, height = 300 }) {
  // Generate mock OHLC data
  const generateData = () => {
    const bars = [];
    let price = 100;
    for (let i = 0; i < 90; i++) {
      const change = (Math.random() - 0.5) * 3;
      const open = price;
      const close = price + change;
      const high = Math.max(open, close) + Math.random() * 2;
      const low = Math.min(open, close) - Math.random() * 2;
      const volume = Math.random() * 10000000 + 5000000;
      
      bars.push({ open, high, low, close, volume });
      price = close;
    }
    return bars;
  };

  const ohlcData = data || generateData();
  const maxPrice = Math.max(...ohlcData.map(d => d.high));
  const minPrice = Math.min(...ohlcData.map(d => d.low));
  const priceRange = maxPrice - minPrice;
  const maxVolume = Math.max(...ohlcData.map(d => d.volume));

  // Calculate moving averages
  const sma20 = ohlcData.map((_, i) => {
    if (i < 19) return null;
    const sum = ohlcData.slice(i - 19, i + 1).reduce((acc, d) => acc + d.close, 0);
    return sum / 20;
  });

  const sma50 = ohlcData.map((_, i) => {
    if (i < 49) return null;
    const sum = ohlcData.slice(i - 49, i + 1).reduce((acc, d) => acc + d.close, 0);
    return sum / 50;
  });

  const getY = (price) => {
    return ((maxPrice - price) / priceRange) * (height * 0.7);
  };

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">{symbol} - Price & Volume</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Price Chart */}
          <div style={{ height: `${height}px` }} className="relative">
            <svg className="w-full h-full">
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
                <line
                  key={i}
                  x1="0"
                  y1={pct * height * 0.7}
                  x2="100%"
                  y2={pct * height * 0.7}
                  stroke="#374151"
                  strokeWidth="1"
                  strokeDasharray="4"
                />
              ))}

              {/* Candlesticks */}
              {ohlcData.map((bar, i) => {
                const x = (i / ohlcData.length) * 100;
                const isGreen = bar.close >= bar.open;
                const color = isGreen ? '#10b981' : '#ef4444';
                
                return (
                  <g key={i}>
                    {/* Wick */}
                    <line
                      x1={`${x}%`}
                      y1={getY(bar.high)}
                      x2={`${x}%`}
                      y2={getY(bar.low)}
                      stroke={color}
                      strokeWidth="1"
                    />
                    {/* Body */}
                    <rect
                      x={`${x - 0.3}%`}
                      y={Math.min(getY(bar.open), getY(bar.close))}
                      width="0.6%"
                      height={Math.abs(getY(bar.open) - getY(bar.close)) || 1}
                      fill={color}
                    />
                  </g>
                );
              })}

              {/* SMA 20 */}
              <polyline
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2"
                points={sma20.map((price, i) => {
                  if (!price) return '';
                  const x = (i / ohlcData.length) * 100;
                  const y = getY(price);
                  return `${x}%,${y}`;
                }).join(' ')}
              />

              {/* SMA 50 */}
              <polyline
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                points={sma50.map((price, i) => {
                  if (!price) return '';
                  const x = (i / ohlcData.length) * 100;
                  const y = getY(price);
                  return `${x}%,${y}`;
                }).join(' ')}
              />
            </svg>

            {/* Price labels */}
            <div className="absolute right-0 top-0 text-xs text-gray-400 space-y-2">
              {[maxPrice, (maxPrice + minPrice) / 2, minPrice].map((price, i) => (
                <div key={i} style={{ top: `${i * 35}%` }} className="absolute right-0">
                  ${price.toFixed(2)}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="absolute top-2 left-2 bg-gray-900/90 p-2 rounded text-xs space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-orange-500"></div>
                <span className="text-white">SMA 20</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-blue-500"></div>
                <span className="text-white">SMA 50</span>
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

          {/* Volume Chart */}
          <div style={{ height: '80px' }} className="relative">
            <svg className="w-full h-full">
              {ohlcData.map((bar, i) => {
                const x = (i / ohlcData.length) * 100;
                const barHeight = (bar.volume / maxVolume) * 80;
                const isGreen = bar.close >= bar.open;
                
                return (
                  <rect
                    key={i}
                    x={`${x - 0.3}%`}
                    y={80 - barHeight}
                    width="0.6%"
                    height={barHeight}
                    fill={isGreen ? '#10b98166' : '#ef444466'}
                  />
                );
              })}
            </svg>
            <div className="absolute bottom-0 left-0 text-xs text-gray-400">
              Volume: {(ohlcData[ohlcData.length - 1].volume / 1000000).toFixed(1)}M
            </div>
          </div>

          {/* Time labels */}
          <div className="flex justify-between text-xs text-gray-400">
            <span>90 days ago</span>
            <span>Today</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}