import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ErrorDisplay({ error, onRetry, title = "Error Loading Data" }) {
  const errorMessage = error?.message || error?.toString() || 'An unknown error occurred';
  const errorDetail = error?.response?.data?.detail || error?.response?.data?.error || null;
  
  return (
    <Card className="bg-red-900/20 border-red-500/50 my-4">
      <CardHeader>
        <CardTitle className="text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-red-300 text-sm">{errorMessage}</p>
          {errorDetail && (
            <p className="text-red-400/80 text-xs font-mono bg-red-900/30 p-2 rounded">
              {typeof errorDetail === 'string' ? errorDetail : JSON.stringify(errorDetail, null, 2)}
            </p>
          )}
          {onRetry && (
            <Button
              onClick={onRetry}
              variant="outline"
              className="border-red-500 text-red-400 hover:bg-red-900/30"
              size="sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

