
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';

export default function FixedIncomeIssuanceCalendar() {
  const auctions = [
    { date: '2025-02-03', maturity: '2Y Note', size: '42B', expectedYield: 4.45, bidToCover: null, status: 'Upcoming' },
    { date: '2025-02-05', maturity: '5Y Note', size: '58B', expectedYield: 4.38, bidToCover: null, status: 'Upcoming' },
    { date: '2025-02-07', maturity: '10Y Note', size: '39B', expectedYield: 4.53, bidToCover: null, status: 'Upcoming' },
    { date: '2025-01-30', maturity: '4W Bill', size: '75B', expectedYield: 4.28, bidToCover: 2.85, status: 'Completed' },
    { date: '2025-01-29', maturity: '13W Bill', size: '68B', expectedYield: 4.32, bidToCover: 2.92, status: 'Completed' }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Issuance Calendar</h2>
          <p className="text-sm text-gray-400">Treasury auctions and corporate issuance</p>
        </div>
      </div>

      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            Treasury Auction Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="bg-gray-900 border-b border-gray-700">
              <tr>
                <th className="text-left p-3 text-gray-400 font-semibold">DATE</th>
                <th className="text-left p-3 text-gray-400 font-semibold">MATURITY</th>
                <th className="text-right p-3 text-gray-400 font-semibold">SIZE</th>
                <th className="text-right p-3 text-gray-400 font-semibold">EXPECTED YIELD</th>
                <th className="text-right p-3 text-gray-400 font-semibold">BID-TO-COVER</th>
                <th className="text-center p-3 text-gray-400 font-semibold">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {auctions.map((auction, idx) => (
                <tr key={idx} className="border-b border-gray-800 hover:bg-gray-700/50">
                  <td className="p-3 font-mono text-white">{auction.date}</td>
                  <td className="p-3 text-white font-semibold">{auction.maturity}</td>
                  <td className="p-3 text-right font-mono text-white">${auction.size}</td>
                  <td className="p-3 text-right font-mono text-white">{auction.expectedYield?.toFixed(2)}%</td>
                  <td className="p-3 text-right font-mono text-white">{auction.bidToCover?.toFixed(2) || '--'}</td>
                  <td className="p-3 text-center">
                    <Badge className={auction.status === 'Completed' ? 'bg-green-600' : 'bg-blue-600'}>
                      {auction.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Weekly Supply</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg">
                <span className="text-gray-400">This Week</span>
                <span className="text-2xl font-bold text-white">$167B</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-900/50 rounded-lg">
                <span className="text-gray-400">Next Week</span>
                <span className="text-2xl font-bold text-white">$139B</span>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Heavy supply calendar may pressure yields higher across the curve
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Auction Demand Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-400">Avg Bid-to-Cover</span>
                  <span className="text-lg font-bold text-white">2.68x</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: '68%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-400">Indirect Bidders</span>
                  <span className="text-lg font-bold text-white">67%</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: '67%' }} />
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Strong foreign demand supporting auctions
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
