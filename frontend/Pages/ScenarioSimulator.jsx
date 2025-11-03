import React, { useState, useEffect } from 'react';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { api } from '@/api/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { 
  Activity, 
  Play, 
  RotateCcw, 
  TrendingUp, 
  TrendingDown,
  Download,
  Check,
  X,
  Loader2,
  BarChart3,
  Sparkles,
  MessageSquare,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import PortfolioPill from '@/components/PortfolioPill';

const SCENARIO_PRESETS = [
  {
    name: 'Tariff - China',
    scenario_type: 'tariff',
    severity: 0.7,
    duration_days: 90,
    parameters: { rate_pct: 25, target_region: 'China' }
  },
  {
    name: 'Export Ban - Technology',
    scenario_type: 'ban',
    severity: 0.8,
    duration_days: 180,
    parameters: { target_region: 'China', target_sector: 'Technology' }
  },
  {
    name: 'Sanction - EU',
    scenario_type: 'sanction',
    severity: 0.6,
    duration_days: 120,
    parameters: { target_region: 'EU' }
  },
  {
    name: 'Carbon Tax Step-up',
    scenario_type: 'carbon_tax',
    severity: 0.5,
    duration_days: 365,
    parameters: { rate_increase_pct: 50 }
  },
  {
    name: 'Supply Chain Disruption',
    scenario_type: 'supply_chain_disruption',
    severity: 0.75,
    duration_days: 60,
    parameters: { country: 'China', disruption_pct: 30 }
  },
  {
    name: 'FX Shock - DXY',
    scenario_type: 'fx_shock',
    severity: 0.4,
    duration_days: 30,
    parameters: { currency: 'DXY', shock_pct: 10 }
  }
];

