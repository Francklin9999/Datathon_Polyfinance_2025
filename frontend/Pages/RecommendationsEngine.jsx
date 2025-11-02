import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  TrendingUp, 
  RefreshCw,
  Download,
  Check,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function RecommendationsEngine() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const prompt = `You are a portfolio manager providing concrete portfolio adjustments based on regulatory risk analysis.

Current Portfolio: S&P 500 with weighted risk score of 62 (threshold: 60)
High Risk Sectors: Technology (68), Healthcare (72), Communication (75)
High Risk Geographic Exposure: China (82 risk score, 18% exposure)

Generate specific, actionable recommendations with this JSON structure:

{
  "sector_rotation": [
    {
      "action": "REDUCE/INCREASE",
      "sector": "sector name",
      "current_weight": "percentage",
      "target_weight": "percentage",
      "change": "percentage points",
      "reason": "explanation"
    }
  ],
  "stock_replacements": [
    {
      "sell": "ticker",
      "sell_name": "company name",
      "sell_risk_score": number,
      "buy": "ticker",
      "buy_name": "company name",
      "buy_risk_score": number,
      "sector": "sector",
      "reason": "explanation"
    }
  ],
  "geographic_reallocation": [
    {
      "region": "region name",
      "current_exposure": "percentage",
      "target_exposure": "percentage",
      "change": "percentage points",
      "reason": "explanation"
    }
  ],
  "expected_outcomes": {
    "risk_score_reduction": "points",
    "estimated_return_impact": "percentage",
    "diversification_improvement": "description"
  }
}

Provide 3-4 sector rotations, 5 stock replacements, 3 geographic reallocations.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            sector_rotation: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  action: { type: "string" },
                  sector: { type: "string" },
                  current_weight: { type: "string" },
                  target_weight: { type: "string" },
                  change: { type: "string" },
                  reason: { type: "string" }
                }
              }
            },
            stock_replacements: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  sell: { type: "string" },
                  sell_name: { type: "string" },
                  sell_risk_score: { type: "number" },
                  buy: { type: "string" },
                  buy_name: { type: "string" },
                  buy_risk_score: { type: "number" },
                  sector: { type: "string" },
                  reason: { type: "string" }
                }
              }
            },
            geographic_reallocation: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  region: { type: "string" },
                  current_exposure: { type: "string" },
                  target_exposure: { type: "string" },
                  change: { type: "string" },
                  reason: { type: "string" }
                }
              }
            },
            expected_outcomes: {
              type: "object",
              properties: {
                risk_score_reduction: { type: "string" },
                estimated_return_impact: { type: "string" },
                diversification_improvement: { type: "string" }
              }
            }
          }
        }
      });

      // Handle string responses (if backend returns JSON string)
      let parsedResult = result;
      if (typeof result === 'string') {
        try {
          parsedResult = JSON.parse(result);
        } catch (e) {
          console.error('Failed to parse string response:', e);
        }
      }

      // Check if result has error fields
      if (parsedResult && (parsedResult.error || parsedResult.parse_error)) {
        console.error('Generation error:', parsedResult);
        // Try to extract JSON from raw_response if available
        if (parsedResult.raw_response) {
          try {
            const jsonMatch = parsedResult.raw_response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              setRecommendations(parsed);
              setIsGenerating(false);
              return;
            }
          } catch (e) {
            console.error('Failed to parse JSON from raw response:', e);
          }
        }
      }
      
      // Check if result has expected structure
      if (parsedResult && (parsedResult.sector_rotation || parsedResult.stock_replacements || parsedResult.expected_outcomes)) {
        // Ensure expected_outcomes exists with all required fields
        if (!parsedResult.expected_outcomes) {
          parsedResult.expected_outcomes = {
            risk_score_reduction: 'N/A',
            estimated_return_impact: 'N/A',
            diversification_improvement: 'N/A'
          };
        }
        setRecommendations(parsedResult);
      } else {
        console.error('Unexpected result format:', parsedResult);
        // Use fallback demo data (will be set in catch block below)
        throw new Error(`Invalid result format. Received: ${JSON.stringify(parsedResult).substring(0, 200)}`);
      }
    } catch (error) {
      console.error('Generation error:', error);
      setError(`Failed to generate recommendations: ${error.message || 'Unknown error'}. Showing demo data.`);
      // Fallback demo data
      setRecommendations({
        sector_rotation: [
          {
            action: "REDUCE",
            sector: "Technology",
            current_weight: "28.5%",
            target_weight: "23.5%",
            change: "-5.0%",
            reason: "High China exposure and tariff sensitivity"
          },
          {
            action: "REDUCE",
            sector: "Communication Services",
            current_weight: "8.7%",
            target_weight: "6.5%",
            change: "-2.2%",
            reason: "Regulatory headwinds (GDPR, antitrust)"
          },
          {
            action: "INCREASE",
            sector: "Utilities",
            current_weight: "3.2%",
            target_weight: "5.5%",
            change: "+2.3%",
            reason: "Defensive play with low regulatory risk"
          },
          {
            action: "INCREASE",
            sector: "Consumer Staples",
            current_weight: "6.5%",
            target_weight: "11.4%",
            change: "+4.9%",
            reason: "Resilient to trade tensions, domestic focus"
          }
        ],
        stock_replacements: [
          {
            sell: "TSLA",
            sell_name: "Tesla Inc.",
            sell_risk_score: 85,
            buy: "F",
            buy_name: "Ford Motor",
            buy_risk_score: 48,
            sector: "Automotive",
            reason: "Lower China exposure, established US manufacturing"
          },
          {
            sell: "META",
            sell_name: "Meta Platforms",
            sell_risk_score: 88,
            buy: "CMCSA",
            buy_name: "Comcast",
            buy_risk_score: 42,
            sector: "Communication",
            reason: "Less regulatory scrutiny, domestic infrastructure focus"
          },
          {
            sell: "JNJ",
            sell_name: "Johnson & Johnson",
            sell_risk_score: 92,
            buy: "UNH",
            buy_name: "UnitedHealth",
            buy_risk_score: 38,
            sector: "Healthcare",
            reason: "Managed care less exposed to product liability"
          },
          {
            sell: "NVDA",
            sell_name: "NVIDIA",
            sell_risk_score: 78,
            buy: "INTC",
            buy_name: "Intel",
            buy_risk_score: 52,
            sector: "Technology",
            reason: "US-based manufacturing, lower China revenue"
          },
          {
            sell: "GOOGL",
            sell_name: "Alphabet",
            sell_risk_score: 82,
            buy: "ORCL",
            buy_name: "Oracle",
            buy_risk_score: 45,
            sector: "Technology",
            reason: "Enterprise focus, less antitrust exposure"
          }
        ],
        geographic_reallocation: [
          {
            region: "China",
            current_exposure: "18%",
            target_exposure: "12%",
            change: "-6%",
            reason: "Reduce exposure due to tariff risks and regulatory uncertainty"
          },
          {
            region: "USA",
            current_exposure: "55%",
            target_exposure: "62%",
            change: "+7%",
            reason: "Increase domestic exposure for stability"
          },
          {
            region: "Europe",
            current_exposure: "15%",
            target_exposure: "14%",
            change: "-1%",
            reason: "Slight reduction due to GDPR compliance costs"
          }
        ],
        expected_outcomes: {
          risk_score_reduction: "-8 points (from 62 to 54)",
          estimated_return_impact: "-0.3% to -0.5% short-term, +0.8% to +1.2% long-term",
          diversification_improvement: "Reduced geographic concentration risk, improved sector balance"
        }
      });
    }

    setIsGenerating(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Target className="w-8 h-8 text-yellow-400" />
              Portfolio Recommendations Engine
            </h1>
            <p className="text-gray-400 mt-1">AI-generated concrete portfolio adjustments based on regulatory risk analysis</p>
          </div>
          <Link to={createPageUrl('Home')}>
            <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Generate Button */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-6">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full bg-yellow-600 hover:bg-yellow-700"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating Recommendations with AI...
                </>
              ) : (
                <>
                  <Target className="w-5 h-5 mr-2" />
                  Generate Portfolio Adjustments
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="bg-red-900/20 border-red-500/30">
            <CardContent className="p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!recommendations && !isGenerating && (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-8 text-center">
              <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Recommendations Yet</h3>
              <p className="text-gray-400 mb-4">
                Click the button above to generate AI-powered portfolio recommendations based on regulatory risk analysis.
              </p>
              <p className="text-sm text-gray-500">
                The recommendations will include sector rotations, stock replacements, geographic reallocations, and expected outcomes.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Recommendations */}
        {recommendations && (
          <>
            {/* Expected Outcomes */}
            <Card className="bg-gradient-to-br from-green-900/20 to-blue-900/20 border-green-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-400" />
                  Expected Outcomes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-gray-900/50 p-4 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Risk Score Reduction</p>
                    <p className="text-2xl font-bold text-green-400">{recommendations?.expected_outcomes?.risk_score_reduction || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-900/50 p-4 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Return Impact</p>
                    <p className="text-lg font-bold text-white">{recommendations?.expected_outcomes?.estimated_return_impact || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-900/50 p-4 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Diversification</p>
                    <p className="text-sm text-white">{recommendations?.expected_outcomes?.diversification_improvement || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sector Rotation */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-blue-400" />
                  Sector Rotation Strategy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(recommendations?.sector_rotation || []).map((rotation, idx) => (
                    <div key={idx} className={`p-4 rounded-lg border ${
                      rotation.action === 'REDUCE' ? 'bg-red-900/20 border-red-500/30' : 'bg-green-900/20 border-green-500/30'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Badge className={rotation.action === 'REDUCE' ? 'bg-red-600' : 'bg-green-600'}>
                            {rotation.action}
                          </Badge>
                          <h4 className="font-bold text-white">{rotation.sector}</h4>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">Change</p>
                          <p className={`text-xl font-bold ${rotation.action === 'REDUCE' ? 'text-red-400' : 'text-green-400'}`}>
                            {rotation.change}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-2">
                        <div>
                          <p className="text-xs text-gray-400">Current Weight</p>
                          <p className="text-white font-mono">{rotation.current_weight}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Target Weight</p>
                          <p className="text-white font-mono">{rotation.target_weight}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-300">{rotation.reason}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Stock Replacements */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-orange-400" />
                  Recommended Stock Replacements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(recommendations?.stock_replacements || []).map((replacement, idx) => (
                    <div key={idx} className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-xs text-gray-400 mb-1">SELL</p>
                            <p className="text-lg font-mono font-bold text-red-400">{replacement.sell}</p>
                            <p className="text-xs text-gray-500">{replacement.sell_name}</p>
                            <Badge className="bg-red-600 mt-1 text-xs">Risk: {replacement.sell_risk_score}</Badge>
                          </div>
                          <ArrowRight className="w-6 h-6 text-gray-500" />
                          <div className="text-center">
                            <p className="text-xs text-gray-400 mb-1">BUY</p>
                            <p className="text-lg font-mono font-bold text-green-400">{replacement.buy}</p>
                            <p className="text-xs text-gray-500">{replacement.buy_name}</p>
                            <Badge className="bg-green-600 mt-1 text-xs">Risk: {replacement.buy_risk_score}</Badge>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-white">{replacement.sector}</Badge>
                      </div>
                      <p className="text-sm text-gray-300">{replacement.reason}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Geographic Reallocation */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Geographic Reallocation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(recommendations?.geographic_reallocation || []).map((geo, idx) => (
                    <div key={idx} className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-white">{geo.region}</h4>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">Change</p>
                          <p className={`text-xl font-bold ${geo.change.startsWith('-') ? 'text-red-400' : 'text-green-400'}`}>
                            {geo.change}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-2">
                        <div>
                          <p className="text-xs text-gray-400">Current Exposure</p>
                          <p className="text-white font-mono">{geo.current_exposure}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Target Exposure</p>
                          <p className="text-white font-mono">{geo.target_exposure}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-300">{geo.reason}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Export */}
            <Card className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 border-blue-500/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Export Recommendations</h3>
                    <p className="text-gray-400">Download complete portfolio adjustment report</p>
                  </div>
                  <Button className="bg-blue-600 hover:bg-blue-700" size="lg">
                    <Download className="w-5 h-5 mr-2" />
                    Export PDF Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}