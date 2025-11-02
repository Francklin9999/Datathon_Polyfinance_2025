import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { 
  Search,
  FileText,
  Building2,
  Globe,
  DollarSign,
  Loader2,
  TrendingUp,
  ChevronDown
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { getStockDataForPrompt, getAllAvailableStocks } from '@/utils/stockData';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function TenKIntelligence() {
  const [searchTicker, setSearchTicker] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [tenKAnalysis, setTenKAnalysis] = useState(null);
  const [availableStocks, setAvailableStocks] = useState([]);
  const [isLoadingStocks, setIsLoadingStocks] = useState(true);
  const [selectedStock, setSelectedStock] = useState('');
  const [error, setError] = useState(null);

  // Fetch available stocks on mount
  useEffect(() => {
    const fetchStocks = async () => {
      setIsLoadingStocks(true);
      try {
        const stocks = await getAllAvailableStocks();
        setAvailableStocks(stocks);
      } catch (error) {
        console.error('Error fetching stocks:', error);
      } finally {
        setIsLoadingStocks(false);
      }
    };
    fetchStocks();
  }, []);

  const handleAnalyze = async (ticker) => {
    if (!ticker) return;
    setIsAnalyzing(true);
    setError(null);
    setTenKAnalysis(null);

    try {
      const tickerUpper = ticker.toUpperCase();
      // Fetch stock data from jeu_de_donnees if available
      const stockData = await getStockDataForPrompt(tickerUpper);
      
      const analysisPrompt = `You are analyzing the 10-K filing for ${ticker.toUpperCase()}.

${stockData ? `${stockData}\n\nUse the above stock data from our dataset as reference for financial metrics when analyzing the 10-K filing.\n\n` : ''}Extract and return this JSON structure:

{
  "ticker": "${ticker.toUpperCase()}",
  "company_name": "Full company name",
  "fiscal_year": "2024",
  "business_model": "2-3 sentence description",
  "key_suppliers": [
    {
      "name": "Supplier name",
      "country": "Country",
      "products": "What they supply",
      "dependency": "High/Medium/Low"
    }
  ],
  "geographic_revenue": [
    {
      "region": "Region name",
      "revenue_percent": percentage as number,
      "revenue_amount": "dollar amount as string"
    }
  ],
  "product_lines": [
    {
      "name": "Product/service name",
      "revenue_percent": percentage as number,
      "description": "Brief description"
    }
  ],
  "risk_factors": ["List 5 key risk factors"],
  "regulatory_mentions": ["List regulatory concerns mentioned"],
  "trade_dependencies": "Description of trade dependencies"
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: analysisPrompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            ticker: { type: "string" },
            company_name: { type: "string" },
            fiscal_year: { type: "string" },
            business_model: { type: "string" },
            key_suppliers: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  country: { type: "string" },
                  products: { type: "string" },
                  dependency: { type: "string" }
                }
              }
            },
            geographic_revenue: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  region: { type: "string" },
                  revenue_percent: { type: "number" },
                  revenue_amount: { type: "string" }
                }
              }
            },
            product_lines: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  revenue_percent: { type: "number" },
                  description: { type: "string" }
                }
              }
            },
            risk_factors: { type: "array", items: { type: "string" } },
            regulatory_mentions: { type: "array", items: { type: "string" } },
            trade_dependencies: { type: "string" }
          }
        }
      });

      // Check if result has error fields
      if (result && (result.error || result.parse_error)) {
        console.error('Analysis error:', result);
        // Try to extract JSON from raw_response if available
        if (result.raw_response) {
          try {
            const jsonMatch = result.raw_response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              setTenKAnalysis(parsed);
              setIsAnalyzing(false);
              return;
            }
          } catch (e) {
            console.error('Failed to parse JSON from raw response:', e);
          }
        }
      }
      
      // Check if result has expected structure
      if (result && (result.ticker || result.company_name || result.business_model)) {
        setTenKAnalysis(result);
      } else {
        console.error('Unexpected result format:', result);
        setError(`Failed to analyze 10-K filing for ${ticker.toUpperCase()}. The API returned an unexpected response format. Please try again.`);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setError(`Error analyzing 10-K filing for ${ticker.toUpperCase()}: ${error.message || 'Unknown error occurred'}. Please try again.`);
    }

    setIsAnalyzing(false);
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <FileText className="w-8 h-8 text-indigo-400" />
              10-K Intelligence
            </h1>
            <p className="text-gray-400 mt-1">NLP analysis of company filings: supply chains, revenue exposure, business models</p>
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
              {/* Stock Dropdown */}
              <div className="flex-1 relative">
                <Select value={selectedStock} onValueChange={(value) => {
                  setSelectedStock(value);
                  setSearchTicker(value);
                  handleAnalyze(value);
                }}>
                  <SelectTrigger className="w-full bg-gray-900 border-gray-700 text-white hover:bg-gray-800">
                    <SelectValue placeholder={isLoadingStocks ? "Loading stocks..." : `Select stock (${availableStocks.length} available)`} />
                    <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white max-h-[300px] overflow-y-auto">
                    {availableStocks.map((stock) => (
                      <SelectItem 
                        key={stock.ticker} 
                        value={stock.ticker}
                        className="hover:bg-gray-700 focus:bg-gray-700"
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-mono font-bold">{stock.ticker}</span>
                          <span className="ml-2 text-gray-400 text-xs">{stock.company_name || ''}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Manual Input (optional) */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Or type ticker symbol..."
                  value={searchTicker}
                  onChange={(e) => {
                    setSearchTicker(e.target.value);
                    setSelectedStock('');
                  }}
                  className="pl-10 bg-gray-900 border-gray-700 text-white"
                  onKeyPress={(e) => e.key === 'Enter' && handleAnalyze(searchTicker)}
                />
              </div>
              
              <Button 
                onClick={() => handleAnalyze(searchTicker)}
                disabled={isAnalyzing || !searchTicker}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing 10-K...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Analyze 10-K
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Select from {availableStocks.length} available stocks in jeu_de_donnees or type a ticker manually
            </p>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="bg-red-900/20 border-red-500/30">
            <CardContent className="p-4">
              <p className="text-red-400">
                ⚠️ {error}
              </p>
            </CardContent>
          </Card>
        )}

        {/* 10-K Analysis */}
        {tenKAnalysis && (
          <>
            <Card className="bg-gradient-to-br from-indigo-900/20 to-blue-900/20 border-indigo-500/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{tenKAnalysis.company_name || 'Company Name'}</h2>
                    <p className="text-gray-400">{tenKAnalysis.ticker || 'N/A'} • FY {tenKAnalysis.fiscal_year || 'N/A'}</p>
                  </div>
                  <Badge className="bg-indigo-600">10-K Analysis</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div>
                  <p className="text-xs text-gray-400 mb-2">Business Model</p>
                  <p className="text-gray-300 leading-relaxed">{tenKAnalysis.business_model || 'Business model information not available'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Key Suppliers */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-orange-400" />
                  Key Suppliers & Supply Chain
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(tenKAnalysis.key_suppliers || []).map((supplier, idx) => (
                    <div key={idx} className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-bold text-white">{supplier?.name || 'Unknown'}</p>
                          <p className="text-sm text-gray-400">{supplier?.country || 'N/A'}</p>
                        </div>
                        <Badge className={
                          supplier?.dependency === 'High' ? 'bg-red-600' :
                          supplier?.dependency === 'Medium' ? 'bg-yellow-600' :
                          'bg-green-600'
                        }>
                          {supplier?.dependency || 'Unknown'} Dependency
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-300">{supplier?.products || 'N/A'}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-blue-300">{tenKAnalysis.trade_dependencies || 'No trade dependencies information available'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Geographic & Product Revenue */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Globe className="w-5 h-5 text-green-400" />
                    Geographic Revenue Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(tenKAnalysis.geographic_revenue && tenKAnalysis.geographic_revenue.length > 0) ? (
                    <>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={tenKAnalysis.geographic_revenue}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ region, revenue_percent }) => `${region}: ${revenue_percent}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="revenue_percent"
                          >
                            {tenKAnalysis.geographic_revenue.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-2 mt-4">
                        {tenKAnalysis.geographic_revenue.map((geo, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-gray-900/50 rounded">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                              <span className="text-white text-sm">{geo?.region || 'Unknown'}</span>
                            </div>
                            <div className="text-right">
                              <p className="text-white font-mono text-sm">{geo?.revenue_amount || 'N/A'}</p>
                              <p className="text-xs text-gray-400">{geo?.revenue_percent || 0}%</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-gray-400 text-sm">No geographic revenue data available</p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-yellow-400" />
                    Product Line Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(tenKAnalysis.product_lines || []).map((product, idx) => (
                      <div key={idx} className="p-3 bg-gray-900/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold text-white">{product?.name || 'Unknown'}</p>
                          <Badge className="bg-blue-600">{product?.revenue_percent || 0}%</Badge>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${product?.revenue_percent || 0}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-400">{product?.description || 'No description available'}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Risk Factors & Regulatory */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Key Risk Factors (from 10-K)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {(tenKAnalysis.risk_factors || []).map((risk, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                        <TrendingUp className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                        {risk || 'Risk factor not available'}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Regulatory Mentions</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {(tenKAnalysis.regulatory_mentions || []).map((mention, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                        <FileText className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                        {mention || 'Regulatory mention not available'}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}