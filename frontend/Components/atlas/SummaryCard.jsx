import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Volume2, Copy, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function SummaryCard({ summary, engineMode, timestamp, language = 'EN' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(summary);
      utterance.lang = language === 'FR' ? 'fr-FR' : 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  if (!summary) return null;

  return (
    <Card className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            AI Summary
            <Badge variant="outline" className="text-purple-300 border-purple-500">
              {engineMode}
            </Badge>
          </CardTitle>
          <div className="flex gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={handleSpeak}
              className="text-gray-400 hover:text-white"
            >
              <Volume2 className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleCopy}
              className="text-gray-400 hover:text-white"
            >
              {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-300 leading-relaxed mb-3">{summary}</p>
        {timestamp && (
          <p className="text-xs text-gray-500">
            Generated: {new Date(timestamp).toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}