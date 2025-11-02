import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function TimePhasedRiskCurve({ regulation }) {
  const phases = [
    { 
      name: 'Proposal', 
      intensity: 20, 
      color: 'bg-blue-500',
      citation: regulation?.citations?.[0]?.paragraph || 'N/A',
      description: 'Initial regulatory proposal stage'
    },
    { 
      name: 'Consultation', 
      intensity: 40, 
      color: 'bg-yellow-500',
      citation: regulation?.citations?.[1]?.paragraph || 'N/A',
      description: 'Public comment and feedback period'
    },
    { 
      name: 'Enforcement', 
      intensity: 80, 
      color: 'bg-orange-500',
      citation: regulation?.citations?.[2]?.paragraph || 'N/A',
      description: 'Active enforcement begins'
    },
    { 
      name: 'Penalty', 
      intensity: 100, 
      color: 'bg-red-500',
      citation: 'TBD',
      description: 'Penalty phase for non-compliance'
    }
  ];

  const getCurrentPhase = () => {
    // Mock logic - in real app would compare dates
    return 'Enforcement';
  };

  const currentPhase = getCurrentPhase();

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            Time-Phased Risk Curve
          </CardTitle>
          <Badge className="bg-orange-600">
            Current: {currentPhase}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {phases.map((phase, idx) => (
            <TooltipProvider key={idx}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-semibold ${
                        phase.name === currentPhase ? 'text-white' : 'text-gray-400'
                      } w-24`}>
                        {phase.name}
                      </span>
                      <div className="flex-1 bg-gray-700 h-8 rounded-lg overflow-hidden relative">
                        <div
                          className={`${phase.color} h-full transition-all duration-500 flex items-center justify-end px-3`}
                          style={{ width: `${phase.intensity}%` }}
                        >
                          <span className="text-white text-xs font-bold">{phase.intensity}%</span>
                        </div>
                        {phase.name === currentPhase && (
                          <div className="absolute top-0 right-0 h-full w-1 bg-yellow-400 animate-pulse"></div>
                        )}
                      </div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-gray-900 border-gray-700 text-white max-w-xs">
                  <div className="space-y-1">
                    <p className="font-semibold">{phase.name}</p>
                    <p className="text-xs text-gray-400">{phase.description}</p>
                    <p className="text-xs text-blue-400">
                      Citation: {phase.citation}
                    </p>
                    <p className="text-xs text-gray-500">
                      Risk Intensity: {phase.intensity}%
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>

        <div className="mt-4 p-3 bg-gray-900/50 rounded border border-gray-700">
          <p className="text-xs text-gray-400">
            <span className="font-semibold text-white">Procedural Maturity:</span> Currently in {currentPhase} phase. 
            Risk intensity escalates through each stage as enforcement mechanisms activate.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}