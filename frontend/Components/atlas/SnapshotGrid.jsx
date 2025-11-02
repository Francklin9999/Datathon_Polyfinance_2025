import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function SnapshotGrid({ snapshot }) {
  if (!snapshot) return null;

  const renderChange = (value) => {
    if (!value && value !== 0) return null;
    const isPositive = value > 0;
    const isNeutral = value === 0;
    const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;
    const colorClass = isNeutral ? 'text-gray-400' : isPositive ? 'text-green-400' : 'text-red-400';
    
    return (
      <div className={`flex items-center gap-1 ${colorClass}`}>
        <Icon className="w-4 h-4" />
        <span className="font-semibold">{isPositive ? '+' : ''}{value.toFixed(2)}%</span>
      </div>
    );
  };

  const IndexTile = ({ item }) => (
    <Card className="bg-gray-800/50 border-gray-700 hover:border-blue-500/50 transition-all">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-sm font-mono text-gray-400">{item.symbol}</p>
            <p className="text-xs text-gray-500">{item.name}</p>
          </div>
          {renderChange(item.chg1D)}
        </div>
        <p className="text-2xl font-bold text-white">{item.price?.toLocaleString()}</p>
        <div className="flex gap-3 mt-2 text-xs text-gray-400">
          {item.chg5D !== undefined && <span>5D: {item.chg5D > 0 ? '+' : ''}{item.chg5D.toFixed(2)}%</span>}
          {item.ytd !== undefined && <span>YTD: {item.ytd > 0 ? '+' : ''}{item.ytd.toFixed(2)}%</span>}
        </div>
      </CardContent>
    </Card>
  );

  const CompactTile = ({ item, showYield }) => (
    <div className="flex justify-between items-center p-3 bg-gray-800/30 rounded-lg border border-gray-700">
      <div>
        <p className="text-sm font-semibold text-white">{item.symbol}</p>
        <p className="text-xs text-gray-500">{item.name}</p>
      </div>
      <div className="text-right">
        <p className="text-lg font-bold text-white">
          {showYield ? `${item.yield?.toFixed(2)}%` : item.price?.toFixed(4)}
        </p>
        {renderChange(item.chg1D)}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Indices */}
      {snapshot.indices && snapshot.indices.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Major Indices</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {snapshot.indices.map((item, idx) => (
              <IndexTile key={idx} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* FX */}
      {snapshot.fx && snapshot.fx.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Foreign Exchange</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {snapshot.fx.map((item, idx) => (
              <CompactTile key={idx} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* Commodities */}
      {snapshot.commodities && snapshot.commodities.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Commodities</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {snapshot.commodities.map((item, idx) => (
              <CompactTile key={idx} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* Bonds */}
      {snapshot.bonds && snapshot.bonds.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Government Bonds</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {snapshot.bonds.map((item, idx) => (
              <CompactTile key={idx} item={item} showYield />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}