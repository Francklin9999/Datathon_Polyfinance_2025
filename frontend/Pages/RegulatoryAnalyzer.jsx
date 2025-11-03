import React, { useState } from 'react';
import { api } from '@/api/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Upload, 
  Brain, 
  CheckCircle, 
  AlertTriangle,
  Building2,
  Globe,
  Calendar,
  FileWarning,
  Loader2,
  ArrowRight,
  Network,
  Share2,
  Download,
  Search
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import RecommendationExplanation from '@/components/RecommendationExplanation';

export default function RegulatoryAnalyzer() {
  const [file, setFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzingPortfolio, setIsAnalyzingPortfolio] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [portfolioImpact, setPortfolioImpact] = useState(null);
  const [documentText, setDocumentText] = useState('');
  const [showCitations, setShowCitations] = useState(false);
  const [isSearchingMissing, setIsSearchingMissing] = useState(false);
  const [missingElementsResult, setMissingElementsResult] = useState(null);

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    setFile(uploadedFile);
  };

  const handleAnalyze = async () => {
    if (!file && !documentText) {
      alert('Please upload a file or paste document text');
      return;
    }

    setIsAnalyzing(true);
    setPortfolioImpact(null);

    try {
      let fileUrl = null;
      
      if (file) {
        const uploadResult = await api.integrations.Core.UploadFile({ file });
        fileUrl = uploadResult.file_url;
      }

      // Use backend API to analyze document
      const analysisResponse = await api.regulatory.analyzeDocument({
        documentText: documentText || undefined,
        fileUrl: fileUrl || undefined,
        docId: `DOC-${Date.now()}`
      });

      setAnalysisResult(analysisResponse);

      // Automatically analyze S&P 500 portfolio impact
      await handleAnalyzePortfolioImpact(analysisResponse);

    } catch (error) {
      console.error('Analysis error:', error);
      alert('Error analyzing document. Please try again.');
    }

    setIsAnalyzing(false);
  };

  const handleAnalyzePortfolioImpact = async (regulationData) => {
    if (!regulationData) {
      regulationData = analysisResult;
    }

    if (!regulationData) {
      return;
    }

    setIsAnalyzingPortfolio(true);

    try {
      const impactResponse = await api.regulatory.analyzeSP500Impact({
        regulation: regulationData
      });

      setPortfolioImpact(impactResponse);
    } catch (error) {
      console.error('Portfolio impact analysis error:', error);
      // Don't show alert here as this is automatic
    }

    setIsAnalyzingPortfolio(false);
  };

  const getCitationBadge = (citationId) => {
    if (!analysisResult?.citations) return null;
    const citation = analysisResult.citations.find(c => c.id === citationId);
    return citation ? (
      <Badge 
        variant="outline" 
        className="ml-2 cursor-pointer hover:bg-blue-900/30"
        onClick={() => setShowCitations(!showCitations)}
      >
        [{citation.paragraph}]
      </Badge>
    ) : null;
  };

  const handleSearchMissingElements = async () => {
    if (!analysisResult) {
      alert('Please analyze a document first');
      return;
    }

    setIsSearchingMissing(true);
    setMissingElementsResult(null);

    try {
      const result = await api.regulatory.searchMissingElements({
        report_type: 'regulatory',
        report_data: analysisResult,
        page_url: 'http://127.0.0.1:8888/'
      });

      setMissingElementsResult(result);
    } catch (error) {
      console.error('Search error:', error);
      alert('Error searching for missing elements. Please try again.');
    } finally {
      setIsSearchingMissing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-400" />
              Regulatory Document Analyzer
            </h1>
            <p className="text-gray-400 mt-1">AI-powered document extraction tool - Parse regulations, extract measures, and trace citations with full document analysis</p>
          </div>
          <div className="flex gap-3">
            <Link to={createPageUrl('AdaptabilityDemo')}>
              <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
                <Share2 className="w-4 h-4 mr-2" />
                Adaptability Demo
              </Button>
            </Link>
            <Link to={createPageUrl('Home')}>
              <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
                Home
              </Button>
            </Link>
          </div>
        </div>

        {/* Upload Section */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-400" />
              Step 1: Upload Regulatory Document
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Upload File (PDF, HTML, XML, DOCX)</label>
              <Input
                type="file"
                accept=".pdf,.html,.xml,.docx"
                onChange={handleFileUpload}
                className="bg-gray-900 border-gray-700 text-white"
              />
              {file && (
                <p className="text-sm text-green-400 mt-2">✓ File uploaded: {file.name}</p>
              )}
            </div>

            <div className="text-center text-gray-500">OR</div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Paste Document Text</label>
              <Textarea
                placeholder="Paste the regulatory document text here..."
                value={documentText}
                onChange={(e) => setDocumentText(e.target.value)}
                className="bg-gray-900 border-gray-700 text-white h-32"
              />
            </div>

            <div className="flex items-center justify-center">
              <div className="relative inline-block">
                <div className="absolute -inset-2 rounded-full border-2 border-blue-400/50 bg-gradient-to-r from-blue-900/20 to-purple-900/20 pointer-events-none"></div>
                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || (!file && !documentText)}
                  className="relative w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Analyzing with Generative AI...
                    </>
                  ) : (
                    <>
                      <Brain className="w-5 h-5 mr-2" />
                      Analyze Document with AI
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analysis Results */}
        {analysisResult && (
          <>
            {/* Extraction Summary */}
            <Card className="bg-gradient-to-br from-green-900/20 to-blue-900/20 border-green-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    Extraction Complete with Citations
                  </span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setShowCitations(!showCitations)}>
                      {showCitations ? 'Hide' : 'Show'} Citations
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-purple-600 hover:bg-purple-700"
                      onClick={handleSearchMissingElements}
                      disabled={isSearchingMissing}
                    >
                      {isSearchingMissing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4 mr-2" />
                          Search Missing Elements
                        </>
                      )}
                    </Button>
                    <Button size="sm" className="bg-blue-600">
                      <Download className="w-4 h-4 mr-2" />
                      Export PDF
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-400">{analysisResult.entities?.tickers?.length || 0}</p>
                    <p className="text-sm text-gray-400">Companies Identified</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-400">{analysisResult.entities?.sectors?.length || 0}</p>
                    <p className="text-sm text-gray-400">Sectors Affected</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-purple-400">{analysisResult.measures?.length || 0}</p>
                    <p className="text-sm text-gray-400">Measures Extracted</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-yellow-400">{analysisResult.citations?.length || 0}</p>
                    <p className="text-sm text-gray-400">Citations Linked</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs for organized view */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-gray-800">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="measures">Measures & Provisions</TabsTrigger>
                <TabsTrigger value="supply-chain">Supply Chain Impact</TabsTrigger>
                <TabsTrigger value="citations">Citations</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6 mt-6">
                {/* Regulation Overview */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">Regulation Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Regulation Name</p>
                        <p className="text-white font-semibold">{analysisResult.regulation_name}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Type</p>
                          <Badge className="bg-blue-600">{analysisResult.regulation_type}</Badge>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Jurisdiction</p>
                          <Badge className="bg-purple-600">{analysisResult.jurisdiction}</Badge>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Issuing Body</p>
                        <p className="text-white">{analysisResult.issuing_body}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Effective Date
                        </p>
                        <p className="text-white font-mono">{analysisResult.effective_date}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300 leading-relaxed">{analysisResult.summary}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Affected Entities */}
                <div className="grid md:grid-cols-3 gap-6">
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white text-sm flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-orange-400" />
                        Affected Companies
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.entities?.tickers?.map((ticker, idx) => (
                          <Badge key={idx} className="bg-orange-600">
                            {ticker}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white text-sm flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-400" />
                        Affected Sectors
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.entities?.sectors?.map((sector, idx) => (
                          <Badge key={idx} className="bg-blue-600">
                            {sector}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white text-sm flex items-center gap-2">
                        <Globe className="w-4 h-4 text-green-400" />
                        Affected Countries
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.entities?.countries?.map((country, idx) => (
                          <Badge key={idx} className="bg-green-600">
                            {country}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="measures" className="space-y-6 mt-6">
                {/* Measures */}
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Extracted Measures (with Citations)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analysisResult.measures?.map((measure, idx) => (
                        <div key={idx} className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-bold text-white">{measure.target}</h4>
                            {getCitationBadge(measure.citation_id)}
                          </div>
                          {measure.rate_pct && (
                            <p className="text-2xl font-bold text-blue-400 mb-2">
                              {measure.rate_pct}%
                            </p>
                          )}
                          <p className="text-sm text-gray-300">{measure.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Key Provisions */}
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Key Provisions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {analysisResult.key_provisions?.map((provision, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-300 p-3 bg-gray-900/50 rounded">
                          <CheckCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                          <span dangerouslySetInnerHTML={{ 
                            __html: provision.replace(/\[(.*?)\]/g, '<span class="text-blue-400 font-mono text-xs ml-1">[$1]</span>')
                          }} />
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="supply-chain" className="space-y-6 mt-6">
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Network className="w-5 h-5 text-purple-400" />
                      Supply Chain Impact Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <p className="text-sm font-semibold text-gray-400 mb-3">Affected Components</p>
                      <div className="grid md:grid-cols-2 gap-2">
                        {analysisResult.supply_chain_impact?.affected_components?.map((component, idx) => (
                          <div key={idx} className="p-3 bg-gray-900/50 rounded border border-gray-700">
                            <p className="text-white text-sm">{component}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-gray-400 mb-3">Affected Suppliers</p>
                      <div className="space-y-2">
                        {analysisResult.supply_chain_impact?.affected_suppliers?.map((supplier, idx) => (
                          <div key={idx} className="p-3 bg-red-900/20 border border-red-500/30 rounded">
                            <p className="text-white text-sm">{supplier}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-gray-400 mb-3">Geographic Choke Points</p>
                      <div className="space-y-2">
                        {analysisResult.supply_chain_impact?.geographic_choke_points?.map((point, idx) => (
                          <div key={idx} className="p-3 bg-orange-900/20 border border-orange-500/30 rounded">
                            <p className="text-white text-sm">{point}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="citations" className="space-y-6 mt-6">
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Document Citations (Traceability)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analysisResult.citations?.map((citation, idx) => (
                        <div key={idx} className="p-4 bg-gray-900/50 rounded-lg border border-blue-500/30">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge className="bg-blue-600 font-mono">{citation.paragraph}</Badge>
                            <Badge variant="outline" className="text-gray-400">ID: {citation.id}</Badge>
                          </div>
                          <p className="text-gray-300 text-sm leading-relaxed italic">
                            "{citation.text}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* S&P 500 Portfolio Impact Analysis */}
            {isAnalyzingPortfolio && (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                    <p className="text-white">Analyzing S&P 500 Portfolio Impact...</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {portfolioImpact && (
              <Card className="bg-gradient-to-br from-purple-900/40 to-red-900/40 border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Building2 className="w-6 h-6 text-purple-400" />
                    S&P 500 Portfolio Impact Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Portfolio Summary */}
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                      <p className="text-3xl font-bold text-red-400">{portfolioImpact.high_risk_count || 0}</p>
                      <p className="text-sm text-gray-400 mt-1">High Risk Stocks</p>
                    </div>
                    <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                      <p className="text-3xl font-bold text-yellow-400">{portfolioImpact.medium_risk_count || 0}</p>
                      <p className="text-sm text-gray-400 mt-1">Medium Risk Stocks</p>
                    </div>
                    <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                      <p className="text-3xl font-bold text-green-400">{portfolioImpact.low_risk_count || 0}</p>
                      <p className="text-sm text-gray-400 mt-1">Low Risk Stocks</p>
                    </div>
                    <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                      <p className="text-3xl font-bold text-blue-400">{portfolioImpact.average_risk_score?.toFixed(1) || '0'}</p>
                      <p className="text-sm text-gray-400 mt-1">Avg Risk Score</p>
                    </div>
                  </div>

                  {/* Top Risk Companies */}
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-4">Top Risk Companies</h4>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {portfolioImpact.companies?.slice(0, 20).map((company, idx) => {
                        const riskScore = company.risk_score || 0;
                        const riskColor = riskScore > 70 ? 'text-red-400' : riskScore > 40 ? 'text-yellow-400' : 'text-green-400';
                        const bgColor = riskScore > 70 ? 'bg-red-900/20 border-red-500/30' : riskScore > 40 ? 'bg-yellow-900/20 border-yellow-500/30' : 'bg-green-900/20 border-green-500/30';
                        
                        return (
                          <div key={idx} className={`p-3 rounded-lg border ${bgColor}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-sm text-gray-400">#{idx + 1}</span>
                                <div>
                                  <p className="font-bold text-white">{company.ticker}</p>
                                  <p className="text-sm text-gray-400">{company.company_name}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className={`text-xl font-bold ${riskColor}`}>
                                    {riskScore.toFixed(1)}
                                  </p>
                                  <p className="text-xs text-gray-400">Risk Score</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-blue-400">
                                    {company.exposure || 'Medium'}
                                  </p>
                                  <p className="text-xs text-gray-400">Exposure</p>
                                </div>
                                {company.portfolio_weight && (
                                  <div className="text-right">
                                    <p className="text-sm text-purple-400">
                                      {(company.portfolio_weight * 100).toFixed(2)}%
                                    </p>
                                    <p className="text-xs text-gray-400">Weight</p>
                                  </div>
                                )}
                              </div>
                            </div>
                            {company.reasoning && (
                              <p className="text-xs text-gray-300 mt-2 italic">{company.reasoning}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-700">
                    <Button 
                      onClick={() => handleAnalyzePortfolioImpact()}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      disabled={isAnalyzingPortfolio}
                    >
                      {isAnalyzingPortfolio ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Re-analyzing...
                        </>
                      ) : (
                        <>
                          <Brain className="w-4 h-4 mr-2" />
                          Re-analyze Portfolio Impact
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Missing Elements Search Results */}
            {missingElementsResult && (
              <Card className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Search className="w-6 h-6 text-purple-400" />
                    Missing Elements Search Results (SearXNG)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Summary */}
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                      <p className="text-3xl font-bold text-blue-400">{missingElementsResult.completeness_percentage}%</p>
                      <p className="text-sm text-gray-400 mt-1">Completeness</p>
                    </div>
                    <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                      <p className="text-3xl font-bold text-green-400">{missingElementsResult.present_count}</p>
                      <p className="text-sm text-gray-400 mt-1">Present</p>
                    </div>
                    <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                      <p className="text-3xl font-bold text-red-400">{missingElementsResult.missing_count}</p>
                      <p className="text-sm text-gray-400 mt-1">Missing</p>
                    </div>
                    <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                      <p className="text-3xl font-bold text-purple-400">{missingElementsResult.total_elements}</p>
                      <p className="text-sm text-gray-400 mt-1">Total</p>
                    </div>
                  </div>

                  {/* Missing Elements */}
                  {missingElementsResult.missing_elements && missingElementsResult.missing_elements.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-4">Missing Elements ({missingElementsResult.missing_count})</h4>
                      <div className="space-y-2">
                        {missingElementsResult.missing_elements.map((element, idx) => (
                          <div key={idx} className="p-3 bg-gray-900/50 rounded border border-gray-700">
                            <div className="flex items-center gap-3 mb-1">
                              <Badge className={element.required ? 'bg-red-600' : 'bg-yellow-600'}>
                                {element.required ? 'Required' : 'Optional'}
                              </Badge>
                              <span className="font-bold text-white">{element.element}</span>
                            </div>
                            <p className="text-sm text-gray-300">{element.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {missingElementsResult.recommendations && missingElementsResult.recommendations.length > 0 && (
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-4">Recommendations</h4>
                      <div className="space-y-2">
                        {missingElementsResult.recommendations.map((rec, idx) => (
                          <div key={idx} className="p-3 bg-gray-900/50 rounded border border-gray-700">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge className={rec.priority === 'HIGH' ? 'bg-red-600' : 'bg-yellow-600'}>
                                {rec.priority}
                              </Badge>
                              <span className="font-bold text-white">{rec.element}</span>
                              <RecommendationExplanation
                                tickers={null}
                                type="general"
                                context={{ element: rec.element, priority: rec.priority }}
                                reason={rec.recommendation}
                              />
                            </div>
                            <p className="text-sm text-gray-300">{rec.recommendation}</p>
                            {rec.sources && rec.sources.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-gray-700">
                                <p className="text-xs text-gray-400 mb-1">Sources:</p>
                                {rec.sources.map((source, sourceIdx) => (
                                  <a
                                    key={sourceIdx}
                                    href={source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-400 hover:text-blue-300 block"
                                  >
                                    • {source.title || source.url}
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Link to full search page */}
                  <div className="pt-4 border-t border-gray-700">
                    <Link to={createPageUrl('MissingElementsSearch')}>
                      <Button className="w-full bg-purple-600 hover:bg-purple-700">
                        <Search className="w-4 h-4 mr-2" />
                        View Full Missing Elements Search
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Next Steps */}
            <Card className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 border-blue-500/30">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-white mb-4">Additional Analysis</h3>
                <p className="text-sm text-gray-300 mb-4">
                  Use the extracted regulation data to assess portfolio impact and generate investment recommendations.
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <Link to={createPageUrl('RegulatoryImpact')} className="block">
                    <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white" size="lg">
                      <AlertTriangle className="w-5 h-5 mr-2" />
                      Detailed Impact Analysis
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                  <Link to={createPageUrl('CompanyImpactAssessment')} className="block">
                    <Button className="w-full bg-red-600 hover:bg-red-700 text-white" size="lg">
                      <Building2 className="w-5 h-5 mr-2" />
                      Score Company Exposure
                      <ArrowRight className="w-5 h-5 ml-2" />
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