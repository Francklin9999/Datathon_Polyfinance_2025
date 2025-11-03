export function createPageUrl(pageName) {
  const routeMap = {
    'Home': '/',
    'RegulatoryAnalyzer': '/regulatory-analyzer',
    'CompanyImpactAssessment': '/company-impact-assessment',
    'PortfolioDashboard': '/portfolio-dashboard',
    'ScenarioSimulator': '/scenario-simulator',
    'RecommendationsEngine': '/recommendations-engine',
  };
  
  return routeMap[pageName] || '/';
}

