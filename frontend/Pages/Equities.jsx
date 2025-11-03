import React, { useState } from 'react';
import { api } from '@/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { TrendingUp, BarChart3, PieChart, Activity, Layers, LineChart, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AssetClassLayout from '../Components/trading/AssetClassLayout';
import EquitiesIndexOverview from '../Components/equities/IndexOverview';
import EquitiesSectorAnalysis from '../Components/equities/SectorAnalysis';
import EquitiesTopHoldings from '../Components/equities/TopHoldings';
import EquitiesFlowMonitor from '../Components/equities/FlowMonitor';
import EquitiesTechnicalAnalysis from '../Components/equities/TechnicalAnalysis';
import QuantStrategySidebar from '../Components/quant/QuantStrategySidebar';
import ErrorDisplay from '@/components/ErrorDisplay';

const tabs = [
  { name: 'Index Overview', icon: BarChart3, description: 'Major indices & benchmarks' },
  { name: 'Sector Analysis', icon: PieChart, description: 'Sector rotation & themes' },
  { name: 'Top Holdings', icon: Layers, description: 'Largest positions' },
  { name: 'Flow Monitor', icon: Activity, description: 'Buy/sell pressure' },
  { name: 'Technical Analysis', icon: LineChart, description: 'Charts & indicators' }
];

export default function Equities() {
  const [activeTab, setActiveTab] = useState('Index Overview');
  const [region, setRegion] = useState('US');
  const [quantSidebarOpen, setQuantSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const { data: snapshots = [], error: snapshotsError, isLoading: isLoadingSnapshots, refetch: refetchSnapshots } = useQuery({
    queryKey: ['snapshots', region],
    queryFn: () => api.entities.MarketSnapshot.filter({ region }),
    initialData: [],
  });

  const { data: riskMetrics = [], error: riskError, isLoading: isLoadingRisk, refetch: refetchRisk } = useQuery({
    queryKey: ['risk', region],
    queryFn: () => api.entities.RiskMetrics.filter({ region }),
    initialData: [],
  });

  const handleAssetClassChange = (newAssetClass) => {
    navigate(createPageUrl(newAssetClass));
  };

  const renderContent = () => {
    const snapshot = snapshots[0];
    const risk = riskMetrics[0];

    switch (activeTab) {
      case 'Index Overview':
        return <EquitiesIndexOverview snapshot={snapshot} risk={risk} />;
      case 'Sector Analysis':
        return <EquitiesSectorAnalysis snapshot={snapshot} />;
      case 'Top Holdings':
        return <EquitiesTopHoldings />;
      case 'Flow Monitor':
        return <EquitiesFlowMonitor />;
      case 'Technical Analysis':
        return <EquitiesTechnicalAnalysis snapshot={snapshot} />;
      default:
        return <EquitiesIndexOverview snapshot={snapshot} risk={risk} />;
    }
  };

  return (
    <>
      <AssetClassLayout
        assetClass="Equities"
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        headerColor="green"
        icon={TrendingUp}
        onAssetClassChange={handleAssetClassChange}
        region={region}
        onRegionChange={setRegion}
      >
        <div className="relative">
          {/* Quant Strategy Button - Floating */}
          <div className="absolute top-4 right-4 z-10">
            <Button 
              onClick={() => setQuantSidebarOpen(true)}
              className="bg-purple-600 hover:bg-purple-700 shadow-lg"
            >
              <Brain className="w-4 h-4 mr-2" />
              Quant Strategies
            </Button>
          </div>

          {/* Error Display */}
          {(snapshotsError || riskError) && (
            <div className="mb-4">
              {snapshotsError && (
                <ErrorDisplay error={snapshotsError} onRetry={refetchSnapshots} title="Error Loading Market Data" />
              )}
              {riskError && (
                <ErrorDisplay error={riskError} onRetry={refetchRisk} title="Error Loading Risk Metrics" />
              )}
            </div>
          )}

          {(isLoadingSnapshots || isLoadingRisk) && !snapshotsError && !riskError ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
              <span className="ml-3 text-gray-400">Loading data...</span>
            </div>
          ) : (
            renderContent()
          )}
        </div>
      </AssetClassLayout>

      {/* Quant Strategy Sidebar */}
      <QuantStrategySidebar 
        isOpen={quantSidebarOpen}
        onClose={() => setQuantSidebarOpen(false)}
        currentSymbol="SPY"
      />
    </>
  );
}