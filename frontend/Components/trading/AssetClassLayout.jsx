import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, RefreshCw, ArrowLeft } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Link, useLocation } from 'react-router-dom';

export default function AssetClassLayout({ 
  assetClass, 
  tabs, 
  activeTab, 
  onTabChange, 
  children,
  headerColor = 'orange',
  icon: Icon,
  onAssetClassChange,
  region,
  onRegionChange
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const location = useLocation();

  const assetClasses = [
    { value: 'Equities', label: 'Equities', path: 'Equities' },
    { value: 'FixedIncome', label: 'Fixed Income', path: 'FixedIncome' },
    { value: 'FX', label: 'FX', path: 'FX' },
    { value: 'Commodities', label: 'Commodities', path: 'Commodities' },
    { value: 'Options', label: 'Options', path: 'Options' },
    { value: 'Credit', label: 'Credit', path: 'Credit' },
    { value: 'Macro', label: 'Macro', path: 'Macro' }
  ];

  const handleTabChange = (tab) => {
    setIsLoading(true);
    onTabChange(tab);
    setTimeout(() => {
      setIsLoading(false);
      setLastRefresh(new Date());
    }, 800 + Math.random() * 400);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setLastRefresh(new Date());
    }, 600);
  };

  const headerColors = {
    orange: 'border-orange-500/30',
    blue: 'border-blue-500/30',
    green: 'border-green-500/30',
    purple: 'border-purple-500/30',
    yellow: 'border-yellow-500/30',
    cyan: 'border-cyan-500/30',
    red: 'border-red-500/30',
    indigo: 'border-indigo-500/30'
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 overflow-hidden">
      {/* Bloomberg-style Header */}
      <div className={`bg-black border-b ${headerColors[headerColor]} px-6 py-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Back to Overview */}
            <Link 
              to={createPageUrl('Index')} 
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-xs">Overview</span>
            </Link>

            {/* Asset Class */}
            <div className="flex items-center gap-2">
              {Icon && <Icon className={`w-5 h-5 text-${headerColor}-500`} />}
              <span className="text-white font-bold text-lg">{assetClass.toUpperCase()}</span>
            </div>
            
            {/* Asset Class Dropdown */}
            <Select value={assetClass} onValueChange={onAssetClassChange}>
              <SelectTrigger className="w-48 h-8 bg-gray-900 border-gray-700 text-white text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {assetClasses.map(ac => (
                  <SelectItem key={ac.value} value={ac.path}>
                    {ac.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Region Tabs */}
            {region && onRegionChange && (
              <Tabs value={region} onValueChange={onRegionChange}>
                <TabsList className="bg-gray-800 h-8">
                  <TabsTrigger value="US" className="text-xs">US</TabsTrigger>
                  <TabsTrigger value="EU" className="text-xs">Europe</TabsTrigger>
                  <TabsTrigger value="ASIA" className="text-xs">Asia</TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              className="h-7"
              disabled={isLoading}
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-400">LIVE</span>
            </div>

            <span className="text-xs text-gray-400 font-mono">
              {lastRefresh.toLocaleTimeString('en-US', { hour12: false })}
            </span>
          </div>
        </div>
      </div>

      {/* Content with Left Tab Navigation */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Tab Bar */}
        <div className="w-56 bg-gray-900/50 border-r border-gray-800 overflow-y-auto">
          <div className="p-2 space-y-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.name;
              const TabIcon = tab.icon;
              
              return (
                <button
                  key={tab.name}
                  onClick={() => handleTabChange(tab.name)}
                  disabled={isLoading}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left
                    ${isActive 
                      ? 'bg-blue-600/20 border border-blue-500/50 text-white' 
                      : 'hover:bg-gray-800/50 text-gray-400 hover:text-white border border-transparent'
                    }
                    ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {TabIcon && <TabIcon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-400' : ''}`} />}
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${isActive ? 'text-white' : ''}`}>{tab.name}</p>
                    {tab.description && (
                      <p className="text-xs text-gray-500">{tab.description}</p>
                    )}
                  </div>
                  {isActive && isLoading && (
                    <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden relative">
          {isLoading && (
            <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
                <p className="text-white font-semibold">Loading {activeTab}...</p>
                <p className="text-gray-400 text-sm mt-2">Fetching real-time data</p>
              </div>
            </div>
          )}
          <div className="h-full overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}