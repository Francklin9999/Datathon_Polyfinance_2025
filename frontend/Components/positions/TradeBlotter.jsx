import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';

export default function TradeBlotter({ orders }) {
  return (
    <Card className="bg-gray-800/90 border-gray-700 h-full flex flex-col">
      <CardHeader className="py-2 px-4 border-b border-gray-700">
        <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-400" />
          TRADE BLOTTER (FILLED)
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto p-0">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-gray-900 border-b border-gray-700">
            <tr>
              <th className="text-left p-2 text-gray-400 font-semibold">TIME</th>
              <th className="text-left p-2 text-gray-400 font-semibold">SYMBOL</th>
              <th className="text-center p-2 text-gray-400 font-semibold">SIDE</th>
              <th className="text-right p-2 text-gray-400 font-semibold">QTY</th>
              <th className="text-right p-2 text-gray-400 font-semibold">PRICE</th>
              <th className="text-left p-2 text-gray-400 font-semibold">VENUE</th>
              <th className="text-left p-2 text-gray-400 font-semibold">DESK</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, idx) => (
              <tr key={idx} className="border-b border-gray-800 hover:bg-gray-700/50">
                <td className="p-2 font-mono text-gray-400">
                  {new Date(order.timestamp).toLocaleTimeString('en-US', { hour12: false })}
                </td>
                <td className="p-2 font-semibold text-white">{order.symbol}</td>
                <td className="p-2 text-center">
                  <Badge className={order.side === 'BUY' ? 'bg-green-600 text-xs' : 'bg-red-600 text-xs'}>
                    {order.side}
                  </Badge>
                </td>
                <td className="p-2 text-right font-mono text-white">
                  {order.filledQuantity || order.quantity}
                </td>
                <td className="p-2 text-right font-mono text-white">
                  ${(order.avgFillPrice || order.price)?.toFixed(2)}
                </td>
                <td className="p-2 text-gray-400">{order.venue || 'SMART'}</td>
                <td className="p-2 text-gray-400">{order.desk}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No filled trades today
          </div>
        )}
      </CardContent>
    </Card>
  );
}