import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { DollarSign, TrendingUp, Activity, BarChart3, Calendar, Zap } from 'lucide-react';
import AssetClassLayout from '../Components/trading/AssetClassLayout';
import FixedIncomeYieldCurve from '../Components/fixedincome/YieldCurve';
import FixedIncomeDurationAnalytics from '../Components/fixedincome/DurationAnalytics';
import FixedIncomeCurveTrading from '../Components/fixedincome/CurveTrading';
import FixedIncomeIssuanceCalendar from '../Components/fixedincome/IssuanceCalendar';
import FixedIncomeFlowMonitor from '../Components/fixedincome/FlowMonitor';
import ErrorDisplay from '@/components/ErrorDisplay';

const tabs = [
  { name: 'Yield Curve', icon: TrendingUp, description: 'Curve shape & dynamics' },
  { name: 'Duration Analytics', icon: Activity, description: 'DV01, convexity, risk' },
  { name: 'Curve Trading', icon: Zap, description: 'Steepeners, flatteners' },
  { name: 'Issuance Calendar', icon: Calendar, description: 'Upcoming auctions' },
  { name: 'Flow Monitor', icon: BarChart3, description: 'Buy/sell flows' }
];

export default function FixedIncome() {
  const [activeTab, setActiveTab] = useState('Yield Curve');
  const [region, setRegion] = useState('US');
  const navigate = useNavigate();

  const { data: snapshots = [], error: snapshotsError, isLoading: isLoadingSnapshots, refetch: refetchSnapshots } = useQuery({
    queryKey: ['snapshots', region],
    queryFn: () => base44.entities.MarketSnapshot.filter({ region }),
    initialData: [],
  });

  const { data: riskMetrics = [], error: riskError, isLoading: isLoadingRisk, refetch: refetchRisk } = useQuery({
    queryKey: ['risk', region],
    queryFn: () => base44.entities.RiskMetrics.filter({ region }),
    initialData: [],
  });

  const snapshot = snapshots[0];
  const risk = riskMetrics[0];

  const handleAssetClassChange = (newAssetClass) => {
    navigate(createPageUrl(newAssetClass));
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Yield Curve':
        return <FixedIncomeYieldCurve snapshot={snapshot} risk={risk} />;
      case 'Duration Analytics':
        return <FixedIncomeDurationAnalytics snapshot={snapshot} risk={risk} />;
      case 'Curve Trading':
        return <FixedIncomeCurveTrading risk={risk} />;
      case 'Issuance Calendar':
        return <FixedIncomeIssuanceCalendar />;
      case 'Flow Monitor':
        return <FixedIncomeFlowMonitor />;
      default:
        return <FixedIncomeYieldCurve snapshot={snapshot} risk={risk} />;
    }
  };

  return (
    <AssetClassLayout
      assetClass="Fixed Income"
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      headerColor="purple"
      icon={DollarSign}
      onAssetClassChange={handleAssetClassChange}
      region={region}
      onRegionChange={setRegion}
    >
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          <span className="ml-3 text-gray-400">Loading data...</span>
        </div>
      ) : (
        renderContent()
      )}
    </AssetClassLayout>
  );
}