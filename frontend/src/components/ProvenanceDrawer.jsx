import React, { useState } from 'react';
import { X, FileText, Clock, Database, Code, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProvenanceDrawer({ provenance, isOpen, onClose }) {
  if (!isOpen || !provenance) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-96 bg-gray-900 border-l border-gray-700 z-50 shadow-2xl overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-700 pb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Document Provenance
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

          {/* Source Information */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-sm">Source</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-gray-600 text-gray-300">
                  {provenance.source || 'Unknown'}
                </Badge>
              </div>
              {provenance.file_format && (
                <div className="text-sm text-gray-400">
                  Format: <span className="text-white">{provenance.file_format}</span>
                </div>
              )}
              {provenance.extraction_method && (
                <div className="text-sm text-gray-400">
                  Method: <span className="text-white font-mono text-xs">{provenance.extraction_method}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timing Information */}
          {provenance.analysis_timestamp && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Analysis Timing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-400">
                  <div>Analyzed: <span className="text-white">{new Date(provenance.analysis_timestamp).toLocaleString()}</span></div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Processing Details */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <Database className="w-4 h-4" />
                Processing Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {provenance.num_companies !== undefined && (
                <div className="text-sm text-gray-400">
                  Companies Analyzed: <span className="text-white">{provenance.num_companies}</span>
                </div>
              )}
              {provenance.threshold !== undefined && (
                <div className="text-sm text-gray-400">
                  Similarity Threshold: <span className="text-white">{provenance.threshold}</span>
                </div>
              )}
              {provenance.strict_units !== undefined && (
                <div className="text-sm text-gray-400">
                  Strict Units: <span className="text-white">{provenance.strict_units ? 'Yes' : 'No'}</span>
                </div>
              )}
              {provenance.search_results !== undefined && (
                <div className="text-sm text-gray-400">
                  Search Results: <span className="text-white">{provenance.search_results}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Services Used */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <Code className="w-4 h-4" />
                Services Used
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {provenance.extraction_method && (
                  <Badge variant="outline" className="border-gray-600 text-gray-300">
                    Document Parser
                  </Badge>
                )}
                <Badge variant="outline" className="border-gray-600 text-gray-300">
                  Regulatory Analyzer
                </Badge>
                <Badge variant="outline" className="border-gray-600 text-gray-300">
                  Impact Modeler
                </Badge>
                {provenance.source === 'agent_query' && (
                  <Badge variant="outline" className="border-gray-600 text-gray-300">
                    SearXNG
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* File Information */}
          {provenance.file_url && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">File Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-400 break-all">
                  <span className="text-white">{provenance.file_url}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Information */}
          {provenance.error && (
            <Card className="bg-red-900/20 border-red-700">
              <CardHeader>
                <CardTitle className="text-red-400 text-sm">Error</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-red-300">{provenance.error}</div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

