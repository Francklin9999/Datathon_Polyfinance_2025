
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

export default function FixedIncomeFlowMonitor() {
  const flows = [
    { maturity: '2Y', buyFlow: 2.5, sellFlow: 1.8, netFlow: 0.7, trend: 'BUY' },
    { maturity: '5Y', buyFlow: 3.2, sellFlow: 2.9, netFlow: 0.3, trend: 'BUY' },
    { maturity: '10Y', buyFlow: 4.8, sellFlow: 5.2, netFlow: -0.4, trend: 'SELL' },
    { maturity: '30Y', buyFlow: 1.5, sellFlow: 1.2, netFlow: 0.3, trend: 'BUY' }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Flow Monitor</h2>
          <p className="text-sm text-gray-400">Real-time Treasury buy/sell flows</p>
        </div>
      </div>

      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            Treasury Flow by Maturity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
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
                      <p className="font-bold text-white text-lg">{flow.maturity} Treasury</p>
                      <p className={`text-sm font-semibold ${flow.netFlow >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        Net Flow: {flow.netFlow >= 0 ? '+' : ''}{flow.netFlow.toFixed(1)}B
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Buy Flow</p>
                    <p className="text-sm font-mono text-green-400">${flow.buyFlow.toFixed(1)}B</p>
                    <p className="text-xs text-gray-400 mt-1">Sell Flow</p>
                    <p className="text-sm font-mono text-red-400">${flow.sellFlow.toFixed(1)}B</p>
                  </div>
                </div>
                <div className="flex h-3 rounded-full overflow-hidden">
                  <div 
                    className="bg-green-500"
                    style={{ width: `${(flow.buyFlow / (flow.buyFlow + flow.sellFlow)) * 100}%` }}
                  />
                  <div 
                    className="bg-red-500"
                    style={{ width: `${(flow.sellFlow / (flow.buyFlow + flow.sellFlow)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
