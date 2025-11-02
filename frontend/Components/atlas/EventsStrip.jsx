import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function EventsStrip({ events }) {
  if (!events || events.length === 0) return null;

  const importanceColors = {
    high: 'bg-red-500/20 text-red-300 border-red-500/50',
    medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
    low: 'bg-blue-500/20 text-blue-300 border-blue-500/50'
  };

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-white">Upcoming Events</h3>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {events.map((event, idx) => (
            <div
              key={idx}
              className="flex-shrink-0 bg-gray-900/50 rounded-lg p-3 border border-gray-700 min-w-[200px]"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-sm font-medium text-white">{event.label}</p>
                <Badge variant="outline" className={importanceColors[event.importance]}>
                  {event.importance}
                </Badge>
              </div>
              {event.eventDate && (
                <p className="text-xs text-gray-400">
                  {format(new Date(event.eventDate), 'MMM d, HH:mm')}
                </p>
              )}
              {event.description && (
                <p className="text-xs text-gray-500 mt-1">{event.description}</p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}