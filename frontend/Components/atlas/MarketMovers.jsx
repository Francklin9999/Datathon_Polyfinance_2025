import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function MarketMovers({ snapshots = [] }) {
  const getAllInstruments = () => {
    const instruments = [];
    snapshots.forEach(snapshot => {
      snapshot.indices?.forEach(item => instruments.push({ ...item, region: snapshot.region }));
      snapshot.fx?.forEach(item => instruments.push({ ...item, region: snapshot.region }));
      snapshot.commodities?.forEach(item => instruments.push({ ...item, region: snapshot.region }));
    });
    return instruments;
  };

  const instruments = getAllInstruments();
  const gainers = [...instruments].sort((a, b) => (b.chg1D || 0) - (a.chg1D || 0)).slice(0, 5);
  const losers = [...instruments].sort((a, b) => (a.chg1D || 0) - (b.chg1D || 0)).slice(0, 5);

  const MoverItem = ({ item, isGainer }) => (
    <div className={`flex items-center justify-between p-3 rounded-lg ${
      isGainer ? 'bg-green-900/20 border border-green-500/30' : 'bg-red-900/20 border border-red-500/30'
    }`}>
      <div className="flex items-center gap-3">
        {isGainer ? (
          <TrendingUp className="w-5 h-5 text-green-400" />
        ) : (
          <TrendingDown className="w-5 h-5 text-red-400" />
        )}
        <div>
          <p className="font-semibold text-white">{item.symbol}</p>
          <p className="text-xs text-gray-400">{item.region}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-lg font-bold text-white">{item.price?.toFixed(2)}</p>
        <p className={`text-sm font-semibold ${isGainer ? 'text-green-400' : 'text-red-400'}`}>
          {item.chg1D >= 0 ? '+' : ''}{item.chg1D?.toFixed(2)}%
        </p>
      </div>
    </div>
  );

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Market Movers</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="gainers" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-900">
            <TabsTrigger value="gainers" className="data-[state=active]:bg-green-600">
              Top Gainers
            </TabsTrigger>
            <TabsTrigger value="losers" className="data-[state=active]:bg-red-600">
              Top Losers
            </TabsTrigger>
          </TabsList>
          <TabsContent value="gainers" className="space-y-2 mt-4">
            {gainers.map((item, idx) => (
              <MoverItem key={idx} item={item} isGainer={true} />
            ))}
          </TabsContent>
          <TabsContent value="losers" className="space-y-2 mt-4">
            {losers.map((item, idx) => (
              <MoverItem key={idx} item={item} isGainer={false} />
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}