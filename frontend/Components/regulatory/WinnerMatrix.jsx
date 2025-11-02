import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Target } from 'lucide-react';

export default function WinnerMatrix({ companies = [] }) {
  // Quadrant classification
  const getQuadrant = (company) => {
    const score = company.score;
    const confidence = company.confidence;

    if (score < 0 && confidence > 0.7) return 'HIGH_BENEFIT_HIGH_CONF';
    if (score < 0 && confidence <= 0.7) return 'HIGH_BENEFIT_LOW_CONF';
    if (score > 0 && confidence > 0.7) return 'HIGH_COST_HIGH_CONF';
    return 'HIGH_COST_LOW_CONF';
  };

  const quadrants = {
    HIGH_BENEFIT_HIGH_CONF: {
      name: 'Clear Winners',
      color: 'bg-green-500',
      textColor: 'text-green-400',
      bgClass: 'bg-green-900/20 border-green-500/50',
      icon: TrendingUp,
      companies: companies.filter(c => getQuadrant(c) === 'HIGH_BENEFIT_HIGH_CONF')
    },
    HIGH_BENEFIT_LOW_CONF: {
      name: 'Potential Winners',
      color: 'bg-blue-500',
      textColor: 'text-blue-400',
      bgClass: 'bg-blue-900/20 border-blue-500/50',
      icon: Target,
      companies: companies.filter(c => getQuadrant(c) === 'HIGH_BENEFIT_LOW_CONF')
    },
    HIGH_COST_HIGH_CONF: {
      name: 'Clear Losers',
      color: 'bg-red-500',
      textColor: 'text-red-400',
      bgClass: 'bg-red-900/20 border-red-500/50',
      icon: TrendingDown,
      companies: companies.filter(c => getQuadrant(c) === 'HIGH_COST_HIGH_CONF')
    },
    HIGH_COST_LOW_CONF: {
      name: 'Uncertain Risk',
      color: 'bg-yellow-500',
      textColor: 'text-yellow-400',
      bgClass: 'bg-yellow-900/20 border-yellow-500/50',
      icon: Target,
      companies: companies.filter(c => getQuadrant(c) === 'HIGH_COST_LOW_CONF')
    }
  };

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-400" />
          Winner/Loser Matrix (Confidence vs Impact)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* 2x2 Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Top Left: Clear Winners */}
          <div className={`${quadrants.HIGH_BENEFIT_HIGH_CONF.bgClass} border rounded-lg p-4`}>
            <div className="flex items-center justify-between mb-3">
              <p className={`text-sm font-bold ${quadrants.HIGH_BENEFIT_HIGH_CONF.textColor}`}>
                ✅ {quadrants.HIGH_BENEFIT_HIGH_CONF.name}
              </p>
              <Badge className="bg-green-600">
                {quadrants.HIGH_BENEFIT_HIGH_CONF.companies.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {quadrants.HIGH_BENEFIT_HIGH_CONF.companies.slice(0, 3).map((c, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-white">{c.ticker}</span>
                  <div className="flex items-center gap-2">
                    <span className={quadrants.HIGH_BENEFIT_HIGH_CONF.textColor}>
                      {c.score}
                    </span>
                    <span className="text-gray-400">
                      {(c.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
              {quadrants.HIGH_BENEFIT_HIGH_CONF.companies.length > 3 && (
                <p className="text-xs text-gray-500">
                  +{quadrants.HIGH_BENEFIT_HIGH_CONF.companies.length - 3} more
                </p>
              )}
            </div>
          </div>

          {/* Top Right: Potential Winners */}
          <div className={`${quadrants.HIGH_BENEFIT_LOW_CONF.bgClass} border rounded-lg p-4`}>
            <div className="flex items-center justify-between mb-3">
              <p className={`text-sm font-bold ${quadrants.HIGH_BENEFIT_LOW_CONF.textColor}`}>
                🎯 {quadrants.HIGH_BENEFIT_LOW_CONF.name}
              </p>
              <Badge className="bg-blue-600">
                {quadrants.HIGH_BENEFIT_LOW_CONF.companies.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {quadrants.HIGH_BENEFIT_LOW_CONF.companies.slice(0, 3).map((c, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-white">{c.ticker}</span>
                  <div className="flex items-center gap-2">
                    <span className={quadrants.HIGH_BENEFIT_LOW_CONF.textColor}>
                      {c.score}
                    </span>
                    <span className="text-gray-400">
                      {(c.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
              {quadrants.HIGH_BENEFIT_LOW_CONF.companies.length > 3 && (
                <p className="text-xs text-gray-500">
                  +{quadrants.HIGH_BENEFIT_LOW_CONF.companies.length - 3} more
                </p>
              )}
            </div>
          </div>

          {/* Bottom Left: Clear Losers */}
          <div className={`${quadrants.HIGH_COST_HIGH_CONF.bgClass} border rounded-lg p-4`}>
            <div className="flex items-center justify-between mb-3">
              <p className={`text-sm font-bold ${quadrants.HIGH_COST_HIGH_CONF.textColor}`}>
                ⚠️ {quadrants.HIGH_COST_HIGH_CONF.name}
              </p>
              <Badge className="bg-red-600">
                {quadrants.HIGH_COST_HIGH_CONF.companies.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {quadrants.HIGH_COST_HIGH_CONF.companies.slice(0, 3).map((c, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-white">{c.ticker}</span>
                  <div className="flex items-center gap-2">
                    <span className={quadrants.HIGH_COST_HIGH_CONF.textColor}>
                      +{c.score}
                    </span>
                    <span className="text-gray-400">
                      {(c.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
              {quadrants.HIGH_COST_HIGH_CONF.companies.length > 3 && (
                <p className="text-xs text-gray-500">
                  +{quadrants.HIGH_COST_HIGH_CONF.companies.length - 3} more
                </p>
              )}
            </div>
          </div>

          {/* Bottom Right: Uncertain Risk */}
          <div className={`${quadrants.HIGH_COST_LOW_CONF.bgClass} border rounded-lg p-4`}>
            <div className="flex items-center justify-between mb-3">
              <p className={`text-sm font-bold ${quadrants.HIGH_COST_LOW_CONF.textColor}`}>
                ❓ {quadrants.HIGH_COST_LOW_CONF.name}
              </p>
              <Badge className="bg-yellow-600">
                {quadrants.HIGH_COST_LOW_CONF.companies.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {quadrants.HIGH_COST_LOW_CONF.companies.slice(0, 3).map((c, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-white">{c.ticker}</span>
                  <div className="flex items-center gap-2">
                    <span className={quadrants.HIGH_COST_LOW_CONF.textColor}>
                      +{c.score}
                    </span>
                    <span className="text-gray-400">
                      {(c.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
              {quadrants.HIGH_COST_LOW_CONF.companies.length > 3 && (
                <p className="text-xs text-gray-500">
                  +{quadrants.HIGH_COST_LOW_CONF.companies.length - 3} more
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Axis Labels */}
        <div className="relative">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>← Low Confidence</span>
            <span>High Confidence →</span>
          </div>
          <div className="absolute -left-6 top-1/2 transform -translate-y-1/2 -rotate-90 text-xs text-gray-400 whitespace-nowrap">
            ← Cost Impact | Benefit Impact →
          </div>
        </div>

        {/* Strategic Insight */}
        <div className="mt-6 p-3 bg-purple-900/20 border border-purple-500/30 rounded">
          <p className="text-xs font-semibold text-purple-300 mb-1">Strategic Insight:</p>
          <p className="text-xs text-gray-300">
            Clear Winners ({quadrants.HIGH_BENEFIT_HIGH_CONF.companies.length}) are high-confidence beneficiaries - consider overweighting. 
            Clear Losers ({quadrants.HIGH_COST_HIGH_CONF.companies.length}) face certain costs - reduce exposure or hedge.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}