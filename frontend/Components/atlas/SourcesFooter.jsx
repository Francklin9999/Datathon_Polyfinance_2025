import React from 'react';
import { Info } from 'lucide-react';
import { format } from 'date-fns';

export default function SourcesFooter({ sources, lastUpdated }) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-6 p-4 bg-gray-900/50 rounded-lg border border-gray-800">
      <div className="flex items-start gap-3">
        <Info className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-xs font-semibold text-gray-400 mb-1">Data Sources</p>
          <p className="text-xs text-gray-500">
            {sources.join(' • ')}
          </p>
          {lastUpdated && (
            <p className="text-xs text-gray-600 mt-1">
              Last updated: {format(new Date(lastUpdated), 'MMM d, yyyy HH:mm:ss')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}