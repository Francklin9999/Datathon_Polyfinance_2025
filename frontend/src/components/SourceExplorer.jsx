import React, { useState } from 'react';
import { Search, FileText, Plus, X, BookOpen, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function SourceExplorer({ ticker, isOpen, onClose, onAddEvidence }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSections, setSelectedSections] = useState([]);
  const [selectedSnippets, setSelectedSnippets] = useState([]);

  if (!isOpen) return null;

  // Mock sections (in production, fetch from 10-K parser)
  const sections = [
    { id: '1A', title: 'Item 1A - Risk Factors', snippet: 'Sample risk factors text...' },
    { id: '7', title: 'Item 7 - MD&A', snippet: 'Sample MD&A text...' },
    { id: '8', title: 'Item 8 - Financial Statements', snippet: 'Sample financial statements text...' },
  ];

  const handleAddSnippet = (snippet, section) => {
    const evidence = {
      source: '10K',
      section: section.id,
      snippet: snippet,
      timestamp: new Date().toISOString()
    };
    
    if (onAddEvidence) {
      onAddEvidence(ticker, evidence);
    }
    
    setSelectedSnippets([...selectedSnippets, evidence]);
  };

  const handleRemoveSnippet = (index) => {
    const newSnippets = selectedSnippets.filter((_, i) => i !== index);
    setSelectedSnippets(newSnippets);
  };

  const filteredSections = sections.filter(section =>
    section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    section.snippet.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Side Panel */}
      <div className="fixed right-0 top-0 h-full w-96 bg-gray-900 border-l border-gray-700 z-50 shadow-2xl overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-700 pb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Source Explorer
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="hover:bg-gray-800"
            >
              <X className="w-4 h-4 text-white" />
            </Button>
          </div>

          {ticker && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-gray-600 text-gray-300">
                {ticker}
              </Badge>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search sections, snippets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-white"
            />
          </div>

          {/* Section Navigator */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-400">Sections</h3>
            <div className="space-y-2">
              {filteredSections.map((section) => (
                <Card key={section.id} className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-white text-sm">{section.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-xs text-gray-400 line-clamp-2">{section.snippet}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddSnippet(section.snippet, section)}
                      className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      <Plus className="w-3 h-3 mr-2" />
                      Add to Evidence
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Selected Snippets */}
          {selectedSnippets.length > 0 && (
            <div className="space-y-3 border-t border-gray-700 pt-4">
              <h3 className="text-sm font-semibold text-gray-400">Selected Evidence</h3>
              <div className="space-y-2">
                {selectedSnippets.map((evidence, index) => (
                  <Card key={index} className="bg-green-900/20 border-green-700">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <Badge variant="outline" className="border-green-600 text-green-300 mb-2">
                            {evidence.source} - {evidence.section}
                          </Badge>
                          <p className="text-xs text-gray-300 line-clamp-2">{evidence.snippet}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSnippet(index)}
                          className="hover:bg-red-900/30"
                        >
                          <X className="w-3 h-3 text-red-400" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

