import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Info, TrendingUp, TrendingDown } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function RiskPanelChart({ riskMetrics }) {
  const [showVolInfo, setShowVolInfo] = useState(false);
  const [showCorrInfo, setShowCorrInfo] = useState(false);
  const [showCurveInfo, setShowCurveInfo] = useState(false);

  if (!riskMetrics) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-8 text-center text-gray-400">
          Risk metrics unavailable
        </CardContent>
      </Card>
    );
  }

  const VolatilityChart = () => {
    if (!riskMetrics.historicalData || riskMetrics.historicalData.length === 0) {
      return <p className="text-gray-500 text-sm">No historical data</p>;
    }

    const maxVol = Math.max(...riskMetrics.historicalData.map(d => d.volatility || 0));
    
    return (
      <div className="h-32 flex items-end gap-1">
        {riskMetrics.historicalData.slice(-30).map((point, idx) => (
          <div
            key={idx}
            className="flex-1 bg-blue-500/70 rounded-t transition-all hover:bg-blue-400"
            style={{ height: `${(point.volatility / maxVol) * 100}%` }}
            title={`${point.date}: ${point.volatility?.toFixed(2)}%`}
          />
        ))}
      </div>
    );
  };

  const DrawdownChart = () => {
    if (!riskMetrics.historicalData || riskMetrics.historicalData.length === 0) {
      return <p className="text-gray-500 text-sm">No historical data</p>;
    }

    const maxDrawdown = Math.max(...riskMetrics.historicalData.map(d => Math.abs(d.drawdown || 0)));
    
    return (
      <div className="h-32 flex items-end gap-1">
        {riskMetrics.historicalData.slice(-30).map((point, idx) => (
          <div
            key={idx}
            className="flex-1 bg-red-500/70 rounded-t transition-all hover:bg-red-400"
            style={{ height: `${(Math.abs(point.drawdown) / maxDrawdown) * 100}%` }}
            title={`${point.date}: ${point.drawdown?.toFixed(2)}%`}
          />
        ))}
      </div>
    );
  };

  const CorrelationHeatmap = () => {
    if (!riskMetrics.correlation || !riskMetrics.correlation.matrix) {
      return <p className="text-gray-500 text-sm">No correlation data</p>;
    }

    const { labels, matrix } = riskMetrics.correlation;

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="p-2"></th>
              {labels.map((label, idx) => (
                <th key={idx} className="p-2 text-gray-400 font-mono">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, i) => (
              <tr key={i}>
                <td className="p-2 text-gray-400 font-mono">{labels[i]}</td>
                {row.map((value, j) => {
                  const intensity = Math.abs(value);
                  const color = value > 0 ? 'bg-green-500' : 'bg-red-500';
                  return (
                    <td
                      key={j}
                      className={`p-2 text-center ${color}`}
                      style={{ opacity: intensity * 0.8 + 0.2 }}
                      title={value.toFixed(3)}
                    >
                      {value.toFixed(2)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const InfoTooltip = ({ content }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" variant="ghost" className="h-6 w-6 text-gray-400 hover:text-white">
            <Info className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <div className="space-y-4">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <p className="text-xs text-gray-400 mb-1">20D Volatility</p>
            <p className="text-2xl font-bold text-white">
              {riskMetrics.volatility20d?.toFixed(2)}%
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <p className="text-xs text-gray-400 mb-1">Drawdown</p>
            <p className="text-2xl font-bold text-red-400">
              {riskMetrics.drawdown?.toFixed(2)}%
            </p>
          </CardContent>
        </Card>
        {riskMetrics.vix && (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <p className="text-xs text-gray-400 mb-1">VIX</p>
              <p className="text-2xl font-bold text-yellow-400">
                {riskMetrics.vix?.toFixed(2)}
              </p>
            </CardContent>
          </Card>
        )}
        {riskMetrics.slope2s10s !== undefined && (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <p className="text-xs text-gray-400 mb-1">2s10s Slope</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-white">
                  {riskMetrics.slope2s10s?.toFixed(0)}bp
                </p>
                {riskMetrics.slope2s10s > 0 ? (
                  <TrendingUp className="w-5 h-5 text-green-400" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-400" />
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Volatility Chart */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-sm">Rolling Volatility (20D)</CardTitle>
            <InfoTooltip content="20-day rolling volatility measures recent price fluctuations. Higher values indicate increased market uncertainty and risk." />
          </div>
        </CardHeader>
        <CardContent>
          <VolatilityChart />
        </CardContent>
      </Card>

      {/* Drawdown Chart */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-sm">Drawdown</CardTitle>
            <InfoTooltip content="Drawdown shows the decline from a historical peak. It measures the potential loss from the highest point." />
          </div>
        </CardHeader>
        <CardContent>
          <DrawdownChart />
        </CardContent>
      </Card>

      {/* Correlation Matrix */}
      {riskMetrics.correlation && (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-sm">60-Day Correlation Matrix</CardTitle>
              <InfoTooltip content="Correlation matrix shows how different assets move together. Values near +1 indicate strong positive correlation, near -1 strong negative correlation." />
            </div>
          </CardHeader>
          <CardContent>
            <CorrelationHeatmap />
          </CardContent>
        </Card>
      )}

      {/* Yield Curve */}
      {riskMetrics.yield2s !== undefined && riskMetrics.yield10s !== undefined && (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-sm">Yield Curve</CardTitle>
              <InfoTooltip content="The yield curve slope (2s10s) indicates market expectations. Steepening suggests growth expectations; flattening or inversion may signal recession concerns." />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-around">
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-1">2-Year</p>
                <p className="text-xl font-bold text-white">{riskMetrics.yield2s?.toFixed(2)}%</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-1">10-Year</p>
                <p className="text-xl font-bold text-white">{riskMetrics.yield10s?.toFixed(2)}%</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400 mb-1">Slope</p>
                <Badge className={riskMetrics.slope2s10s > 0 ? 'bg-green-600' : 'bg-red-600'}>
                  {riskMetrics.slope2s10s > 0 ? '+' : ''}{riskMetrics.slope2s10s?.toFixed(0)}bp
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}