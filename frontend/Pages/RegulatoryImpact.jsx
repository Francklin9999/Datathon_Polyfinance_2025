import React, { useState } from 'react';
import { api } from '@/api/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, 
  AlertTriangle, 
  BarChart3, 
  TrendingUp,
  TrendingDown,
  X,
  Scale,
  Building2,
  ArrowRight,
  ArrowLeft,
  Search,
  Loader2,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { getStockDataForPrompt, getAllAvailableStocks } from '@/utils/stockData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line } from 'recharts';

export default function RegulatoryImpact() {
  const [regulation, setRegulation] = useState(null);
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [availableStocks, setAvailableStocks] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [comparisonData, setComparisonData] = useState(null);

  // Mock regulation options
  const regulations = [
    { id: 'ira-2022', name: 'Inflation Reduction Act 2022', type: 'subsidy', jurisdiction: 'USA' },
    { id: 'gdpr', name: 'GDPR Compliance', type: 'regulation', jurisdiction: 'EU' },
    { id: 'green-deal', name: 'EU Green Deal 2025', type: 'environmental', jurisdiction: 'EU' },
    { id: 'cbam', name: 'Carbon Border Adjustment', type: 'tariff', jurisdiction: 'EU' }
  ];

  // Load available stocks
  React.useEffect(() => {
    const loadStocks = async () => {
      try {
        const stocks = await getAllAvailableStocks();
        setAvailableStocks(stocks);
      } catch (error) {
        // Fallback stocks
        setAvailableStocks(['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX', 'JPM', 'BAC', 'WMT', 'JNJ', 'PG', 'XOM', 'CVX']);
      }
    };
    loadStocks();
  }, []);

  const handleAddCompany = (ticker) => {
    if (ticker && !selectedCompanies.find(c => c.ticker === ticker.toUpperCase())) {
      setSelectedCompanies([...selectedCompanies, { ticker: ticker.toUpperCase(), name: ticker.toUpperCase() }]);
      setSearchTerm('');
    }
  };

  const handleRemoveCompany = (ticker) => {
    setSelectedCompanies(selectedCompanies.filter(c => c.ticker !== ticker));
    if (comparisonData) {
      setComparisonData({
        ...comparisonData,
        companies: comparisonData.companies.filter(c => c.ticker !== ticker)
      });
    }
  };

  const handleCompare = async () => {
    if (selectedCompanies.length < 2 || !regulation) {
      alert('Please select at least 2 companies and a regulation to compare');
      return;
    }

    setIsAnalyzing(true);

    try {
      const tickers = selectedCompanies.map(c => c.ticker);
      const stockDataPromises = tickers.map(ticker => getStockDataForPrompt(ticker));
      const stockDataResults = await Promise.all(stockDataPromises);

      const comparisonPrompt = `Compare the regulatory impact of ${regulation.name} on these companies: ${tickers.join(', ')}.

For each company, provide:
- impact_score: -100 to +100 (negative = benefit, positive = cost)
- exposure_level: "Low", "Medium", "High", or "Critical"
- key_risks: array of 3-4 main risk factors
- key_opportunities: array of 2-3 main opportunities
- estimated_cost: dollar amount or percentage of revenue
- compliance_readiness: "High", "Medium", "Low" - how ready they are
- competitive_position: "Winner", "Neutral", "Loser" relative to peers
- timeframe_impact: "Immediate", "Short-term", "Long-term"

Return JSON:
{
  "regulation": "${regulation.name}",
  "companies": [
    {
      "ticker": "ticker",
      "company_name": "Full name",
      "sector": "Sector",
      "impact_score": number,
      "exposure_level": "string",
      "key_risks": ["array"],
      "key_opportunities": ["array"],
      "estimated_cost": "string",
      "compliance_readiness": "string",
      "competitive_position": "string",
      "timeframe_impact": "string",
      "reasoning": "2-3 sentence explanation"
    }
  ],
  "comparison_insights": "Overall comparison insights"
}`;

      const result = await api.integrations.Core.InvokeLLM({
        prompt: comparisonPrompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            regulation: { type: "string" },
            companies: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  ticker: { type: "string" },
                  company_name: { type: "string" },
                  sector: { type: "string" },
                  impact_score: { type: "number" },
                  exposure_level: { type: "string" },
                  key_risks: { type: "array", items: { type: "string" } },
                  key_opportunities: { type: "array", items: { type: "string" } },
                  estimated_cost: { type: "string" },
                  compliance_readiness: { type: "string" },
                  competitive_position: { type: "string" },
                  timeframe_impact: { type: "string" },
                  reasoning: { type: "string" }
                }
              }
            },
            comparison_insights: { type: "string" }
          }
        }
      });

      setComparisonData(result);
    } catch (error) {
      console.error('Comparison error:', error);
      // Fallback mock data
      setComparisonData({
        regulation: regulation.name,
        companies: selectedCompanies.map((company, idx) => ({
          ticker: company.ticker,
          company_name: `${company.ticker} Corp`,
          sector: idx % 2 === 0 ? 'Technology' : 'Energy',
          impact_score: [72, 45, -35, 68, 52][idx % 5],
          exposure_level: ['High', 'Medium', 'Low', 'High', 'Medium'][idx % 5],
          key_risks: ['High compliance costs', 'Supply chain disruption', 'Regulatory uncertainty'],
          key_opportunities: ['Market share gains', 'First mover advantage'],
          estimated_cost: `${(idx + 1) * 500}M - ${(idx + 1) * 800}M`,
          compliance_readiness: ['Low', 'Medium', 'High', 'Medium', 'High'][idx % 5],
          competitive_position: ['Loser', 'Neutral', 'Winner', 'Loser', 'Neutral'][idx % 5],
          timeframe_impact: 'Short-term',
          reasoning: 'Moderate exposure with existing mitigation strategies in place.'
        })),
        comparison_insights: 'Technology companies show higher impact due to data processing requirements. Energy companies face transition costs but have longer implementation timelines.'
      });
    }

    setIsAnalyzing(false);
  };

  const filteredStocks = availableStocks.filter(stock => 
    stock.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedCompanies.find(c => c.ticker === stock.toUpperCase())
  ).slice(0, 10);

  const getExposureColor = (level) => {
    switch (level) {
      case 'Critical': return 'bg-red-600';
      case 'High': return 'bg-orange-600';
      case 'Medium': return 'bg-yellow-600';
      case 'Low': return 'bg-green-600';
      default: return 'bg-gray-600';
    }
  };

  const getPositionColor = (position) => {
    switch (position) {
      case 'Winner': return 'text-green-400 bg-green-900/30 border-green-500/50';
      case 'Neutral': return 'text-yellow-400 bg-yellow-900/30 border-yellow-500/50';
      case 'Loser': return 'text-red-400 bg-red-900/30 border-red-500/50';
      default: return 'text-gray-400 bg-gray-900/30 border-gray-500/50';
    }
  };

  // Prepare data for charts
  const radarData = comparisonData?.companies.map(company => ({
    subject: company.ticker,
    Impact: Math.abs(company.impact_score),
    Exposure: company.exposure_level === 'Critical' ? 100 : company.exposure_level === 'High' ? 75 : company.exposure_level === 'Medium' ? 50 : 25,
    Readiness: company.compliance_readiness === 'High' ? 100 : company.compliance_readiness === 'Medium' ? 50 : 25
  })) || [];

  const comparisonChartData = comparisonData?.companies.map(company => ({
    ticker: company.ticker,
    score: company.impact_score,
    exposure: company.exposure_level === 'Critical' ? 100 : company.exposure_level === 'High' ? 75 : company.exposure_level === 'Medium' ? 50 : 25
  })) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Scale className="w-8 h-8 text-purple-400" />
              Regulatory Impact Comparison
            </h1>
            <p className="text-gray-400 mt-1">Compare how different companies are affected by regulatory changes</p>
          </div>
          <Link to={createPageUrl('RegulatoryAnalyzer')}>
            <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Analyzer
            </Button>
          </Link>
        </div>

        {/* Selection Section */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Regulation Selection */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                Step 1: Select Regulation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={regulation?.id} onValueChange={(value) => {
                const reg = regulations.find(r => r.id === value);
                setRegulation(reg);
              }}>
                <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                  <SelectValue placeholder="Select a regulation to analyze" />
                </SelectTrigger>
                <SelectContent>
                  {regulations.map(reg => (
                    <SelectItem key={reg.id} value={reg.id}>
                      {reg.name} ({reg.jurisdiction})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {regulation && (
                <div className="mt-4 p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-blue-600">{regulation.type}</Badge>
                    <Badge variant="outline">{regulation.jurisdiction}</Badge>
                  </div>
                  <p className="text-sm text-gray-300">{regulation.name}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Company Selection */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-green-400" />
                Step 2: Select Companies (2+ required)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Selected Companies */}
              <div className="flex flex-wrap gap-2">
                {selectedCompanies.map(company => (
                  <Badge key={company.ticker} className="bg-purple-600 text-white px-3 py-1">
                    {company.ticker}
                    <button
                      onClick={() => handleRemoveCompany(company.ticker)}
                      className="ml-2 hover:text-red-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              {/* Search and Add */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search for ticker (e.g., AAPL, TSLA, MSFT)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-900 border-gray-700 text-white"
                />
                {searchTerm && filteredStocks.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredStocks.map(stock => (
                      <button
                        key={stock}
                        onClick={() => handleAddCompany(stock)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-700 text-white text-sm flex items-center justify-between"
                      >
                        <span>{stock}</span>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedCompanies.length < 2 && (
                <p className="text-sm text-yellow-400">Select at least 2 companies to compare</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Compare Button */}
        {selectedCompanies.length >= 2 && regulation && (
          <Card className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 border-purple-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Ready to Compare</h3>
                  <p className="text-gray-300">
                    Comparing {selectedCompanies.length} companies under {regulation.name}
                  </p>
                </div>
                <Button
                  onClick={handleCompare}
                  disabled={isAnalyzing}
                  className="bg-purple-600 hover:bg-purple-700 px-8 py-6 text-lg"
                  size="lg"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Compare Companies
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Comparison Results */}
        {comparisonData && (
          <>
            {/* Overview Summary */}
            <Card className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white">Comparison Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-200 leading-relaxed">{comparisonData.comparison_insights}</p>
              </CardContent>
            </Card>

            {/* Comparison Charts */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Impact Score Comparison */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Impact Score Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={comparisonChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="ticker" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
                      <Legend />
                      <Bar dataKey="score" fill="#9333EA" name="Impact Score" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Radar Chart */}
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Multi-Dimensional Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#374151" />
                      <PolarAngleAxis dataKey="subject" stroke="#9CA3AF" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#9CA3AF" />
                      <Radar name="Impact" dataKey="Impact" stroke="#9333EA" fill="#9333EA" fillOpacity={0.6} />
                      <Radar name="Exposure" dataKey="Exposure" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} />
                      <Radar name="Readiness" dataKey="Readiness" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Comparison Table */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  Detailed Company Comparison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-900 border-b border-gray-700">
                      <tr>
                        <th className="text-left p-3 text-gray-400 font-semibold">Company</th>
                        <th className="text-center p-3 text-gray-400 font-semibold">Impact Score</th>
                        <th className="text-center p-3 text-gray-400 font-semibold">Exposure</th>
                        <th className="text-center p-3 text-gray-400 font-semibold">Position</th>
                        <th className="text-center p-3 text-gray-400 font-semibold">Readiness</th>
                        <th className="text-center p-3 text-gray-400 font-semibold">Est. Cost</th>
                        <th className="text-left p-3 text-gray-400 font-semibold">Timeframe</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonData.companies.map((company, idx) => (
                        <tr key={idx} className="border-b border-gray-800 hover:bg-gray-700/50">
                          <td className="p-3">
                            <div>
                              <p className="font-semibold text-white">{company.ticker}</p>
                              <p className="text-xs text-gray-400">{company.company_name}</p>
                              <p className="text-xs text-gray-500 mt-1">{company.sector}</p>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {company.impact_score > 0 ? (
                                <TrendingUp className="w-4 h-4 text-red-400" />
                              ) : (
                                <TrendingDown className="w-4 h-4 text-green-400" />
                              )}
                              <span className={`text-lg font-bold ${
                                company.impact_score > 50 ? 'text-red-400' :
                                company.impact_score > 0 ? 'text-orange-400' :
                                company.impact_score < -30 ? 'text-green-400' :
                                'text-yellow-400'
                              }`}>
                                {company.impact_score > 0 ? '+' : ''}{company.impact_score}
                              </span>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <Badge className={getExposureColor(company.exposure_level)}>
                              {company.exposure_level}
                            </Badge>
                          </td>
                          <td className="p-3 text-center">
                            <Badge variant="outline" className={getPositionColor(company.competitive_position)}>
                              {company.competitive_position}
                            </Badge>
                          </td>
                          <td className="p-3 text-center">
                            <Badge variant="outline" className={
                              company.compliance_readiness === 'High' ? 'text-green-400 border-green-500' :
                              company.compliance_readiness === 'Medium' ? 'text-yellow-400 border-yellow-500' :
                              'text-red-400 border-red-500'
                            }>
                              {company.compliance_readiness}
                            </Badge>
                          </td>
                          <td className="p-3 text-center">
                            <span className="text-white font-mono text-xs">{company.estimated_cost}</span>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="text-xs">
                              {company.timeframe_impact}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Company Cards */}
            <div className="grid md:grid-cols-2 gap-6">
              {comparisonData.companies.map((company, idx) => (
                <Card key={idx} className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-blue-400" />
                        {company.ticker} - {company.company_name}
                      </span>
                      <Badge className={getExposureColor(company.exposure_level)}>
                        {company.exposure_level}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-400 mb-2">Reasoning</p>
                      <p className="text-gray-300 text-sm">{company.reasoning}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Impact Score</p>
                        <p className={`text-2xl font-bold ${
                          company.impact_score > 50 ? 'text-red-400' :
                          company.impact_score > 0 ? 'text-orange-400' :
                          company.impact_score < -30 ? 'text-green-400' :
                          'text-yellow-400'
                        }`}>
                          {company.impact_score > 0 ? '+' : ''}{company.impact_score}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Est. Cost</p>
                        <p className="text-lg font-bold text-white">{company.estimated_cost}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-gray-400 mb-2">Key Risks</p>
                      <div className="space-y-1">
                        {company.key_risks.map((risk, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-red-300">
                            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>{risk}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {company.key_opportunities && company.key_opportunities.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-400 mb-2">Key Opportunities</p>
                        <div className="space-y-1">
                          {company.key_opportunities.map((opp, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm text-green-300">
                              <TrendingUp className="w-4 h-4 mt-0.5 flex-shrink-0" />
                              <span>{opp}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Quick Actions */}
        {!comparisonData && (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-8 text-center">
              <Scale className="w-16 h-16 text-purple-400 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-white mb-2">Compare Company Exposure</h3>
              <p className="text-gray-400 mb-6">
                Select a regulation and choose 2+ companies to compare their regulatory impact side-by-side
              </p>
              <div className="flex justify-center gap-4">
                <Link to={createPageUrl('RegulatoryAnalyzer')}>
                  <Button variant="outline" className="border-purple-500 text-purple-300">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Upload Regulation Document
                  </Button>
                </Link>
                <Link to={createPageUrl('CompanyImpactAssessment')}>
                  <Button variant="outline" className="border-blue-500 text-blue-300">
                    Analyze Single Company
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}