import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function ExplainabilityToggle({ enabled, onToggle }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={onToggle}
            variant={enabled ? 'default' : 'outline'}
            size="sm"
            className={enabled ? 'bg-blue-600 hover:bg-blue-700' : 'border-gray-700 text-white hover:bg-gray-800'}
          >
            {enabled ? (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Explainability ON
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                Explainability OFF
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent className="bg-gray-900 border-gray-700 text-white max-w-xs">
          <div className="space-y-2 text-xs">
            <p className="font-semibold">Explainability Mode</p>
            {enabled ? (
              <div className="space-y-1 text-gray-300">
                <p>✓ Template-based summaries</p>
                <p>✓ Expanded citations</p>
                <p>✓ No generative phrasing</p>
                <p>✓ No speculative language</p>
              </div>
            ) : (
              <p className="text-gray-300">
                Enable for full transparency with template summaries and expanded citations
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}