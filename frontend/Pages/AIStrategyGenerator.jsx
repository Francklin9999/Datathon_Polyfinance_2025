import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Brain, Sparkles, Play, Code, TrendingUp, Zap, AlertCircle } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';

export default function AIStrategyGenerator() {
  const [mlModel, setMlModel] = useState('ensemble');
  const [isTraining, setIsTraining] = useState(false);
  const [generatedStrategy, setGeneratedStrategy] = useState(null);

  // ML Models available
  const models = [
    { id: 'ensemble', name: 'Ensemble (RF + XGBoost + LSTM)', description: 'Best for balanced performance' },
    { id: 'lstm', name: 'LSTM Neural Network', description: 'Time-series prediction' },
    { id: 'reinforcement', name: 'Reinforcement Learning (DQN)', description: 'Adaptive trading' },
    { id: 'genetic', name: 'Genetic Algorithm', description: 'Parameter optimization' },
    { id: 'gpt', name: 'GPT-4 Strategy Builder', description: 'Natural language to strategy' }
  ];

  // Generated strategies
  const aiStrategies = [
    {
      name: 'Momentum-Reversal Hybrid',
      type: 'Ensemble ML',
      sharpe: 2.4,
      accuracy: 64.2,
      features: ['RSI', '20D Momentum', 'Volume Spike', 'Sector Rotation'],
      status: 'ready'
    },
    {
      name: 'Volatility Regime Switcher',
      type: 'LSTM',
      sharpe: 2.1,
      accuracy: 61.8,
      features: ['VIX', 'ATR', 'Bollinger Width', 'Market Correlation'],
      status: 'ready'
    },
    {
      name: 'Multi-Asset Arbitrage',
      type: 'Reinforcement',
      sharpe: 1.9,
      accuracy: 58.5,
      features: ['Cross-Asset Spread', 'Liquidity', 'Order Flow', 'Macro Indicators'],
      status: 'training'
    }
  ];

  // Feature importance
  const featureImportance = [
    { feature: '20D Momentum', importance: 0.28, category: 'Technical' },
    { feature: 'RSI Divergence', importance: 0.22, category: 'Technical' },
    { feature: 'Volume Profile', importance: 0.18, category: 'Volume' },
    { feature: 'Sector Strength', importance: 0.15, category: 'Fundamental' },
    { feature: 'News Sentiment', importance: 0.12, category: 'Alternative' },
    { feature: 'Options Flow', importance: 0.05, category: 'Alternative' }
  ];

  // Model performance over time
  const modelPerformance = Array.from({ length: 60 }, (_, i) => ({
    day: i + 1,
    accuracy: 0.5 + (Math.random() * 0.15),
    sharpe: 1.0 + (Math.random() * 1.5),
    loss: 0.3 - (i / 60) * 0.2 + Math.random() * 0.05
  }));

  // Prediction confidence distribution
  const confidenceDistribution = [
    { range: '0-20%', count: 45, avgReturn: -1.2 },
    { range: '20-40%', count: 88, avgReturn: 0.3 },
    { range: '40-60%', count: 142, avgReturn: 1.1 },
    { range: '60-80%', count: 96, avgReturn: 2.8 },
    { range: '80-100%', count: 52, avgReturn: 4.5 }
  ];

  // Neural network architecture visualization
  const networkLayers = [
    { layer: 'Input', neurons: 64, type: 'Dense' },
    { layer: 'Hidden 1', neurons: 128, type: 'LSTM' },
    { layer: 'Hidden 2', neurons: 64, type: 'LSTM' },
    { layer: 'Dropout', neurons: 64, type: 'Dropout (0.3)' },
    { layer: 'Dense', neurons: 32, type: 'Dense + ReLU' },
    { layer: 'Output', neurons: 3, type: 'Softmax' }
  ];

  const handleGenerateStrategy = () => {
    setIsTraining(true);
    setTimeout(() => {
      setIsTraining(false);
      setGeneratedStrategy({
        name: 'AI-Generated Momentum Strategy',
        description: 'Multi-factor momentum strategy optimized by genetic algorithm',
        sharpe: 2.7,
        accuracy: 67.3,
        code: `# AI-Generated Strategy
def strategy_signal(data):
    # Feature engineering
    rsi = calculate_rsi(data, 14)
    momentum = data['close'].pct_change(20)
    volume_spike = data['volume'] / data['volume'].rolling(20).mean()
    
    # ML model prediction
    features = np.column_stack([rsi, momentum, volume_spike])
    prediction = model.predict(features)
    confidence = model.predict_proba(features)
    
    # Generate signals
    if prediction == 1 and confidence > 0.65:
        return 'BUY', confidence
    elif prediction == -1 and confidence > 0.65:
        return 'SELL', confidence
    else:
        return 'HOLD', confidence`
      });
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Brain className="w-8 h-8 text-indigo-400" />
            AI Strategy Generator
          </h1>
          <p className="text-gray-400 mt-1">Machine learning-powered strategy discovery using genetic algorithms and neural networks</p>
        </div>

        {/* Strategy Generator */}
        <Card className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border-indigo-500/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              Generate New Strategy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">ML Model</label>
                <Select value={mlModel} onValueChange={setMlModel}>
                  <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map(m => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  {models.find(m => m.id === mlModel)?.description}
                </p>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Training Data Period</label>
                <Select defaultValue="3years">
                  <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1year">1 Year</SelectItem>
                    <SelectItem value="3years">3 Years</SelectItem>
                    <SelectItem value="5years">5 Years</SelectItem>
                    <SelectItem value="10years">10 Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-2 block">Optimization Target</label>
                <Select defaultValue="sharpe">
                  <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sharpe">Sharpe Ratio</SelectItem>
                    <SelectItem value="return">Total Return</SelectItem>
                    <SelectItem value="calmar">Calmar Ratio</SelectItem>
                    <SelectItem value="sortino">Sortino Ratio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-2 block">Strategy Description (Optional)</label>
              <Textarea 
                placeholder="Describe the type of strategy you want to create, or leave blank for AI to explore..."
                className="bg-gray-900 border-gray-700 text-white min-h-[100px]"
              />
            </div>

            <Button 
              onClick={handleGenerateStrategy}
              disabled={isTraining}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              size="lg"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              {isTraining ? 'Training Model...' : 'Generate Strategy with AI'}
            </Button>
          </CardContent>
        </Card>

        {/* Generated Strategy Display */}
        {generatedStrategy && (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">{generatedStrategy.name}</CardTitle>
                <Badge className="bg-green-600">Ready to Deploy</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-300">{generatedStrategy.description}</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-900/50 p-4 rounded">
                  <p className="text-sm text-gray-400">Predicted Sharpe</p>
                  <p className="text-3xl font-bold text-white">{generatedStrategy.sharpe}</p>
                </div>
                <div className="bg-gray-900/50 p-4 rounded">
                  <p className="text-sm text-gray-400">Prediction Accuracy</p>
                  <p className="text-3xl font-bold text-white">{generatedStrategy.accuracy}%</p>
                </div>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-2">Generated Strategy Code</h4>
                <div className="bg-gray-900 p-4 rounded font-mono text-sm text-green-400 overflow-x-auto">
                  <pre>{generatedStrategy.code}</pre>
                </div>
              </div>

              <div className="flex gap-3">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Play className="w-4 h-4 mr-2" />
                  Backtest Strategy
                </Button>
                <Button variant="outline" className="border-gray-700 text-white">
                  <Code className="w-4 h-4 mr-2" />
                  Export Code
                </Button>
                <Button variant="outline" className="border-gray-700 text-white">
                  Deploy to Production
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Existing AI Strategies */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">AI-Generated Strategies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {aiStrategies.map((strategy, idx) => (
                <div key={idx} className="p-4 bg-gray-900/50 rounded-lg border border-gray-700 hover:border-indigo-500/50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-white font-semibold">{strategy.name}</h4>
                      <p className="text-sm text-gray-400">{strategy.type}</p>
                    </div>
                    <Badge className={strategy.status === 'ready' ? 'bg-green-600' : 'bg-yellow-600'}>
                      {strategy.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-400">Sharpe Ratio</p>
                      <p className="text-xl font-bold text-white">{strategy.sharpe}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Accuracy</p>
                      <p className="text-xl font-bold text-white">{strategy.accuracy}%</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {strategy.features.map((feature, i) => (
                      <Badge key={i} variant="outline" className="text-xs border-indigo-600 text-indigo-400">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Feature Importance */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Feature Importance (Current Model)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={featureImportance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9CA3AF" />
                  <YAxis dataKey="feature" type="category" stroke="#9CA3AF" width={120} />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
                  <Bar dataKey="importance" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>

              <div className="mt-4 space-y-2">
                {featureImportance.map((feature, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-gray-300">{feature.feature}</span>
                    <Badge variant="outline" className="text-xs">
                      {feature.category}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Model Training Progress */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Training Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={modelPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="day" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
                  <Legend />
                  <Line type="monotone" dataKey="accuracy" stroke="#10B981" name="Accuracy" />
                  <Line type="monotone" dataKey="sharpe" stroke="#3B82F6" name="Sharpe" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Prediction Confidence Analysis */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Prediction Confidence vs Returns</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={confidenceDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="range" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
                <Legend />
                <Bar dataKey="count" fill="#6B7280" name="Number of Predictions" />
                <Bar dataKey="avgReturn" fill="#8B5CF6" name="Avg Return %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Neural Network Architecture */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Neural Network Architecture</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {networkLayers.map((layer, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="w-32">
                    <p className="text-sm font-semibold text-white">{layer.layer}</p>
                    <p className="text-xs text-gray-400">{layer.type}</p>
                  </div>
                  <div className="flex-1">
                    <div className="h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded flex items-center justify-center" style={{ width: `${(layer.neurons / 128) * 100}%` }}>
                      <span className="text-white text-sm font-bold">{layer.neurons} neurons</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-lg">
              <p className="text-sm text-indigo-300">
                <Zap className="w-4 h-4 inline mr-1" />
                <strong>Architecture Highlights:</strong> LSTM layers for temporal dependencies, dropout for regularization, softmax output for multi-class prediction (BUY/SELL/HOLD)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Alert */}
        <Card className="bg-gradient-to-r from-indigo-900/20 to-purple-900/20 border-indigo-500/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-white font-semibold mb-1">AI Strategy Generator Tips</h4>
                <p className="text-sm text-gray-300">
                  Best results achieved with 3+ years of training data. Ensemble models provide more robust predictions across market regimes. 
                  Always backtest generated strategies before deployment. Consider paper trading for 30 days minimum.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}