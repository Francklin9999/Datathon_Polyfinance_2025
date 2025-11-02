import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Layers, TrendingUp, TrendingDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function EquitiesTopHoldings() {
  const holdings = [
    { symbol: 'AAPL', name: 'Apple Inc', sector: 'Technology', weight: 7.2, price: 185.45, chg1D: 1.25, marketCap: 2890 },
    { symbol: 'MSFT', name: 'Microsoft Corp', sector: 'Technology', weight: 6.8, price: 378.92, chg1D: 0.87, marketCap: 2810 },
    { symbol: 'NVDA', name: 'NVIDIA Corp', sector: 'Technology', weight: 5.4, price: 875.32, chg1D: 2.15, marketCap: 2150 },
    { symbol: 'GOOGL', name: 'Alphabet Inc', sector: 'Communication', weight: 4.1, price: 142.58, chg1D: 0.52, marketCap: 1780 },
    { symbol: 'AMZN', name: 'Amazon.com Inc', sector: 'Consumer Disc', weight: 3.9, price: 178.25, chg1D: 0.95, marketCap: 1850 },
    { symbol: 'META', name: 'Meta Platforms', sector: 'Communication', weight: 2.8, price: 485.75, chg1D: 1.42, marketCap: 1230 },
    { symbol: 'TSLA', name: 'Tesla Inc', sector: 'Consumer Disc', weight: 2.3, price: 215.30, chg1D: -0.68, marketCap: 685 },
    { symbol: 'BRK.B', name: 'Berkshire Hathaway', sector: 'Financials', weight: 2.1, price: 425.82, chg1D: 0.15, marketCap: 945 },
    { symbol: 'JPM', name: 'JPMorgan Chase', sector: 'Financials', weight: 1.9, price: 189.45, chg1D: 0.42, marketCap: 545 },
    { symbol: 'V', name: 'Visa Inc', sector: 'Financials', weight: 1.7, price: 282.15, chg1D: 0.68, marketCap: 580 }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Top Holdings</h2>
          <p className="text-sm text-gray-400">Largest index constituents by market cap</p>
        </div>
      </div>

      {/* Holdings Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {holdings.slice(0, 6).map((holding, idx) => (
          <Card key={idx} className="bg-gray-800/50 border-gray-700 hover:border-blue-500/50 transition-all">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-lg font-bold text-white">{holding.symbol}</p>
                  <p className="text-sm text-gray-400">{holding.name}</p>
                  <Badge variant="outline" className="mt-1 text-xs">{holding.sector}</Badge>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-white">${holding.price}</p>
                  <p className={`text-sm font-semibold ${holding.chg1D >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {holding.chg1D >= 0 ? '+' : ''}{holding.chg1D.toFixed(2)}%
                  </p>
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>Weight: {holding.weight}%</span>
                <span>Mkt Cap: ${holding.marketCap}B</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Full Holdings Table */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Complete Holdings List</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>
                <th className="text-left p-3 text-gray-400 font-semibold">RANK</th>
                <th className="text-left p-3 text-gray-400 font-semibold">SYMBOL</th>
                <th className="text-left p-3 text-gray-400 font-semibold">NAME</th>
                <th className="text-left p-3 text-gray-400 font-semibold">SECTOR</th>
                <th className="text-right p-3 text-gray-400 font-semibold">WEIGHT</th>
                <th className="text-right p-3 text-gray-400 font-semibold">PRICE</th>
                <th className="text-right p-3 text-gray-400 font-semibold">1D CHG</th>
                <th className="text-right p-3 text-gray-400 font-semibold">MKT CAP</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((holding, idx) => (
                <tr key={idx} className="border-b border-gray-800 hover:bg-gray-700/50">
                  <td className="p-3 text-gray-400">{idx + 1}</td>
                  <td className="p-3 font-mono font-bold text-white">{holding.symbol}</td>
                  <td className="p-3 text-gray-300">{holding.name}</td>
                  <td className="p-3 text-gray-400">{holding.sector}</td>
                  <td className="p-3 text-right font-mono text-white">{holding.weight}%</td>
                  <td className="p-3 text-right font-mono text-white">${holding.price}</td>
                  <td className={`p-3 text-right font-mono font-bold ${holding.chg1D >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {holding.chg1D >= 0 ? '+' : ''}{holding.chg1D.toFixed(2)}%
                  </td>
                  <td className="p-3 text-right font-mono text-gray-300">${holding.marketCap}B</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Concentration Analysis */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Top 10 Concentration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-400">Top 10 Weight</span>
                  <span className="text-xl font-bold text-white">
                    {holdings.slice(0, 10).reduce((sum, h) => sum + h.weight, 0).toFixed(1)}%
                  </span>
                </div>
                <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500"
                    style={{ width: `${holdings.slice(0, 10).reduce((sum, h) => sum + h.weight, 0)}%` }}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400">
                High concentration in top holdings. Monitor for rebalancing opportunities.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Sector Concentration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-400">Technology</span>
                  <span className="text-sm text-white">28.5%</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: '28.5%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-400">Financials</span>
                  <span className="text-sm text-white">13.2%</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500" style={{ width: '13.2%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-400">Healthcare</span>
                  <span className="text-sm text-white">12.8%</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: '12.8%' }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}