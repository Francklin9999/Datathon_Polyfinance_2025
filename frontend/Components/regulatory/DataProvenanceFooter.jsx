import React from 'react';
import { Badge } from '@/components/ui/badge';
import { FileText, Clock, Hash, CheckCircle } from 'lucide-react';

export default function DataProvenanceFooter({ regulation, timestamp }) {
  const citationCount = regulation?.citations?.length || 0;
  const measuresCount = regulation?.measures?.length || 0;
  const entitiesCount = (regulation?.entities?.tickers?.length || 0) + 
                        (regulation?.entities?.sectors?.length || 0);

  return (
    <div className="border-t border-gray-700 bg-gray-900/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-gray-400">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Run: {timestamp || new Date().toLocaleString()}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span>Doc ID: {regulation?.docId || 'N/A'}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4" />
            <span>{citationCount} citations</span>
          </div>
          
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span>{measuresCount} measures extracted</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-blue-400">
              {entitiesCount} entities identified
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span>Extraction v2.1.0</span>
          <span className="text-gray-600">|</span>
          <span className="text-green-400">AWS Bedrock</span>
        </div>
      </div>
    </div>
  );
}