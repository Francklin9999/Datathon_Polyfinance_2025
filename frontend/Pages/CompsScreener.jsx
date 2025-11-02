import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Building2, TrendingUp, DollarSign, Target, BarChart3 } from 'lucide-react';

export default function CompsScreener() {
  const [sector, setSector] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Comparable Companies
  const comparables = [
    {
      name: 'TechCorp Inc',
      ticker: 'TECH',
      sector: 'Technology',
      marketCap: 450.5,
      revenue: 125.3,
      ebitda: 42.1,
      evEbitda: 18.5,
      evRevenue: 3.6,
      peRatio: 28.4,
      revenueGrowth: 18.5,
      ebitdaMargin: 33.6,
      similarityScore: 95
    },
    {
      name: 'Digital Solutions Ltd',
      ticker: 'DSOL',
      sector: 'Technology',
      marketCap: 380.2,
      revenue: 98.7,
      ebitda: 32.5,
      evEbitda: 17.2,
      evRevenue: 3.9,
      peRatio: 26.8,
      revenueGrowth: 22.1,
      ebitdaMargin: 32.9,
      similarityScore: 91
    },
    {
      name: 'Innovation Systems',
      ticker: 'INNO',
      sector: 'Technology',
      marketCap: 520.8,
      revenue: 142.6,
      ebitda: 48.9,
      evEbitda: 19.1,
      evRevenue: 3.7,
      peRatio: 30.2,
      revenueGrowth: 15.8,
      ebitdaMargin: 34.3,
      similarityScore: 88
    },
    {
      name: 'CloudWare Group',
      ticker: 'CLWD',
      sector: 'Technology',
      marketCap: 295.4,
      revenue: 76.8,
      ebitda: 24.2,
      evEbitda: 16.8,
      evRevenue: 3.8,
      peRatio: 25.6,
      revenueGrowth: 24.3,
      ebitdaMargin: 31.5,
      similarityScore: 85
    },
    {
      name: 'Enterprise Tech Co',
      ticker: 'ENTC',
      sector: 'Technology',
      marketCap: 610.2,
      revenue: 168.5,
      ebitda: 58.7,
      evEbitda: 19.8,
      evRevenue: 3.6,
      peRatio: 31.5,
      revenueGrowth: 12.9,
      ebitdaMargin: 34.8,
      similarityScore: 82
    }
  ];

  // Valuation Metrics Summary
  const valuationSummary = {
    median: {
      evEbitda: 18.5,
      evRevenue: 3.7,
      peRatio: 28.4,
      revenueGrowth: 18.5,
      ebitdaMargin: 33.6
    },
    mean: {
      evEbitda: 18.3,
      evRevenue: 3.7,
      peRatio: 28.5,
      revenueGrowth: 18.7,
      ebitdaMargin: 33.4
    },
    range: {
      evEbitdaLow: 16.8,
      evEbitdaHigh: 19.8,
      evRevenueLow: 3.6,
      evRevenueHigh: 3.9
    }
  };

  // Transaction Comparables
  const transactions = [
    {
      date: '2024-Q4',
      buyer: 'MegaCorp',
      target: 'SoftSolutions Inc',
      dealValue: 2.8,
      revenue: 95.2,
      ebitda: 28.5,
      evEbitda: 15.2,
      evRevenue: 2.9,
      premium: 35.2,
      synergies: 'Technology integration, cost savings'
    },
    {
      date: '2024-Q3',
      buyer: 'Global Tech Holdings',
      target: 'DataSystems Corp',
      dealValue: 3.4,
      revenue: 112.8,
      ebitda: 35.6,
      evEbitda: 16.8,
      evRevenue: 3.0,
      premium: 42.1,
      synergies: 'Market expansion, cross-selling'
    },
    {
      date: '2024-Q2',
      buyer: 'Enterprise Solutions',
      target: 'CloudTech Ltd',
      dealValue: 1.9,
      revenue: 68.4,
      ebitda: 20.1,
      evEbitda: 14.5,
      evRevenue: 2.8,
      premium: 28.7,
      synergies: 'Product consolidation'
    }
  ];

  const getSimilarityColor = (score) => {
    if (score >= 90) return 'bg-green-600';
    if (score >= 80) return 'bg-blue-600';
    return 'bg-yellow-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Search className="w-8 h-8 text-blue-400" />
            Comparable Companies Screener
          </h1>
          <p className="text-gray-400 mt-1">AI-powered comparable company analysis with valuation multiples and transaction comps</p>
        </div>

        {/* Search & Filters */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by company name or ticker..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>
              <Select value={sector} onValueChange={setSector}>
                <SelectTrigger className="w-48 bg-gray-900 border-gray-700 text-white">
                  <SelectValue placeholder="Sector" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sectors</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="financials">Financials</SelectItem>
                  <SelectItem value="industrials">Industrials</SelectItem>
                </SelectContent>
              </Select>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Valuation Summary */}
        <div className="grid md:grid-cols-5 gap-4">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <p className="text-xs text-gray-400 mb-2">Median EV/EBITDA</p>
              <p className="text-2xl font-bold text-white">{valuationSummary.median.evEbitda}x</p>
              <p className="text-xs text-gray-400 mt-1">Range: {valuationSummary.range.evEbitdaLow}x - {valuationSummary.range.evEbitdaHigh}x</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <p className="text-xs text-gray-400 mb-2">Median EV/Revenue</p>
              <p className="text-2xl font-bold text-white">{valuationSummary.median.evRevenue}x</p>
              <p className="text-xs text-gray-400 mt-1">Range: {valuationSummary.range.evRevenueLow}x - {valuationSummary.range.evRevenueHigh}x</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <p className="text-xs text-gray-400 mb-2">Median P/E</p>
              <p className="text-2xl font-bold text-white">{valuationSummary.median.peRatio}x</p>
              <p className="text-xs text-gray-400 mt-1">Trading multiple</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <p className="text-xs text-gray-400 mb-2">Avg Revenue Growth</p>
              <p className="text-2xl font-bold text-white">{valuationSummary.median.revenueGrowth}%</p>
              <p className="text-xs text-gray-400 mt-1">YoY growth</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <p className="text-xs text-gray-400 mb-2">Avg EBITDA Margin</p>
              <p className="text-2xl font-bold text-white">{valuationSummary.median.ebitdaMargin}%</p>
              <p className="text-xs text-gray-400 mt-1">Profitability</p>
            </CardContent>
          </Card>
        </div>

        {/* Comparable Companies Table */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Comparable Public Companies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-900 border-b border-gray-700">
                  <tr>
                    <th className="text-left p-3 text-gray-400 font-semibold">COMPANY</th>
                    <th className="text-right p-3 text-gray-400 font-semibold">MARKET CAP</th>
                    <th className="text-right p-3 text-gray-400 font-semibold">REVENUE</th>
                    <th className="text-right p-3 text-gray-400 font-semibold">EBITDA</th>
                    <th className="text-right p-3 text-gray-400 font-semibold">EV/EBITDA</th>
                    <th className="text-right p-3 text-gray-400 font-semibold">EV/REV</th>
                    <th className="text-right p-3 text-gray-400 font-semibold">P/E</th>
                    <th className="text-right p-3 text-gray-400 font-semibold">REV GROWTH</th>
                    <th className="text-right p-3 text-gray-400 font-semibold">MARGIN</th>
                    <th className="text-center p-3 text-gray-400 font-semibold">SIMILARITY</th>
                  </tr>
                </thead>
                <tbody>
                  {comparables.map((comp, idx) => (
                    <tr key={idx} className="border-b border-gray-800 hover:bg-gray-700/50">
                      <td className="p-3">
                        <div>
                          <p className="font-semibold text-white">{comp.name}</p>
                          <p className="text-xs text-gray-400">{comp.ticker}</p>
                        </div>
                      </td>
                      <td className="p-3 text-right font-mono text-white">${comp.marketCap}B</td>
                      <td className="p-3 text-right font-mono text-white">${comp.revenue}B</td>
                      <td className="p-3 text-right font-mono text-white">${comp.ebitda}B</td>
                      <td className="p-3 text-right font-mono font-bold text-blue-400">{comp.evEbitda}x</td>
                      <td className="p-3 text-right font-mono font-bold text-blue-400">{comp.evRevenue}x</td>
                      <td className="p-3 text-right font-mono text-white">{comp.peRatio}x</td>
                      <td className="p-3 text-right font-mono text-green-400">{comp.revenueGrowth}%</td>
                      <td className="p-3 text-right font-mono text-white">{comp.ebitdaMargin}%</td>
                      <td className="p-3 text-center">
                        <Badge className={getSimilarityColor(comp.similarityScore)}>
                          {comp.similarityScore}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Comparables */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Precedent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactions.map((txn, idx) => (
                <div key={idx} className="p-4 bg-gray-900/50 rounded-lg border-l-4 border-purple-500">
                  <div className="grid md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-400">Transaction</p>
                      <p className="text-white font-semibold">{txn.buyer}</p>
                      <p className="text-sm text-gray-300">acquired {txn.target}</p>
                      <p className="text-xs text-gray-400 mt-1">{txn.date}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-400">Deal Value</p>
                      <p className="text-xl font-bold text-white">${txn.dealValue}B</p>
                      <p className="text-xs text-green-400 mt-1">{txn.premium}% premium</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-400">Multiples</p>
                      <div className="flex gap-3 mt-1">
                        <div>
                          <p className="text-sm text-gray-300">EV/EBITDA</p>
                          <p className="text-lg font-bold text-blue-400">{txn.evEbitda}x</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-300">EV/Rev</p>
                          <p className="text-lg font-bold text-blue-400">{txn.evRevenue}x</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-gray-400">Key Synergies</p>
                      <p className="text-sm text-gray-300 mt-1">{txn.synergies}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Valuation Analysis */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Implied Valuation Range</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-gray-900/50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-gray-300">Based on EV/EBITDA</p>
                    <Badge className="bg-blue-600">Primary Multiple</Badge>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-white">$3.2B - $4.1B</p>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <span>16.8x low</span>
                    <span>18.5x median</span>
                    <span>19.8x high</span>
                  </div>
                  <div className="mt-3 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600" style={{ width: '100%' }} />
                  </div>
                </div>

                <div className="p-4 bg-gray-900/50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-gray-300">Based on EV/Revenue</p>
                    <Badge variant="outline" className="text-xs">Secondary</Badge>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-white">$2.9B - $3.6B</p>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <span>3.6x low</span>
                    <span>3.7x median</span>
                    <span>3.9x high</span>
                  </div>
                  <div className="mt-3 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-500 via-green-400 to-green-600" style={{ width: '85%' }} />
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg">
                  <p className="text-sm font-semibold text-white mb-1">Recommended Valuation Range</p>
                  <p className="text-2xl font-bold text-purple-400">$3.4B - $3.8B</p>
                  <p className="text-xs text-gray-300 mt-2">Blended approach using primary multiples with 60/40 weighting</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Key Insights & Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <TrendingUp className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-white font-semibold mb-1">Strong Comp Set</h4>
                      <p className="text-sm text-gray-300">
                        Identified 5 highly comparable companies with 85%+ similarity scores. Strong business model and market positioning alignment.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-white font-semibold mb-1">Valuation Premium Justified</h4>
                      <p className="text-sm text-gray-300">
                        Above-average revenue growth (18.5% vs peer median 15.2%) and EBITDA margins (33.6% vs 31.8%) support premium valuation multiples.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Target className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-white font-semibold mb-1">M&A Market Validation</h4>
                      <p className="text-sm text-gray-300">
                        Recent transactions show 14.5x-16.8x EV/EBITDA range with 28-42% control premiums. Active M&A market supports upper end of valuation range.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <DollarSign className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-white font-semibold mb-1">Recommended Action</h4>
                      <p className="text-sm text-gray-300">
                        Initial offer range: $3.5B-$3.7B (17.5x-18.5x EV/EBITDA). Prepare for up to 30% premium on acceptance. Monitor comp multiples quarterly.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}