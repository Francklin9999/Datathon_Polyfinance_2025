import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';

export default function PerformanceChart({ positions }) {
  // Generate mock intraday P&L data
  const generateIntradayPnL = () => {
    const data = [];
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 30);
    const currentPnL = positions.reduce((sum, p) => sum + (p.dayPnL || 0), 0);
    
    for (let i = 0; i < 60; i++) {
      const time = new Date(startOfDay.getTime() + i * 6 * 60000); // Every 6 minutes
      const progress = i / 60;
      const pnl = currentPnL * progress + (Math.random() - 0.5) * currentPnL * 0.1;
      data.push({ time, pnl });
    }
    
    return data;
  };

  const intradayData = generateIntradayPnL();
  const minPnL = Math.min(...intradayData.map(d => d.pnl));
  const maxPnL = Math.max(...intradayData.map(d => d.pnl));
  const range = maxPnL - minPnL;

  return (
    <Card className="bg-gray-800/90 border-gray-700 h-full flex flex-col">
      <CardHeader className="py-2 px-4 border-b border-gray-700">
        <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-400" />
          INTRADAY P&L PERFORMANCE
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-4">
        <div className="h-full relative">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-0 w-16 flex flex-col justify-between text-xs text-gray-400 font-mono">
            <span>${(maxPnL / 1000).toFixed(0)}K</span>
            <span>$0K</span>
            <span>${(minPnL / 1000).toFixed(0)}K</span>
          </div>

          {/* Chart area */}
          <div className="ml-16 h-full border-l border-b border-gray-700 relative">
            {/* Zero line */}
            <div 
              className="absolute left-0 right-0 border-t border-dashed border-gray-600"
              style={{ top: `${((maxPnL - 0) / range) * 100}%` }}
            />

            {/* P&L line */}
            <svg className="w-full h-full">
              <polyline
                fill="none"
                stroke={intradayData[intradayData.length - 1]?.pnl >= 0 ? '#4ade80' : '#f87171'}
                strokeWidth="2"
                points={intradayData.map((d, i) => {
                  const x = (i / (intradayData.length - 1)) * 100;
                  const y = ((maxPnL - d.pnl) / range) * 100;
                  return `${x}%,${y}%`;
                }).join(' ')}
              />
              
              {/* Fill area */}
              <polygon
                fill={intradayData[intradayData.length - 1]?.pnl >= 0 ? 'rgba(74, 222, 128, 0.1)' : 'rgba(248, 113, 113, 0.1)'}
                points={
                  intradayData.map((d, i) => {
                    const x = (i / (intradayData.length - 1)) * 100;
                    const y = ((maxPnL - d.pnl) / range) * 100;
                    return `${x}%,${y}%`;
                  }).join(' ') + ` 100%,${((maxPnL - 0) / range) * 100}% 0%,${((maxPnL - 0) / range) * 100}%`
                }
              />
            </svg>

            {/* Current value marker */}
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-900 px-2 py-1 rounded border border-gray-700">
              <span className={`text-xs font-bold font-mono ${
                intradayData[intradayData.length - 1]?.pnl >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                ${(intradayData[intradayData.length - 1]?.pnl / 1000).toFixed(1)}K
              </span>
            </div>
          </div>

          {/* X-axis labels */}
          <div className="ml-16 mt-2 flex justify-between text-xs text-gray-400">
            <span>9:30</span>
            <span>12:00</span>
            <span>16:00</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}