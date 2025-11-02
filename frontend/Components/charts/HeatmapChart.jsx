import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function HeatmapChart({ title, data }) {
  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          {data.map((item, idx) => {
            const intensity = Math.abs(item.change);
            const color = item.change > 0 ? 'bg-green-500' : 'bg-red-500';
            const opacity = Math.min(intensity / 2, 0.9);
            
            return (
              <div
                key={idx}
                className={`p-4 rounded-lg ${color} flex flex-col items-center justify-center`}
                style={{ opacity }}
              >
                <p className="text-white font-bold text-sm">{item.name}</p>
                <p className="text-white text-xs mt-1">{item.value}%</p>
                <p className="text-white text-lg font-bold mt-1">
                  {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}%
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}