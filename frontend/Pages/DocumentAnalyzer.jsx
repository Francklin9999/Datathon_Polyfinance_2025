import React, { useState } from 'react';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { api } from '@/api/apiClient';
import StorageService from '@/services/storageService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  FileText, 
  Upload, 
  Brain, 
  AlertTriangle,
  Loader2,
  Lightbulb,
  CheckCircle,
  TrendingUp,
  Globe,
  Building2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import PortfolioPill from '@/components/PortfolioPill';

export default function DocumentAnalyzer() {
  const { portfolio, loading: portfolioLoading } = usePortfolio();
  const [file, setFile] = useState(null);
  const [documentText, setDocumentText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [interpretation, setInterpretation] = useState(null);
  const [error, setError] = useState(null);

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setError(null);
      setInterpretation(null);
    }
  };

  const removeFile = () => {
    setFile(null);
    const input = document.getElementById('file-upload-input');
    if (input) input.value = '';
    setInterpretation(null);
  };

  const handleAnalyze = async () => {
    if (!portfolio) {
      setError('Portfolio not initialized. Please wait...');
      return;
    }

    if (!file && !documentText.trim()) {
      setError('Please upload a file or paste document text');
      return;
    }

    setError(null);
    setInterpretation(null);
    setIsAnalyzing(true);

    try {
      let fileUrl = null;
      
      // Upload file if provided
      if (file) {
        try {
          const uploadResult = await api.integrations.Core.UploadFile({ file });
          fileUrl = uploadResult.file_url;
        } catch (uploadError) {
          throw new Error(`File upload failed: ${uploadError.message}`);
        }
      }

      // Generate interpretation using NLP
      const result = await api.documents.generateInterpretation({
        portfolio: portfolio,
        documentText: documentText.trim() || undefined,
        fileUrl: fileUrl || undefined,
        agentQuery: undefined,
        threshold: 0.6,
        strictUnits: false,
        maxCompanies: 50
      });

      setInterpretation(result);
      
      // Store interpretation for Risk Dashboard
      StorageService.saveDocumentAdvice({
        interpretation: result.interpretation,
        timestamp: result.timestamp
      });

    } catch (err) {
      console.error('Error generating interpretation:', err);
      setError(err.message || 'Error generating interpretation. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getFileIcon = (filename) => {
    if (!filename) return <FileText className="w-5 h-5" />;
    const ext = filename.split('.').pop()?.toLowerCase();
    return <FileText className="w-5 h-5" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Brain className="w-8 h-8 text-green-400" />
              NLP Document Analyzer
            </h1>
            <p className="text-gray-400 mt-1">
              Upload documents and get AI-powered general interpretation and portfolio insights
            </p>
            {portfolio && (
              <p className="text-green-400 text-sm mt-1">
                Analyzing for: Equal-weight portfolio ({Object.keys(portfolio.holdings || {}).length} stocks)
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <PortfolioPill />
            <Link to="/portfolio-risk-dashboard">
              <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
                Risk Dashboard
              </Button>
            </Link>
            <Link to="/">
              <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
                Home
              </Button>
            </Link>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="bg-red-900/20 border-red-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <p className="text-red-300">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Section */}
        <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-500/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Document Input
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* File Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Upload File</label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Input
                    id="file-upload-input"
                    type="file"
                    accept=".csv,.xml,.pdf,.docx,.txt,.html,.htm"
                    onChange={handleFileUpload}
                    className="bg-gray-800 border-gray-700 text-white"
                    disabled={isAnalyzing}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Supported: CSV, XML, PDF, DOCX, TXT, HTML
                  </p>
                </div>
                {file && (
                  <div className="flex items-center gap-2 bg-gray-900/50 p-2 rounded border border-gray-700">
                    {getFileIcon(file.name)}
                    <span className="text-sm text-gray-300 max-w-xs truncate">{file.name}</span>
                    <Button
                      onClick={removeFile}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                      disabled={isAnalyzing}
                    >
                      ×
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Text Input Alternative */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Or Paste Document Text</label>
              <Textarea
                value={documentText}
                onChange={(e) => setDocumentText(e.target.value)}
                placeholder="Paste document text here..."
                className="bg-gray-800 border-gray-700 text-white min-h-32"
                disabled={isAnalyzing}
              />
            </div>

            {/* Analyze Button */}
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || portfolioLoading || !portfolio || (!file && !documentText.trim())}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating Interpretation...
                </>
              ) : (
                <>
                  <Brain className="w-5 h-5 mr-2" />
                  Generate General Interpretation
                </>
              )}
            </Button>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-gray-700">
              <div className="grid md:grid-cols-2 gap-4">
                <Link to="/portfolio-risk-dashboard">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" size="lg">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    View Risk Dashboard
                  </Button>
                </Link>
                <Link to={createPageUrl('RecommendationsEngine')} className="block">
                  <Button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white" size="lg">
                    Get Portfolio Adjustments
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interpretation Results */}
        {interpretation && interpretation.interpretation && (
          <Card className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border-purple-500/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-purple-400" />
                General Interpretation (NLP Analysis)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Summary */}
              <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                <h3 className="text-white font-semibold mb-2">Summary</h3>
                <p className="text-gray-300">{interpretation.interpretation.summary}</p>
              </div>

              {/* Key Themes */}
              {interpretation.interpretation.key_themes && interpretation.interpretation.key_themes.length > 0 && (
                <div>
                  <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    Key Themes
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {interpretation.interpretation.key_themes.map((theme, idx) => (
                      <Badge key={idx} variant="outline" className="border-blue-600 text-blue-300">
                        {theme}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Portfolio Implications */}
              <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                <h3 className="text-white font-semibold mb-2">Portfolio Implications</h3>
                <p className="text-gray-300">{interpretation.interpretation.portfolio_implications}</p>
              </div>

              {/* Risk Assessment */}
              {interpretation.interpretation.risk_assessment && (
                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-semibold">Risk Assessment</h3>
                    <Badge 
                      variant="outline" 
                      className={
                        interpretation.interpretation.risk_assessment.toLowerCase().includes('high') ? 'border-red-600 text-red-300' :
                        interpretation.interpretation.risk_assessment.toLowerCase().includes('medium') ? 'border-yellow-600 text-yellow-300' :
                        'border-green-600 text-green-300'
                      }
                    >
                      {interpretation.interpretation.risk_assessment}
                    </Badge>
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {interpretation.interpretation.recommendations && interpretation.interpretation.recommendations.length > 0 && (
                <div>
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    Recommendations
                  </h3>
                  <div className="space-y-2">
                    {interpretation.interpretation.recommendations.map((rec, idx) => (
                      <div key={idx} className="bg-gray-900/50 p-3 rounded border border-green-700/30">
                        <p className="text-sm text-gray-300">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sectors & Geographic Impact */}
              <div className="grid grid-cols-2 gap-4">
                {interpretation.interpretation.sectors_mentioned && interpretation.interpretation.sectors_mentioned.length > 0 && (
                  <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                    <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Sectors Mentioned
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {interpretation.interpretation.sectors_mentioned.map((sector, idx) => (
                        <Badge key={idx} variant="outline" className="border-purple-600 text-purple-300">
                          {sector}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {interpretation.interpretation.geographic_impact && (
                  <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                    <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Geographic Impact
                    </h3>
                    <p className="text-sm text-gray-300">{interpretation.interpretation.geographic_impact}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-gray-700">
                <div className="grid md:grid-cols-2 gap-4">
                  <Link to="/portfolio-risk-dashboard">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" size="lg">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Get Portfolio Adjustments & Suggestions
                    </Button>
                  </Link>
                  <Link to={createPageUrl('RecommendationsEngine')} className="block">
                    <Button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white" size="lg">
                      Get Portfolio Adjustments
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
