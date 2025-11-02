import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, TrendingUp, AlertTriangle } from 'lucide-react';

export default function DurationAnalytics() {
  const portfolioDuration = 6.8;
  const portfolioConvexity = 0.42;
  const dv01 = 68500;

  const holdings = [
    { cusip: 'US912828Z224', maturity: '2Y', duration: 1.95, convexity: 0.05, weight: 15, yieldChange: -0.05 },
    { cusip: 'US912828Z315', maturity: '5Y', duration: 4.65, convexity: 0.25, weight: 25, yieldChange: 0.02 },
    { cusip: 'US912828Z406', maturity: '10Y', duration: 8.85, convexity: 0.68, weight: 35, yieldChange: 0.08 },
    { cusip: 'US912828Z497', maturity: '30Y', duration: 18.2, convexity: 2.85, weight: 25, yieldChange: 0.12 }
  ];

  const scenarios = [
    { name: '+50bp parallel shift', impact: -3.4, probability: 25 },
    { name: '+25bp parallel shift', impact: -1.7, probability: 35 },
    { name: 'No change', impact: 0, probability: 20 },
    { name: '-25bp parallel shift', impact: 1.7, probability: 15 },
    { name: 'Steepening (2s10s +30bp)', impact: 1.2, probability: 5 }
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Duration & Convexity Analytics</h2>
        <p className="text-sm text-gray-400">Interest rate risk exposure and hedging tools</p>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-400">Portfolio Duration</p>
              <Clock className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-white">{portfolioDuration}</p>
            <p className="text-xs text-gray-400 mt-1">Years</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-400">Convexity</p>
              <TrendingUp className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-3xl font-bold text-white">{portfolioConvexity}</p>
            <p className="text-xs text-gray-400 mt-1">Positive convexity</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-400">DV01</p>
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <p className="text-3xl font-bold text-white">${(dv01 / 1000).toFixed(0)}K</p>
            <p className="text-xs text-gray-400 mt-1">Per 1bp move</p>
          </CardContent>
        </Card>
      </div>

      {/* Holdings Breakdown */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Holdings Duration Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>
                <th className="text-left p-3 text-gray-400 font-semibold">CUSIP</th>
                <th className="text-center p-3 text-gray-400 font-semibold">MATURITY</th>
                <th className="text-right p-3 text-gray-400 font-semibold">DURATION</th>
                <th className="text-right p-3 text-gray-400 font-semibold">CONVEXITY</th>
                <th className="text-right p-3 text-gray-400 font-semibold">WEIGHT</th>
                <th className="text-right p-3 text-gray-400 font-semibold">YLD CHG</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((holding, idx) => (
                <tr key={idx} className="border-b border-gray-800 hover:bg-gray-700/50">
                  <td className="p-3 font-mono text-white">{holding.cusip}</td>
                  <td className="p-3 text-center">
                    <Badge variant="outline">{holding.maturity}</Badge>
                  </td>
                  <td className="p-3 text-right font-mono text-white">{holding.duration}</td>
                  <td className="p-3 text-right font-mono text-white">{holding.convexity}</td>
                  <td className="p-3 text-right font-mono text-white">{holding.weight}%</td>
                  <td className={`p-3 text-right font-mono ${holding.yieldChange >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {holding.yieldChange >= 0 ? '+' : ''}{holding.yieldChange}bp
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Duration Contribution Chart */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Duration Contribution by Maturity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {holdings.map((holding, idx) => {
              const contribution = (holding.duration * holding.weight) / 100;
              const barWidth = (contribution / portfolioDuration) * 100;
              
              return (
                <div key={idx}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-400">{holding.maturity}</span>
                    <span className="text-sm text-white">{contribution.toFixed(2)} years</span>
                  </div>
                  <div className="h-6 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 flex items-center justify-end pr-2"
                      style={{ width: `${barWidth}%` }}
                    >
                      <span className="text-xs text-white font-semibold">{holding.weight}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Scenario Analysis */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Rate Scenario Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>
                <th className="text-left p-3 text-gray-400 font-semibold">SCENARIO</th>
                <th className="text-right p-3 text-gray-400 font-semibold">IMPACT (%)</th>
                <th className="text-right p-3 text-gray-400 font-semibold">PROBABILITY</th>
                <th className="text-left p-3 text-gray-400 font-semibold">SIGNAL</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map((scenario, idx) => (
                <tr key={idx} className="border-b border-gray-800 hover:bg-gray-700/50">
                  <td className="p-3 text-white">{scenario.name}</td>
                  <td className={`p-3 text-right font-mono font-bold ${scenario.impact >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {scenario.impact >= 0 ? '+' : ''}{scenario.impact.toFixed(2)}%
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-500"
                          style={{ width: `${scenario.probability}%` }}
                        />
                      </div>
                      <span className="text-gray-400 text-xs">{scenario.probability}%</span>
                    </div>
                  </td>
                  <td className="p-3">
                    {scenario.impact < -2 ? (
                      <Badge className="bg-red-600">High Risk</Badge>
                    ) : scenario.impact > 1 ? (
                      <Badge className="bg-green-600">Opportunity</Badge>
                    ) : (
                      <Badge className="bg-gray-600">Neutral</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Hedging Recommendations */}
      <Card className="bg-purple-900/20 border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-white">Duration Hedge Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-purple-300">Target Duration: 5.0 years</p>
                <p className="text-xs text-gray-300 mt-1">
                  Current duration ({portfolioDuration}) exceeds target. Consider:
                </p>
                <ul className="text-xs text-gray-300 mt-2 space-y-1">
                  <li>• Reduce 30Y exposure by 10%</li>
                  <li>• Add 2Y Treasuries (+15%)</li>
                  <li>• Hedge with 10Y futures (-5 contracts)</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}