export default function ScenarioSimulator() {
  const { portfolio, loading: portfolioLoading } = usePortfolio();
  const location = useLocation();
  const [selectedScenarios, setSelectedScenarios] = useState(new Set());
  const [customScenarios, setCustomScenarios] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResults, setSimulationResults] = useState(null);
  const [companyRisks, setCompanyRisks] = useState(null);
  const [scenarioText, setScenarioText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedScenarios, setGeneratedScenarios] = useState([]);
  const [expandedExplanations, setExpandedExplanations] = useState(new Set());

  // Load company risks from navigation state if available
  useEffect(() => {
    if (location.state?.companyRisks) {
      setCompanyRisks(location.state.companyRisks);
    }
  }, [location]);

  const toggleScenario = (preset) => {
    const newSelected = new Set(selectedScenarios);
    if (newSelected.has(preset.name)) {
      newSelected.delete(preset.name);
    } else {
      newSelected.add(preset.name);
    }
    setSelectedScenarios(newSelected);
  };

  const handleSimulate = async () => {
    if (!portfolio || selectedScenarios.size === 0) {
      alert('Please select at least one scenario');
      return;
    }

    setIsSimulating(true);

    try {
      // Build scenarios array - check both presets and generated scenarios
      const scenarios = Array.from(selectedScenarios).map(name => {
        // First check generated scenarios
        const generated = generatedScenarios.find(s => s.name === name);
        if (generated) {
          // Ensure all required fields are present, clean null values from parameters
          let cleanParams = generated.parameters || {};
          if (cleanParams && typeof cleanParams === 'object') {
            cleanParams = Object.fromEntries(
              Object.entries(cleanParams).filter(([_, v]) => v !== null && v !== undefined)
            );
          }
          if (Object.keys(cleanParams).length === 0) {
            cleanParams = null;
          }
          
          return {
            name: generated.name,
            scenario_type: generated.scenario_type,
            severity: generated.severity || 0.5,
            duration_days: generated.duration_days || 90,
            parameters: cleanParams
          };
        }
        
        // Then check presets
        const preset = SCENARIO_PRESETS.find(p => p.name === name);
        if (preset) {
          // Clean null values from parameters
          let cleanParams = preset.parameters || {};
          if (cleanParams && typeof cleanParams === 'object') {
            cleanParams = Object.fromEntries(
              Object.entries(cleanParams).filter(([_, v]) => v !== null && v !== undefined)
            );
          }
          if (Object.keys(cleanParams).length === 0) {
            cleanParams = null;
          }
          
          return {
            name: preset.name,
            scenario_type: preset.scenario_type,
            severity: preset.severity || 0.5,
            duration_days: preset.duration_days || 90,
            parameters: cleanParams
          };
        }
        
        // Fallback
        return {
          name,
          scenario_type: 'tariff',
          severity: 0.5,
          duration_days: 90,
          parameters: null
        };
      });

      // Ensure portfolio has required fields
      const portfolioPayload = {
        asof: portfolio.asof || new Date().toISOString(),
        holdings: portfolio.holdings || {},
        meta: portfolio.meta || null
      };

      // Debug: log the payload being sent
      console.log('Sending scenario request:', {
        portfolio: portfolioPayload,
        scenarios: scenarios,
        company_risks_count: companyRisks?.length || 0
      });

      const response = await api.scenarios.run({
        portfolio: portfolioPayload,
        scenarios: scenarios,
        company_risks: companyRisks || []
      });

      setSimulationResults(response);
    } catch (error) {
      console.error('Simulation error:', error);
      console.error('Error details:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.detail || error.message || 'Error running simulation. Please try again.';
      alert(`Simulation error: ${errorMessage}`);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleReset = () => {
    setSelectedScenarios(new Set());
    setSimulationResults(null);
    setGeneratedScenarios([]);
    setScenarioText('');
  };

  const handleGenerateFromText = async () => {
    if (!scenarioText.trim()) {
      alert('Please enter a scenario description');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await api.scenarios.generateFromText({
        user_request: scenarioText
      });

      if (response.scenarios && response.scenarios.length > 0) {
        setGeneratedScenarios(response.scenarios);
        // Auto-select the first generated scenario
        const newSelected = new Set(selectedScenarios);
        response.scenarios.forEach(scenario => {
          newSelected.add(scenario.name);
        });
        setSelectedScenarios(newSelected);
        setScenarioText(''); // Clear input after successful generation
      } else {
        alert('Could not generate scenarios from your description. Please try again with more details.');
      }
    } catch (error) {
      console.error('Error generating scenarios:', error);
      alert('Error generating scenarios. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const exportToPDF = () => {
    // TODO: Implement PDF export
    alert('PDF export coming soon');
  };

  const results = simulationResults?.results || [];
  const summary = simulationResults?.summary || null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Activity className="w-8 h-8 text-purple-400" />
              Scenario Simulator
            </h1>
            <p className="text-gray-400 mt-1">
              Build and combine scenarios; show P5/P50/P95 portfolio impact
            </p>
          </div>
          <div className="flex items-center gap-4">
            <PortfolioPill />
            <Link to="/">
              <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
                Back to Home
              </Button>
            </Link>
            <Link to="/document-analyzer">
              <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
                Analyze Document
              </Button>
            </Link>
          </div>
        </div>

        {/* Text-based Scenario Generator */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Generate Scenario from Text
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="scenario-text" className="text-gray-300">
                  Describe your scenario (e.g., "A 30% tariff on Chinese imports lasting 6 months" or "Technology export ban to China for 180 days")
                </Label>
                <Textarea
                  id="scenario-text"
                  value={scenarioText}
                  onChange={(e) => setScenarioText(e.target.value)}
                  placeholder="Enter a scenario description..."
                  className="mt-2 bg-gray-900 border-gray-700 text-white min-h-[100px]"
                  disabled={isGenerating}
                />
              </div>
              <Button
                onClick={handleGenerateFromText}
                disabled={isGenerating || !scenarioText.trim()}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Generate Scenario
                  </>
                )}
              </Button>
              {generatedScenarios.length > 0 && (
                <div className="mt-4 p-4 bg-green-900/20 border border-green-600/30 rounded-lg">
                  <p className="text-sm text-green-300 mb-2">
                    ✓ Generated {generatedScenarios.length} scenario(s):
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                    {generatedScenarios.map((scenario, idx) => (
                      <li key={idx}>{scenario.name} ({scenario.scenario_type})</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Scenario Presets */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">
              Scenario Presets {generatedScenarios.length > 0 && <span className="text-sm font-normal text-gray-400">({generatedScenarios.length} generated)</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {/* Show generated scenarios first */}
              {generatedScenarios.map((preset) => {
                const isSelected = selectedScenarios.has(preset.name);
                return (
                  <Card
                    key={preset.name}
                    className={`cursor-pointer transition-all border-purple-500/50 ${
                      isSelected
                        ? 'bg-green-900/30 border-green-600'
                        : 'bg-purple-900/20 border-purple-700 hover:border-purple-600'
                    }`}
                    onClick={() => toggleScenario(preset)}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {isSelected ? (
                            <Check className="w-5 h-5 text-green-400" />
                          ) : (
                            <X className="w-5 h-5 text-gray-500" />
                          )}
                          <span className="text-white font-semibold">{preset.name}</span>
                          <Badge variant="outline" className="border-purple-600 text-purple-300 text-xs ml-2">
                            Generated
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm text-gray-400">
                        <div>Type: {preset.scenario_type}</div>
                        <div>Severity: {(preset.severity * 100).toFixed(0)}%</div>
                        <div>Duration: {preset.duration_days} days</div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {/* Show original presets */}
              {SCENARIO_PRESETS.map((preset) => {
                const isSelected = selectedScenarios.has(preset.name);
                return (
                  <Card
                    key={preset.name}
                    className={`cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-green-900/30 border-green-600'
                        : 'bg-gray-900 border-gray-700 hover:border-gray-600'
                    }`}
                    onClick={() => toggleScenario(preset)}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {isSelected ? (
                            <Check className="w-5 h-5 text-green-400" />
                          ) : (
                            <X className="w-5 h-5 text-gray-500" />
                          )}
                          <span className="text-white font-semibold">{preset.name}</span>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm text-gray-400">
                        <div>Type: {preset.scenario_type}</div>
                        <div>Severity: {(preset.severity * 100).toFixed(0)}%</div>
                        <div>Duration: {preset.duration_days} days</div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Simulation Controls */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Simulation Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button
                onClick={handleSimulate}
                disabled={isSimulating || portfolioLoading || selectedScenarios.size === 0}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isSimulating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run Simulation
                  </>
                )}
              </Button>
              <Button
                onClick={handleReset}
                variant="outline"
                className="border-gray-700 text-white hover:bg-gray-800"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              {simulationResults && (
                <Button
                  onClick={exportToPDF}
                  variant="outline"
                  className="border-gray-700 text-white hover:bg-gray-800"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
              )}
            </div>
            <div className="mt-4">
              <Badge variant="outline" className="border-gray-600 text-gray-300">
                Selected: {selectedScenarios.size} scenario{selectedScenarios.size !== 1 ? 's' : ''}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {simulationResults && (
          <div className="space-y-6">
            {/* P5/P50/P95 Chart */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Portfolio Impact Distribution (P5/P50/P95)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={results.map((r, i) => ({
                    scenario: r.scenario_name || `Scenario ${i + 1}`,
                    p5: r.p5 || 0,
                    p50: r.p50 || 0,
                    p95: r.p95 || 0
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="scenario" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" label={{ value: 'Impact (bps)', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF' } }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1F2937', border: '#374151', color: '#F9FAFB' }}
                      labelStyle={{ color: '#F9FAFB' }}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="p5" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} name="P5 (5th percentile)" />
                    <Area type="monotone" dataKey="p50" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.5} name="P50 (Median)" />
                    <Area type="monotone" dataKey="p95" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} name="P95 (95th percentile)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Scenario Results Table */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Scenario Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left text-gray-300 p-2">Scenario</th>
                        <th className="text-left text-gray-300 p-2">P5</th>
                        <th className="text-left text-gray-300 p-2">P50 (Median)</th>
                        <th className="text-left text-gray-300 p-2">P95</th>
                        <th className="text-left text-gray-300 p-2">Expected Impact</th>
                        <th className="text-left text-gray-300 p-2">Risk Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((result, index) => (
                        <tr key={index} className="border-b border-gray-700 hover:bg-gray-900">
                          <td className="text-white p-2 font-semibold">{result.scenario_name || `Scenario ${index + 1}`}</td>
                          <td className="text-blue-300 p-2">{result.p5?.toFixed(1) || 'N/A'} bps</td>
                          <td className="text-green-300 p-2 font-semibold">{result.p50?.toFixed(1) || 'N/A'} bps</td>
                          <td className="text-red-300 p-2">{result.p95?.toFixed(1) || 'N/A'} bps</td>
                          <td className="text-white p-2">
                            {result.expected_portfolio_impact_pct?.toFixed(2) || 'N/A'}%
                          </td>
                          <td className="p-2">
                            <Badge
                              variant="outline"
                              className={
                                result.risk_rating === 'Critical' ? 'border-red-600 text-red-300' :
                                result.risk_rating === 'High' ? 'border-orange-600 text-orange-300' :
                                result.risk_rating === 'Medium' ? 'border-yellow-600 text-yellow-300' :
                                'border-green-600 text-green-300'
                              }
                            >
                              {result.risk_rating || 'N/A'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Scenario Explanations */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-400" />
                  Impact Explanations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {results.map((result, index) => {
                    const isExpanded = expandedExplanations.has(index);
                    const explanation = result.explanation || 'No explanation available for this scenario.';
                    
                    return (
                      <Card
                        key={index}
                        className="bg-gray-900 border-gray-700 overflow-hidden"
                      >
                        <CardHeader
                          className="cursor-pointer hover:bg-gray-800/50 transition-colors"
                          onClick={() => {
                            const newExpanded = new Set(expandedExplanations);
                            if (isExpanded) {
                              newExpanded.delete(index);
                            } else {
                              newExpanded.add(index);
                            }
                            setExpandedExplanations(newExpanded);
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-white text-lg flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                              {result.scenario_name || `Scenario ${index + 1}`}
                              <Badge
                                variant="outline"
                                className={
                                  result.risk_rating === 'Critical' ? 'border-red-600 text-red-300' :
                                  result.risk_rating === 'High' ? 'border-orange-600 text-orange-300' :
                                  result.risk_rating === 'Medium' ? 'border-yellow-600 text-yellow-300' :
                                  'border-green-600 text-green-300'
                                }
                              >
                                {result.risk_rating || 'N/A'}
                              </Badge>
                            </CardTitle>
                            <div className="text-sm text-gray-400">
                              Impact: {result.expected_portfolio_impact_pct?.toFixed(2) || 'N/A'}%
                            </div>
                          </div>
                        </CardHeader>
                        {isExpanded && (
                          <CardContent className="pt-0">
                            <div className="prose prose-invert max-w-none">
                              <div className="text-gray-300 whitespace-pre-line text-sm leading-relaxed space-y-2">
                                {explanation.split('\n').map((line, lineIdx) => {
                                  // Format markdown-style bold
                                  const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
                                  return (
                                    <div
                                      key={lineIdx}
                                      dangerouslySetInnerHTML={{ __html: formattedLine }}
                                      className={line.startsWith('•') ? 'ml-4' : line.startsWith('**') ? 'font-semibold text-white mt-4' : ''}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Summary */}
            {summary && (
              <Card className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border-blue-500/30">
                <CardHeader>
                  <CardTitle className="text-white">Simulation Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {summary.best_case && (
                      <div className="bg-gray-900/50 p-4 rounded-lg">
                        <div className="text-sm text-gray-400 mb-1">Best Case</div>
                        <div className="text-2xl font-bold text-green-400">
                          {summary.best_case.expected_portfolio_impact_pct?.toFixed(2) || 'N/A'}%
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {summary.best_case.scenario_name || 'Scenario'}
                        </div>
                      </div>
                    )}
                    {summary.expected_case && (
                      <div className="bg-gray-900/50 p-4 rounded-lg">
                        <div className="text-sm text-gray-400 mb-1">Expected Case</div>
                        <div className="text-2xl font-bold text-white">
                          {summary.expected_case.expected_portfolio_impact_pct?.toFixed(2) || 'N/A'}%
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {summary.expected_case.scenario_name || 'Scenario'}
                        </div>
                      </div>
                    )}
                    {summary.worst_case && (
                      <div className="bg-gray-900/50 p-4 rounded-lg">
                        <div className="text-sm text-gray-400 mb-1">Worst Case</div>
                        <div className="text-2xl font-bold text-red-400">
                          {summary.worst_case.expected_portfolio_impact_pct?.toFixed(2) || 'N/A'}%
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {summary.worst_case.scenario_name || 'Scenario'}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
