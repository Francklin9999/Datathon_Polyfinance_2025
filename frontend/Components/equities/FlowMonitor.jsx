
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

export default function EquitiesFlowMonitor() {
  const flows = [
    { symbol: 'SPY', buyVolume: 45000000, sellVolume: 38000000, netFlow: 7000000, trend: 'BUY' },
    { symbol: 'QQQ', buyVolume: 32000000, sellVolume: 28000000, netFlow: 4000000, trend: 'BUY' },
    { symbol: 'IWM', buyVolume: 18000000, sellVolume: 22000000, netFlow: -4000000, trend: 'SELL' },
    { symbol: 'DIA', buyVolume: 12000000, sellVolume: 11000000, netFlow: 1000000, trend: 'BUY' },
    { symbol: 'VTI', buyVolume: 25000000, sellVolume: 23000000, netFlow: 2000000, trend: 'BUY' }
  ];

  const recentTrades = [
    { time: '14:23:15', symbol: 'AAPL', side: 'BUY', qty: 50000, price: 185.45, venue: 'NASDAQ' },
    { time: '14:22:48', symbol: 'MSFT', side: 'BUY', qty: 35000, price: 378.92, venue: 'NASDAQ' },
    { time: '14:22:12', symbol: 'NVDA', side: 'SELL', qty: 15000, price: 875.32, venue: 'NASDAQ' },
    { time: '14:21:55', symbol: 'GOOGL', side: 'BUY', qty: 28000, price: 142.58, venue: 'NASDAQ' },
    { time: '14:21:30', symbol: 'TSLA', side: 'SELL', qty: 42000, price: 215.30, venue: 'NASDAQ' }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Flow Monitor</h2>
          <p className="text-sm text-gray-400">Real-time buy/sell pressure and order flow</p>
        </div>
      </div>

      {/* Net Flow Indicators */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            ETF Net Flow (Live)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {flows.map((flow, idx) => (
              <div key={idx} className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {flow.trend === 'BUY' ? (
                      <ArrowUpCircle className="w-6 h-6 text-green-400" />
                    ) : (
                      <ArrowDownCircle className="w-6 h-6 text-red-400" />
                    )}
                    <div>
                      <p className="font-bold text-white text-lg">{flow.symbol}</p>
                      <p className={`text-sm font-semibold ${flow.netFlow >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        Net Flow: {flow.netFlow >= 0 ? '+' : ''}{(flow.netFlow / 1000000).toFixed(1)}M
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Buy Volume</p>
                    <p className="text-sm font-mono text-green-400">{(flow.buyVolume / 1000000).toFixed(1)}M</p>
                    <p className="text-xs text-gray-400 mt-1">Sell Volume</p>
                    <p className="text-sm font-mono text-red-400">{(flow.sellVolume / 1000000).toFixed(1)}M</p>
                  </div>
                </div>
                <div className="flex h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-green-500"
                    style={{ width: `${(flow.buyVolume / (flow.buyVolume + flow.sellVolume)) * 100}%` }}
                  />
                  <div 
                    className="bg-red-500"
                    style={{ width: `${(flow.sellVolume / (flow.buyVolume + flow.sellVolume)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Large Trades */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Recent Large Trades (10&nbsp;K shares)</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>
                <th className="text-left p-3 text-gray-400 font-semibold">TIME</th>
                <th className="text-left p-3 text-gray-400 font-semibold">SYMBOL</th>
                <th className="text-center p-3 text-gray-400 font-semibold">SIDE</th>
                <th className="text-right p-3 text-gray-400 font-semibold">QTY</th>
                <th className="text-right p-3 text-gray-400 font-semibold">PRICE</th>
                <th className="text-left p-3 text-gray-400 font-semibold">VENUE</th>
              </tr>
            </thead>
            <tbody>
              {recentTrades.map((trade, idx) => (
                <tr key={idx} className="border-b border-gray-800 hover:bg-gray-700/50">
                  <td className="p-3 font-mono text-gray-400">{trade.time}</td>
                  <td className="p-3 font-mono font-bold text-white">{trade.symbol}</td>
                  <td className="p-3 text-center">
                    <Badge className={trade.side === 'BUY' ? 'bg-green-600' : 'bg-red-600'}>
                      {trade.side}
                    </Badge>
                  </td>
                  <td className="p-3 text-right font-mono text-white">{trade.qty.toLocaleString()}</td>
                  <td className="p-3 text-right font-mono text-white">${trade.price}</td>
                  <td className="p-3 text-gray-400">{trade.venue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Buy/Sell Pressure Gauge */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Market Pressure</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-5xl font-bold text-green-400">62%</p>
              <p className="text-sm text-gray-400 mt-2">Buy Pressure</p>
              <div className="mt-4 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: '62%' }} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Block Trades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-5xl font-bold text-blue-400">247</p>
              <p className="text-sm text-gray-400 mt-2">Today</p>
              <p className="text-xs text-gray-500 mt-1">Avg size: 125K shares</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Dark Pool Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-5xl font-bold text-purple-400">38%</p>
              <p className="text-sm text-gray-400 mt-2">Of Total Volume</p>
              <p className="text-xs text-gray-500 mt-1">Above average</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
