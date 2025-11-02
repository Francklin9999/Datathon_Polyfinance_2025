import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Activity, Play, RotateCcw, TrendingUp, TrendingDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ScenarioSimulator() {
  const [tariffRate, setTariffRate] = useState([25]);
  const [geographicScope, setGeographicScope] = useState('China');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResults, setSimulationResults] = useState(null);

  const handleSimulate = () => {
    setIsSimulating(true);
    
    setTimeout(() => {
      const baseImpact = -2.5;
      const tariffMultiplier = tariffRate[0] / 25;
      const totalImpact = baseImpact * tariffMultiplier;

      setSimulationResults({
        totalImpact: totalImpact.toFixed(2),
        affectedCompanies: Math.floor(135 * tariffMultiplier),
        sectorImpacts: [
          { sector: 'Technology', before: -2.8, after: -2.8 * tariffMultiplier },
          { sector: 'Consumer Discretionary', before: -3.5, after: -3.5 * tariffMultiplier },
          { sector: 'Industrials', before: -2.1, after: -2.1 * tariffMultiplier },
          { sector: 'Healthcare', before: -1.2, after: -1.2 * tariffMultiplier },
          { sector: 'Materials', before: -2.9, after: -2.9 * tariffMultiplier }
        ],
        projectedReturns: Array.from({ length: 12 }, (_, i) => ({
          month: `M${i + 1}`,
          baseline: 8 - Math.random() * 2,
          withRegulation: 8 + totalImpact - Math.random() * 2
        }))
      });

      setIsSimulating(false);
    }, 1500);
  };

  const handleReset = () => {
    setTariffRate([25]);
    setGeographicScope('China');
    setSimulationResults(null);
  };

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
            <p className="text-gray-400 mt-1">Model different regulatory scenarios and measure real-time portfolio impact</p>
          </div>
          <Link to={createPageUrl('Home')}>
            <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Scenario Configuration */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Configure Scenario Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-white mb-2 block">Tariff Rate: {tariffRate[0]}%</Label>
              <Slider
                value={tariffRate}
                onValueChange={setTariffRate}
                max={100}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            <div>
              <Label className="text-white mb-2 block">Geographic Scope</Label>
              <div className="grid grid-cols-4 gap-2">
                {['China', 'EU', 'Global', 'Emerging Markets'].map((scope) => (
                  <Button
                    key={scope}
                    variant={geographicScope === scope ? 'default' : 'outline'}
                    onClick={() => setGeographicScope(scope)}
                    className={geographicScope === scope ? 'bg-purple-600' : 'border-gray-600 text-white'}
                  >
                    {scope}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleSimulate}
                disabled={isSimulating}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
                size="lg"
              >
                {isSimulating ? (
                  <>
                    <RotateCcw className="w-5 h-5 mr-2 animate-spin" />
                    Simulating...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Run Simulation
                  </>
                )}
              </Button>
              <Button
                onClick={handleReset}
                variant="outline"
                className="border-gray-700 text-white hover:bg-gray-800"
                size="lg"
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Simulation Results */}
        {simulationResults && (
          <>
            <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white">Simulation Results Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-gray-900/50 p-4 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Portfolio Impact</p>
                    <p className={`text-3xl font-bold ${parseFloat(simulationResults.totalImpact) < 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {simulationResults.totalImpact}%
                    </p>
                  </div>
                  <div className="bg-gray-900/50 p-4 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Affected Companies</p>
                    <p className="text-3xl font-bold text-white">{simulationResults.affectedCompanies}</p>
                  </div>
                  <div className="bg-gray-900/50 p-4 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Estimated Loss</p>
                    <p className="text-3xl font-bold text-red-400">
                      ${(Math.abs(parseFloat(simulationResults.totalImpact)) * 8.5).toFixed(1)}B
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Sector Impact Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={simulationResults.sectorImpacts}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="sector" stroke="#9CA3AF" angle={-15} textAnchor="end" height={80} fontSize={11} />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
                      <Legend />
                      <Bar dataKey="before" fill="#6B7280" name="Before" />
                      <Bar dataKey="after" fill="#F59E0B" name="After Simulation" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">12-Month Return Projection</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={simulationResults.projectedReturns}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
                      <Legend />
                      <Line type="monotone" dataKey="baseline" stroke="#10B981" strokeWidth={2} name="Baseline" />
                      <Line type="monotone" dataKey="withRegulation" stroke="#EF4444" strokeWidth={2} name="With Regulation" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Scenario Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                    <p className="text-sm font-semibold text-red-300 mb-2 flex items-center gap-2">
                      <TrendingDown className="w-4 h-4" />
                      Negative Impact Drivers
                    </p>
                    <ul className="text-sm text-gray-300 space-y-1 ml-6">
                      <li>• Technology sector most exposed due to {geographicScope} manufacturing</li>
                      <li>• {tariffRate[0]}% tariff rate directly impacts supply chain costs</li>
                      <li>• Consumer Discretionary affected by reduced purchasing power</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                    <p className="text-sm font-semibold text-green-300 mb-2 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Mitigation Opportunities
                    </p>
                    <ul className="text-sm text-gray-300 space-y-1 ml-6">
                      <li>• Rotate into domestic-focused companies (Utilities, Financials)</li>
                      <li>• Increase Healthcare allocation (less trade-sensitive)</li>
                      <li>• Consider hedging with inverse ETFs or put options</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 border-blue-500/30">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-white mb-4">Next Steps</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <Link to={createPageUrl('RecommendationsEngine')} className="block">
                    <Button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white" size="lg">
                      View Recommended Adjustments
                    </Button>
                  </Link>
                  <Link to={createPageUrl('PortfolioDashboard')} className="block">
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white" size="lg">
                      Return to Dashboard
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}