import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { PortfolioProvider } from './contexts/PortfolioContext';
import { AnalysisProvider } from './contexts/AnalysisContext';

// Main 4 pages per spec
import DocumentAnalyzer from '../Pages/DocumentAnalyzer';
import CompanyAssessment from '../Pages/CompanyAssessment';
import PortfolioRiskDashboard from '../Pages/PortfolioRiskDashboard';
import ScenarioSimulator from '../Pages/ScenarioSimulator';
import MarketResearch from '../Pages/MarketResearch';

// Legacy pages (kept for backward compatibility, can be removed later)
import Home from '../Pages/Home';
import RegulatoryAnalyzer from '../Pages/RegulatoryAnalyzer';
import CompanyImpactAssessment from '../Pages/CompanyImpactAssessment';
import PortfolioDashboard from '../Pages/PortfolioDashboard';
import RecommendationsEngine from '../Pages/RecommendationsEngine';
import TenKIntelligence from '../Pages/TenKIntelligence';
import NLPQuantStrategy from '../Pages/NLPQuantStrategy';

import ChatAssistant from './components/ChatAssistant';
import NotificationCenter from './components/NotificationCenter';

function App() {
  return (
    <PortfolioProvider>
      <AnalysisProvider>
        <Router>
          <Routes>
            {/* Home page */}
            <Route path="/" element={<Home />} />
            <Route path="/home" element={<Home />} />
            
            {/* Main 4 routes per spec */}
            <Route path="/document-analyzer" element={<DocumentAnalyzer />} />
            <Route path="/company-assessment" element={<CompanyAssessment />} />
            <Route path="/portfolio-risk-dashboard" element={<PortfolioRiskDashboard />} />
            <Route path="/scenario-simulator" element={<ScenarioSimulator />} />
            <Route path="/market-research" element={<MarketResearch />} />
            
            {/* Legacy routes - kept for backward compatibility */}
            <Route path="/regulatory-analyzer" element={<RegulatoryAnalyzer />} />
            <Route path="/company-impact-assessment" element={<CompanyImpactAssessment />} />
            <Route path="/portfolio-dashboard" element={<PortfolioDashboard />} />
            <Route path="/recommendations-engine" element={<RecommendationsEngine />} />
            <Route path="/tenk-intelligence" element={<TenKIntelligence />} />
            <Route path="/nlp-quant-strategy" element={<NLPQuantStrategy />} />
          </Routes>
          {/* AI Chat Assistant - Available on all pages */}
          <ChatAssistant />
          {/* Notification Center - Available on all pages */}
          <NotificationCenter />
        </Router>
      </AnalysisProvider>
    </PortfolioProvider>
  );
}

export default App;
