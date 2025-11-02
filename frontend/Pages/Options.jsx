import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Target, Calculator, Globe, Activity, Zap, TrendingUp } from 'lucide-react';
import AssetClassLayout from '../Components/trading/AssetClassLayout';
import OptionsPricingCalculator from '../Components/options/PricingCalculator';
import OptionsVolSurface from '../Components/options/VolSurface';
import OptionsGreeks from '../Components/options/Greeks';
import OptionsFlowMonitor from '../Components/options/FlowMonitor';
import OptionsStrategies from '../Components/options/Strategies';
import ErrorDisplay from '@/src/components/ErrorDisplay';

const tabs = [
  { name: 'Pricing Calculator', icon: Calculator, description: 'Black-Scholes & binomial' },
  { name: 'Vol Surface', icon: Globe, description: '3D implied volatility' },
  { name: 'Greeks Dashboard', icon: Activity, description: 'Delta, gamma, vega, theta' },
  { name: 'Flow Monitor', icon: Zap, description: 'Unusual options activity' },
  { name: 'Strategies', icon: TrendingUp, description: 'Popular option strategies' }
];

export default function Options() {
  const [activeTab, setActiveTab] = useState('Pricing Calculator');
  const [region, setRegion] = useState('US');
  const navigate = useNavigate();

  const { data: riskMetrics = [], error: riskError, isLoading: isLoadingRisk, refetch: refetchRisk } = useQuery({
    queryKey: ['risk', region],
    queryFn: () => base44.entities.RiskMetrics.filter({ region }),
    initialData: [],
  });

  const risk = riskMetrics[0];

  const handleAssetClassChange = (newAssetClass) => {
    navigate(createPageUrl(newAssetClass));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Pricing Calculator':
        return <OptionsPricingCalculator risk={risk} />;
      case 'Vol Surface':
        return <OptionsVolSurface risk={risk} />;
      case 'Greeks Dashboard':
        return <OptionsGreeks risk={risk} />;
      case 'Flow Monitor':
        return <OptionsFlowMonitor />;
      case 'Strategies':
        return <OptionsStrategies risk={risk} />;
      default:
        return <OptionsPricingCalculator risk={risk} />;
    }
  };

  return (
    <AssetClassLayout
      assetClass="Options"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      headerColor="cyan"
      icon={Target}
      onAssetClassChange={handleAssetClassChange}
      region={region}
      onRegionChange={setRegion}
    >
      {/* Error Display */}
      {riskError && (
        <div className="mb-4">
          <ErrorDisplay error={riskError} onRetry={refetchRisk} title="Error Loading Risk Metrics" />
        </div>
      )}

      {isLoadingRisk && !riskError ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
          <span className="ml-3 text-gray-400">Loading data...</span>
        </div>
      ) : (
        renderContent()
      )}
    </AssetClassLayout>
  );
}