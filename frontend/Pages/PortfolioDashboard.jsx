import React, { useState } from 'react';
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
  DollarSign
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ErrorDisplay from '@/components/ErrorDisplay';

export default function PortfolioDashboard() {
  // Fetch SP500 portfolio data from backend
  const { data: portfolioData, error: portfolioError, isLoading: isLoadingPortfolio, refetch: refetchPortfolio } = useQuery({
    queryKey: ['sp500-portfolio'],
    queryFn: () => base44.regulatory.getSP500Portfolio(),
    initialData: null,
  });

  // Default fallback data
  const defaultPortfolioComposition = [
    { sector: 'Technology', weight: 28.5, avgRisk: 68, exposure: 24500000000 },
    { sector: 'Healthcare', weight: 13.2, avgRisk: 72, exposure: 11200000000 },
    { sector: 'Financial', weight: 11.8, avgRisk: 42, exposure: 4800000000 },
    { sector: 'Consumer Discretionary', weight: 10.9, avgRisk: 55, exposure: 7200000000 },
    { sector: 'Industrials', weight: 9.1, avgRisk: 58, exposure: 5900000000 },
    { sector: 'Communication', weight: 8.7, avgRisk: 75, exposure: 8100000000 },
    { sector: 'Consumer Staples', weight: 6.5, avgRisk: 38, exposure: 2200000000 },
    { sector: 'Energy', weight: 4.3, avgRisk: 65, exposure: 4500000000 },
    { sector: 'Utilities', weight: 3.2, avgRisk: 35, exposure: 1800000000 },
    { sector: 'Real Estate', weight: 2.8, avgRisk: 42, exposure: 1600000000 }
  ];

  // Use fetched data or fallback to defaults
  const portfolioComposition = portfolioData?.sectorBreakdown || portfolioData?.sectors || defaultPortfolioComposition;

  // Geographic Exposure
  const defaultGeographicRisk = [
    { region: 'USA', exposure: 55, riskScore: 48 },
    { region: 'China', exposure: 18, riskScore: 82 },
    { region: 'Europe', exposure: 15, riskScore: 55 },
    { region: 'Asia (ex-China)', exposure: 8, riskScore: 62 },
    { region: 'Other', exposure: 4, riskScore: 45 }
  ];

  const geographicRisk = portfolioData?.geographicRisk || portfolioData?.geographicExposure || defaultGeographicRisk;

  // High Risk Companies
  const defaultHighRiskCompanies = [
    { ticker: 'JNJ', name: 'Johnson & Johnson', riskScore: 92, exposure: 8500000000 },
    { ticker: 'META', name: 'Meta Platforms', riskScore: 88, exposure: 6800000000 },
    { ticker: 'TSLA', name: 'Tesla Inc.', riskScore: 85, exposure: 8500000000 },
    { ticker: 'GOOGL', name: 'Alphabet Inc.', riskScore: 82, exposure: 5900000000 },
    { ticker: 'NVDA', name: 'NVIDIA Corp.', riskScore: 78, exposure: 3800000000 }
  ];

  const highRiskCompanies = portfolioData?.highRiskCompanies || portfolioData?.topRiskHoldings || defaultHighRiskCompanies;

  // Portfolio Risk Trend (12M)
  const defaultRiskTrend = Array.from({ length: 12 }, (_, i) => ({
    month: `M${i + 1}`,
    portfolioRisk: 55 + Math.random() * 10,
    benchmark: 50
  }));

  const riskTrend = portfolioData?.riskTrend || portfolioData?.historicalRisk || defaultRiskTrend;

  const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'];

  const getRiskColor = (score) => {
    if (score >= 80) return '#EF4444';
    if (score >= 60) return '#F59E0B';
    if (score >= 40) return '#FBBF24';
    return '#10B981';
  };

  const totalExposure = portfolioComposition.reduce((sum, s) => sum + s.exposure, 0);
  const weightedRisk = portfolioComposition.reduce((sum, s) => sum + (s.avgRisk * s.weight / 100), 0);

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
        {portfolioError && (
          <ErrorDisplay error={portfolioError} onRetry={refetchPortfolio} title="Error Loading Portfolio Data" />
        )}

        {/* Loading State */}
        {isLoadingPortfolio && !portfolioError && (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            <span className="ml-3 text-gray-400">Loading portfolio data...</span>
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
                <p className="text-xs text-gray-500 mt-1">12.8% of portfolio value</p>
              </div>
              <div className="bg-gray-900/50 p-4 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Weighted Risk Score</p>
                <p className="text-3xl font-bold text-orange-400">{weightedRisk.toFixed(0)}</p>
                <p className="text-xs text-gray-500 mt-1">Above threshold (60)</p>
              </div>
              <div className="bg-gray-900/50 p-4 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">High Risk Companies</p>
                <p className="text-3xl font-bold text-white">{highRiskCompanies.length}</p>
                <p className="text-xs text-gray-500 mt-1">Risk score ≥ 75</p>
              </div>
              <div className="bg-gray-900/50 p-4 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Risk Trend (3M)</p>
                <p className="text-3xl font-bold text-green-400">+8.2%</p>
                <p className="text-xs text-gray-500 mt-1">Increasing exposure</p>
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

            <div className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-300">
                <AlertTriangle className="w-4 h-4 inline mr-1" />
                <strong>High Risk Alert:</strong> China exposure (18%) carries risk score of 82. Recommend reducing to below 15% through sector rotation.
              </p>
            </div>
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
              <Button className="w-full bg-red-600 hover:bg-red-700 text-white" size="lg">
                Export Risk Report (PDF)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}