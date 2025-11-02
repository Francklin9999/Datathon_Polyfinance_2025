import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Leaf, Users, Shield, TrendingUp, AlertTriangle, Award, Target } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

export default function ESGAnalytics() {
  const [view, setView] = useState('portfolio');

  // Portfolio ESG Score
  const portfolioESG = {
    overall: 78,
    environmental: 82,
    social: 75,
    governance: 77,
    trend: 'improving',
    change: 5.2
  };

  // ESG Score Breakdown
  const esgBreakdown = [
    { category: 'Environmental', score: 82, benchmark: 75, fullMark: 100 },
    { category: 'Social', score: 75, benchmark: 72, fullMark: 100 },
    { category: 'Governance', score: 77, benchmark: 78, fullMark: 100 },
    { category: 'Sustainability', score: 80, benchmark: 70, fullMark: 100 },
    { category: 'Ethics', score: 85, benchmark: 80, fullMark: 100 }
  ];

  // Portfolio Holdings ESG
  const holdingsESG = [
    { 
      name: 'Tech Corp A', 
      ticker: 'TCHA', 
      weight: 8.5, 
      esgScore: 88, 
      environmental: 92, 
      social: 85, 
      governance: 87,
      controversies: 0,
      trend: 'up'
    },
    { 
      name: 'Energy Co B', 
      ticker: 'ENERB', 
      weight: 6.2, 
      esgScore: 62, 
      environmental: 55, 
      social: 68, 
      governance: 65,
      controversies: 2,
      trend: 'neutral'
    },
    { 
      name: 'Finance Inc C', 
      ticker: 'FINC', 
      weight: 7.8, 
      esgScore: 75, 
      environmental: 70, 
      social: 78, 
      governance: 78,
      controversies: 0,
      trend: 'up'
    },
    { 
      name: 'Manufacturing D', 
      ticker: 'MANUD', 
      weight: 5.3, 
      esgScore: 68, 
      environmental: 60, 
      social: 72, 
      governance: 72,
      controversies: 1,
      trend: 'neutral'
    },
    { 
      name: 'Healthcare E', 
      ticker: 'HLTHE', 
      weight: 9.1, 
      esgScore: 82, 
      environmental: 78, 
      social: 88, 
      governance: 80,
      controversies: 0,
      trend: 'up'
    }
  ];

  // Carbon Footprint
  const carbonData = [
    { month: 'Jan', scope1: 1200, scope2: 800, scope3: 2000 },
    { month: 'Feb', scope1: 1150, scope2: 780, scope3: 1950 },
    { month: 'Mar', scope1: 1100, scope2: 750, scope3: 1900 },
    { month: 'Apr', scope1: 1080, scope2: 730, scope3: 1850 },
    { month: 'May', scope1: 1050, scope2: 710, scope3: 1800 },
    { month: 'Jun', scope1: 1020, scope2: 690, scope3: 1750 }
  ];

  // Sector ESG Comparison
  const sectorComparison = [
    { sector: 'Technology', portfolioScore: 85, sectorAverage: 78, difference: 7 },
    { sector: 'Healthcare', portfolioScore: 82, sectorAverage: 80, difference: 2 },
    { sector: 'Financials', portfolioScore: 75, sectorAverage: 72, difference: 3 },
    { sector: 'Energy', portfolioScore: 62, sectorAverage: 58, difference: 4 },
    { sector: 'Industrials', portfolioScore: 68, sectorAverage: 65, difference: 3 },
    { sector: 'Consumer', portfolioScore: 78, sectorAverage: 75, difference: 3 }
  ];

  // ESG Risk Events
  const riskEvents = [
    {
      company: 'Energy Co B',
      event: 'Environmental violation reported',
      severity: 'Medium',
      date: '2025-01-10',
      impactScore: -8,
      status: 'Monitoring'
    },
    {
      company: 'Manufacturing D',
      event: 'Labor dispute in supply chain',
      severity: 'Low',
      date: '2025-01-15',
      impactScore: -3,
      status: 'Resolved'
    }
  ];

  // UN SDG Alignment
  const sdgAlignment = [
    { goal: 'Climate Action', alignment: 85, icon: '🌍' },
    { goal: 'Clean Energy', alignment: 78, icon: '⚡' },
    { goal: 'Gender Equality', alignment: 72, icon: '⚖️' },
    { goal: 'Decent Work', alignment: 80, icon: '💼' },
    { goal: 'Sustainable Cities', alignment: 68, icon: '🏙️' },
    { goal: 'Responsible Consumption', alignment: 75, icon: '♻️' }
  ];

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBadgeColor = (score) => {
    if (score >= 80) return 'bg-green-600';
    if (score >= 60) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Leaf className="w-8 h-8 text-green-400" />
            ESG Analytics Dashboard
          </h1>
          <p className="text-gray-400 mt-1">Environmental, Social, and Governance performance tracking for institutional portfolios</p>
        </div>

        {/* Portfolio ESG Score */}
        <Card className="bg-gradient-to-br from-green-900/20 to-blue-900/20 border-green-500/30">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-4 gap-6">
              <div className="flex flex-col items-center justify-center">
                <p className="text-sm text-gray-400 mb-2">Overall ESG Score</p>
                <p className="text-6xl font-bold text-white mb-2">{portfolioESG.overall}</p>
                <Badge className="bg-green-600 mb-2">A Rating</Badge>
                <div className="flex items-center gap-1 text-green-400 text-sm">
                  <TrendingUp className="w-4 h-4" />
                  <span>+{portfolioESG.change} vs last quarter</span>
                </div>
              </div>

              <div className="md:col-span-3 grid grid-cols-3 gap-4">
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Leaf className="w-4 h-4 text-green-400" />
                      <p className="text-xs text-gray-400">Environmental</p>
                    </div>
                    <p className="text-3xl font-bold text-white mb-2">{portfolioESG.environmental}</p>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: `${portfolioESG.environmental}%` }} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800/50 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-blue-400" />
                      <p className="text-xs text-gray-400">Social</p>
                    </div>
                    <p className="text-3xl font-bold text-white mb-2">{portfolioESG.social}</p>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${portfolioESG.social}%` }} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800/50 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-purple-400" />
                      <p className="text-xs text-gray-400">Governance</p>
                    </div>
                    <p className="text-3xl font-bold text-white mb-2">{portfolioESG.governance}</p>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500" style={{ width: `${portfolioESG.governance}%` }} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* ESG Radar Chart */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">ESG Performance vs Benchmark</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={esgBreakdown}>
                  <PolarGrid stroke="#374151" />
                  <PolarAngleAxis dataKey="category" stroke="#9CA3AF" />
                  <PolarRadiusAxis stroke="#9CA3AF" />
                  <Radar name="Portfolio" dataKey="score" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
                  <Radar name="Benchmark" dataKey="benchmark" stroke="#6B7280" fill="#6B7280" fillOpacity={0.3} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Carbon Footprint */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Carbon Footprint Trend (tCO2e)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={carbonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
                  <Legend />
                  <Bar dataKey="scope1" stackId="a" fill="#EF4444" name="Scope 1" />
                  <Bar dataKey="scope2" stackId="a" fill="#F59E0B" name="Scope 2" />
                  <Bar dataKey="scope3" stackId="a" fill="#6B7280" name="Scope 3" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                <p className="text-sm text-green-300">
                  <TrendingUp className="w-4 h-4 inline mr-1" />
                  Carbon emissions decreased 15% over the last 6 months through strategic portfolio adjustments
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Holdings ESG Breakdown */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Top Holdings ESG Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-900 border-b border-gray-700">
                  <tr>
                    <th className="text-left p-3 text-gray-400 font-semibold">COMPANY</th>
                    <th className="text-right p-3 text-gray-400 font-semibold">WEIGHT</th>
                    <th className="text-right p-3 text-gray-400 font-semibold">ESG SCORE</th>
                    <th className="text-right p-3 text-gray-400 font-semibold">E</th>
                    <th className="text-right p-3 text-gray-400 font-semibold">S</th>
                    <th className="text-right p-3 text-gray-400 font-semibold">G</th>
                    <th className="text-center p-3 text-gray-400 font-semibold">CONTROVERSIES</th>
                    <th className="text-center p-3 text-gray-400 font-semibold">TREND</th>
                  </tr>
                </thead>
                <tbody>
                  {holdingsESG.map((holding, idx) => (
                    <tr key={idx} className="border-b border-gray-800 hover:bg-gray-700/50">
                      <td className="p-3">
                        <div>
                          <p className="font-semibold text-white">{holding.name}</p>
                          <p className="text-xs text-gray-400">{holding.ticker}</p>
                        </div>
                      </td>
                      <td className="p-3 text-right font-mono text-white">{holding.weight}%</td>
                      <td className="p-3 text-right">
                        <Badge className={getScoreBadgeColor(holding.esgScore)}>
                          {holding.esgScore}
                        </Badge>
                      </td>
                      <td className={`p-3 text-right font-mono ${getScoreColor(holding.environmental)}`}>
                        {holding.environmental}
                      </td>
                      <td className={`p-3 text-right font-mono ${getScoreColor(holding.social)}`}>
                        {holding.social}
                      </td>
                      <td className={`p-3 text-right font-mono ${getScoreColor(holding.governance)}`}>
                        {holding.governance}
                      </td>
                      <td className="p-3 text-center">
                        {holding.controversies > 0 ? (
                          <Badge className="bg-yellow-600">{holding.controversies}</Badge>
                        ) : (
                          <span className="text-green-400">None</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {holding.trend === 'up' && <TrendingUp className="w-5 h-5 text-green-400 mx-auto" />}
                        {holding.trend === 'neutral' && <span className="text-gray-400">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Sector Comparison */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Sector ESG Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sectorComparison} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9CA3AF" />
                  <YAxis dataKey="sector" type="category" stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
                  <Legend />
                  <Bar dataKey="portfolioScore" fill="#10B981" name="Portfolio" />
                  <Bar dataKey="sectorAverage" fill="#6B7280" name="Sector Avg" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* UN SDG Alignment */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">UN SDG Alignment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sdgAlignment.map((sdg, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-2xl">{sdg.icon}</span>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-300">{sdg.goal}</span>
                        <span className="text-sm font-semibold text-white">{sdg.alignment}%</span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-green-500 to-blue-500"
                          style={{ width: `${sdg.alignment}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ESG Risk Events */}
        {riskEvents.length > 0 && (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                ESG Risk Events & Controversies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {riskEvents.map((event, idx) => (
                  <div key={idx} className="p-4 bg-gray-900/50 rounded-lg border-l-4 border-yellow-500">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="text-white font-semibold">{event.company}</h4>
                        <p className="text-sm text-gray-300 mt-1">{event.event}</p>
                      </div>
                      <Badge className={event.severity === 'High' ? 'bg-red-600' : event.severity === 'Medium' ? 'bg-yellow-600' : 'bg-blue-600'}>
                        {event.severity}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
                      <span>{event.date}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-red-400">Impact: {event.impactScore} pts</span>
                        <Badge variant="outline" className="text-xs">
                          {event.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}