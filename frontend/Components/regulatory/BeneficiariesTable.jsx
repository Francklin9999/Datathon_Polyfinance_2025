import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function BeneficiariesTable({ companies = [] }) {
  const beneficiaries = companies.filter(c => c.score < 0); // Negative score = beneficial impact

  const getArbitrageType = (company) => {
    if (company.score < -40) return { type: 'Subsidy Advantage', color: 'bg-green-600' };
    if (company.score < -20) return { type: 'Geographic Exemption', color: 'bg-blue-600' };
    return { type: 'Lower Disclosure Burden', color: 'bg-purple-600' };
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-900 border-b border-gray-700">
          <tr>
            <th className="text-left p-3 text-gray-400 font-semibold">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                TICKER
              </div>
            </th>
            <th className="text-left p-3 text-gray-400 font-semibold">BENEFIT REASON</th>
            <th className="text-left p-3 text-gray-400 font-semibold">ARBITRAGE TYPE</th>
            <th className="text-right p-3 text-gray-400 font-semibold">BENEFIT SCORE</th>
            <th className="text-center p-3 text-gray-400 font-semibold">CITATIONS</th>
          </tr>
        </thead>
        <tbody>
          {beneficiaries.length === 0 ? (
            <tr>
              <td colSpan="5" className="p-6 text-center text-gray-500">
                No beneficiaries identified from this regulation
              </td>
            </tr>
          ) : (
            beneficiaries.map((company, idx) => {
              const arbitrage = getArbitrageType(company);
              return (
                <tr
                  key={idx}
                  className="border-b border-gray-800 hover:bg-green-900/10 transition-all"
                >
                  <td className="p-3 font-mono font-bold text-green-400">{company.ticker}</td>
                  <td className="p-3 text-gray-300">{company.exposure}</td>
                  <td className="p-3">
                    <Badge className={arbitrage.color}>
                      {arbitrage.type}
                    </Badge>
                  </td>
                  <td className="p-3 text-right">
                    <span className="text-xl font-bold text-green-400">
                      {Math.abs(company.score)}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex gap-1 justify-center">
                      {company.citations?.map((c, i) => (
                        <TooltipProvider key={i}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className="font-mono text-blue-400 text-xs cursor-pointer">
                                {c}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent className="bg-gray-900 border-gray-700 text-white">
                              <p className="text-xs">Source citation: {c}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {beneficiaries.length > 0 && (
        <div className="mt-4 p-3 bg-green-900/20 border border-green-500/30 rounded">
          <p className="text-xs text-green-300">
            <span className="font-semibold">{beneficiaries.length} beneficiaries identified.</span> These companies 
            stand to benefit from regulatory changes through subsidies, exemptions, or competitive advantages.
          </p>
        </div>
      )}
    </div>
  );
}