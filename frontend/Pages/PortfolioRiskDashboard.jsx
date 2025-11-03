import React, { useState, useEffect } from 'react';

import { base44 } from '@/api/base44Client';

import { useQuery } from '@tanstack/react-query';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';

import { Button } from '@/components/ui/button';

import { 

  BarChart3, 

  TrendingDown,

  AlertTriangle,

  Globe,

  Building2,

  DollarSign,
  Lightbulb,
  TrendingUp,
  RefreshCw,
  CheckCircle,
  Loader2,
  ArrowRight,
  Brain

} from 'lucide-react';

import { Link } from 'react-router-dom';

import { createPageUrl } from '@/utils';

import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import ErrorDisplay from '@/components/ErrorDisplay';

import CacheService from '@/services/cacheService';

import { usePortfolio } from '@/contexts/PortfolioContext';



export default function PortfolioRiskDashboard() {
  const { portfolio, updateHoldings } = usePortfolio();
  const [documentAdvice, setDocumentAdvice] = useState(null);
  const [isGettingAdjustments, setIsGettingAdjustments] = useState(false);
  const [adjustmentsResult, setAdjustmentsResult] = useState(null);
  const [adjustmentError, setAdjustmentError] = useState(null);

  // Load document advice from cache
  useEffect(() => {
    const advice = CacheService.getDocumentAdvice();
    if (advice) {
      setDocumentAdvice(advice);
    }
  }, []);

  // Fetch portfolio risk dashboard data from backend
  const { data: riskData, error: riskError, isLoading: isLoadingRisk, refetch: refetchRisk } = useQuery({
    queryKey: ['portfolio-risk-dashboard'],
    queryFn: () => base44.portfolio.getRiskDashboard(),
    initialData: null,
    enabled: true,
  });



  // Extract data from backend response

  // Fallback sector breakdown data if API returns empty
  const defaultSectorBreakdown = [
    { sector: 'Technology', weight: 28.5, avgRisk: 52.3, exposure: 12500000000, stock_count: 45 },
    { sector: 'Healthcare', weight: 15.2, avgRisk: 48.7, exposure: 6800000000, stock_count: 38 },
    { sector: 'Financials', weight: 12.8, avgRisk: 51.2, exposure: 5200000000, stock_count: 32 },
    { sector: 'Consumer Discretionary', weight: 11.5, avgRisk: 49.5, exposure: 4800000000, stock_count: 29 },
    { sector: 'Communication Services', weight: 9.3, avgRisk: 53.8, exposure: 3800000000, stock_count: 23 },
    { sector: 'Industrials', weight: 8.7, avgRisk: 47.9, exposure: 3500000000, stock_count: 22 },
    { sector: 'Consumer Staples', weight: 6.2, avgRisk: 46.5, exposure: 2500000000, stock_count: 16 },
    { sector: 'Energy', weight: 4.1, avgRisk: 54.2, exposure: 1700000000, stock_count: 10 },
    { sector: 'Real Estate', weight: 2.8, avgRisk: 50.1, exposure: 1100000000, stock_count: 7 },
    { sector: 'Utilities', weight: 0.8, avgRisk: 45.8, exposure: 350000000, stock_count: 2 }
  ];

  const portfolioComposition = riskData?.sectorBreakdown?.length > 0 
    ? riskData.sectorBreakdown 
    : defaultSectorBreakdown;

  const geographicRisk = riskData?.geographicRisk || [];

  const highRiskCompanies = riskData?.highRiskCompanies || [];

  const riskTrend = riskData?.riskTrend || [];

  const portfolioRiskSummary = riskData?.portfolioRiskSummary || {};

  const portfolioCompositionData = riskData?.portfolioComposition || {};

  // Find high-risk geographic regions for alerts
  const highRiskRegions = geographicRisk.filter(
    (geo) => geo.riskScore >= 75 && geo.exposure >= 15
  );
  
  const moderateRiskRegions = geographicRisk.filter(
    (geo) => geo.exposure >= 15 && geo.riskScore >= 60 && geo.riskScore < 75
  );



  const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'];



  const getRiskColor = (score) => {

    if (score >= 80) return '#EF4444';

    if (score >= 60) return '#F59E0B';

    if (score >= 40) return '#FBBF24';

    return '#10B981';

  };



  const totalExposure = portfolioRiskSummary?.totalRegulatoryExposure || 0;

  const weightedRisk = portfolioRiskSummary?.weightedRiskScore || 0;

  // Handle portfolio adjustments
  const handleGetPortfolioAdjustments = async () => {
    if (!portfolio || !documentAdvice?.interpretation) {
      setAdjustmentError('Portfolio or document interpretation not available');
      return;
    }

    setIsGettingAdjustments(true);
    setAdjustmentError(null);
    setAdjustmentsResult(null);

    try {
      const result = await base44.portfolio.getPortfolioAdjustments({
        portfolio: portfolio,
        documentAnalysisResult: {
          interpretation: documentAdvice.interpretation
        }
      });

      setAdjustmentsResult(result);

      // Optionally update portfolio weights
      // Uncomment to automatically apply adjustments:
      // const adjustedHoldings = {};
      // Object.entries(result.adjustedWeights).forEach(([ticker, weight]) => {
      //   adjustedHoldings[ticker] = weight / 100; // Convert percentage to decimal
      // });
      // updateHoldings(adjustedHoldings);

    } catch (err) {
      console.error('Error getting portfolio adjustments:', err);
      setAdjustmentError(err.message || 'Error calculating portfolio adjustments');
    } finally {
      setIsGettingAdjustments(false);
    }
  };



  return (

    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-6">

      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}

        <div className="flex items-center justify-between">

          <div>

            <h1 className="text-3xl font-bold text-white flex items-center gap-3">

              <BarChart3 className="w-8 h-8 text-green-400" />

              S&P 500 Portfolio Risk Dashboard

            </h1>

            <p className="text-gray-400 mt-1">Aggregate regulatory impact and risk concentration analysis</p>

          </div>

          <Link to={createPageUrl('Home')}>

            <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">

              Back to Home

            </Button>

          </Link>

        </div>



        {/* Error Display */}
        {riskError && (
          <ErrorDisplay error={riskError} onRetry={refetchRisk} title="Error Loading Risk Dashboard Data" />
        )}

        {/* Document Interpretation Section */}
        {documentAdvice && documentAdvice.interpretation && (
          <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-blue-400" />
                Document Interpretation (NLP Analysis)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Summary */}
              <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                <h3 className="text-white font-semibold mb-2">Summary</h3>
                <p className="text-gray-300">{documentAdvice.interpretation.summary}</p>
              </div>

              {/* Key Themes */}
              {documentAdvice.interpretation.key_themes && documentAdvice.interpretation.key_themes.length > 0 && (
                <div>
                  <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    Key Themes
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {documentAdvice.interpretation.key_themes.map((theme, idx) => (
                      <Badge key={idx} variant="outline" className="border-blue-600 text-blue-300">
                        {theme}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Portfolio Implications */}
              <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                <h3 className="text-white font-semibold mb-2">Portfolio Implications</h3>
                <p className="text-gray-300">{documentAdvice.interpretation.portfolio_implications}</p>
              </div>

              {/* Risk Assessment */}
              {documentAdvice.interpretation.risk_assessment && (
                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-semibold">Risk Assessment</h3>
                    <Badge 
                      variant="outline" 
                      className={
                        documentAdvice.interpretation.risk_assessment.toLowerCase().includes('high') ? 'border-red-600 text-red-300' :
                        documentAdvice.interpretation.risk_assessment.toLowerCase().includes('medium') ? 'border-yellow-600 text-yellow-300' :
                        'border-green-600 text-green-300'
                      }
                    >
                      {documentAdvice.interpretation.risk_assessment}
                    </Badge>
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {documentAdvice.interpretation.recommendations && documentAdvice.interpretation.recommendations.length > 0 && (
                <div>
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    Recommendations
                  </h3>
                  <div className="space-y-2">
                    {documentAdvice.interpretation.recommendations.map((rec, idx) => (
                      <div key={idx} className="bg-gray-900/50 p-3 rounded border border-green-700/30">
                        <p className="text-sm text-gray-300">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Get Portfolio Adjustments Button */}
              <div className="pt-4 border-t border-gray-700">
                <Button
                  onClick={handleGetPortfolioAdjustments}
                  disabled={isGettingAdjustments || !portfolio || !documentAdvice.interpretation}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                >
                  {isGettingAdjustments ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating Adjustments & Suggestions...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2" />
                      Get Portfolio Adjustments & NLP Suggestions
                    </>
                  )}
                </Button>
                {adjustmentError && (
                  <p className="text-sm text-red-300 mt-2">{adjustmentError}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Portfolio Adjustments Result */}
        {adjustmentsResult && (
          <Card className="bg-gradient-to-br from-green-900/20 to-blue-900/20 border-green-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Portfolio Adjustments Calculated
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* NLP Suggestions - Display First and Prominently */}
              {adjustmentsResult.suggestions && adjustmentsResult.suggestions.length > 0 && (
                <div className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border-2 border-purple-700/50 rounded-lg p-5">
                  <h4 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                    <Brain className="w-6 h-6 text-purple-400" />
                    NLP-Based Strategic Suggestions
                  </h4>
                  <div className="space-y-3">
                    {adjustmentsResult.suggestions.map((suggestion, idx) => (
                      <div key={idx} className="bg-gray-900/80 p-4 rounded-lg border border-purple-700/60 shadow-lg">
                        <div className="flex items-start gap-3">
                          <Lightbulb className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                          <p className="text-base text-gray-100 leading-relaxed font-medium">{suggestion}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Market Risk</p>
                    <p className="text-2xl font-bold text-white">
                      {adjustmentsResult.summary.marketRiskAssessment || 'Medium'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Adjustment Strategy</p>
                    <p className="text-2xl font-bold text-green-400">
                      {adjustmentsResult.summary.adjustmentStrategy || 'Maintain'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Positions Adjusted</p>
                    <p className="text-2xl font-bold text-blue-400">
                      {adjustmentsResult.summary.numAdjustments || 0}
                    </p>
                  </div>
                </div>
                {adjustmentsResult.summary.sectorsAffected && adjustmentsResult.summary.sectorsAffected.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <p className="text-xs text-gray-400 mb-2">Sectors Affected</p>
                    <div className="flex flex-wrap gap-2">
                      {adjustmentsResult.summary.sectorsAffected.map((sector, idx) => (
                        <Badge key={idx} variant="outline" className="border-purple-600 text-purple-300">
                          {sector}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Top Adjustments */}
              {adjustmentsResult.adjustments && adjustmentsResult.adjustments.length > 0 && (
                <div>
                  <h4 className="text-white font-semibold mb-3">Top Adjustments</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {adjustmentsResult.adjustments.slice(0, 10).map((adj, idx) => (
                      <div key={idx} className="bg-gray-900/50 p-3 rounded border border-gray-700">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-white">{adj.ticker}</span>
                            {adj.riskScore && (
                              <Badge variant="outline" className="border-gray-600 text-gray-300">
                                Risk: {adj.riskScore.toFixed(1)}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-xs text-gray-400">Current</p>
                              <p className="text-sm text-white">{adj.currentWeight.toFixed(2)}%</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-500" />
                            <div className="text-right">
                              <p className="text-xs text-gray-400">Adjusted</p>
                              <p className={`text-sm font-bold ${
                                adj.adjustment > 0 ? 'text-green-400' : 'text-red-400'
                              }`}>
                                {adj.adjustedWeight.toFixed(2)}%
                              </p>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={
                                adj.adjustment > 0 ? 'border-green-600 text-green-300' : 'border-red-600 text-red-300'
                              }
                            >
                              {adj.adjustment > 0 ? '+' : ''}{adj.adjustment.toFixed(2)}%
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{adj.reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Apply Adjustments Button */}
              <div className="pt-4 border-t border-gray-700">
                <Button
                  onClick={() => {
                    if (adjustmentsResult.adjustedWeights) {
                      const adjustedHoldings = {};
                      Object.entries(adjustmentsResult.adjustedWeights).forEach(([ticker, weight]) => {
                        adjustedHoldings[ticker] = weight / 100; // Convert percentage to decimal
                      });
                      updateHoldings(adjustedHoldings);
                      setAdjustmentsResult(null);
                      alert('Portfolio weights have been updated!');
                    }
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Apply Adjustments to Portfolio
                </Button>
              </div>
            </CardContent>
          </Card>
        )}



        {/* Loading State */}

        {isLoadingRisk && !riskError && (

          <div className="flex items-center justify-center p-8">

            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>

            <span className="ml-3 text-gray-400">Loading portfolio risk data...</span>

          </div>

        )}






        {/* Portfolio Overview */}

        <Card className="bg-gradient-to-br from-red-900/20 to-orange-900/20 border-red-500/30">

          <CardHeader>

            <CardTitle className="text-white">Portfolio Risk Summary</CardTitle>

          </CardHeader>

          <CardContent>

            <div className="grid md:grid-cols-4 gap-4">

              <div className="bg-gray-900/50 p-4 rounded-lg">

                <p className="text-xs text-gray-400 mb-1">Total Regulatory Exposure</p>

                <p className="text-3xl font-bold text-red-400">${(totalExposure / 1000000000).toFixed(1)}B</p>

                <p className="text-xs text-gray-500 mt-1">
                  {portfolioCompositionData?.totalStocks ? 
                    `${((totalExposure / 1000000000) / (portfolioCompositionData.totalStocks * portfolioCompositionData.equalWeight * 1000000 / 1000)) * 100 || 0}% of portfolio value` 
                    : 'Calculating...'}
                </p>

              </div>

              <div className="bg-gray-900/50 p-4 rounded-lg">

                <p className="text-xs text-gray-400 mb-1">Weighted Risk Score</p>

                <p className="text-3xl font-bold text-orange-400">{weightedRisk.toFixed(0)}</p>

                <p className="text-xs text-gray-500 mt-1">Above threshold (60)</p>

              </div>

              <div className="bg-gray-900/50 p-4 rounded-lg">

                <p className="text-xs text-gray-400 mb-1">High Risk Companies</p>

                <p className="text-3xl font-bold text-white">{portfolioRiskSummary?.highRiskCompanies || highRiskCompanies.length}</p>

                <p className="text-xs text-gray-500 mt-1">Risk score ≥ 75</p>

              </div>

              <div className="bg-gray-900/50 p-4 rounded-lg">

                <p className="text-xs text-gray-400 mb-1">Risk Trend (3M)</p>

                <p className="text-3xl font-bold text-green-400">
                  {portfolioRiskSummary?.riskTrendPercentage !== undefined 
                    ? `${portfolioRiskSummary.riskTrendPercentage > 0 ? '+' : ''}${portfolioRiskSummary.riskTrendPercentage.toFixed(1)}%`
                    : '--'}
                </p>

                <p className="text-xs text-gray-500 mt-1">
                  {portfolioRiskSummary?.riskTrendPercentage > 0 ? 'Increasing exposure' : portfolioRiskSummary?.riskTrendPercentage < 0 ? 'Decreasing exposure' : 'Stable'}
                </p>

              </div>

            </div>

          </CardContent>

        </Card>



        {/* Sector Risk Concentration */}

        <div className="grid lg:grid-cols-2 gap-6">

          <Card className="bg-gray-800/50 border-gray-700">

            <CardHeader>

              <CardTitle className="text-white flex items-center gap-2">

                <Building2 className="w-5 h-5 text-blue-400" />

                Sector Risk Concentration

              </CardTitle>

            </CardHeader>

            <CardContent>

              <ResponsiveContainer width="100%" height={300}>

                <BarChart data={portfolioComposition}>

                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />

                  <XAxis dataKey="sector" stroke="#9CA3AF" angle={-45} textAnchor="end" height={100} fontSize={11} />

                  <YAxis stroke="#9CA3AF" />

                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />

                  <Bar dataKey="avgRisk" fill="#F59E0B" name="Avg Risk Score">

                    {portfolioComposition.map((entry, index) => (

                      <Cell key={`cell-${index}`} fill={getRiskColor(entry.avgRisk)} />

                    ))}

                  </Bar>

                </BarChart>

              </ResponsiveContainer>

            </CardContent>

          </Card>



          <Card className="bg-gray-800/50 border-gray-700">

            <CardHeader>

              <CardTitle className="text-white flex items-center gap-2">

                <DollarSign className="w-5 h-5 text-green-400" />

                Sector Exposure Distribution

              </CardTitle>

            </CardHeader>

            <CardContent>

              <ResponsiveContainer width="100%" height={300}>

                <PieChart>

                  <Pie

                    data={portfolioComposition}

                    cx="50%"

                    cy="50%"

                    labelLine={false}

                    label={({ sector, weight }) => `${sector}: ${weight}%`}

                    outerRadius={100}

                    fill="#8884d8"

                    dataKey="weight"

                  >

                    {portfolioComposition.map((entry, index) => (

                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />

                    ))}

                  </Pie>

                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />

                </PieChart>

              </ResponsiveContainer>

            </CardContent>

          </Card>

        </div>



        {/* Geographic Risk */}

        <Card className="bg-gray-800/50 border-gray-700">

          <CardHeader>

            <CardTitle className="text-white flex items-center gap-2">

              <Globe className="w-5 h-5 text-purple-400" />

              Geographic Risk Concentration

            </CardTitle>

          </CardHeader>

          <CardContent>

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-gray-900 border-b border-gray-700">

                  <tr>

                    <th className="text-left p-3 text-gray-400 font-semibold">REGION</th>

                    <th className="text-right p-3 text-gray-400 font-semibold">EXPOSURE %</th>

                    <th className="text-right p-3 text-gray-400 font-semibold">RISK SCORE</th>

                    <th className="text-center p-3 text-gray-400 font-semibold">RISK LEVEL</th>

                    <th className="text-right p-3 text-gray-400 font-semibold">RISK BAR</th>

                  </tr>

                </thead>

                <tbody>

                  {geographicRisk.map((geo, idx) => (

                    <tr key={idx} className="border-b border-gray-800 hover:bg-gray-700/50">

                      <td className="p-3 font-semibold text-white">{geo.region}</td>

                      <td className="p-3 text-right font-mono text-white">{geo.exposure}%</td>

                      <td className="p-3 text-right">

                        <span className="text-xl font-bold" style={{ color: getRiskColor(geo.riskScore) }}>

                          {geo.riskScore}

                        </span>

                      </td>

                      <td className="p-3 text-center">

                        <Badge style={{ backgroundColor: getRiskColor(geo.riskScore) }}>

                          {geo.riskScore >= 80 ? 'Critical' : geo.riskScore >= 60 ? 'High' : geo.riskScore >= 40 ? 'Medium' : 'Low'}

                        </Badge>

                      </td>

                      <td className="p-3">

                        <div className="w-full bg-gray-700 rounded-full h-2">

                          <div 

                            className="h-2 rounded-full" 

                            style={{ 

                              width: `${geo.riskScore}%`,

                              backgroundColor: getRiskColor(geo.riskScore)

                            }}

                          />

                        </div>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>



            {/* High Risk Alerts */}
            {highRiskRegions.map((geo) => (
              <div key={geo.region} className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-300">
                  <AlertTriangle className="w-4 h-4 inline mr-1" />
                  <strong>High Risk Alert:</strong> {geo.region} exposure ({geo.exposure}%) carries risk score of {geo.riskScore.toFixed(0)}. 
                  {geo.exposure >= 15 && (
                    <> Recommend reducing to below 15% through sector rotation.</>
                  )}
                </p>
              </div>
            ))}

            {/* Moderate Risk Warnings */}
            {highRiskRegions.length === 0 && moderateRiskRegions.map((geo) => (
              <div key={geo.region} className="mt-4 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                <p className="text-sm text-yellow-300">
                  <AlertTriangle className="w-4 h-4 inline mr-1" />
                  <strong>Moderate Risk Warning:</strong> {geo.region} exposure ({geo.exposure}%) has risk score of {geo.riskScore.toFixed(0)}. 
                  Monitor exposure levels.
                </p>
              </div>
            ))}

          </CardContent>

        </Card>



        {/* High Risk Companies */}

        <Card className="bg-gray-800/50 border-gray-700">

          <CardHeader>

            <CardTitle className="text-white flex items-center gap-2">

              <AlertTriangle className="w-5 h-5 text-red-400" />

              Highest Risk Companies (Top 5)

            </CardTitle>

          </CardHeader>

          <CardContent>

            <div className="space-y-3">

              {highRiskCompanies.map((company, idx) => (

                <div key={idx} className="p-4 bg-gray-900/50 rounded-lg border border-red-500/30">

                  <div className="flex items-center justify-between">

                    <div className="flex items-center gap-3">

                      <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold">

                        {idx + 1}

                      </div>

                      <div>

                        <p className="font-mono font-bold text-white">{company.ticker}</p>

                        <p className="text-sm text-gray-400">{company.name}</p>

                      </div>

                    </div>

                    <div className="flex items-center gap-6">

                      <div className="text-right">

                        <p className="text-xs text-gray-400">Risk Score</p>

                        <p className="text-2xl font-bold text-red-400">{company.riskScore}</p>

                      </div>

                      <div className="text-right">

                        <p className="text-xs text-gray-400">Exposure</p>

                        <p className="text-xl font-bold text-white">${(company.exposure / 1000000000).toFixed(1)}B</p>

                      </div>

                      <Link to={createPageUrl('CompanyImpactAssessment')}>

                        <Button size="sm" variant="outline" className="border-blue-600 text-blue-400 hover:bg-blue-900/30">

                          View Details

                        </Button>

                      </Link>

                    </div>

                  </div>

                </div>

              ))}

            </div>

          </CardContent>

        </Card>



        {/* Portfolio Risk Trend */}

        <Card className="bg-gray-800/50 border-gray-700">

          <CardHeader>

            <CardTitle className="text-white flex items-center gap-2">

              <TrendingDown className="w-5 h-5 text-yellow-400" />

              Portfolio Risk Trend (12M)

            </CardTitle>

          </CardHeader>

          <CardContent>

            <ResponsiveContainer width="100%" height={300}>

              <LineChart data={riskTrend}>

                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />

                <XAxis dataKey="month" stroke="#9CA3AF" />

                <YAxis stroke="#9CA3AF" domain={[0, 100]} />

                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />

                <Legend />

                <Line type="monotone" dataKey="portfolioRisk" stroke="#F59E0B" strokeWidth={3} name="Portfolio Risk Score" />

                <Line type="monotone" dataKey="benchmark" stroke="#6B7280" strokeDasharray="5 5" name="Benchmark (50)" />

              </LineChart>

            </ResponsiveContainer>

          </CardContent>

        </Card>



        {/* Action Buttons */}

        <Card className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 border-blue-500/30">

          <CardContent className="p-6">

            <h3 className="text-xl font-bold text-white mb-4">Recommended Actions</h3>

            <div className="grid md:grid-cols-3 gap-4">

              <Link to={createPageUrl('ScenarioSimulator')} className="block">

                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white" size="lg">

                  Run Scenario Analysis

                </Button>

              </Link>

              <Link to={createPageUrl('RecommendationsEngine')} className="block">

                <Button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white" size="lg">

                  Get Portfolio Adjustments

                </Button>

              </Link>

              <Button className="w-full bg-gray-700 hover:bg-gray-600 text-white" size="lg">

                Export Risk Report (PDF)

              </Button>

            </div>

          </CardContent>

        </Card>

      </div>

    </div>

  );

}
