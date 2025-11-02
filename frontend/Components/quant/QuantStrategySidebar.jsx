import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Play, TrendingUp, TrendingDown, Activity, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function QuantStrategySidebar({ isOpen, onClose, currentSymbol = 'SPY' }) {
  const [selectedStrategy, setSelectedStrategy] = useState('momentum');

  // Available strategies
  const strategies = [
    { 
      id: 'momentum', 
      name: 'Momentum Alpha', 
      type: 'Trend Following',
      sharpe: 2.1,
      annualReturn: 18.5,
      maxDrawdown: -12.3,
      winRate: 58.2,
      status: 'active'
    },
    { 
      id: 'meanrev', 
      name: 'Mean Reversion', 
      type: 'Stat Arb',
      sharpe: 1.8,
      annualReturn: 14.2,
      maxDrawdown: -8.5,
      winRate: 62.1,
      status: 'active'
    },
    { 
      id: 'ml-ensemble', 
      name: 'ML Ensemble', 
      type: 'Machine Learning',
      sharpe: 2.4,
      annualReturn: 22.1,
      maxDrawdown: -15.2,
      winRate: 54.8,
      status: 'testing'
    },
    { 
      id: 'pairs', 
      name: 'Pairs Trading', 
      type: 'Market Neutral',
      sharpe: 1.6,
      annualReturn: 11.8,
      maxDrawdown: -6.2,
      winRate: 65.3,
      status: 'active'
    }
  ];

  // Performance data
  const performanceData = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    cumReturn: 100 * (1 + (Math.random() * 0.15 + 0.05) * (i / 30)),
    benchmark: 100 * (1 + 0.08 * (i / 30))
  }));

  // Current strategy signals
  const signals = [
    { asset: 'SPY', signal: 'BUY', confidence: 0.78, entry: 485.23, target: 495.50, stop: 482.10 },
    { asset: 'QQQ', signal: 'SELL', confidence: 0.65, entry: 412.45, target: 405.20, stop: 415.30 },
    { asset: 'IWM', signal: 'HOLD', confidence: 0.52, entry: null, target: null, stop: null }
  ];

  const currentStrategy = strategies.find(s => s.id === selectedStrategy);

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-screen w-96 bg-gray-900 border-l border-gray-700 shadow-2xl z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-bold text-white">Quant Strategies</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5 text-gray-400" />
        </Button>
      </div>

      <div className="p-4 space-y-4">
        {/* Strategy Selector */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-sm text-white">Select Strategy</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
              <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {strategies.map(strategy => (
                  <SelectItem key={strategy.id} value={strategy.id}>
                    {strategy.name} ({strategy.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Strategy Performance */}
        {currentStrategy && (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-white">{currentStrategy.name}</CardTitle>
                <Badge className={currentStrategy.status === 'active' ? 'bg-green-600' : 'bg-yellow-600'}>
                  {currentStrategy.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-900/50 p-3 rounded">
                  <p className="text-xs text-gray-400">Sharpe Ratio</p>
                  <p className="text-lg font-bold text-white">{currentStrategy.sharpe}</p>
                </div>
                <div className="bg-gray-900/50 p-3 rounded">
                  <p className="text-xs text-gray-400">Annual Return</p>
                  <p className="text-lg font-bold text-green-400">{currentStrategy.annualReturn}%</p>
                </div>
                <div className="bg-gray-900/50 p-3 rounded">
                  <p className="text-xs text-gray-400">Max Drawdown</p>
                  <p className="text-lg font-bold text-red-400">{currentStrategy.maxDrawdown}%</p>
                </div>
                <div className="bg-gray-900/50 p-3 rounded">
                  <p className="text-xs text-gray-400">Win Rate</p>
                  <p className="text-lg font-bold text-white">{currentStrategy.winRate}%</p>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="day" stroke="#9CA3AF" hide />
                  <YAxis stroke="#9CA3AF" hide />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
                  <Line type="monotone" dataKey="cumReturn" stroke="#8B5CF6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="benchmark" stroke="#6B7280" strokeWidth={1} dot={false} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Live Signals */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-sm text-white">Live Signals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {signals.map((signal, idx) => (
              <div key={idx} className={`p-3 rounded border ${
                signal.signal === 'BUY' ? 'bg-green-900/20 border-green-500/30' :
                signal.signal === 'SELL' ? 'bg-red-900/20 border-red-500/30' :
                'bg-gray-900/50 border-gray-700'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white">{signal.asset}</span>
                    <Badge className={
                      signal.signal === 'BUY' ? 'bg-green-600' :
                      signal.signal === 'SELL' ? 'bg-red-600' :
                      'bg-gray-600'
                    }>
                      {signal.signal}
                    </Badge>
                  </div>
                  <span className="text-xs text-gray-400">
                    {(signal.confidence * 100).toFixed(0)}% conf
                  </span>
                </div>
                {signal.entry && (
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Entry:</span>
                      <span className="text-white font-mono">${signal.entry}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Target:</span>
                      <span className="text-green-400 font-mono">${signal.target}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Stop:</span>
                      <span className="text-red-400 font-mono">${signal.stop}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="space-y-2">
          <Button className="w-full bg-purple-600 hover:bg-purple-700">
            <Play className="w-4 h-4 mr-2" />
            Run Backtest
          </Button>
          <Button variant="outline" className="w-full border-gray-700 text-white hover:bg-gray-800">
            View Full Analysis
          </Button>
        </div>

        {/* Risk Alert */}
        <Card className="bg-yellow-900/20 border-yellow-500/30">
          <CardContent className="p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-yellow-300">Risk Notice</p>
                <p className="text-xs text-gray-300 mt-1">
                  Current market volatility above average. Consider reducing position sizes by 20%.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}