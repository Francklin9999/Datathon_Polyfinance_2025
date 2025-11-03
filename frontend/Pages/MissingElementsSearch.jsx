import React, { useState } from 'react';
import { api } from '@/api/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  AlertTriangle,
  CheckCircle,
  Loader2,
  ExternalLink,
  FileText,
  Building2,
  BarChart3,
  Globe,
  RefreshCw,
  Info
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import RecommendationExplanation from '@/components/RecommendationExplanation';

export default function MissingElementsSearch() {
  const [reportType, setReportType] = useState('regulatory');
  const [reportData, setReportData] = useState('');
  const [pageUrl, setPageUrl] = useState('http://127.0.0.1:8888/');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (!reportData) {
      alert('Please provide report data (JSON format)');
      return;
    }

    setIsSearching(true);
    setError(null);
    setSearchResults(null);

    try {
      // Parse report data if it's a string
      let parsedReportData = reportData;
      if (typeof reportData === 'string') {
        try {
          parsedReportData = JSON.parse(reportData);
        } catch (e) {
          // If parsing fails, try to extract from current page data
          parsedReportData = {};
        }
      }

      const result = await api.regulatory.searchMissingElements({
        report_type: reportType,
        report_data: parsedReportData,
        page_url: pageUrl
      });

      setSearchResults(result);
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message || 'Error searching for missing elements');
    } finally {
      setIsSearching(false);
    }
  };

  const getReportTypeIcon = (type) => {
    switch (type) {
      case 'regulatory':
        return <FileText className="w-5 h-5" />;
      case 'company_impact':
        return <Building2 className="w-5 h-5" />;
      case 'portfolio':
        return <BarChart3 className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-600';
      case 'MEDIUM':
        return 'bg-yellow-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Search className="w-8 h-8 text-blue-400" />
              Missing Elements Search
            </h1>
            <p className="text-gray-400 mt-1">
              Search for missing elements from reports using SearXNG at http://127.0.0.1:8888/
            </p>
          </div>
          <Link to={createPageUrl('Home')}>
            <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Search Configuration */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-400" />
              Search Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Report Type Selection */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Report Type</label>
              <Tabs value={reportType} onValueChange={setReportType}>
                <TabsList className="grid w-full grid-cols-3 bg-gray-900">
                  <TabsTrigger value="regulatory" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Regulatory
                  </TabsTrigger>
                  <TabsTrigger value="company_impact" className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Company Impact
                  </TabsTrigger>
                  <TabsTrigger value="portfolio" className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Portfolio
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Page URL */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">SearXNG URL</label>
              <Input
                value={pageUrl}
                onChange={(e) => setPageUrl(e.target.value)}
                placeholder="http://127.0.0.1:8888/"
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>

            {/* Report Data */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Report Data (JSON format)
              </label>
              <textarea
                value={reportData}
                onChange={(e) => setReportData(e.target.value)}
                placeholder='{"regulation_name": "Example Regulation", "jurisdiction": "US", ...}'
                className="w-full h-32 p-3 bg-gray-900 border border-gray-700 text-white rounded-md font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Paste your report data in JSON format, or leave empty to search based on report type only
              </p>
            </div>

            {/* Search Button */}
            <Button
              onClick={handleSearch}
              disabled={isSearching}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Searching with SearXNG...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  Search for Missing Elements
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="bg-red-900/20 border-red-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <p className="text-red-300">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search Results */}
        {searchResults && (
          <>
            {/* Summary */}
            <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  {getReportTypeIcon(searchResults.report_type)}
                  Search Results Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                    <p className="text-3xl font-bold text-blue-400">{searchResults.completeness_percentage}%</p>
                    <p className="text-sm text-gray-400 mt-1">Completeness</p>
                  </div>
                  <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                    <p className="text-3xl font-bold text-green-400">{searchResults.present_count}</p>
                    <p className="text-sm text-gray-400 mt-1">Present Elements</p>
                  </div>
                  <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                    <p className="text-3xl font-bold text-red-400">{searchResults.missing_count}</p>
                    <p className="text-sm text-gray-400 mt-1">Missing Elements</p>
                  </div>
                  <div className="text-center p-4 bg-gray-900/50 rounded-lg">
                    <p className="text-3xl font-bold text-purple-400">{searchResults.total_elements}</p>
                    <p className="text-sm text-gray-400 mt-1">Total Elements</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Missing Elements */}
            {searchResults.missing_elements && searchResults.missing_elements.length > 0 && (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    Missing Elements ({searchResults.missing_count})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {searchResults.missing_elements.map((element, idx) => (
                      <div key={idx} className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <Badge className={element.required ? 'bg-red-600' : 'bg-yellow-600'}>
                              {element.required ? 'Required' : 'Optional'}
                            </Badge>
                            <h4 className="font-bold text-white">{element.element}</h4>
                          </div>
                        </div>
                        <p className="text-sm text-gray-300">{element.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Search Results and Recommendations */}
            {searchResults.search_results && searchResults.search_results.length > 0 && (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Search className="w-5 h-5 text-blue-400" />
                    SearXNG Search Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {searchResults.search_results.map((result, idx) => (
                      <div key={idx} className="p-4 bg-gray-900/50 rounded-lg border border-blue-500/30">
                        <div className="mb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className="bg-blue-600">{result.element}</Badge>
                            <span className="text-sm text-gray-400">{result.number_of_results} results found</span>
                          </div>
                          <p className="text-xs text-gray-500 italic">Query: {result.query}</p>
                        </div>
                        
                        <div className="space-y-3">
                          {result.results.map((searchResult, resultIdx) => (
                            <div key={resultIdx} className="p-3 bg-gray-800/50 rounded border border-gray-700">
                              <div className="flex items-start justify-between mb-2">
                                <h5 className="font-semibold text-white text-sm">{searchResult.title}</h5>
                                <a
                                  href={searchResult.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:text-blue-300"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </div>
                              <p className="text-xs text-gray-400 mb-2">
                                {searchResult.url}
                              </p>
                              <p className="text-sm text-gray-300 line-clamp-2">
                                {searchResult.content}
                              </p>
                              {searchResult.engine && (
                                <Badge variant="outline" className="mt-2 text-xs">
                                  Source: {searchResult.engine}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {searchResults.recommendations && searchResults.recommendations.length > 0 && (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Info className="w-5 h-5 text-green-400" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {searchResults.recommendations.map((rec, idx) => (
                      <div key={idx} className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <Badge className={getPriorityColor(rec.priority)}>
                              {rec.priority}
                            </Badge>
                            <h4 className="font-bold text-white">{rec.element}</h4>
                            <RecommendationExplanation
                              tickers={null}
                              type="general"
                              context={{ element: rec.element, priority: rec.priority }}
                              reason={rec.recommendation}
                            />
                          </div>
                        </div>
                        <p className="text-sm text-gray-300 mb-3">{rec.recommendation}</p>
                        
                        {rec.sources && rec.sources.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-700">
                            <p className="text-xs text-gray-400 mb-2">Recommended Sources:</p>
                            <div className="space-y-2">
                              {rec.sources.map((source, sourceIdx) => (
                                <a
                                  key={sourceIdx}
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  {source.title || source.url}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Present Elements */}
            {searchResults.present_elements && searchResults.present_elements.length > 0 && (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    Present Elements ({searchResults.present_count})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {searchResults.present_elements.map((element, idx) => (
                      <Badge key={idx} className="bg-green-600">
                        {element}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Refresh Button */}
            <div className="flex justify-center">
              <Button
                onClick={handleSearch}
                disabled={isSearching}
                variant="outline"
                className="border-gray-700 text-white hover:bg-gray-800"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Search
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
