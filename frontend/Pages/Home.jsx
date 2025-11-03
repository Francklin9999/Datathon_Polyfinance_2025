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
  CheckCircle2,
  Search
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import PortfolioPill from '@/components/PortfolioPill';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <Shield className="w-12 h-12 text-white" />
              </div>
            </div>
            <div className="flex items-center justify-center mb-4">
              <PortfolioPill />
            </div>
            <h1 className="text-6xl font-bold text-white mb-4">
              PolyFinance 2025
            </h1>
            <p className="text-2xl text-gray-300 mb-4">
              Portfolio-First, Document-Driven Risk Analysis
            </p>
            <p className="text-lg text-gray-400 max-w-4xl mx-auto leading-relaxed mb-8">
              Upload or fetch a regulation → see how <strong>your</strong> portfolio moves. 
              Show who's most exposed and why, with citations. Offer concrete hedges and a one-click "what-if."
            </p>
            
            <div className="mt-8 flex gap-4 justify-center">
              <Link to="/document-analyzer">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg px-8 py-6">
                  <FileText className="w-6 h-6 mr-2" />
                  Analyze a Document
                  <ArrowRight className="w-6 h-6 ml-2" />
                </Button>
              </Link>
              <Link to="/portfolio-risk-dashboard">
                <Button size="lg" variant="outline" className="border-gray-600 text-white hover:bg-gray-800 text-lg px-8 py-6">
                  <BarChart3 className="w-6 h-6 mr-2" />
                  View Risk Dashboard
                </Button>
              </Link>
            </div>
          </div>

          {/* Problem Statement */}
          <Card className="bg-gradient-to-br from-red-900/20 to-orange-900/20 border-red-500/30 mb-12">
            <CardContent className="p-8">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-white mb-3">The Challenge</h3>
                  <p className="text-gray-300 text-lg leading-relaxed mb-4">
                    Financial markets are increasingly influenced by complex regulations, protectionist laws, and economic sanctions. 
                    Traditional analysis is slow, manual, and error-prone. Portfolio managers need hours or days to assess impact 
                    on their holdings.
                  </p>
                  <div className="grid md:grid-cols-3 gap-4 mt-4">
                    <div className="bg-gray-900/50 p-4 rounded-lg text-center">
                      <p className="text-3xl font-bold text-red-400 mb-1">72+ Hours</p>
                      <p className="text-sm text-gray-400">Manual regulatory analysis time</p>
                    </div>
                    <div className="bg-gray-900/50 p-4 rounded-lg text-center">
                      <p className="text-3xl font-bold text-orange-400 mb-1">$8.5B</p>
                      <p className="text-sm text-gray-400">Average litigation exposure per regulation</p>
                    </div>
                    <div className="bg-gray-900/50 p-4 rounded-lg text-center">
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
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Brain className="w-6 h-6 text-green-400" />
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-white mb-3">Our Solution</h3>
                  <p className="text-gray-300 text-lg leading-relaxed mb-6">
                    <strong>Portfolio-first approach:</strong> Equal-weight portfolio built from tickers with recent filings (10-K/10-Q). 
                    <strong>Document-driven risk:</strong> Upload any regulation or ask our AI agent to fetch it. See instant impact with 
                    evidence citations. <strong>Calibrated scoring:</strong> Four-component risk model with Ridge regression calibration. 
                    <strong>Actionable hedges:</strong> Get concrete hedge suggestions with estimated risk reduction and cost.
                  </p>
                  <div className="grid md:grid-cols-4 gap-4 justify-items-center">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
                      <p className="text-white">Portfolio-first analysis</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
                      <p className="text-white">Document-driven risk</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
                      <p className="text-white">Calibrated scoring</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
                      <p className="text-white">Actionable hedges</p>
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
          <p className="text-xl text-gray-400">Five steps from portfolio to hedge implementation</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
          <Card className="bg-gray-800/50 border-gray-700 relative">
            <div className="absolute -top-4 left-6">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                1
              </div>
            </div>
            <CardContent className="p-6 pt-8">
              <Globe className="w-10 h-10 text-blue-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Initialize Portfolio</h3>
              <p className="text-sm text-gray-400">
                Start with an equal-weight portfolio from tickers with recent filings (10-K/10-Q) in the last 18 months.
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
              <FileText className="w-10 h-10 text-purple-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Analyze Document</h3>
              <p className="text-sm text-gray-400">
                Upload a regulation, paste text, or ask the AI agent to fetch it. Works with PDF, HTML, XML, DOCX.
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
              <h3 className="text-lg font-bold text-white mb-2">View Impact</h3>
              <p className="text-sm text-gray-400">
                See portfolio impact with top offenders, risk components (SupplyChain, GeoExposure, MeasureMatch, SentimentRisk), and evidence.
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
              <Activity className="w-10 h-10 text-green-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Explore Scenarios</h3>
              <p className="text-sm text-gray-400">
                Simulate different regulatory scenarios with P5/P50/P95 distributions. Tariffs, sanctions, bans, supply chain disruptions.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 relative">
            <div className="absolute -top-4 left-6">
              <div className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center text-white font-bold">
                5
              </div>
            </div>
            <CardContent className="p-6 pt-8">
              <Target className="w-10 h-10 text-yellow-400 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Apply Hedges</h3>
              <p className="text-sm text-gray-400">
                Get hedge recommendations with estimated risk reduction and cost. Options overlays, ETF tilts, equity pairs, macro hedges.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Platform Modules */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">Platform Modules</h2>
          <p className="text-xl text-gray-400">Complete portfolio-first risk management workflow</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Document Analyzer */}
          <Link to="/document-analyzer">
            <Card className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 border-blue-500/50 hover:border-blue-400 transition-all hover:scale-105 cursor-pointer group h-full">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                  <FileText className="w-7 h-7 text-white" />
                </div>
                <div className="flex justify-center mb-3">
                  <Badge className="bg-blue-600">Core Module</Badge>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Document Analyzer</h3>
                <p className="text-sm text-gray-300 mb-4">
                  Upload or fetch a regulation → see how your portfolio moves. Get instant portfolio impact with top-5 offenders and citation snippets.
                </p>
                <div className="flex items-center justify-center text-sm text-blue-400">
                  <span>Start Here</span>
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Company Assessment */}
          <Link to="/company-assessment">
            <Card className="bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-all hover:scale-105 cursor-pointer group h-full">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-cyan-600 rounded-xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Company Assessment</h3>
                <p className="text-sm text-gray-300 mb-4">
                  Rank portfolio constituents by sentiment risk vs sector peers. Cross-asset sentiment analysis from SEC filings, social media, and lawsuits.
                </p>
                <div className="flex items-center justify-center text-sm text-green-400">
                  <span>Assess Companies</span>
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Portfolio Risk Dashboard */}
          <Link to="/portfolio-risk-dashboard">
            <Card className="bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-all hover:scale-105 cursor-pointer group h-full">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Portfolio Risk Dashboard</h3>
                <p className="text-sm text-gray-300 mb-4">
                  At-a-glance current risk with ranking of offenders. See regulatory risk changes, top exposed companies, and proposed hedges.
                </p>
                <div className="flex items-center justify-center text-sm text-yellow-400">
                  <span>View Dashboard</span>
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Scenario Simulator */}
          <Link to="/scenario-simulator">
            <Card className="bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-all hover:scale-105 cursor-pointer group h-full">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                  <Activity className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Scenario Simulator</h3>
                <p className="text-sm text-gray-300 mb-4">
                  Build and combine scenarios; show P5/P50/P95 portfolio impact. Simulate tariffs, sanctions, bans, and supply chain disruptions.
                </p>
                <div className="flex items-center justify-center text-sm text-purple-400">
                  <span>Run Simulation</span>
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* NLP Quantitative Strategy */}
          <Link to="/nlp-quant-strategy">
            <Card className="bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-all hover:scale-105 cursor-pointer group h-full">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                  <Brain className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">NLP Quantitative Strategy</h3>
                <p className="text-sm text-gray-300 mb-4">
                  Advanced NLP analysis of 10K/10Q filings using spaCy, NLTK, and HuggingFace embeddings. Generate trading signals from sentiment and forward-looking statements.
                </p>
                <div className="flex items-center justify-center text-sm text-indigo-400">
                  <span>Analyze Strategy</span>
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Market Research */}
          <Link to="/market-research">
            <Card className="bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-all hover:scale-105 cursor-pointer group h-full">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                  <Search className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Market Research</h3>
                <p className="text-sm text-gray-300 mb-4">
                  AI-powered web research to identify risks and opportunities for stocks. Searches the web for recent news, regulatory issues, and market sentiment.
                </p>
                <div className="flex items-center justify-center text-sm text-teal-400">
                  <span>Research Stock</span>
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
          <h2 className="text-4xl font-bold text-white mb-4">Why PolyFinance 2025?</h2>
          <p className="text-xl text-gray-400">Built for portfolio-first risk analysis with transparent, defensible scoring</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 text-center">Portfolio-First</h3>
              <p className="text-sm text-gray-400 text-center">
                Equal-weight portfolio built from tickers with recent filings. Everything revolves around your portfolio.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Brain className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 text-center">Document-Driven</h3>
              <p className="text-sm text-gray-400 text-center">
                Upload any regulation or ask our AI agent to fetch it. See instant impact with evidence citations.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 text-center">Calibrated Scoring</h3>
              <p className="text-sm text-gray-400 text-center">
                Four-component risk model with Ridge regression calibration for accurate, defensible weights.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingDown className="w-6 h-6 text-yellow-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 text-center">Actionable Hedges</h3>
              <p className="text-sm text-gray-400 text-center">
                Get concrete hedge suggestions with estimated risk reduction and cost. Options, ETFs, pairs, macro hedges.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
