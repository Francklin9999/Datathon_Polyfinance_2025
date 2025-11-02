
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';

export default function OptionsStrategies({ risk }) {
  const strategies = [
    {
      name: 'Covered Call',
      type: 'Income',
      description: 'Own 100 shares + Sell 1 OTM Call',
      maxProfit: 'Limited to strike - stock price + premium',
      maxLoss: 'Stock price - premium',
      breakeven: 'Stock price - premium',
      bestMarket: 'Neutral to slightly bullish',
      example: 'Own SPY at $492, Sell $500 Call @ $3.50'
    },
    {
      name: 'Iron Condor',
      type: 'Income',
      description: 'Sell OTM Call Spread + Sell OTM Put Spread',
      maxProfit: 'Net premium received',
      maxLoss: 'Width of spread - net premium',
      breakeven: 'Two breakevens at wings',
      bestMarket: 'Low volatility, range-bound',
      example: 'SPY: Sell 480P/475P, Sell 510C/515C'
    },
    {
      name: 'Long Straddle',
      type: 'Volatility',
      description: 'Buy ATM Call + Buy ATM Put',
      maxProfit: 'Unlimited',
      maxLoss: 'Total premium paid',
      breakeven: 'Strike ± total premium',
      bestMarket: 'Expecting large move, direction unclear',
      example: 'SPY @ $492: Buy 492C + 492P'
    },
    {
      name: 'Bull Call Spread',
      type: 'Directional',
      description: 'Buy Call + Sell Higher Strike Call',
      maxProfit: 'Difference in strikes - net premium',
      maxLoss: 'Net premium paid',
      breakeven: 'Long strike + net premium',
      bestMarket: 'Moderately bullish',
      example: 'SPY: Buy 495C, Sell 505C'
    },
    {
      name: 'Calendar Spread',
      type: 'Volatility',
      description: 'Sell Near-Term + Buy Far-Term (same strike)',
      maxProfit: 'When stock near strike at near expiry',
      maxLoss: 'Net premium paid',
      breakeven: 'Complex, depends on vol',
      bestMarket: 'Expecting vol increase',
      example: 'SPY: Sell Feb 500C, Buy Mar 500C'
    },
    {
      name: 'Butterfly Spread',
      type: 'Income',
      description: 'Buy 1 ITM + Sell 2 ATM + Buy 1 OTM',
      maxProfit: 'Middle strike - lower strike - net premium',
      maxLoss: 'Net premium paid',
      breakeven: 'Two breakevens',
      bestMarket: 'Low volatility, pinning expected',
      example: 'SPY: Buy 485C, Sell 2x 495C, Buy 505C'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Options Strategies</h2>
          <p className="text-sm text-gray-400">Popular strategies with risk/reward profiles</p>
        </div>
      </div>

      {/* Strategy Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {strategies.map((strategy, idx) => (
          <Card key={idx} className="bg-gray-800/50 border-gray-700 hover:border-cyan-500/50 transition-all">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">{strategy.name}</CardTitle>
                <Badge className={
                  strategy.type === 'Income' ? 'bg-green-600' :
                  strategy.type === 'Volatility' ? 'bg-purple-600' :
                  'bg-blue-600'
                }>
                  {strategy.type}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-400 text-xs mb-1">Structure</p>
                  <p className="text-white">{strategy.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-gray-400 text-xs">Max Profit</p>
                    <p className="text-green-400 text-xs font-semibold">{strategy.maxProfit}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Max Loss</p>
                    <p className="text-red-400 text-xs font-semibold">{strategy.maxLoss}</p>
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">Best Market</p>
                  <p className="text-white text-xs">{strategy.bestMarket}</p>
                </div>
                <div className="p-2 bg-cyan-900/20 border border-cyan-500/30 rounded">
                  <p className="text-gray-400 text-xs mb-1">Example</p>
                  <p className="text-cyan-300 text-xs font-mono">{strategy.example}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Current Market Recommendations */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Current Market Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
              <p className="text-green-300 font-semibold mb-2">Recommended: Iron Condor</p>
              <p className="text-xs text-gray-400">
                VIX at {risk?.vix?.toFixed(1)} suggests range-bound action. Sell premium in low-vol environment.
              </p>
            </div>
            <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-300 font-semibold mb-2">Monitor: Calendar Spreads</p>
              <p className="text-xs text-gray-400">
                Vol term structure shows contango. Time spreads may be attractive.
              </p>
            </div>
            <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
              <p className="text-red-300 font-semibold mb-2">Avoid: Long Straddles</p>
              <p className="text-xs text-gray-400">
                Implied vol not cheap enough. Need larger move to overcome premium cost.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
