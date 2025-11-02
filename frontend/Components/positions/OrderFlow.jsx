import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

export default function OrderFlow({ orders }) {
  const recentOrders = orders.slice(0, 20);

  const getStatusColor = (status) => {
    switch (status) {
      case 'FILLED': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'PARTIAL': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'PENDING': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'CANCELLED': return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      case 'REJECTED': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  return (
    <Card className="bg-gray-800/90 border-gray-700 h-full flex flex-col">
      <CardHeader className="py-2 px-4 border-b border-gray-700">
        <CardTitle className="text-sm font-semibold text-white">ORDER FLOW (LIVE)</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto p-2 space-y-1">
        {recentOrders.map((order, idx) => (
          <div
            key={idx}
            className="p-2 bg-gray-900/50 rounded border border-gray-700 hover:bg-gray-900/70 transition-colors"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                {order.side === 'BUY' ? (
                  <ArrowUpCircle className="w-4 h-4 text-green-400" />
                ) : (
                  <ArrowDownCircle className="w-4 h-4 text-red-400" />
                )}
                <span className="font-semibold text-white text-xs">{order.symbol}</span>
              </div>
              <Badge variant="outline" className={`text-xs ${getStatusColor(order.status)}`}>
                {order.status}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-400">Qty:</span>
                <span className="text-white font-mono ml-1">{order.quantity}</span>
              </div>
              <div>
                <span className="text-gray-400">Px:</span>
                <span className="text-white font-mono ml-1">${order.price?.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-400">Type:</span>
                <span className="text-white ml-1">{order.orderType}</span>
              </div>
              <div>
                <span className="text-gray-400">Desk:</span>
                <span className="text-white ml-1">{order.desk}</span>
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {new Date(order.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
        {recentOrders.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            No recent orders
          </div>
        )}
      </CardContent>
    </Card>
  );
}