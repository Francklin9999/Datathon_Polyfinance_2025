import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import HeaderBar from '../Components/atlas/HeaderBar';
import SummaryCard from '../Components/atlas/SummaryCard';
import SnapshotGrid from '../Components/atlas/SnapshotGrid';
import NewsList from '../Components/atlas/NewsList';
import RiskPanelChart from '../Components/atlas/RiskPanelChart';
import EventsStrip from '../Components/atlas/EventsStrip';
import SourcesFooter from '../Components/atlas/SourcesFooter';
import ErrorDisplay from '@/components/ErrorDisplay';

export default function USMarkets() {
  const [language, setLanguage] = useState('EN');
  const [summary, setSummary] = useState(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const { data: snapshots = [], error: snapshotsError, isLoading: isLoadingSnapshots, refetch: refetchSnapshots } = useQuery({
    queryKey: ['snapshots'],
    queryFn: () => base44.entities.MarketSnapshot.filter({ region: 'US' }),
    initialData: [],
  });

  const { data: news = [], error: newsError, isLoading: isLoadingNews, refetch: refetchNews } = useQuery({
    queryKey: ['news-us'],
    queryFn: () => base44.entities.NewsItem.list('-publishedDate', 20),
    initialData: [],
  });

  const { data: events = [], error: eventsError, isLoading: isLoadingEvents, refetch: refetchEvents } = useQuery({
    queryKey: ['events-us'],
    queryFn: () => base44.entities.EventItem.list('-eventDate', 10),
    initialData: [],
  });

  const { data: riskMetrics = [], error: riskError, isLoading: isLoadingRisk, refetch: refetchRisk } = useQuery({
    queryKey: ['risk-us'],
    queryFn: () => base44.entities.RiskMetrics.filter({ region: 'US' }),
    initialData: [],
  });

  const snapshot = snapshots[0];
  const risk = riskMetrics[0];

  const handleSummarize = async () => {
    setIsGeneratingSummary(true);
    try {
      const context = {
        region: 'US',
        snapshot: snapshot,
        news: news.slice(0, 5),
        risk: risk,
        events: events.slice(0, 3),
        language: language
      };

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a senior macro analyst. Provide a brief (3-5 sentences) ${language === 'FR' ? 'French' : 'English'} summary of US market conditions based on this data: ${JSON.stringify(context)}. Use neutral institutional tone, no trading advice, cite key drivers succinctly (e.g., 'VIX up', '2s10s steepened', sentiment).`,
        response_json_schema: null
      });

      setSummary({
        text: result,
        timestamp: new Date().toISOString(),
        engineMode: 'Polished'
      });
    } catch (error) {
      // Fallback template
      const sentimentText = news.length > 0 
        ? (news.filter(n => n.sentiment === 'positive').length > news.length / 2 ? 'positive' : 'mixed')
        : 'neutral';
      
      setSummary({
        text: language === 'FR'
          ? `Les marchés américains affichent un sentiment ${sentimentText}. La volatilité sur 20 jours est à ${risk?.volatility20d?.toFixed(1) || 'N/A'}%. ${events.length > 0 ? `Événement à venir: ${events[0].label}.` : ''}`
          : `US markets show ${sentimentText} sentiment. 20-day volatility at ${risk?.volatility20d?.toFixed(1) || 'N/A'}%. ${events.length > 0 ? `Upcoming: ${events[0].label}.` : ''}`,
        timestamp: new Date().toISOString(),
        engineMode: 'Offline'
      });
    }
    setIsGeneratingSummary(false);
  };

  const handleGeneratePDF = () => {
    alert('PDF generation would call backend /api/report endpoint');
  };

  const handleCreateVideo = () => {
    alert('Video creation would call backend /api/recap endpoint');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
      <HeaderBar
        currentRegion="US"
        marketStatus={snapshot?.status || 'CLOSED'}
        language={language}
        onLanguageChange={setLanguage}
        onSummarize={handleSummarize}
        onGeneratePDF={handleGeneratePDF}
        onCreateVideo={handleCreateVideo}
        engineMode="Polished"
      />

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <h1 className="text-3xl font-bold text-white mb-6">
          {language === 'FR' ? 'Marchés Américains' : 'US Markets'}
        </h1>

        {/* Error Display */}
        {(snapshotsError || newsError || eventsError || riskError) && (
          <div className="space-y-4 mb-6">
            {snapshotsError && (
              <ErrorDisplay error={snapshotsError} onRetry={refetchSnapshots} title="Error Loading Market Data" />
            )}
            {newsError && (
              <ErrorDisplay error={newsError} onRetry={refetchNews} title="Error Loading News" />
            )}
            {eventsError && (
              <ErrorDisplay error={eventsError} onRetry={refetchEvents} title="Error Loading Events" />
            )}
            {riskError && (
              <ErrorDisplay error={riskError} onRetry={refetchRisk} title="Error Loading Risk Metrics" />
            )}
          </div>
        )}

        {/* Loading State */}
        {(isLoadingSnapshots || isLoadingNews || isLoadingEvents || isLoadingRisk) && 
         !snapshotsError && !newsError && !eventsError && !riskError && (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-400">Loading data...</span>
          </div>
        )}

        {/* Summary */}
        {isGeneratingSummary && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Generating AI summary...</p>
          </div>
        )}
        
        {summary && !isGeneratingSummary && (
          <SummaryCard
            summary={summary.text}
            engineMode={summary.engineMode}
            timestamp={summary.timestamp}
            language={language}
          />
        )}

        {/* Events */}
        {events.length > 0 && <EventsStrip events={events} />}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* News - Left Column */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-semibold text-white mb-4">
              {language === 'FR' ? 'Actualités' : 'News & Sentiment'}
            </h2>
            <NewsList news={news} />
          </div>

          {/* Market Data & Risk - Right Columns */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">
                {language === 'FR' ? 'Snapshot du Marché' : 'Market Snapshot'}
              </h2>
              <SnapshotGrid snapshot={snapshot} />
            </div>

            <div>
              <h2 className="text-xl font-semibold text-white mb-4">
                {language === 'FR' ? 'Analyse des Risques' : 'Risk Analysis'}
              </h2>
              <RiskPanelChart riskMetrics={risk} />
            </div>
          </div>
        </div>

        <SourcesFooter
          sources={snapshot?.sources || ['Seed data']}
          lastUpdated={snapshot?.updated_date || new Date().toISOString()}
        />
      </div>
    </div>
  );
}