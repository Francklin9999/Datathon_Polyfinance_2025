import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Zap, TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export default function TradeExecution() {
  const [orderType, setOrderType] = useState('limit');
  const [side, setSide] = useState('buy');

  // Active Orders
  const activeOrders = [
    { 
      id: 'ORD-2501-001', 
      symbol: 'AAPL', 
      side: 'BUY', 
      quantity: 1000, 
      orderType: 'LIMIT', 
      limitPrice: 185.50, 
      filled: 650, 
      remaining: 350,
      status: 'PARTIAL',
      avgPrice: 185.48,
      time: '09:32:15'
    },
    { 
      id: 'ORD-2501-002', 
      symbol: 'MSFT', 
      side: 'SELL', 
      quantity: 500, 
      orderType: 'LIMIT', 
      limitPrice: 379.00, 
      filled: 0, 
      remaining: 500,
      status: 'PENDING',
      avgPrice: null,
      time: '09:45:22'
    },
    { 
      id: 'ORD-2501-003', 
      symbol: 'GOOGL', 
      side: 'BUY', 
      quantity: 750, 
      orderType: 'MARKET', 
      limitPrice: null, 
      filled: 750, 
      remaining: 0,
      status: 'FILLED',
      avgPrice: 142.62,
      time: '10:12:08'
    }
  ];

  // Execution Analytics
  const executionMetrics = {
    todayOrders: 47,
    fillRate: 94.2,
    avgSlippage: 0.03,
    bestExecution: 89.5,
    vwap: 185.42,
    currentPrice: 185.50
  };

  // Recent Executions
  const recentExecutions = [
    { time: '10:15:32', symbol: 'TSLA', side: 'BUY', qty: 200, price: 215.34, venue: 'NASDAQ', savings: 128 },
    { time: '10:14:18', symbol: 'NVDA', side: 'SELL', qty: 150, price: 875.45, venue: 'NYSE', savings: 215 },
    { time: '10:12:45', symbol: 'META', side: 'BUY', qty: 300, price: 489.23, venue: 'NASDAQ', savings: 342 },
    { time: '10:10:22', symbol: 'AMZN', side: 'BUY', qty: 100, price: 178.92, venue: 'NASDAQ', savings: 89 },
    { time: '10:08:55', symbol: 'JPM', side: 'SELL', qty: 500, price: 185.67, venue: 'NYSE', savings: 156 }
  ];

  // Order Book Depth
  const orderBook = {
    bids: [
      { price: 185.49, quantity: 2500, orders: 12 },
      { price: 185.48, quantity: 3200, orders: 18 },
      { price: 185.47, quantity: 1800, orders: 9 },
      { price: 185.46, quantity: 4100, orders: 21 },
      { price: 185.45, quantity: 2900, orders: 15 }
    ],
    asks: [
      { price: 185.50, quantity: 2200, orders: 11 },
      { price: 185.51, quantity: 3500, orders: 19 },
      { price: 185.52, quantity: 1600, orders: 8 },
      { price: 185.53, quantity: 3900, orders: 20 },
      { price: 185.54, quantity: 2700, orders: 14 }
    ]
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'FILLED': return 'bg-green-600';
      case 'PARTIAL': return 'bg-yellow-600';
      case 'PENDING': return 'bg-blue-600';
      case 'CANCELLED': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'FILLED': return <CheckCircle className="w-4 h-4" />;
      case 'PARTIAL': return <Clock className="w-4 h-4" />;
      case 'PENDING': return <Clock className="w-4 h-4" />;
      case 'CANCELLED': return <XCircle className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Zap className="w-8 h-8 text-yellow-400" />
            Trade Execution Platform
          </h1>
          <p className="text-gray-400 mt-1">Professional order management with smart routing and execution analytics</p>
        </div>

        {/* Execution Metrics */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-400">Today's Orders</p>
                <Zap className="w-4 h-4 text-yellow-400" />
              </div>
              <p className="text-2xl font-bold text-white">{executionMetrics.todayOrders}</p>
              <p className="text-xs text-gray-400 mt-1">Across all desks</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-400">Fill Rate</p>
                <CheckCircle className="w-4 h-4 text-green-400" />
              </div>
              <p className="text-2xl font-bold text-white">{executionMetrics.fillRate}%</p>
              <p className="text-xs text-green-400 mt-1">Above target</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-400">Avg Slippage</p>
                <TrendingDown className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-white">{executionMetrics.avgSlippage} bps</p>
              <p className="text-xs text-gray-400 mt-1">Better than benchmark</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-400">Best Execution</p>
                <TrendingUp className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-2xl font-bold text-white">{executionMetrics.bestExecution}%</p>
              <p className="text-xs text-gray-400 mt-1">Quality score</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Order Entry */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">New Order</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Symbol</label>
                  <Input placeholder="e.g., AAPL" className="bg-gray-900 border-gray-700 text-white" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Side</label>
                    <Select value={side} onValueChange={setSide}>
                      <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="buy">BUY</SelectItem>
                        <SelectItem value="sell">SELL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Quantity</label>
                    <Input placeholder="1000" className="bg-gray-900 border-gray-700 text-white" type="number" />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Order Type</label>
                  <Select value={orderType} onValueChange={setOrderType}>
                    <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="market">MARKET</SelectItem>
                      <SelectItem value="limit">LIMIT</SelectItem>
                      <SelectItem value="stop">STOP</SelectItem>
                      <SelectItem value="stop-limit">STOP LIMIT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {orderType !== 'market' && (
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Limit Price</label>
                    <Input placeholder="185.50" className="bg-gray-900 border-gray-700 text-white" type="number" step="0.01" />
                  </div>
                )}

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Time in Force</label>
                  <Select defaultValue="day">
                    <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">DAY</SelectItem>
                      <SelectItem value="gtc">GTC</SelectItem>
                      <SelectItem value="ioc">IOC</SelectItem>
                      <SelectItem value="fok">FOK</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button className={`w-full ${side === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                  <Zap className="w-4 h-4 mr-2" />
                  Submit Order
                </Button>

                <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                  <p className="text-xs text-blue-300">
                    <AlertTriangle className="w-3 h-3 inline mr-1" />
                    Smart routing enabled. Order will be optimized across multiple venues.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Book */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Level 2 Order Book - AAPL</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {/* Bids */}
                  <div>
                    <h4 className="text-sm font-semibold text-green-400 mb-3">BIDS</h4>
                    <div className="space-y-1">
                      {orderBook.bids.map((bid, idx) => (
                        <div key={idx} className="relative">
                          <div 
                            className="absolute inset-0 bg-green-500/10 rounded"
                            style={{ width: `${(bid.quantity / 5000) * 100}%` }}
                          />
                          <div className="relative flex items-center justify-between p-2 text-sm">
                            <span className="font-mono text-green-400 font-semibold">${bid.price}</span>
                            <span className="font-mono text-white">{bid.quantity}</span>
                            <span className="font-mono text-gray-400 text-xs">{bid.orders}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Asks */}
                  <div>
                    <h4 className="text-sm font-semibold text-red-400 mb-3">ASKS</h4>
                    <div className="space-y-1">
                      {orderBook.asks.map((ask, idx) => (
                        <div key={idx} className="relative">
                          <div 
                            className="absolute inset-0 bg-red-500/10 rounded"
                            style={{ width: `${(ask.quantity / 5000) * 100}%` }}
                          />
                          <div className="relative flex items-center justify-between p-2 text-sm">
                            <span className="font-mono text-red-400 font-semibold">${ask.price}</span>
                            <span className="font-mono text-white">{ask.quantity}</span>
                            <span className="font-mono text-gray-400 text-xs">{ask.orders}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-gray-900/50 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <p className="text-gray-400">Spread</p>
                      <p className="text-white font-semibold">$0.01 (0.005%)</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Mid Price</p>
                      <p className="text-white font-semibold">$185.495</p>
                    </div>
                    <div>
                      <p className="text-gray-400">VWAP</p>
                      <p className="text-white font-semibold">${executionMetrics.vwap}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Active Orders */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Active Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-900 border-b border-gray-700">
                  <tr>
                    <th className="text-left p-3 text-gray-400 font-semibold">ORDER ID</th>
                    <th className="text-left p-3 text-gray-400 font-semibold">SYMBOL</th>
                    <th className="text-center p-3 text-gray-400 font-semibold">SIDE</th>
                    <th className="text-right p-3 text-gray-400 font-semibold">QUANTITY</th>
                    <th className="text-right p-3 text-gray-400 font-semibold">FILLED</th>
                    <th className="text-right p-3 text-gray-400 font-semibold">LIMIT PRICE</th>
                    <th className="text-right p-3 text-gray-400 font-semibold">AVG PRICE</th>
                    <th className="text-center p-3 text-gray-400 font-semibold">STATUS</th>
                    <th className="text-left p-3 text-gray-400 font-semibold">TIME</th>
                    <th className="text-center p-3 text-gray-400 font-semibold">ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {activeOrders.map((order, idx) => (
                    <tr key={idx} className="border-b border-gray-800 hover:bg-gray-700/50">
                      <td className="p-3 font-mono text-white">{order.id}</td>
                      <td className="p-3 font-mono font-bold text-white">{order.symbol}</td>
                      <td className="p-3 text-center">
                        <Badge className={order.side === 'BUY' ? 'bg-green-600' : 'bg-red-600'}>
                          {order.side}
                        </Badge>
                      </td>
                      <td className="p-3 text-right font-mono text-white">{order.quantity.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-white">
                        {order.filled.toLocaleString()}
                        {order.filled > 0 && order.filled < order.quantity && (
                          <span className="text-yellow-400 text-xs ml-1">
                            ({((order.filled / order.quantity) * 100).toFixed(0)}%)
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right font-mono text-white">
                        {order.limitPrice ? `$${order.limitPrice}` : 'MKT'}
                      </td>
                      <td className="p-3 text-right font-mono text-white">
                        {order.avgPrice ? `$${order.avgPrice}` : '-'}
                      </td>
                      <td className="p-3 text-center">
                        <Badge className={getStatusColor(order.status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(order.status)}
                            {order.status}
                          </span>
                        </Badge>
                      </td>
                      <td className="p-3 font-mono text-gray-400">{order.time}</td>
                      <td className="p-3 text-center">
                        {order.status !== 'FILLED' && (
                          <Button size="sm" variant="outline" className="text-red-400 border-red-400 hover:bg-red-400 hover:text-white">
                            Cancel
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Recent Executions */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Recent Executions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentExecutions.map((exec, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-xs text-gray-400">{exec.time}</span>
                    <Badge className={exec.side === 'BUY' ? 'bg-green-600' : 'bg-red-600'}>
                      {exec.side}
                    </Badge>
                    <span className="font-mono font-bold text-white">{exec.symbol}</span>
                    <span className="text-white">{exec.qty} @ ${exec.price}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-400">{exec.venue}</span>
                    <div className="text-green-400 text-sm">
                      <TrendingDown className="w-3 h-3 inline mr-1" />
                      Saved ${exec.savings}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}