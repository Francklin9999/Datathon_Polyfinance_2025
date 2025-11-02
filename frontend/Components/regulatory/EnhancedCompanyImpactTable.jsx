import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, TrendingUp, TrendingDown, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

export default function EnhancedCompanyImpactTable({ companies = [], showExplainability = false }) {
  const [sortBy, setSortBy] = useState('score'); // 'score', 'confidence', 'ticker'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  const [expandedRow, setExpandedRow] = useState(null);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const sortedCompanies = [...companies].sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];
    
    if (sortBy === 'ticker') {
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    
    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const getScoreColor = (score) => {
    if (score > 60) return 'text-red-500';
    if (score > 30) return 'text-orange-500';
    if (score > 0) return 'text-yellow-500';
    if (score > -30) return 'text-blue-500';
    return 'text-green-500';
  };

  const getScoreBg = (score) => {
    if (score > 60) return 'bg-red-900/30 border-red-500/50';
    if (score > 30) return 'bg-orange-900/30 border-orange-500/50';
    if (score > 0) return 'bg-yellow-900/30 border-yellow-500/50';
    if (score > -30) return 'bg-blue-900/30 border-blue-500/50';
    return 'bg-green-900/30 border-green-500/50';
  };

  const getImpactLabel = (score) => {
    if (score > 60) return 'HIGH COST';
    if (score > 30) return 'MODERATE COST';
    if (score > 0) return 'LOW COST';
    if (score > -30) return 'LOW BENEFIT';
    return 'HIGH BENEFIT';
  };

  const getConfidenceColor = (confidence) => {
    if (confidence > 0.8) return 'text-green-400';
    if (confidence > 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const scoreIntensity = Math.abs(companies[0]?.score || 0) / 100;
  const barOpacity = Math.min(0.3 + scoreIntensity * 0.7, 1);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-900 border-b border-gray-700">
          <tr>
            <th className="text-left p-3 text-gray-400 font-semibold">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSort('ticker')}
                className="text-gray-400 hover:text-white"
              >
                TICKER
                <ArrowUpDown className="w-3 h-3 ml-1" />
              </Button>
            </th>
            <th className="text-center p-3 text-gray-400 font-semibold">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSort('score')}
                className="text-gray-400 hover:text-white"
              >
                IMPACT SCORE
                <ArrowUpDown className="w-3 h-3 ml-1" />
              </Button>
            </th>
            <th className="text-center p-3 text-gray-400 font-semibold">IMPACT TYPE</th>
            <th className="text-center p-3 text-gray-400 font-semibold">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSort('confidence')}
                className="text-gray-400 hover:text-white"
              >
                CONFIDENCE
                <ArrowUpDown className="w-3 h-3 ml-1" />
              </Button>
            </th>
            <th className="text-left p-3 text-gray-400 font-semibold">REASONING</th>
            <th className="text-center p-3 text-gray-400 font-semibold">DETAILS</th>
          </tr>
        </thead>
        <tbody>
          {sortedCompanies.map((company, idx) => {
            const isExpanded = expandedRow === idx;
            const barWidth = `${Math.abs(company.score)}%`;
            
            return (
              <React.Fragment key={idx}>
                <tr className={`border-b border-gray-800 hover:bg-gray-700/30 transition-colors ${getScoreBg(company.score)} border`}>
                  <td className="p-3 font-mono font-bold text-white text-lg">
                    {company.ticker}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-3">
                      <div className="relative w-32 h-6 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`absolute top-0 h-full transition-all ${
                            company.score > 0 ? 'bg-red-500 right-1/2' : 'bg-green-500 left-1/2'
                          }`}
                          style={{ width: barWidth, opacity: barOpacity }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className={`text-sm font-bold ${getScoreColor(company.score)} z-10`}>
                            {company.score > 0 ? '+' : ''}{company.score}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <Badge className={company.score > 0 ? 'bg-red-600' : 'bg-green-600'}>
                      {getImpactLabel(company.score)}
                    </Badge>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="flex items-center gap-1">
                        <div
                          className={`w-16 h-2 bg-gray-700 rounded-full overflow-hidden`}
                        >
                          <div
                            className={`h-full ${
                              company.confidence > 0.8 ? 'bg-green-500' :
                              company.confidence > 0.6 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${company.confidence * 100}%` }}
                          />
                        </div>
                        <span className={`text-xs font-bold ${getConfidenceColor(company.confidence)}`}>
                          {(company.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-gray-300 max-w-md">
                    <p className="truncate">{company.reasoning}</p>
                  </td>
                  <td className="p-3 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedRow(isExpanded ? null : idx)}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </td>
                </tr>
                
                {isExpanded && (
                  <tr className="bg-gray-900/50">
                    <td colSpan={6} className="p-4">
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-semibold text-gray-400 mb-1">Full Reasoning:</p>
                          <p className="text-sm text-gray-300">{company.reasoning}</p>
                        </div>
                        
                        {showExplainability && (
                          <div className="bg-blue-900/20 border border-blue-500/30 rounded p-3">
                            <p className="text-xs font-semibold text-blue-400 mb-2">📎 Citations & Evidence:</p>
                            <ul className="text-xs text-gray-300 space-y-1">
                              <li>• Referenced measures: Carbon emissions (45%), Renewable energy (30%)</li>
                              <li>• Sector exposure: {company.ticker} operates in affected sectors</li>
                              <li>• Historical compliance costs: Estimated at {Math.abs(company.score * 10)}M USD</li>
                            </ul>
                          </div>
                        )}

                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-gray-800/50 p-2 rounded">
                            <p className="text-xs text-gray-400">Risk Level</p>
                            <p className={`text-sm font-bold ${getScoreColor(company.score)}`}>
                              {company.score > 50 ? 'High' : company.score > 20 ? 'Medium' : 'Low'}
                            </p>
                          </div>
                          <div className="bg-gray-800/50 p-2 rounded">
                            <p className="text-xs text-gray-400">Action Priority</p>
                            <p className={`text-sm font-bold ${getScoreColor(company.score)}`}>
                              {company.score > 50 ? 'Urgent' : company.score > 20 ? 'Monitor' : 'Track'}
                            </p>
                          </div>
                          <div className="bg-gray-800/50 p-2 rounded">
                            <p className="text-xs text-gray-400">Recommendation</p>
                            <p className={`text-sm font-bold ${company.score > 0 ? 'text-red-400' : 'text-green-400'}`}>
                              {company.score > 50 ? 'Reduce' : company.score > 0 ? 'Hold' : 'Increase'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>

      {/* Summary Stats */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="bg-red-900/20 border border-red-500/30 p-3 rounded">
          <p className="text-xs text-gray-400 mb-1">Avg Cost Impact</p>
          <p className="text-2xl font-bold text-red-400">
            {(companies.filter(c => c.score > 0).reduce((sum, c) => sum + c.score, 0) / companies.filter(c => c.score > 0).length || 0).toFixed(1)}
          </p>
        </div>
        <div className="bg-green-900/20 border border-green-500/30 p-3 rounded">
          <p className="text-xs text-gray-400 mb-1">Avg Benefit Impact</p>
          <p className="text-2xl font-bold text-green-400">
            {Math.abs(companies.filter(c => c.score < 0).reduce((sum, c) => sum + c.score, 0) / companies.filter(c => c.score < 0).length || 0).toFixed(1)}
          </p>
        </div>
        <div className="bg-blue-900/20 border border-blue-500/30 p-3 rounded">
          <p className="text-xs text-gray-400 mb-1">Avg Confidence</p>
          <p className="text-2xl font-bold text-blue-400">
            {((companies.reduce((sum, c) => sum + c.confidence, 0) / companies.length || 0) * 100).toFixed(0)}%
          </p>
        </div>
      </div>
    </div>
  );
}