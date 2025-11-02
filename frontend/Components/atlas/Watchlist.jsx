import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Plus, X, TrendingUp, TrendingDown } from 'lucide-react';

export default function Watchlist() {
  const [watchlist, setWatchlist] = useState([
    { symbol: 'SPX', name: 'S&P 500', price: 5987.37, chg1D: 0.53, type: 'Index' },
    { symbol: 'US10Y', name: '10Y Treasury', price: 4.53, chg1D: 0.05, type: 'Bond' },
    { symbol: 'GC', name: 'Gold', price: 2787.5, chg1D: 0.85, type: 'Commodity' },
    { symbol: 'EURUSD', name: 'EUR/USD', price: 1.0455, chg1D: 0.22, type: 'FX' }
  ]);

  const removeFromWatchlist = (symbol) => {
    setWatchlist(watchlist.filter(item => item.symbol !== symbol));
  };

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400" />
            Watchlist
          </CardTitle>
          <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {watchlist.length === 0 ? (
          <p className="text-gray-400 text-center py-4 text-sm">
            No items in watchlist. Add instruments to track them.
          </p>
        ) : (
          <div className="space-y-2">
            {watchlist.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg hover:bg-gray-900/70 transition-colors group"
              >
                <div className="flex items-center gap-3 flex-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm">{item.symbol}</p>
                    <p className="text-xs text-gray-400 truncate">{item.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">
                      {item.type === 'Bond' ? `${item.price}%` : item.price.toFixed(2)}
                    </p>
                    <p className={`text-xs font-semibold flex items-center gap-1 ${
                      item.chg1D >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {item.chg1D >= 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {item.chg1D >= 0 ? '+' : ''}{item.chg1D.toFixed(2)}%
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-gray-400 hover:text-red-400"
                    onClick={() => removeFromWatchlist(item.symbol)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}