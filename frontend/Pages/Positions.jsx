import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Briefcase, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity,
  RefreshCw,
  Download
} from 'lucide-react';
import PositionTable from '../Components/positions/PositionTable';
import OrderFlow from '../Components/positions/OrderFlow';
import RiskMetricsPanel from '../Components/positions/RiskMetricsPanel';
import TradeBlotter from '../Components/positions/TradeBlotter';
import PerformanceChart from '../Components/positions/PerformanceChart';
import ErrorDisplay from '@/src/components/ErrorDisplay';

export default function Positions() {
  const [selectedDesk, setSelectedDesk] = useState('ALL');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: positions = [], error: positionsError, refetch: refetchPositions, isLoading: isLoadingPositions } = useQuery({
    queryKey: ['positions'],
    queryFn: () => base44.entities.Position.list('-updated_date'),
    initialData: [],
    refetchInterval: autoRefresh ? 5000 : false,
  });

  const { data: orders = [], error: ordersError, refetch: refetchOrders, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order.list('-timestamp', 50),
    initialData: [],
    refetchInterval: autoRefresh ? 3000 : false,
  });

  const filteredPositions = selectedDesk === 'ALL' 
    ? positions 
    : positions.filter(p => p.desk === selectedDesk);

  const calculatePortfolioMetrics = () => {
    const totalPnL = positions.reduce((sum, p) => sum + (p.dayPnL || 0), 0);
    const unrealizedPnL = positions.reduce((sum, p) => sum + (p.unrealizedPnL || 0), 0);
    const realizedPnL = positions.reduce((sum, p) => sum + (p.realizedPnL || 0), 0);
    const totalExposure = positions.reduce((sum, p) => sum + Math.abs(p.exposure || 0), 0);
    const totalMarketValue = positions.reduce((sum, p) => sum + Math.abs(p.marketValue || 0), 0);
    
    const longPositions = positions.filter(p => p.side === 'LONG');
    const shortPositions = positions.filter(p => p.side === 'SHORT');
    
    const longExposure = longPositions.reduce((sum, p) => sum + (p.exposure || 0), 0);
    const shortExposure = shortPositions.reduce((sum, p) => sum + Math.abs(p.exposure || 0), 0);

    return {
      totalPnL,
      unrealizedPnL,
      realizedPnL,
      totalExposure,
      totalMarketValue,
      longExposure,
      shortExposure,
      netExposure: longExposure - shortExposure,
      numPositions: positions.length,
      longCount: longPositions.length,
      shortCount: shortPositions.length
    };
  };

  const metrics = calculatePortfolioMetrics();

  const desks = ['ALL', 'Equities', 'FixedIncome', 'FX', 'Commodities', 'Options', 'Credit'];

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 overflow-hidden">
      {/* Bloomberg-style Header Bar */}
      <div className="bg-black border-b border-orange-500/30 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-orange-500" />
              <span className="text-white font-bold text-lg">POSITIONS & P/L</span>
            </div>
            
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-400">Total P&L:</span>
              <span className={`font-bold text-lg ${metrics.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {metrics.totalPnL >= 0 ? '+' : ''}${metrics.totalPnL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-400">Exposure:</span>
              <span className="font-bold text-white">
                ${(metrics.totalExposure / 1000000).toFixed(1)}M
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-400">Positions:</span>
              <span className="font-bold text-white">{metrics.numPositions}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant={autoRefresh ? "default" : "outline"}
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="h-7"
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? 'Live' : 'Paused'}
            </Button>

            <Button size="sm" variant="outline" className="h-7">
              <Download className="w-3 h-3 mr-1" />
              Export
            </Button>

            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-400">LIVE</span>
            </div>

            <span className="text-xs text-gray-400 font-mono">
              {new Date().toLocaleTimeString('en-US', { hour12: false })}
            </span>
          </div>
        </div>
      </div>

      {/* Desk Filter Bar */}
      <div className="bg-gray-900/50 border-b border-gray-800 px-4 py-2">
        <Tabs value={selectedDesk} onValueChange={setSelectedDesk}>
          <TabsList className="bg-gray-800 h-8">
            {desks.map(desk => (
              <TabsTrigger key={desk} value={desk} className="text-xs px-4">
                {desk}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Main Content - Bloomberg-style Multi-Panel Layout */}
      <div className="flex-1 overflow-hidden p-2 space-y-2">
        {/* Error Display */}
        {(positionsError || ordersError) && (
          <div className="p-2">
            {positionsError && (
              <ErrorDisplay error={positionsError} onRetry={refetchPositions} title="Error Loading Positions" />
            )}
            {ordersError && (
              <ErrorDisplay error={ordersError} onRetry={refetchOrders} title="Error Loading Orders" />
            )}
          </div>
        )}
        
        {(isLoadingPositions || isLoadingOrders) && !positionsError && !ordersError && (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <span className="ml-3 text-gray-400">Loading data...</span>
          </div>
        )}
        {/* Top Row - Key Metrics */}
        <div className="grid grid-cols-5 gap-2 h-24">
          <Card className="bg-gray-800/90 border-gray-700">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">DAY P&L</span>
                {metrics.totalPnL >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-400" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-400" />
                )}
              </div>
              <p className={`text-2xl font-bold ${metrics.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {metrics.totalPnL >= 0 ? '+' : ''}${(metrics.totalPnL / 1000).toFixed(1)}K
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Real: ${(metrics.realizedPnL / 1000).toFixed(1)}K | Unreal: ${(metrics.unrealizedPnL / 1000).toFixed(1)}K
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/90 border-gray-700">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">LONG EXPOSURE</span>
                <TrendingUp className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-white">
                ${(metrics.longExposure / 1000000).toFixed(2)}M
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {metrics.longCount} positions
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/90 border-gray-700">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">SHORT EXPOSURE</span>
                <TrendingDown className="w-4 h-4 text-red-400" />
              </div>
              <p className="text-2xl font-bold text-white">
                ${(metrics.shortExposure / 1000000).toFixed(2)}M
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {metrics.shortCount} positions
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/90 border-gray-700">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">NET EXPOSURE</span>
                <Activity className="w-4 h-4 text-yellow-400" />
              </div>
              <p className="text-2xl font-bold text-white">
                ${(metrics.netExposure / 1000000).toFixed(2)}M
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {((metrics.netExposure / metrics.totalExposure) * 100).toFixed(1)}% net
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/90 border-gray-700">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">MARKET VALUE</span>
                <DollarSign className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-2xl font-bold text-white">
                ${(metrics.totalMarketValue / 1000000).toFixed(2)}M
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Gross exposure
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Middle Row - Position Table and Order Flow */}
        <div className="grid grid-cols-3 gap-2" style={{ height: 'calc(50% - 3.5rem)' }}>
          <div className="col-span-2">
            <PositionTable positions={filteredPositions} />
          </div>
          <div>
            <OrderFlow orders={orders} />
          </div>
        </div>

        {/* Bottom Row - Blotter, Performance, Risk */}
        <div className="grid grid-cols-5 gap-2" style={{ height: 'calc(50% - 3.5rem)' }}>
          <div className="col-span-2">
            <TradeBlotter orders={orders.filter(o => o.status === 'FILLED')} />
          </div>
          <div className="col-span-2">
            <PerformanceChart positions={positions} />
          </div>
          <div>
            <RiskMetricsPanel positions={positions} metrics={metrics} />
          </div>
        </div>
      </div>
    </div>
  );
}