import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  FileText, 
  TrendingDown, 
  Target,
  BarChart3,
  ArrowRight,
  AlertTriangle,
  Brain,
  Shield,
  Activity,
  Globe,
  Building2,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <Shield className="w-12 h-12 text-white" />
              </div>
            </div>
            <h1 className="text-6xl font-bold text-white mb-4">
              Regulatory Impact Analyzer
            </h1>
            <p className="text-2xl text-gray-300 mb-4">
              Transform Regulatory Complexity into Portfolio Opportunity
            </p>
            <p className="text-lg text-gray-400 max-w-4xl mx-auto leading-relaxed">
              An AI-powered platform that automatically analyzes regulatory documents (laws, directives, sanctions) 
              to assess their impact on S&P 500 companies and generate actionable portfolio recommendations.
            </p>
            
            <div className="mt-8 flex gap-4 justify-center">
              <Link to={createPageUrl('RegulatoryAnalyzer')}>
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg px-8 py-6">
                  <FileText className="w-6 h-6 mr-2" />
                  Analyze a Document
                  <ArrowRight className="w-6 h-6 ml-2" />
                </Button>
              </Link>
              <Link to={createPageUrl('PortfolioDashboard')}>
                <Button size="lg" variant="outline" className="border-gray-600 text-white hover:bg-gray-800 text-lg px-8 py-6">
                  <BarChart3 className="w-6 h-6 mr-2" />
                  View Demo Dashboard
                </Button>
              </Link>
            </div>
          </div>

          {/* Problem Statement */}
          <Card className="bg-gradient-to-br from-red-900/20 to-orange-900/20 border-red-500/30 mb-12">
            <CardContent className="p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-3">The Challenge</h3>
                  <p className="text-gray-300 text-lg leading-relaxed mb-4">
                    Financial markets are increasingly influenced by complex regulations, protectionist laws, and economic sanctions. 
                    Traditional analysis is slow, manual, and error-prone. Portfolio managers need hours or days to assess impact 
                    on their holdings.
                  </p>
                  <div className="grid md:grid-cols-3 gap-4 mt-4">
                    <div className="bg-gray-900/50 p-4 rounded-lg">
                      <p className="text-3xl font-bold text-red-400 mb-1">72+ Hours</p>
                      <p className="text-sm text-gray-400">Manual regulatory analysis time</p>
                    </div>
                    <div className="bg-gray-900/50 p-4 rounded-lg">
                      <p className="text-3xl font-bold text-orange-400 mb-1">$8.5B</p>
                      <p className="text-sm text-gray-400">Average litigation exposure per regulation</p>
                    </div>
                    <div className="bg-gray-900/50 p-4 rounded-lg">
                      <p className="text-3xl font-bold text-yellow-400 mb-1">500+</p>
                      <p className="text-sm text-gray-400">Companies to assess per portfolio</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Solution Overview */}
          <Card className="bg-gradient-to-br from-green-900/20 to-blue-900/20 border-green-500/30 mb-12">
            <CardContent className="p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Brain className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-3">Our Solution</h3>
                  <p className="text-gray-300 text-lg leading-relaxed mb-6">
                    We use Generative AI and NLP to automatically extract entities, measures, and implications from any regulatory document. 
                    Then we cross-reference with 10-K filings to calculate precise risk scores for every S&P 500 company, 
                    and generate concrete portfolio recommendations.
                  </p>
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
                      <p className="text-white">Minutes, not days</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
                      <p className="text-white">Transparent reasoning</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
                      <p className="text-white">Actionable recommendations</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
                      <p className="text-white">Any document format</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* How It Works */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">How It Works</h2>
          <p className="text-xl text-gray-400">Four steps from document to decision</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="bg-gray-800/50 border-gray-700 relative">
            <div className="absolute -top-4 left-6">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                1
              </div>
            </div>
            <CardContent className="p-6 pt-8">
              <FileText className="w-10 h-10 text-blue-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Upload Document</h3>
              <p className="text-sm text-gray-400">
                Upload any regulatory document: PDF, HTML, XML. Works with laws, directives, reports from any jurisdiction.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 relative">
            <div className="absolute -top-4 left-6">
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                2
              </div>
            </div>
            <CardContent className="p-6 pt-8">
              <Brain className="w-10 h-10 text-purple-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">AI Extraction</h3>
              <p className="text-sm text-gray-400">
                Generative AI extracts companies, sectors, countries, measures, dates, and provisions automatically.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 relative">
            <div className="absolute -top-4 left-6">
              <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                3
              </div>
            </div>
            <CardContent className="p-6 pt-8">
              <AlertTriangle className="w-10 h-10 text-orange-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Impact Assessment</h3>
              <p className="text-sm text-gray-400">
                Cross-reference with 10-K filings. Calculate risk scores (0-100) for every S&P 500 company with transparent reasoning.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 relative">
            <div className="absolute -top-4 left-6">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">
                4
              </div>
            </div>
            <CardContent className="p-6 pt-8">
              <Target className="w-10 h-10 text-green-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Recommendations</h3>
              <p className="text-sm text-gray-400">
                Get concrete adjustments: sector rotation, stock replacements, geographic reallocation strategies.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Platform Modules */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">Platform Modules</h2>
          <p className="text-xl text-gray-400">Complete regulatory risk management workflow</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Core Module */}
          <Link to={createPageUrl('RegulatoryAnalyzer')}>
            <Card className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 border-blue-500/50 hover:border-blue-400 transition-all hover:scale-105 cursor-pointer group h-full">
              <CardContent className="p-6">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FileText className="w-7 h-7 text-white" />
                </div>
                <Badge className="bg-blue-600 mb-3">Core Module</Badge>
                <h3 className="text-xl font-bold text-white mb-2">Document Analyzer</h3>
                <p className="text-sm text-gray-300 mb-4">
                  Upload regulatory documents and extract key information using Generative AI. 
                  Works with any format: PDF, HTML, XML.
                </p>
                <div className="flex items-center text-sm text-blue-400">
                  <span>Start Here</span>
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Company Impact */}
          <Link to={createPageUrl('CompanyImpactAssessment')}>
            <Card className="bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-all hover:scale-105 cursor-pointer group h-full">
              <CardContent className="p-6">
                <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <AlertTriangle className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Company Impact Assessment</h3>
                <p className="text-sm text-gray-300 mb-4">
                  Calculate risk scores (0-100) for S&P 500 companies. Cross-reference with 10-K filings 
                  for supply chain and revenue exposure analysis.
                </p>
                <div className="flex items-center text-sm text-orange-400">
                  <span>Assess Companies</span>
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Portfolio Dashboard */}
          <Link to={createPageUrl('PortfolioDashboard')}>
            <Card className="bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-all hover:scale-105 cursor-pointer group h-full">
              <CardContent className="p-6">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-cyan-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Portfolio Risk Dashboard</h3>
                <p className="text-sm text-gray-300 mb-4">
                  Aggregate view of S&P 500 exposure. Identify risk concentration by sector, 
                  geography. Visualize portfolio-level impact.
                </p>
                <div className="flex items-center text-sm text-green-400">
                  <span>View Dashboard</span>
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Scenario Simulator */}
          <Link to={createPageUrl('ScenarioSimulator')}>
            <Card className="bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-all hover:scale-105 cursor-pointer group h-full">
              <CardContent className="p-6">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Activity className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Scenario Simulator</h3>
                <p className="text-sm text-gray-300 mb-4">
                  Model different regulatory scenarios. Adjust tariff rates, geographic scope. 
                  See real-time impact on portfolio returns.
                </p>
                <div className="flex items-center text-sm text-purple-400">
                  <span>Run Simulation</span>
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Recommendations Engine */}
          <Link to={createPageUrl('RecommendationsEngine')}>
            <Card className="bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-all hover:scale-105 cursor-pointer group h-full">
              <CardContent className="p-6">
                <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Target className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Recommendations Engine</h3>
                <p className="text-sm text-gray-300 mb-4">
                  Get actionable portfolio adjustments: sector rotation strategies, 
                  specific stock replacements, geographic reallocation.
                </p>
                <div className="flex items-center text-sm text-yellow-400">
                  <span>Get Recommendations</span>
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* 10-K Intelligence */}
          <Link to={createPageUrl('TenKIntelligence')}>
            <Card className="bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-all hover:scale-105 cursor-pointer group h-full">
              <CardContent className="p-6">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">10-K Intelligence</h3>
                <p className="text-sm text-gray-300 mb-4">
                  NLP analysis of company filings. Extract suppliers, revenue geography, 
                  product lines, risk factors for deep company understanding.
                </p>
                <div className="flex items-center text-sm text-indigo-400">
                  <span>Analyze Filings</span>
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* NLP Quant Strategy */}
          <Link to={createPageUrl('NLPQuantStrategy')}>
            <Card className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border-purple-500/50 hover:border-purple-400 transition-all hover:scale-105 cursor-pointer group h-full">
              <CardContent className="p-6">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Brain className="w-7 h-7 text-white" />
                </div>
                <Badge className="bg-purple-600 mb-3">Advanced NLP</Badge>
                <h3 className="text-xl font-bold text-white mb-2">NLP Quantitative Strategy</h3>
                <p className="text-sm text-gray-300 mb-4">
                  Advanced NLP analysis using spaCy, NLTK, and HuggingFace embeddings. Generate trading signals 
                  from 10K/10Q filings with sentiment analysis, risk assessment, and anomaly detection.
                </p>
                <div className="flex items-center text-sm text-purple-400">
                  <span>Run NLP Strategy</span>
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Key Features */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">Why This Platform?</h2>
          <p className="text-xl text-gray-400">Built for institutional portfolio managers</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Brain className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 text-center">Generative AI Powered</h3>
              <p className="text-sm text-gray-400 text-center">
                Uses AWS Bedrock and advanced NLP to extract entities, measures, dates from any document format automatically
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 text-center">Transparent & Explainable</h3>
              <p className="text-sm text-gray-400 text-center">
                Every risk score comes with clear reasoning. Understand WHY a company is exposed before making decisions
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 text-center">Actionable Recommendations</h3>
              <p className="text-sm text-gray-400 text-center">
                Not just alerts — get concrete portfolio actions: reduce Tech by 5%, replace TSLA with F, reallocate China exposure
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Globe className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 text-center">Universal Document Support</h3>
              <p className="text-sm text-gray-400 text-center">
                Works with ANY regulatory document: US laws, EU directives, Chinese regulations, Canadian bills — any format, any jurisdiction
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 text-center">Real-Time Risk Monitoring</h3>
              <p className="text-sm text-gray-400 text-center">
                Identify risk concentration by sector and geography. Track portfolio risk trends over time to stay ahead of exposures
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-yellow-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 text-center">S&P 500 Coverage</h3>
              <p className="text-sm text-gray-400 text-center">
                Automatically assess all 500 companies in the index. Cross-reference with 10-K filings for deep supply chain analysis
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <Card className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 border-blue-500/30">
          <CardContent className="p-12 text-center">
            <h2 className="text-4xl font-bold text-white mb-4">Ready to Get Started?</h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Upload your first regulatory document and see the AI-powered analysis in action. 
              Get risk scores, portfolio insights, and recommendations in minutes.
            </p>
            <div className="flex gap-4 justify-center">
              <Link to={createPageUrl('RegulatoryAnalyzer')}>
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xl px-12 py-6">
                  <FileText className="w-6 h-6 mr-2" />
                  Analyze Your First Document
                  <ArrowRight className="w-6 h-6 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-800 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold">Regulatory Impact Analyzer</p>
                <p className="text-gray-500 text-xs">Datathon 2025 PolyFinances</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-400">System Operational</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}