import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from '../Pages/Home';
import Index from '../Pages/Index';
import RiskAnalytics from '../Pages/RiskAnalytics';
import AIInsights from '../Pages/AIInsights';
import Positions from '../Pages/Positions';
import Macro from '../Pages/Macro';
import Credit from '../Pages/Credit';
import Options from '../Pages/Options';
import Commodities from '../Pages/Commodities';
import FX from '../Pages/FX';
import FixedIncome from '../Pages/FixedIncome';
import Equities from '../Pages/Equities';
import Asia from '../Pages/Asia';
import EU from '../Pages/EU';
import US from '../Pages/US';
import AllInsights from '../Pages/AllInsights';
import PortfolioOptimizer from '../Pages/PortfolioOptimizer';
import SentimentAnalytics from '../Pages/SentimentAnalytics';
import ESGAnalytics from '../Pages/ESGAnalytics';
import TradeExecution from '../Pages/TradeExecution';
import CompsScreener from '../Pages/CompsScreener';
import StrategyBacktesting from '../Pages/StrategyBacktesting';
import AIStrategyGenerator from '../Pages/AIStrategyGenerator';
import AlternativeData from '../Pages/AlternativeData';
import MarketMicrostructure from '../Pages/MarketMicrostructure';
import StatisticalArbitrage from '../Pages/StatisticalArbitrage';
import RegulatoryAnalyzer from '../Pages/RegulatoryAnalyzer';
import CompanyImpactAssessment from '../Pages/CompanyImpactAssessment';
import PortfolioDashboard from '../Pages/PortfolioDashboard';
import ScenarioSimulator from '../Pages/ScenarioSimulator';
import RecommendationsEngine from '../Pages/RecommendationsEngine';
import TenKIntelligence from '../Pages/TenKIntelligence';
import NLPQuantStrategy from '../Pages/NLPQuantStrategy';
import AdaptabilityDemo from '../Pages/AdaptabilityDemo';
import LawsuitTracker from '../Pages/LawsuitTracker';
import TrendsAnalysis from '../Pages/TrendsAnalysis';
import SocialSentiment from '../Pages/SocialSentiment';
import RegulatoryImpact from '../Pages/RegulatoryImpact';
import AWSVoiceChat from './components/VAPIChat';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/overview" element={<Index />} />
        <Route path="/risk-analytics" element={<RiskAnalytics />} />
        <Route path="/ai-insights" element={<AIInsights />} />
        <Route path="/positions" element={<Positions />} />
        <Route path="/macro" element={<Macro />} />
        <Route path="/credit" element={<Credit />} />
        <Route path="/options" element={<Options />} />
        <Route path="/commodities" element={<Commodities />} />
        <Route path="/fx" element={<FX />} />
        <Route path="/fixed-income" element={<FixedIncome />} />
        <Route path="/equities" element={<Equities />} />
        <Route path="/asia" element={<Asia />} />
        <Route path="/eu" element={<EU />} />
        <Route path="/us" element={<US />} />
        <Route path="/all-insights" element={<AllInsights />} />
        <Route path="/portfolio-optimizer" element={<PortfolioOptimizer />} />
        <Route path="/sentiment-analytics" element={<SentimentAnalytics />} />
        <Route path="/esg-analytics" element={<ESGAnalytics />} />
        <Route path="/trade-execution" element={<TradeExecution />} />
        <Route path="/comps-screener" element={<CompsScreener />} />
        <Route path="/strategy-backtesting" element={<StrategyBacktesting />} />
        <Route path="/ai-strategy-generator" element={<AIStrategyGenerator />} />
        <Route path="/alternative-data" element={<AlternativeData />} />
        <Route path="/market-microstructure" element={<MarketMicrostructure />} />
        <Route path="/statistical-arbitrage" element={<StatisticalArbitrage />} />
        <Route path="/regulatory-analyzer" element={<RegulatoryAnalyzer />} />
        <Route path="/company-impact-assessment" element={<CompanyImpactAssessment />} />
        <Route path="/portfolio-dashboard" element={<PortfolioDashboard />} />
        <Route path="/scenario-simulator" element={<ScenarioSimulator />} />
        <Route path="/recommendations-engine" element={<RecommendationsEngine />} />
        <Route path="/tenk-intelligence" element={<TenKIntelligence />} />
        <Route path="/nlp-quant-strategy" element={<NLPQuantStrategy />} />
        <Route path="/adaptability-demo" element={<AdaptabilityDemo />} />
        <Route path="/lawsuit-tracker" element={<LawsuitTracker />} />
        <Route path="/trends-analysis" element={<TrendsAnalysis />} />
        <Route path="/social-sentiment" element={<SocialSentiment />} />
        <Route path="/regulatory-impact" element={<RegulatoryImpact />} />
      </Routes>
      {/* AWS Voice Chat - Available on all pages */}
      <AWSVoiceChat />
    </Router>
  );
}

export default App;

