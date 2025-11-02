import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function PositionTable({ positions }) {
  return (
    <Card className="bg-gray-800/90 border-gray-700 h-full flex flex-col">
      <CardHeader className="py-2 px-4 border-b border-gray-700">
        <CardTitle className="text-sm font-semibold text-white">ACTIVE POSITIONS</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto p-0">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-gray-900 border-b border-gray-700">
            <tr>
              <th className="text-left p-2 text-gray-400 font-semibold">SYMBOL</th>
              <th className="text-left p-2 text-gray-400 font-semibold">DESK</th>
              <th className="text-right p-2 text-gray-400 font-semibold">QTY</th>
              <th className="text-right p-2 text-gray-400 font-semibold">AVG PX</th>
              <th className="text-right p-2 text-gray-400 font-semibold">MKT PX</th>
              <th className="text-right p-2 text-gray-400 font-semibold">MKT VAL</th>
              <th className="text-right p-2 text-gray-400 font-semibold">DAY P&L</th>
              <th className="text-right p-2 text-gray-400 font-semibold">UNREAL P&L</th>
              <th className="text-center p-2 text-gray-400 font-semibold">SIDE</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((pos, idx) => (
              <tr
                key={idx}
                className="border-b border-gray-800 hover:bg-gray-700/50 transition-colors"
              >
                <td className="p-2">
                  <div>
                    <p className="font-semibold text-white">{pos.symbol}</p>
                    <p className="text-gray-500 text-xs">{pos.name}</p>
                  </div>
                </td>
                <td className="p-2">
                  <Badge variant="outline" className="text-xs">
                    {pos.desk}
                  </Badge>
                </td>
                <td className="p-2 text-right font-mono text-white">
                  {pos.quantity?.toLocaleString()}
                </td>
                <td className="p-2 text-right font-mono text-white">
                  ${pos.avgPrice?.toFixed(2)}
                </td>
                <td className="p-2 text-right font-mono text-white">
                  ${pos.currentPrice?.toFixed(2)}
                </td>
                <td className="p-2 text-right font-mono text-white">
                  ${(pos.marketValue / 1000).toFixed(1)}K
                </td>
                <td className="p-2 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {pos.dayPnL >= 0 ? (
                      <TrendingUp className="w-3 h-3 text-green-400" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-400" />
                    )}
                    <span className={`font-mono font-semibold ${pos.dayPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {pos.dayPnL >= 0 ? '+' : ''}${(pos.dayPnL / 1000).toFixed(1)}K
                    </span>
                  </div>
                </td>
                <td className="p-2 text-right">
                  <span className={`font-mono font-semibold ${pos.unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {pos.unrealizedPnL >= 0 ? '+' : ''}${(pos.unrealizedPnL / 1000).toFixed(1)}K
                  </span>
                </td>
                <td className="p-2 text-center">
                  <Badge className={pos.side === 'LONG' ? 'bg-blue-600' : 'bg-red-600'}>
                    {pos.side}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {positions.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No active positions
          </div>
        )}
      </CardContent>
    </Card>
  );
}