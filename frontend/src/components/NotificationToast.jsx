import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  X, 
  Info,
  Loader2
} from 'lucide-react';

export default function NotificationToast({ notification, onDismiss, onMarkRead }) {
  const getIcon = () => {
    switch (notification.type) {
      case 'analysis_complete':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'analysis_failed':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'job_started':
        return <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />;
      case 'job_cancelled':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      default:
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getTitle = () => {
    switch (notification.type) {
      case 'analysis_complete':
        return 'Analysis Complete';
      case 'analysis_failed':
        return 'Analysis Failed';
      case 'job_started':
        return 'Analysis Started';
      case 'job_cancelled':
        return 'Analysis Cancelled';
      default:
        return 'Notification';
    }
  };

  const getMessage = () => {
    const data = notification.data || {};
    
    switch (notification.type) {
      case 'analysis_complete':
        const topOffender = data.result?.portfolio_impact?.worst_offenders?.[0];
        return topOffender
          ? `Top exposed company: ${topOffender.ticker} (Score: ${topOffender.score?.toFixed(1)})`
          : 'Document analysis completed successfully';
      case 'analysis_failed':
        return data.error || 'An error occurred during analysis';
      case 'job_started':
        return `Analysis is now running in the background`;
      case 'job_cancelled':
        return 'Analysis was cancelled';
      default:
        return 'New notification';
    }
  };

  const getBadgeColor = () => {
    switch (notification.type) {
      case 'analysis_complete':
        return 'border-green-600 text-green-300';
      case 'analysis_failed':
        return 'border-red-600 text-red-300';
      case 'job_started':
        return 'border-blue-600 text-blue-300';
      case 'job_cancelled':
        return 'border-yellow-600 text-yellow-300';
      default:
        return 'border-gray-600 text-gray-300';
    }
  };

  if (notification.read) {
    return null;
  }

  return (
    <Card className={`bg-gray-800 border-gray-700 mb-2 ${!notification.read ? 'border-l-4 border-l-blue-500' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-semibold text-white">{getTitle()}</h4>
              <Badge variant="outline" className={`text-xs ${getBadgeColor()}`}>
                {notification.type}
              </Badge>
            </div>
            <p className="text-sm text-gray-300">{getMessage()}</p>
            <div className="flex items-center gap-2 mt-2">
              {notification.data?.jobId && (
                <span className="text-xs text-gray-500">
                  Job ID: {notification.data.jobId.substring(0, 8)}...
                </span>
              )}
              {notification.type === 'analysis_complete' && notification.data?.jobId && (
                <a
                  href="/document-analyzer"
                  className="text-xs text-blue-400 hover:text-blue-300 underline"
                  onClick={() => {
                    onMarkRead && onMarkRead(notification.id);
                  }}
                >
                  View Results
                </a>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-gray-400 hover:text-white"
            onClick={() => {
              onDismiss && onDismiss(notification.id);
            }}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

