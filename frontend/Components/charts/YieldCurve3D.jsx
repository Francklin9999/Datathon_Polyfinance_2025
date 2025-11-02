import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart } from 'lucide-react';

export default function YieldCurve3D() {
  const data = [
    { maturity: '3M', yield: 5.25 },
    { maturity: '6M', yield: 5.15 },
    { maturity: '1Y', yield: 4.95 },
    { maturity: '2Y', yield: 4.65 },
    { maturity: '5Y', yield: 4.35 },
    { maturity: '10Y', yield: 4.55 },
    { maturity: '30Y', yield: 4.75 }
  ];

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <LineChart className="w-5 h-5 text-blue-400" />
          3D Yield Curve
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative h-64 bg-gray-900/50 rounded-lg">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <polyline
              points={data.map((d, i) => `${(i / (data.length - 1)) * 80 + 10},${90 - d.yield * 10}`).join(' ')}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="0.5"
            />
            {data.map((d, i) => (
              <g key={i}>
                <circle
                  cx={(i / (data.length - 1)) * 80 + 10}
                  cy={90 - d.yield * 10}
                  r="1"
                  fill="#3b82f6"
                />
                <text
                  x={(i / (data.length - 1)) * 80 + 10}
                  y="95"
                  fontSize="3"
                  fill="#9ca3af"
                  textAnchor="middle"
                >
                  {d.maturity}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}