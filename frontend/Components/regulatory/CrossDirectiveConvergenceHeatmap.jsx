import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function CrossDirectiveConvergenceHeatmap({ directives = [] }) {
  const sectors = [
    'Technology', 'Financials', 'Healthcare', 'Consumer Discretionary',
    'Industrials', 'Energy', 'Materials', 'Utilities'
  ];

  // Calculate convergence intensity
  const calculateIntensity = (sector, directive) => {
    const measures = directive.measures?.filter(m => 
      m.target?.toLowerCase().includes(sector.toLowerCase()) ||
      directive.entities?.sectors?.includes(sector)
    ).length || 0;
    
    const severity = directive.measures?.reduce((sum, m) => sum + (m.rate_pct || 10), 0) / 100 || 1;
    const overlap = directives.filter(d => 
      d.entities?.sectors?.includes(sector)
    ).length;
    
    return measures * severity * overlap;
  };

  const getIntensityColor = (intensity) => {
    if (intensity > 10) return 'bg-red-500';
    if (intensity > 5) return 'bg-orange-500';
    if (intensity > 2) return 'bg-yellow-500';
    if (intensity > 0) return 'bg-blue-500';
    return 'bg-gray-700';
  };

  const getSectorsUnderPressure = () => {
    return sectors.filter(sector => {
      const affectingDirectives = directives.filter(d => 
        d.entities?.sectors?.includes(sector)
      );
      return affectingDirectives.length >= 2;
    });
  };

  const pressuredSectors = getSectorsUnderPressure();

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Cross-Directive Convergence Heatmap</CardTitle>
          {pressuredSectors.length > 0 && (
            <Badge className="bg-red-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {pressuredSectors.length} sectors under 2+ pressures
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="p-2 text-left text-xs text-gray-400 sticky left-0 bg-gray-800">SECTOR</th>
                {directives.map((dir, idx) => (
                  <th key={idx} className="p-2 text-center text-xs text-gray-400 min-w-[120px]">
                    <div className="truncate">{dir.regulation_name?.substring(0, 20)}...</div>
                    <div className="text-xs text-gray-500">{dir.effective_date}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sectors.map((sector, sIdx) => {
                const isPressured = pressuredSectors.includes(sector);
                return (
                  <tr key={sIdx} className={isPressured ? 'border-l-4 border-red-500' : ''}>
                    <td className={`p-2 text-sm font-semibold sticky left-0 bg-gray-800 ${
                      isPressured ? 'text-red-400' : 'text-white'
                    }`}>
                      {sector}
                      {isPressured && <span className="ml-2 text-red-400">⚠</span>}
                    </td>
                    {directives.map((dir, dIdx) => {
                      const intensity = calculateIntensity(sector, dir);
                      const affectingMeasures = dir.measures?.filter(m => 
                        m.target?.toLowerCase().includes(sector.toLowerCase())
                      ) || [];
                      const cellOpacity = Math.min(0.3 + intensity / 15, 1);
                      
                      return (
                        <TooltipProvider key={dIdx}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <td
                                className={`p-2 text-center cursor-pointer transition-all hover:opacity-80 ${
                                  getIntensityColor(intensity)
                                }`}
                                style={{ opacity: cellOpacity }}
                              >
                                <span className="text-white text-xs font-bold">
                                  {intensity > 0 ? intensity.toFixed(1) : '—'}
                                </span>
                              </td>
                            </TooltipTrigger>
                            {intensity > 0 && (
                              <TooltipContent className="bg-gray-900 border-gray-700 text-white max-w-xs">
                                <div className="space-y-2">
                                  <p className="font-semibold text-sm">{sector} × {dir.regulation_name}</p>
                                  <p className="text-xs text-gray-400">
                                    Convergence Intensity: {intensity.toFixed(2)}
                                  </p>
                                  {affectingMeasures.length > 0 && (
                                    <div>
                                      <p className="text-xs font-semibold text-blue-400">Overlapping Measures:</p>
                                      {affectingMeasures.map((m, i) => (
                                        <p key={i} className="text-xs text-gray-300">
                                          • {m.target} ({m.rate_pct}%) [{m.citation_id}]
                                        </p>
                                      ))}
                                    </div>
                                  )}
                                  <p className="text-xs text-gray-500">
                                    Effective: {dir.effective_date}
                                  </p>
                                </div>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 text-xs text-gray-400">
          <span>Intensity:</span>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span>Low</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <span>High</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>Critical</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}