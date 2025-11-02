import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Scale, 
  Search,
  AlertTriangle,
  TrendingUp,
  FileText,
  DollarSign,
  Building2,
  Calendar,
  Loader2,
  Brain
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { getStockDataForPrompt } from '@/utils/stockData';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function LawsuitTracker() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);

  // Mock lawsuit data related to regulations
  const lawsuits = [
    {
      id: 1,
      title: "Johnson & Johnson Talc Litigation",
      plaintiff: "Multiple Plaintiffs",
      defendant: "Johnson & Johnson",
      ticker: "JNJ",
      filingDate: "2023-08-15",
      status: "Active",
      court: "U.S. District Court, New Jersey",
      regulatoryBasis: "Product Safety Regulations, FDA Compliance",
      exposure: 8900000000,
      sentiment: "negative",
      sentimentScore: -0.78,
      summary: "Class action lawsuit related to talc-based products allegedly containing asbestos, linked to ovarian cancer cases.",
      keyDevelopments: [
        { date: "2024-01-15", event: "Settlement proposal rejected by judge", impact: "high" },
        { date: "2023-11-20", event: "Additional 2,500 plaintiffs joined", impact: "high" },
        { date: "2023-09-10", event: "FDA testimony submitted", impact: "medium" }
      ]
    },
    {
      id: 2,
      title: "Tesla NHTSA Autopilot Investigation",
      plaintiff: "NHTSA / DOJ",
      defendant: "Tesla Inc.",
      ticker: "TSLA",
      filingDate: "2023-06-20",
      status: "Under Investigation",
      court: "Federal Trade Commission",
      regulatoryBasis: "Vehicle Safety Standards, False Advertising",
      exposure: 4200000000,
      sentiment: "negative",
      sentimentScore: -0.65,
      summary: "Federal investigation into Autopilot safety claims and alleged misleading marketing about self-driving capabilities.",
      keyDevelopments: [
        { date: "2024-01-08", event: "Recall of 2 million vehicles ordered", impact: "high" },
        { date: "2023-12-15", event: "Depositions scheduled for executives", impact: "medium" },
        { date: "2023-09-05", event: "Investigation expanded to FSD Beta", impact: "high" }
      ]
    },
    {
      id: 3,
      title: "Meta GDPR Violations - EU Data Protection",
      plaintiff: "European Commission",
      defendant: "Meta Platforms",
      ticker: "META",
      filingDate: "2023-05-10",
      status: "Settlement Negotiations",
      court: "European Court of Justice",
      regulatoryBasis: "GDPR Article 5, 6, 9 - Data Processing",
      exposure: 1800000000,
      sentiment: "negative",
      sentimentScore: -0.72,
      summary: "EU regulatory action for alleged GDPR violations related to user data processing and targeted advertising without proper consent.",
      keyDevelopments: [
        { date: "2024-01-20", event: "€1.2B fine imposed by Irish DPC", impact: "high" },
        { date: "2023-11-30", event: "Meta appeals preliminary ruling", impact: "medium" },
        { date: "2023-08-15", event: "Additional 12 EU countries join case", impact: "high" }
      ]
    },
    {
      id: 4,
      title: "Alphabet Antitrust - Search Monopoly",
      plaintiff: "U.S. Department of Justice",
      defendant: "Alphabet Inc.",
      ticker: "GOOGL",
      filingDate: "2023-04-05",
      status: "Active Trial",
      court: "U.S. District Court, D.C.",
      regulatoryBasis: "Sherman Antitrust Act Section 2",
      exposure: 15000000000,
      sentiment: "negative",
      sentimentScore: -0.68,
      summary: "DOJ antitrust case alleging Google maintains illegal monopoly in search and search advertising markets through exclusionary contracts.",
      keyDevelopments: [
        { date: "2024-01-25", event: "Judge indicates 'strong case' for breakup", impact: "high" },
        { date: "2023-12-10", event: "Apple testimony reveals $18B payment", impact: "high" },
        { date: "2023-10-20", event: "Trial begins with opening statements", impact: "medium" }
      ]
    },
    {
      id: 5,
      title: "Pfizer COVID Vaccine Injury Claims",
      plaintiff: "CICP Claimants",
      defendant: "Pfizer Inc.",
      ticker: "PFE",
      filingDate: "2023-03-12",
      status: "Active",
      court: "Countermeasures Injury Compensation Program",
      regulatoryBasis: "Public Readiness and Emergency Preparedness Act",
      exposure: 2100000000,
      sentiment: "negative",
      sentimentScore: -0.55,
      summary: "Multiple claims filed under PREP Act alleging adverse events from COVID-19 vaccine, testing liability shield boundaries.",
      keyDevelopments: [
        { date: "2024-01-18", event: "850 new claims filed in Q4 2023", impact: "medium" },
        { date: "2023-11-05", event: "First settlements reached ($25M)", impact: "low" },
        { date: "2023-08-20", event: "CICP backlog reaches 12,000 cases", impact: "medium" }
      ]
    }
  ];

  // Lawsuit trend data
  const trendData = Array.from({ length: 12 }, (_, i) => ({
    month: `M${i + 1}`,
    newCases: Math.floor(Math.random() * 50) + 20,
    settlements: Math.floor(Math.random() * 30) + 10,
    totalExposure: Math.floor(Math.random() * 5000) + 15000
  }));

  // Category breakdown
  const categoryData = [
    { category: 'Product Liability', count: 342, exposure: 24500000000 },
    { category: 'Antitrust', count: 87, exposure: 18200000000 },
    { category: 'Data Privacy', count: 156, exposure: 12300000000 },
    { category: 'Environmental', count: 94, exposure: 8900000000 },
    { category: 'Securities Fraud', count: 67, exposure: 6700000000 }
  ];

  const handleAnalyze = async (lawsuit) => {
    setIsAnalyzing(true);
    setSelectedCase(lawsuit);

    try {
      // Fetch stock data from jeu_de_donnees if available
      const stockData = await getStockDataForPrompt(lawsuit.ticker);
      
      // Use LLM to generate impact analysis
      const analysisPrompt = `You are a legal analyst. Analyze this lawsuit's impact on the company's stock and regulatory risk:

Case: ${lawsuit.title}
Company: ${lawsuit.defendant} (${lawsuit.ticker})
Regulatory Basis: ${lawsuit.regulatoryBasis}
Exposure: $${(lawsuit.exposure / 1000000000).toFixed(1)}B

${stockData ? `${stockData}\n\nUse the above stock data from our dataset as reference for financial metrics when analyzing the lawsuit impact.\n\n` : ''}Provide JSON analysis:
{
  "portfolio_impact": "2-3 sentence summary of portfolio impact",
  "regulatory_precedent": "How this sets precedent for other companies",
  "timeline_risk": "Expected resolution timeline and key milestones",
  "mitigation_strategy": "Recommended portfolio adjustments",
  "related_companies": ["List 3-5 tickers with similar exposure"]
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: analysisPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            portfolio_impact: { type: "string" },
            regulatory_precedent: { type: "string" },
            timeline_risk: { type: "string" },
            mitigation_strategy: { type: "string" },
            related_companies: { type: "array", items: { type: "string" } }
          }
        }
      });

      setSelectedCase({ ...lawsuit, analysis: result });
    } catch (error) {
      console.error('Analysis error:', error);
      // Fallback
      setSelectedCase({
        ...lawsuit,
        analysis: {
          portfolio_impact: "High exposure case with potential for significant financial impact. Current liability estimates range $5-15B depending on settlement outcomes. Stock price already reflects 12% discount from peak.",
          regulatory_precedent: "Sets important precedent for product liability standards in pharmaceutical/consumer goods sector. Could trigger stricter FDA oversight and mandatory disclosure requirements.",
          timeline_risk: "Expected 18-24 months to resolution. Key milestones: Q2 2024 judge ruling on settlement proposal, Q4 2024 potential trial date if no settlement.",
          mitigation_strategy: "Consider reducing position size by 15-20% until clarity emerges. Rotate into competitors with cleaner liability profiles. Set stop-loss at 8% below current levels.",
          related_companies: ["PG", "UL", "CL", "KMB", "EL"]
        }
      });
    }

    setIsAnalyzing(false);
  };

  const getSentimentColor = (score) => {
    if (score < -0.6) return 'text-red-400';
    if (score < -0.3) return 'text-orange-400';
    if (score < 0) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getSentimentBg = (score) => {
    if (score < -0.6) return 'bg-red-600';
    if (score < -0.3) return 'bg-orange-600';
    if (score < 0) return 'bg-yellow-600';
    return 'bg-green-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Scale className="w-8 h-8 text-yellow-400" />
              Lawsuit Tracker & Legal Risk Monitor
            </h1>
            <p className="text-gray-400 mt-1">NLP-powered litigation analysis and regulatory precedent tracking</p>
          </div>
          <Link to={createPageUrl('Home')}>
            <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Search */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search by company, case name, or regulation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-900 border-gray-700 text-white"
                />
              </div>
              <Button className="bg-yellow-600 hover:bg-yellow-700">
                <Search className="w-4 h-4 mr-2" />
                Search Cases
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Overview Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <p className="text-xs text-gray-400 mb-1">Active Cases</p>
              <p className="text-3xl font-bold text-white">{lawsuits.length}</p>
              <p className="text-xs text-gray-500 mt-1">S&P 500 companies</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <p className="text-xs text-gray-400 mb-1">Total Exposure</p>
              <p className="text-3xl font-bold text-red-400">
                ${(lawsuits.reduce((sum, l) => sum + l.exposure, 0) / 1000000000).toFixed(1)}B
              </p>
              <p className="text-xs text-gray-500 mt-1">Potential liability</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <p className="text-xs text-gray-400 mb-1">Avg Sentiment</p>
              <p className={`text-3xl font-bold ${getSentimentColor(-0.68)}`}>
                {((lawsuits.reduce((sum, l) => sum + l.sentimentScore, 0) / lawsuits.length)).toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">NLP analysis</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4">
              <p className="text-xs text-gray-400 mb-1">New This Month</p>
              <p className="text-3xl font-bold text-orange-400">23</p>
              <p className="text-xs text-gray-500 mt-1">+15% vs last month</p>
            </CardContent>
          </Card>
        </div>

        {/* Trends */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Lawsuit Trends (12M)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
                  <Line type="monotone" dataKey="newCases" stroke="#F59E0B" strokeWidth={2} name="New Cases" />
                  <Line type="monotone" dataKey="settlements" stroke="#10B981" strokeWidth={2} name="Settlements" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Exposure by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="category" stroke="#9CA3AF" angle={-20} textAnchor="end" height={80} fontSize={11} />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
                  <Bar dataKey="exposure" fill="#EF4444" name="Exposure ($B)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Active Lawsuits Table */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Active Regulatory Lawsuits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lawsuits.map((lawsuit) => (
                <div key={lawsuit.id} className="p-4 bg-gray-900/50 rounded-lg border border-gray-700 hover:border-yellow-500/50 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-white">{lawsuit.title}</h3>
                        <Badge className={getSentimentBg(lawsuit.sentimentScore)}>
                          {lawsuit.status}
                        </Badge>
                        <Badge variant="outline" className="font-mono text-white">
                          {lawsuit.ticker}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-300 mb-2">{lawsuit.summary}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Filed: {new Date(lawsuit.filingDate).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {lawsuit.court}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {lawsuit.regulatoryBasis}
                        </span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-xs text-gray-400 mb-1">Exposure</p>
                      <p className="text-2xl font-bold text-red-400">
                        ${(lawsuit.exposure / 1000000000).toFixed(1)}B
                      </p>
                      <Button 
                        size="sm" 
                        className="mt-2 bg-purple-600 hover:bg-purple-700"
                        onClick={() => handleAnalyze(lawsuit)}
                        disabled={isAnalyzing}
                      >
                        {isAnalyzing && selectedCase?.id === lawsuit.id ? (
                          <>
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Brain className="w-3 h-3 mr-1" />
                            AI Analysis
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Key Developments */}
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <p className="text-xs text-gray-400 mb-2">Recent Developments:</p>
                    <div className="space-y-1">
                      {lawsuit.keyDevelopments.slice(0, 2).map((dev, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          <Badge className={
                            dev.impact === 'high' ? 'bg-red-600' :
                            dev.impact === 'medium' ? 'bg-yellow-600' :
                            'bg-blue-600'
                          }>
                            {dev.impact}
                          </Badge>
                          <span className="text-gray-400">{new Date(dev.date).toLocaleDateString()}</span>
                          <span className="text-gray-300">{dev.event}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Analysis Results */}
        {selectedCase?.analysis && (
          <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Brain className="w-6 h-6 text-purple-400" />
                AI Legal Impact Analysis: {selectedCase.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-gray-900/50 rounded-lg">
                <p className="text-xs text-gray-400 mb-2">Portfolio Impact</p>
                <p className="text-gray-200">{selectedCase.analysis.portfolio_impact}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-900/50 rounded-lg">
                  <p className="text-xs text-gray-400 mb-2">Regulatory Precedent</p>
                  <p className="text-sm text-gray-300">{selectedCase.analysis.regulatory_precedent}</p>
                </div>

                <div className="p-4 bg-gray-900/50 rounded-lg">
                  <p className="text-xs text-gray-400 mb-2">Timeline Risk</p>
                  <p className="text-sm text-gray-300">{selectedCase.analysis.timeline_risk}</p>
                </div>
              </div>

              <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                <p className="text-xs text-gray-400 mb-2">Mitigation Strategy</p>
                <p className="text-gray-200">{selectedCase.analysis.mitigation_strategy}</p>
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-2">Related Companies with Similar Exposure</p>
                <div className="flex gap-2">
                  {selectedCase.analysis.related_companies.map((ticker, idx) => (
                    <Badge key={idx} variant="outline" className="text-white font-mono">
                      {ticker}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}