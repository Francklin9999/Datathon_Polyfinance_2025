import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { format } from 'date-fns';

export default function NewsList({ news }) {
  if (!news || news.length === 0) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-8 text-center text-gray-400">
          No news available
        </CardContent>
      </Card>
    );
  }

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'negative': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case 'positive': return <TrendingUp className="w-3 h-3" />;
      case 'negative': return <TrendingDown className="w-3 h-3" />;
      default: return <Minus className="w-3 h-3" />;
    }
  };

  // Calculate aggregate sentiment
  const aggregateSentiment = React.useMemo(() => {
    const total = news.length;
    const positive = news.filter(n => n.sentiment === 'positive').length;
    const negative = news.filter(n => n.sentiment === 'negative').length;
    const neutral = total - positive - negative;
    
    const avgScore = news.reduce((sum, n) => sum + (n.sentimentScore || 0), 0) / total;
    
    return {
      positive: (positive / total * 100).toFixed(0),
      neutral: (neutral / total * 100).toFixed(0),
      negative: (negative / total * 100).toFixed(0),
      score: avgScore.toFixed(2)
    };
  }, [news]);

  // Extract top keywords
  const topKeywords = React.useMemo(() => {
    const keywordCounts = {};
    news.forEach(item => {
      if (item.keywords) {
        item.keywords.forEach(kw => {
          keywordCounts[kw] = (keywordCounts[kw] || 0) + 1;
        });
      }
    });
    return Object.entries(keywordCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([kw]) => kw);
  }, [news]);

  return (
    <div className="space-y-4">
      {/* Sentiment Gauge */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-sm">Sentiment Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex h-3 rounded-full overflow-hidden">
              <div className="bg-green-500" style={{ width: `${aggregateSentiment.positive}%` }} />
              <div className="bg-gray-500" style={{ width: `${aggregateSentiment.neutral}%` }} />
              <div className="bg-red-500" style={{ width: `${aggregateSentiment.negative}%` }} />
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span className="text-green-400">{aggregateSentiment.positive}% Positive</span>
              <span>{aggregateSentiment.neutral}% Neutral</span>
              <span className="text-red-400">{aggregateSentiment.negative}% Negative</span>
            </div>
            <div className="text-center">
              <span className="text-sm text-gray-400">Overall Score: </span>
              <span className="text-lg font-bold text-white">{aggregateSentiment.score}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Keywords */}
      {topKeywords.length > 0 && (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-sm">Top Keywords</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {topKeywords.map((keyword, idx) => (
                <Badge key={idx} variant="outline" className="bg-blue-900/30 text-blue-200 border-blue-500/30">
                  {keyword}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* News Items */}
      <div className="space-y-3">
        {news.map((item, idx) => (
          <Card key={idx} className="bg-gray-800/50 border-gray-700 hover:border-blue-500/50 transition-all">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className={getSentimentColor(item.sentiment)}>
                      {getSentimentIcon(item.sentiment)}
                      <span className="ml-1">{item.sentiment}</span>
                    </Badge>
                    <span className="text-xs text-gray-500">{item.source}</span>
                  </div>
                  <h4 className="text-white font-medium mb-2 leading-snug">{item.title}</h4>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    {item.publishedDate && (
                      <span>{format(new Date(item.publishedDate), 'MMM d, HH:mm')}</span>
                    )}
                    {item.keywords && item.keywords.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {item.keywords.slice(0, 3).map((kw, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {kw}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}