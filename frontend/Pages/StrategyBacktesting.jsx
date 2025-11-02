import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LineChart, Play, TrendingUp, AlertCircle, Settings, Code, BarChart3 } from 'lucide-react';
import { LineChart as RechartsLine, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';

export default function StrategyBacktesting() {
  const [strategyType, setStrategyType] = useState('momentum');
  const [isBacktesting, setIsBacktesting] = useState(false);

  // Strategy templates
  const strategies = [
    { id: 'momentum', name: 'Momentum Strategy', description: 'Buy assets with strong recent performance' },
    { id: 'meanreversion', name: 'Mean Reversion', description: 'Buy oversold, sell overbought assets' },
    { id: 'breakout', name: 'Breakout Strategy', description: 'Trade range breakouts with volume confirmation' },
    { id: 'pairs', name: 'Pairs Trading', description: 'Market-neutral statistical arbitrage' },
    { id: 'ml', name: 'ML Ensemble', description: 'Machine learning prediction model' }
  ];

  // Backtest results
  const backtestResults = {
    totalReturn: 127.8,
    annualizedReturn: 18.5,
    sharpeRatio: 2.1,
    sortinoRatio: 2.8,
    maxDrawdown: -12.3,
    calmarRatio: 1.5,
    winRate: 58.2,
    profitFactor: 2.3,
    avgWin: 2.4,
    avgLoss: -1.1,
    totalTrades: 247,
    winningTrades: 144,
    losingTrades: 103
  };

  // Equity curve data
  const equityCurve = Array.from({ length: 252 }, (_, i) => {
    const date = new Date(2024, 0, 1);
    date.setDate(date.getDate() + i);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      portfolio: 100000 * (1 + (Math.random() * 0.3 + 0.1) * (i / 252)),
      benchmark: 100000 * (1 + 0.08 * (i / 252)),
      drawdown: Math.random() * -15
    };
  });

  // Monthly returns
  const monthlyReturns = [
    { month: 'Jan', return: 4.2 },
    { month: 'Feb', return: -1.8 },
    { month: 'Mar', return: 3.5 },
    { month: 'Apr', return: 5.1 },
    { month: 'May', return: -2.3 },
    { month: 'Jun', return: 2.8 },
    { month: 'Jul', return: 6.2 },
    { month: 'Aug', return: 1.4 },
    { month: 'Sep', return: -3.1 },
    { month: 'Oct', return: 4.8 },
    { month: 'Nov', return: 3.2 },
    { month: 'Dec', return: 2.9 }
  ];

  // Trade distribution
  const tradeDistribution = [
    { range: '<-10%', count: 8 },
    { range: '-10 to -5%', count: 22 },
    { range: '-5 to 0%', count: 73 },
    { range: '0 to 5%', count: 89 },
    { range: '5 to 10%', count: 42 },
    { range: '>10%', count: 13 }
  ];

  // Recent trades
  const recentTrades = [
    { date: '2024-12-15', symbol: 'AAPL', side: 'BUY', entry: 185.20, exit: 192.45, return: 3.9, duration: 5 },
    { date: '2024-12-10', symbol: 'MSFT', side: 'BUY', entry: 375.80, exit: 369.20, return: -1.8, duration: 3 },
    { date: '2024-12-08', symbol: 'GOOGL', side: 'SELL', entry: 142.30, exit: 138.95, return: 2.4, duration: 7 },
    { date: '2024-12-05', symbol: 'NVDA', side: 'BUY', entry: 485.60, exit: 512.30, return: 5.5, duration: 4 },
    { date: '2024-12-01', symbol: 'TSLA', side: 'BUY', entry: 215.40, exit: 209.80, return: -2.6, duration: 2 }
  ];

  const handleRunBacktest = () => {
    setIsBacktesting(true);
    setTimeout(() => {
      setIsBacktesting(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <LineChart className="w-8 h-8 text-blue-400" />
            Strategy Backtesting Lab
          </h1>
          <p className="text-gray-400 mt-1">Design, test, and optimize algorithmic trading strategies with historical data</p>
        </div>

        {/* Strategy Configuration */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Strategy Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Strategy Type</label>
                <Select value={strategyType} onValueChange={setStrategyType}>
                  <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {strategies.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Initial Capital</label>
                <Input defaultValue="100000" className="bg-gray-900 border-gray-700 text-white" type="number" />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Backtest Period</label>
                <Select defaultValue="1year">
                  <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3months">3 Months</SelectItem>
                    <SelectItem value="6months">6 Months</SelectItem>
                    <SelectItem value="1year">1 Year</SelectItem>
                    <SelectItem value="3years">3 Years</SelectItem>
                    <SelectItem value="5years">5 Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Universe</label>
                <Select defaultValue="sp500">
                  <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sp500">S&P 500</SelectItem>
                    <SelectItem value="nasdaq100">NASDAQ 100</SelectItem>
                    <SelectItem value="russell2000">Russell 2000</SelectItem>
                    <SelectItem value="custom">Custom Universe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4 mt-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Commission (%)</label>
                <Input defaultValue="0.1" className="bg-gray-900 border-gray-700 text-white" type="number" step="0.01" />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Slippage (%)</label>
                <Input defaultValue="0.05" className="bg-gray-900 border-gray-700 text-white" type="number" step="0.01" />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Max Position Size</label>
                <Input defaultValue="10" className="bg-gray-900 border-gray-700 text-white" type="number" />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Stop Loss (%)</label>
                <Input defaultValue="5" className="bg-gray-900 border-gray-700 text-white" type="number" />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button 
                onClick={handleRunBacktest}
                disabled={isBacktesting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Play className="w-4 h-4 mr-2" />
                {isBacktesting ? 'Running Backtest...' : 'Run Backtest'}
              </Button>
              <Button variant="outline" className="border-gray-700 text-white">
                <Code className="w-4 h-4 mr-2" />
                Edit Strategy Code
              </Button>
              <Button variant="outline" className="border-gray-700 text-white">
                <Settings className="w-4 h-4 mr-2" />
                Optimize Parameters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <div className="grid md:grid-cols-6 gap-4">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <p className="text-xs text-gray-400 mb-1">Total Return</p>
              <p className="text-2xl font-bold text-green-400">+{backtestResults.totalReturn}%</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <p className="text-xs text-gray-400 mb-1">Sharpe Ratio</p>
              <p className="text-2xl font-bold text-white">{backtestResults.sharpeRatio}</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <p className="text-xs text-gray-400 mb-1">Max Drawdown</p>
              <p className="text-2xl font-bold text-red-400">{backtestResults.maxDrawdown}%</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <p className="text-xs text-gray-400 mb-1">Win Rate</p>
              <p className="text-2xl font-bold text-white">{backtestResults.winRate}%</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <p className="text-xs text-gray-400 mb-1">Profit Factor</p>
              <p className="text-2xl font-bold text-white">{backtestResults.profitFactor}</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <p className="text-xs text-gray-400 mb-1">Total Trades</p>
              <p className="text-2xl font-bold text-white">{backtestResults.totalTrades}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="equity" className="space-y-4">
          <TabsList className="bg-gray-800">
            <TabsTrigger value="equity">Equity Curve</TabsTrigger>
            <TabsTrigger value="returns">Returns Analysis</TabsTrigger>
            <TabsTrigger value="trades">Trade Analysis</TabsTrigger>
            <TabsTrigger value="risk">Risk Metrics</TabsTrigger>
          </TabsList>

          <TabsContent value="equity" className="space-y-4">
            {/* Equity Curve */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Equity Curve vs Benchmark</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={equityCurve}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
                    <Legend />
                    <Area type="monotone" dataKey="portfolio" fill="#3B82F6" fillOpacity={0.3} stroke="#3B82F6" name="Strategy" />
                    <Line type="monotone" dataKey="benchmark" stroke="#6B7280" strokeDasharray="5 5" name="Benchmark" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Drawdown Chart */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Drawdown Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={equityCurve}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
                    <Area type="monotone" dataKey="drawdown" fill="#EF4444" stroke="#EF4444" name="Drawdown %" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="returns" className="space-y-4">
            {/* Monthly Returns */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Monthly Returns</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={monthlyReturns}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
                    <Bar dataKey="return" fill="#3B82F6" name="Return %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Return Distribution */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Return Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={tradeDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="range" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
                    <Bar dataKey="count" fill="#8B5CF6" name="Number of Trades" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trades">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Recent Trades</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-900 border-b border-gray-700">
                      <tr>
                        <th className="text-left p-3 text-gray-400 font-semibold">DATE</th>
                        <th className="text-left p-3 text-gray-400 font-semibold">SYMBOL</th>
                        <th className="text-center p-3 text-gray-400 font-semibold">SIDE</th>
                        <th className="text-right p-3 text-gray-400 font-semibold">ENTRY</th>
                        <th className="text-right p-3 text-gray-400 font-semibold">EXIT</th>
                        <th className="text-right p-3 text-gray-400 font-semibold">RETURN</th>
                        <th className="text-right p-3 text-gray-400 font-semibold">DURATION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTrades.map((trade, idx) => (
                        <tr key={idx} className="border-b border-gray-800 hover:bg-gray-700/50">
                          <td className="p-3 text-gray-300">{trade.date}</td>
                          <td className="p-3 font-mono font-bold text-white">{trade.symbol}</td>
                          <td className="p-3 text-center">
                            <Badge className={trade.side === 'BUY' ? 'bg-green-600' : 'bg-red-600'}>
                              {trade.side}
                            </Badge>
                          </td>
                          <td className="p-3 text-right font-mono text-white">${trade.entry}</td>
                          <td className="p-3 text-right font-mono text-white">${trade.exit}</td>
                          <td className={`p-3 text-right font-mono font-bold ${trade.return >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {trade.return >= 0 ? '+' : ''}{trade.return}%
                          </td>
                          <td className="p-3 text-right text-gray-400">{trade.duration}d</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="risk">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Risk-Adjusted Returns</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded">
                    <span className="text-gray-300">Sharpe Ratio</span>
                    <span className="text-xl font-bold text-white">{backtestResults.sharpeRatio}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded">
                    <span className="text-gray-300">Sortino Ratio</span>
                    <span className="text-xl font-bold text-white">{backtestResults.sortinoRatio}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded">
                    <span className="text-gray-300">Calmar Ratio</span>
                    <span className="text-xl font-bold text-white">{backtestResults.calmarRatio}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded">
                    <span className="text-gray-300">Max Drawdown</span>
                    <span className="text-xl font-bold text-red-400">{backtestResults.maxDrawdown}%</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Trade Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded">
                    <span className="text-gray-300">Win Rate</span>
                    <span className="text-xl font-bold text-white">{backtestResults.winRate}%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded">
                    <span className="text-gray-300">Profit Factor</span>
                    <span className="text-xl font-bold text-white">{backtestResults.profitFactor}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded">
                    <span className="text-gray-300">Avg Win</span>
                    <span className="text-xl font-bold text-green-400">+{backtestResults.avgWin}%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded">
                    <span className="text-gray-300">Avg Loss</span>
                    <span className="text-xl font-bold text-red-400">{backtestResults.avgLoss}%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Recommendations */}
        <Card className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-white font-semibold mb-1">Strategy Performance Summary</h4>
                <p className="text-sm text-gray-300">
                  Strong Sharpe ratio of {backtestResults.sharpeRatio} indicates excellent risk-adjusted returns. 
                  Win rate of {backtestResults.winRate}% with profit factor {backtestResults.profitFactor}x suggests robust edge. 
                  Consider live deployment with reduced position sizing during high volatility periods.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}