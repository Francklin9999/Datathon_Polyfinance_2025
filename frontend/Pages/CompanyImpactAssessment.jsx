import React, { useState, useEffect } from 'react';
import { api } from '@/api/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  AlertTriangle, 
  Search,
  TrendingDown,
  Building2,
  Loader2,
  FileText,
  DollarSign,
  Globe,
  ArrowRight,
  Target,
  BarChart3
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { getStockDataForPrompt, getAllAvailableStocks } from '@/utils/stockData';

export default function CompanyImpactAssessment() {
  const [searchTicker, setSearchTicker] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [companyAnalysis, setCompanyAnalysis] = useState(null);
  const [availableCompanies, setAvailableCompanies] = useState([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);

  // Fetch available companies from backend on mount
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const stocks = await getAllAvailableStocks();
        setAvailableCompanies(stocks);
      } catch (error) {
        console.error('Error fetching companies:', error);
        setAvailableCompanies([]);
      } finally {
        setIsLoadingCompanies(false);
      }
    };
    fetchCompanies();
  }, []);

  const handleAnalyze = async (ticker) => {
    if (!ticker) return;
    
    setIsAnalyzing(true);
    setCompanyAnalysis(null);
    
    try {
      const tickerUpper = ticker.toUpperCase();
      
      // Check if company exists in available companies
      const company = availableCompanies.find(c => c.ticker === tickerUpper);
      
      if (!company && availableCompanies.length > 0) {
        alert(`Company ${tickerUpper} not found in available dataset. Please try another ticker.`);
        setIsAnalyzing(false);
        return;
      }

      // Fetch stock data from jeu_de_donnees if available
      const stockDataText = await getStockDataForPrompt(tickerUpper);
      
      // Try to fetch stock data from API, but don't fail if endpoint doesn't exist
      let stockData = null;
      try {
        const stockDataResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/stocks/stock/${tickerUpper}`);
        if (stockDataResponse.ok) {
          stockData = await stockDataResponse.json();
        }
      } catch (stockError) {
        console.warn('Could not fetch stock data from API:', stockError);
        // Continue without stock data - not critical
      }

      // Fetch 10-K data if available
      let companyData = null;
      try {
        const tenKResponse = await api.analytics.analyzeTenK(tickerUpper);
        if (tenKResponse && !tenKResponse.error) {
          // Map 10-K data to company data format
          companyData = {
            ticker: tenKResponse.ticker || tickerUpper,
            company_name: tenKResponse.company_name || company?.company_name || `${tickerUpper} Inc.`,
            business_description_full: tenKResponse.business_model || '',
            key_suppliers: tenKResponse.key_suppliers || [],
            geographic_revenue: tenKResponse.geographic_revenue || [],
            product_lines: tenKResponse.product_lines || [],
            risk_factors: tenKResponse.risk_factors || [],
            regulatory_mentions: tenKResponse.regulatory_mentions || []
          };
        }
      } catch (tenKError) {
        console.warn('Could not fetch 10-K data:', tenKError);
      }

      // If no 10-K data, create basic company data structure
      if (!companyData) {
        companyData = {
          ticker: tickerUpper,
          company_name: company?.company_name || `${tickerUpper} Inc.`,
          business_description_full: '',
          key_suppliers: [],
          geographic_revenue: [],
          product_lines: []
        };
      }

      // Create regulation data structure (Inflation Reduction Act of 2022)
      const regulationData = {
        regulation_type: "tax_credit",
        title: "Inflation Reduction Act of 2022",
        entities: {
          countries: ["China", "North Korea", "Iran", "Russia"],
          sectors: ["Automotive", "Energy", "Technology", "Manufacturing"]
        },
        measures: [
          {
            target: "electric vehicles",
            rate_pct: 25,
            description: "EV tax credits requiring North American assembly"
          },
          {
            target: "battery components",
            rate_pct: 50,
            description: "Battery component sourcing from approved countries"
          },
          {
            target: "clean energy",
            rate_pct: 30,
            description: "Clean energy tax credits for renewable energy projects"
          }
        ],
        supply_chain_impact: {
          affected_components: ["batteries", "semiconductors", "critical minerals"],
          affected_suppliers: [],
          affected_countries: ["China", "Taiwan"]
        }
      };

      // Call backend company impact assessment endpoint
      let impactResponse;
      try {
        impactResponse = await api.regulatory.assessCompanyImpact({
          regulation: regulationData,
          companies: [tickerUpper],
          companyData: {
            [tickerUpper]: companyData
          },
          stockData: stockData?.data ? {
            [tickerUpper]: stockData.data
          } : {}
        });
      } catch (impactError) {
        console.error('Error calling assessCompanyImpact:', impactError);
        throw new Error(`Failed to assess company impact: ${impactError.message || 'Backend service unavailable'}`);
      }

      if (!impactResponse || !impactResponse.companies || impactResponse.companies.length === 0) {
        throw new Error('No impact assessment returned from backend. The backend may not have processed the request correctly.');
      }

      const impact = impactResponse.companies[0];

      // Use LLM to generate detailed analysis with all available data
      const tenKText = companyData.business_description_full ? 
        `10-K Business Description: ${companyData.business_description_full}\n` : '';
      
      const analysisPrompt = `You are a financial analyst assessing regulatory impact on ${companyData.company_name} (${tickerUpper}).

Company Information:
${stockDataText || 'Stock data not available'}

${tenKText || ''}

Regulation: ${regulationData.title}
- EV tax credits requiring North American assembly
- Battery component sourcing restrictions
- Clean energy incentives

Backend Impact Analysis:
- Risk Score: ${impact.risk_score}/100
- Exposure Level: ${impact.exposure}
- Supply Chain Risk: ${impact.supply_chain_risk}/100
- Geographic Exposure: ${impact.geographic_exposure}/100
- Estimated Revenue Impact: ${impact.revenue_impact_pct}%
- Reasoning: ${impact.reasoning}

Generate a detailed impact assessment with this JSON structure:

{
  "risk_score": ${impact.risk_score},
  "risk_level": "${impact.risk_score >= 80 ? 'Critical' : impact.risk_score >= 60 ? 'High' : impact.risk_score >= 40 ? 'Medium' : 'Low'}",
  "estimated_revenue_impact": "Format as '-$X.XB (-X.X%)' using revenue from stock data if available",
  "estimated_margin_impact": "Format as '-X.X%' based on risk score",
  "supply_chain_exposure": {
    "key_suppliers": ${JSON.stringify((companyData.key_suppliers || []).slice(0, 5).map(s => s.name || s))},
    "geographic_risk": "Based on ${impact.geographic_exposure}/100 geographic exposure score",
    "mitigation_options": ${JSON.stringify(impact.mitigation_strategies || [])}
  },
  "revenue_exposure": {
    "affected_revenue_percent": "${impact.revenue_impact_pct}%",
    "affected_regions": ${JSON.stringify((companyData.geographic_revenue || []).map(g => g.region || g).filter(Boolean).slice(0, 5))},
    "product_lines_at_risk": ${JSON.stringify((companyData.product_lines || []).map(p => p.name || p).filter(Boolean).slice(0, 5))}
  },
  "compliance_requirements": ["Extract from regulation measures"],
  "opportunities": ["Identify potential benefits from regulation"],
  "recommendation": "${impact.risk_score >= 70 ? 'REDUCE' : impact.risk_score >= 40 ? 'HOLD' : 'INCREASE'}",
  "reasoning": "${impact.reasoning}"
}`;

      const llmResult = await api.integrations.Core.InvokeLLM({
        prompt: analysisPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            risk_score: { type: "number" },
            risk_level: { type: "string" },
            estimated_revenue_impact: { type: "string" },
            estimated_margin_impact: { type: "string" },
            supply_chain_exposure: { 
              type: "object",
              properties: {
                key_suppliers: { type: "array", items: { type: "string" } },
                geographic_risk: { type: "string" },
                mitigation_options: { type: "string" }
              }
            },
            revenue_exposure: {
              type: "object",
              properties: {
                affected_revenue_percent: { type: "string" },
                affected_regions: { type: "array", items: { type: "string" } },
                product_lines_at_risk: { type: "array", items: { type: "string" } }
              }
            },
            compliance_requirements: { type: "array", items: { type: "string" } },
            opportunities: { type: "array", items: { type: "string" } },
            recommendation: { type: "string" },
            reasoning: { type: "string" }
          }
        }
      });

      // Calculate revenue and margin impact (always calculate as fallback)
      const revenueImpactPct = impact.revenue_impact_pct || (impact.risk_score * 0.5); // Fallback if missing
      let revenueImpact;
      
      if (stockData?.data?.revenue) {
        // Parse revenue (could be string like "150.5B" or number)
        let revenueValue = 0;
        const revenueStr = String(stockData.data.revenue || '');
        if (revenueStr.includes('B') || revenueStr.includes('b')) {
          revenueValue = parseFloat(revenueStr.replace(/[Bb]/g, '')) * 1000000000;
        } else if (revenueStr.includes('M') || revenueStr.includes('m')) {
          revenueValue = parseFloat(revenueStr.replace(/[Mm]/g, '')) * 1000000;
        } else {
          revenueValue = parseFloat(revenueStr) || 0;
        }
        
        const impactAmount = (revenueValue * revenueImpactPct / 100) / 1000000000;
        revenueImpact = `-$${Math.abs(impactAmount).toFixed(1)}B (-${revenueImpactPct.toFixed(1)}%)`;
      } else {
        revenueImpact = `-${revenueImpactPct.toFixed(1)}%`;
      }
      
      const marginImpact = `-${(impact.risk_score * 0.03).toFixed(1)}%`;

      // Parse LLM result or use backend impact as fallback
      let parsedAnalysis = null;
      
      if (llmResult && !llmResult.error && !llmResult.parse_error && llmResult.estimated_revenue_impact && llmResult.estimated_margin_impact) {
        // Use LLM result if available and has required fields
        parsedAnalysis = llmResult;
        // Ensure revenue and margin impact are always set
        if (!parsedAnalysis.estimated_revenue_impact || parsedAnalysis.estimated_revenue_impact === 'N/A') {
          parsedAnalysis.estimated_revenue_impact = revenueImpact;
        }
        if (!parsedAnalysis.estimated_margin_impact || parsedAnalysis.estimated_margin_impact === 'N/A') {
          parsedAnalysis.estimated_margin_impact = marginImpact;
        }
      } else if (llmResult && llmResult.raw_response) {
        // Try to extract JSON from raw response
        try {
          const jsonMatch = llmResult.raw_response.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsedAnalysis = JSON.parse(jsonMatch[0]);
            // Ensure required fields
            if (!parsedAnalysis.estimated_revenue_impact) parsedAnalysis.estimated_revenue_impact = revenueImpact;
            if (!parsedAnalysis.estimated_margin_impact) parsedAnalysis.estimated_margin_impact = marginImpact;
          }
        } catch (e) {
          console.warn('Failed to parse JSON from raw response');
        }
      }

      // If LLM failed or missing fields, use backend impact with formatted data
      if (!parsedAnalysis || !parsedAnalysis.estimated_revenue_impact || !parsedAnalysis.estimated_margin_impact) {
        parsedAnalysis = {
          risk_score: impact.risk_score,
          risk_level: impact.risk_score >= 80 ? 'Critical' : impact.risk_score >= 60 ? 'High' : impact.risk_score >= 40 ? 'Medium' : 'Low',
          estimated_revenue_impact: revenueImpact,
          estimated_margin_impact: marginImpact,
          supply_chain_exposure: {
            key_suppliers: (companyData.key_suppliers || []).slice(0, 5).map(s => 
              typeof s === 'string' ? s : `${s.name || ''}${s.country ? ` (${s.country})` : ''}`
            ).filter(Boolean),
            geographic_risk: `Geographic exposure score: ${impact.geographic_exposure}/100. ${impact.geographic_exposure >= 70 ? 'High concentration in affected regions' : impact.geographic_exposure >= 40 ? 'Moderate exposure to affected regions' : 'Low exposure'}.`,
            mitigation_options: impact.mitigation_strategies || []
          },
          revenue_exposure: {
            affected_revenue_percent: `${revenueImpactPct.toFixed(1)}%`,
            affected_regions: (companyData.geographic_revenue || []).map(g => g.region || g).filter(Boolean).slice(0, 5),
            product_lines_at_risk: (companyData.product_lines || []).map(p => p.name || p).filter(Boolean).slice(0, 5)
          },
          compliance_requirements: regulationData.measures.map(m => m.description),
          opportunities: [
            'Benefit from clean energy tax credits',
            'Potential market share gains in compliant supply chains'
          ],
          recommendation: impact.risk_score >= 70 ? 'REDUCE' : impact.risk_score >= 40 ? 'HOLD' : 'INCREASE',
          reasoning: impact.reasoning,
          ...(parsedAnalysis || {}) // Merge any valid LLM fields
        };
      }

      // Set the analysis result
      setCompanyAnalysis({
        ticker: tickerUpper,
        name: companyData.company_name,
        sector: stockData?.data?.sector || 'Unknown',
        exposure: impact.risk_score * 10000000, // Estimate exposure for display
        impactReason: impact.reasoning,
        geographic_exposure: impact.geographic_exposure, // Include for reference
        ...parsedAnalysis
      });

    } catch (error) {
      console.error('Analysis error:', error);
      
      // Provide more helpful error messages
      let errorMessage = 'Failed to analyze company';
      
      if (error.message && error.message.includes('fetch')) {
        errorMessage = 'Failed to connect to backend server. Please ensure the backend is running on http://localhost:8000';
      } else if (error.message && error.message.includes('Network')) {
        errorMessage = 'Network error. Please check your connection and ensure the backend server is running.';
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      alert(`${errorMessage}. Please try again.`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRiskColor = (score) => {
    if (score >= 80) return 'text-red-400';
    if (score >= 60) return 'text-orange-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getRiskBgColor = (score) => {
    if (score >= 80) return 'bg-red-600';
    if (score >= 60) return 'bg-orange-600';
    if (score >= 40) return 'bg-yellow-600';
    return 'bg-green-600';
  };

  // Map available companies to display format
  const displayCompanies = availableCompanies.map(c => ({
    ticker: c.ticker,
    name: c.company_name || c.company || `${c.ticker} Inc.`,
    sector: 'Unknown', // Sector not available in basic stock list
    riskScore: 50, // Placeholder - would need to calculate from actual data
    exposure: 0
  })).slice(0, 50); // Limit to first 50 for display

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-red-400" />
              Company Impact Assessment
            </h1>
            <p className="text-gray-400 mt-1">Cross-reference regulations with 10-K filings to calculate risk scores</p>
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
                  placeholder="Search by ticker (e.g., AAPL, TSLA, MSFT)..."
                  value={searchTicker}
                  onChange={(e) => setSearchTicker(e.target.value)}
                  className="pl-10 bg-gray-900 border-gray-700 text-white"
                  onKeyPress={(e) => e.key === 'Enter' && handleAnalyze(searchTicker)}
                />
                
              </div>
              <Button 
                onClick={() => handleAnalyze(searchTicker)}
                disabled={isAnalyzing || !searchTicker}
                className="bg-red-600 hover:bg-red-700"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Analyze Impact
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>


        {/* Company Analysis Result */}
        {companyAnalysis && (
          <>
            <Card className="bg-gradient-to-br from-red-900/20 to-orange-900/20 border-red-500/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{companyAnalysis.name}</h2>
                    <p className="text-gray-400">{companyAnalysis.ticker} • {companyAnalysis.sector}</p>
                  </div>
                  <div className="text-right">
                    <Badge className={`${getRiskBgColor(companyAnalysis.risk_score || 0)} text-lg px-4 py-2`}>
                      Risk Score: {companyAnalysis.risk_score ?? 'N/A'}
                    </Badge>
                    <p className="text-sm text-gray-400 mt-1">{companyAnalysis.risk_level || 'Unknown'} Risk</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="bg-gray-900/50 p-4 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Revenue Impact</p>
                    <p className="text-2xl font-bold text-red-400">{companyAnalysis.estimated_revenue_impact || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-900/50 p-4 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Margin Impact</p>
                    <p className="text-2xl font-bold text-orange-400">{companyAnalysis.estimated_margin_impact || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-900/50 p-4 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Total Exposure</p>
                    <p className="text-2xl font-bold text-white">
                      {companyAnalysis.exposure ? 
                        `$${(companyAnalysis.exposure / 1000000000).toFixed(1)}B` : 
                        'N/A'
                      }
                    </p>
                  </div>
                  <div className="bg-gray-900/50 p-4 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Recommendation</p>
                    <Badge className={`${
                      companyAnalysis.recommendation === 'REDUCE' ? 'bg-red-600' :
                      companyAnalysis.recommendation === 'HOLD' ? 'bg-yellow-600' :
                      'bg-green-600'
                    } text-lg`}>
                      {companyAnalysis.recommendation || 'N/A'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transparent Reasoning */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Impact Assessment Reasoning</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 leading-relaxed mb-4">{companyAnalysis.impactReason || companyAnalysis.reasoning || 'No impact reason available'}</p>
                <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-blue-300">
                    {companyAnalysis.reasoning || companyAnalysis.impactReason || 'Detailed reasoning will be generated based on supply chain exposure, geographic revenue, and regulatory measures.'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Supply Chain & Revenue Exposure */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-orange-400" />
                    Supply Chain Exposure
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-2">Key Suppliers (from 10-K)</p>
                    <div className="space-y-1">
                      {(companyAnalysis.supply_chain_exposure?.key_suppliers && companyAnalysis.supply_chain_exposure.key_suppliers.length > 0) ? (
                        companyAnalysis.supply_chain_exposure.key_suppliers.map((supplier, idx) => (
                          <div key={idx} className="p-2 bg-gray-900/50 rounded text-sm text-white">
                            {supplier}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-400 italic">Supplier data not available from 10-K filing. Analysis based on sector and geographic exposure.</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Geographic Risk</p>
                    <p className="text-sm text-gray-300">
                      {companyAnalysis.supply_chain_exposure?.geographic_risk || 
                       'Geographic risk assessment based on revenue exposure and supply chain analysis. See Revenue Exposure section for details.'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Mitigation Options</p>
                    <div className="space-y-1">
                      {(() => {
                        const options = companyAnalysis.supply_chain_exposure?.mitigation_options;
                        if (typeof options === 'string' && options.trim()) {
                          return <p className="text-sm text-gray-300">{options}</p>;
                        } else if (Array.isArray(options) && options.length > 0) {
                          return (
                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                              {options.map((opt, idx) => (
                                <li key={idx}>{opt}</li>
                              ))}
                            </ul>
                          );
                        } else {
                          return (
                            <p className="text-sm text-gray-400 italic">
                              Monitor regulatory developments closely. Maintain flexibility in operations. Consider diversifying supply chain if risk increases.
                            </p>
                          );
                        }
                      })()}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <Globe className="w-5 h-5 text-green-400" />
                    Revenue Exposure
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Affected Revenue</p>
                    <p className="text-3xl font-bold text-red-400">
                      {companyAnalysis.revenue_exposure?.affected_revenue_percent || 
                       (companyAnalysis.estimated_revenue_impact ? 
                        companyAnalysis.estimated_revenue_impact.match(/\((-?\d+\.?\d*%)\)/)?.[1] || 'N/A' : 
                        'N/A')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-2">Affected Regions</p>
                    <div className="flex flex-wrap gap-2">
                      {(companyAnalysis.revenue_exposure?.affected_regions && companyAnalysis.revenue_exposure.affected_regions.length > 0) ? (
                        companyAnalysis.revenue_exposure.affected_regions.map((region, idx) => (
                          <Badge key={idx} variant="outline" className="text-white">
                            {region}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-gray-400 italic">Geographic revenue breakdown not available from 10-K filing.</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-2">Product Lines at Risk</p>
                    <div className="space-y-1">
                      {(companyAnalysis.revenue_exposure?.product_lines_at_risk && companyAnalysis.revenue_exposure.product_lines_at_risk.length > 0) ? (
                        companyAnalysis.revenue_exposure.product_lines_at_risk.map((product, idx) => (
                          <div key={idx} className="p-2 bg-gray-900/50 rounded text-sm text-white">
                            {product}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-400 italic">Product line data not available from 10-K filing. Assessment based on sector exposure.</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Compliance & Opportunities */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-yellow-400" />
                    New Compliance Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(companyAnalysis.compliance_requirements && companyAnalysis.compliance_requirements.length > 0) ? (
                    <ul className="space-y-2">
                      {companyAnalysis.compliance_requirements.map((req, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                          <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-400 italic mb-2">Based on Inflation Reduction Act of 2022:</p>
                      <ul className="space-y-2 text-sm text-gray-300">
                        <li className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                          EV tax credits requiring North American assembly
                        </li>
                        <li className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                          Battery component sourcing from approved countries
                        </li>
                        <li className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                          Clean energy tax credits for renewable energy projects
                        </li>
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-green-400" />
                    Potential Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(companyAnalysis.opportunities && companyAnalysis.opportunities.length > 0) ? (
                    <ul className="space-y-2">
                      {companyAnalysis.opportunities.map((opp, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                          <DollarSign className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                          {opp}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="space-y-2">
                      <ul className="space-y-2 text-sm text-gray-300">
                        <li className="flex items-start gap-2">
                          <DollarSign className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                          Benefit from clean energy tax credits if operations align with regulations
                        </li>
                        <li className="flex items-start gap-2">
                          <DollarSign className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                          Potential market share gains in compliant supply chains
                        </li>
                        <li className="flex items-start gap-2">
                          <DollarSign className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                          Competitive advantage for companies already compliant
                        </li>
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Next Steps */}
            <Card className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 border-blue-500/30">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-white mb-4">Next Steps</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <Link to={createPageUrl('PortfolioDashboard')} className="block">
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white" size="lg">
                      <BarChart3 className="w-5 h-5 mr-2" />
                      View Portfolio Risk Dashboard
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                  <Link to={createPageUrl('RecommendationsEngine')} className="block">
                    <Button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white" size="lg">
                      <Target className="w-5 h-5 mr-2" />
                      Get Portfolio Adjustments
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Available Companies Table */}
        {!isLoadingCompanies && (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">
                Available Companies ({displayCompanies.length})
              </CardTitle>
              <p className="text-sm text-gray-400 mt-1">
                Companies available in dataset. Click "Analyze" to assess regulatory impact.
              </p>
            </CardHeader>
            <CardContent>
              {displayCompanies.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-900 border-b border-gray-700">
                      <tr>
                        <th className="text-left p-3 text-gray-400 font-semibold">TICKER</th>
                        <th className="text-left p-3 text-gray-400 font-semibold">COMPANY</th>
                        <th className="text-center p-3 text-gray-400 font-semibold">ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayCompanies.map((company, idx) => (
                        <tr key={idx} className="border-b border-gray-800 hover:bg-gray-700/50">
                          <td className="p-3 font-mono font-bold text-white">{company.ticker}</td>
                          <td className="p-3 text-white">{company.name}</td>
                          <td className="p-3 text-center">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-blue-600 text-blue-400 hover:bg-blue-900/30"
                              onClick={() => handleAnalyze(company.ticker)}
                              disabled={isAnalyzing}
                            >
                              {isAnalyzing && companyAnalysis?.ticker === company.ticker ? (
                                <>
                                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                  Analyzing...
                                </>
                              ) : (
                                'Analyze'
                              )}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">
                  No companies found in dataset. Please ensure the backend is running and data files are available.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}