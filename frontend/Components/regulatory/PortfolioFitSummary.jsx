import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, Copy, CheckCircle } from 'lucide-react';

export default function PortfolioFitSummary({ adjustments = [] }) {
  const [copied, setCopied] = useState(false);

  const theme = generateTheme(adjustments);
  
  const copyRationale = () => {
    const bullets = [
      `Portfolio Rotation Theme: ${theme.title}`,
      `Total Movement: ${theme.totalBps} bps across ${adjustments.length} positions`,
      ...adjustments.slice(0, 3).map(adj => 
        `• ${adj.action.toUpperCase()} ${adj.target} by ${adj.sizeBp} bps: ${adj.rationale}`
      ),
      `Net Impact: ${theme.netImpact}`
    ];
    
    navigator.clipboard.writeText(bullets.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border-purple-500/30">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-purple-400" />
              <h3 className="font-semibold text-white">Portfolio Fit Summary</h3>
            </div>
            
            <div className="space-y-2">
              <div>
                <p className="text-sm text-gray-400">Recommended Theme</p>
                <p className="text-lg font-bold text-white">{theme.title}</p>
              </div>
              
              <div className="flex gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Total Movement</p>
                  <p className="font-semibold text-blue-400">{theme.totalBps} bps</p>
                </div>
                <div>
                  <p className="text-gray-400">Positions</p>
                  <p className="font-semibold text-white">{adjustments.length}</p>
                </div>
                <div>
                  <p className="text-gray-400">Net Impact</p>
                  <Badge className={theme.netImpact.includes('Reduce') ? 'bg-orange-600' : 'bg-green-600'}>
                    {theme.netImpact}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <Button
            onClick={copyRationale}
            className="bg-purple-600 hover:bg-purple-700"
            size="sm"
          >
            {copied ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy Rationale
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function generateTheme(adjustments) {
  const totalBps = adjustments.reduce((sum, adj) => sum + adj.sizeBp, 0);
  const reductions = adjustments.filter(a => a.action === 'reduce').reduce((sum, a) => sum + a.sizeBp, 0);
  const increases = adjustments.filter(a => a.action === 'increase').reduce((sum, a) => sum + a.sizeBp, 0);
  
  let title = '';
  if (reductions > increases) {
    title = `Defensive Rotation: Reduce High-Risk Exposure`;
  } else if (increases > reductions) {
    title = `Opportunistic Rotation: Increase Beneficiary Positions`;
  } else {
    title = `Balanced Rotation: Risk Mitigation & Opportunity Capture`;
  }
  
  const netBps = increases - reductions;
  const netImpact = netBps > 0 ? `Net +${netBps} bps` : `Net ${netBps} bps`;
  
  return { title, totalBps, netImpact };
}