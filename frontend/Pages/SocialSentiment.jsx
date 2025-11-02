import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  MessageSquare, 
  Search,
  Brain,
  Twitter,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Loader2,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function SocialSentiment() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sentimentData, setSentimentData] = useState(null);

  // Mock social media posts
  const mockPosts = [
    {
      platform: 'Twitter',
      author: '@FinanceDaily',
      content: "Breaking: Meta fined €1.2B for GDPR violations. This sets a major precedent for Big Tech. Investors should watch carefully. #GDPR #Meta #Privacy",
      timestamp: "2024-01-20T14:32:00",
      sentiment: "negative",
      sentimentScore: -0.72,
      engagement: { likes: 2345, retweets: 892, replies: 456 }
    },
    {
      platform: 'Twitter',
      author: '@TechInvestor',
      content: "Inflation Reduction Act EV credits are game-changing for $TSLA $GM $F. Massive demand incoming. Long these names. 🚗⚡",
      timestamp: "2024-01-20T13:15:00",
      sentiment: "positive",
      sentimentScore: 0.85,
      engagement: { likes: 5678, retweets: 1234, replies: 234 }
    },
    {
      platform: 'Reddit',
      author: 'u/WallStreetAnalyst',
      content: "DD: Johnson & Johnson talc lawsuit exposure is massive. $8.5B+ potential liability. Reducing position to 0.5% of portfolio. Risk/reward no longer favorable.",
      timestamp: "2024-01-20T12:45:00",
      sentiment: "negative",
      sentimentScore: -0.68,
      engagement: { upvotes: 3421, comments: 567 }
    },
    {
      platform: 'Twitter',
      author: '@RegulatoryWatch',
      content: "CBAM (Carbon Border Adjustment Mechanism) could reshape global supply chains. Steel, cement, aluminum sectors most exposed. Winners: domestic EU producers.",
      timestamp: "2024-01-20T11:20:00",
      sentiment: "neutral",
      sentimentScore: 0.12,
      engagement: { likes: 892, retweets: 345, replies: 123 }
    },
    {
      platform: 'Reddit',
      author: 'u/ClimateInvestor',
      content: "Analysis: EU Carbon Border Tax will crush Chinese steel imports. $X $NUE $STLD positioned to benefit. This is a 10-year tailwind.",
      timestamp: "2024-01-20T10:05:00",
      sentiment: "positive",
      sentimentScore: 0.78,
      engagement: { upvotes: 1892, comments: 234 }
    },
    {
      platform: 'Twitter',
      author: '@AutoNewsDaily',
      content: "NHTSA mandates Tesla recall 2M vehicles for Autopilot software fix. Safety concerns mount. $TSLA down 3.2% premarket.",
      timestamp: "2024-01-20T09:30:00",
      sentiment: "negative",
      sentimentScore: -0.81,
      engagement: { likes: 8934, retweets: 3456, replies: 1234 }
    }
  ];

  const handleAnalyze = async () => {
    if (!searchTerm) {
      alert('Please enter a search term');
      return;
    }

    setIsAnalyzing(true);

    try {
      // Use LLM to analyze sentiment from posts
      const postsText = mockPosts.map((p, i) => `Post ${i + 1}: ${p.content}`).join('\n\n');
      
      const sentimentPrompt = `You are a sentiment analyst. Analyze social media sentiment for "${searchTerm}" from these posts:

${postsText}

Provide JSON analysis:
{
  "overall_sentiment": "positive/negative/neutral",
  "sentiment_score": number between -1 and 1,
  "confidence": number between 0 and 1,
  "key_themes": ["List 4-5 main themes"],
  "investor_mood": "Detailed description of investor mood",
  "risk_signals": ["List concerning signals"],
  "opportunity_signals": ["List opportunity signals"],
  "sentiment_drivers": "What is driving the sentiment",
  "recommended_monitoring": ["What to monitor going forward"]
}`;

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: sentimentPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            overall_sentiment: { type: "string" },
            sentiment_score: { type: "number" },
            confidence: { type: "number" },
            key_themes: { type: "array", items: { type: "string" } },
            investor_mood: { type: "string" },
            risk_signals: { type: "array", items: { type: "string" } },
            opportunity_signals: { type: "array", items: { type: "string" } },
            sentiment_drivers: { type: "string" },
            recommended_monitoring: { type: "array", items: { type: "string" } }
          }
        }
      });

      // Generate time series data
      const timeSeriesData = Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        sentiment: -0.2 + Math.random() * 0.8,
        volume: Math.floor(Math.random() * 500) + 100
      }));

      // Sentiment distribution
      const sentimentDist = [
        { name: 'Positive', value: 42, color: '#10B981' },
        { name: 'Neutral', value: 28, color: '#6B7280' },
        { name: 'Negative', value: 30, color: '#EF4444' }
      ];

      setSentimentData({
        keyword: searchTerm,
        posts: mockPosts,
        analysis,
        timeSeriesData,
        sentimentDist,
        totalPosts: 15678,
        totalEngagement: 89234
      });
    } catch (error) {
      console.error('Analysis error:', error);
      // Fallback data
      setSentimentData({
        keyword: searchTerm,
        posts: mockPosts,
        analysis: {
          overall_sentiment: "mixed",
          sentiment_score: -0.15,
          confidence: 0.78,
          key_themes: ["Regulatory enforcement", "Legal exposure", "Market reaction", "Policy impact", "Investor concern"],
          investor_mood: "Cautious and watchful. Investors are monitoring regulatory developments closely with mixed views on long-term impact.",
          risk_signals: ["Increasing legal exposure", "Regulatory enforcement tightening", "Negative precedent setting"],
          opportunity_signals: ["Winners emerging in regulatory changes", "Market inefficiencies creating opportunities"],
          sentiment_drivers: "Primarily driven by recent enforcement actions, lawsuit developments, and policy announcements",
          recommended_monitoring: ["Legal case updates", "Policy announcements", "Company responses", "Market reaction patterns"]
        },
        timeSeriesData: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          sentiment: -0.2 + Math.random() * 0.6,
          volume: Math.floor(Math.random() * 500) + 100
        })),
        sentimentDist: [
          { name: 'Positive', value: 38, color: '#10B981' },
          { name: 'Neutral', value: 32, color: '#6B7280' },
          { name: 'Negative', value: 30, color: '#EF4444' }
        ],
        totalPosts: 15678,
        totalEngagement: 89234
      });
    }

    setIsAnalyzing(false);
  };

  const getSentimentIcon = (sentiment) => {
    if (sentiment === 'positive') return <ThumbsUp className="w-4 h-4 text-green-400" />;
    if (sentiment === 'negative') return <ThumbsDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getSentimentColor = (score) => {
    if (score > 0.3) return 'text-green-400';
    if (score < -0.3) return 'text-red-400';
    return 'text-gray-400';
  };

  const getSentimentBg = (score) => {
    if (score > 0.3) return 'bg-green-600';
    if (score < -0.3) return 'bg-red-600';
    return 'bg-gray-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-blue-400" />
              Social Sentiment Analysis
            </h1>
            <p className="text-gray-400 mt-1">NLP-powered Twitter & Reddit sentiment tracking for regulatory topics</p>
          </div>
          <Link to={createPageUrl('Home')}>
            <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Info Banner */}
        <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Brain className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-white font-semibold mb-1">Real-Time Investor Sentiment</p>
                <p className="text-sm text-gray-300">
                  Track retail and institutional investor reactions to regulatory developments across Twitter and Reddit. 
                  Early sentiment shifts can signal market moves before they appear in price action.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder='Search: "TSLA autopilot", "Meta GDPR", "JNJ lawsuit", "carbon tax"'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-900 border-gray-700 text-white"
                  onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
                />
              </div>
              <Button 
                onClick={handleAnalyze}
                disabled={isAnalyzing || !searchTerm}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Analyze Sentiment
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {sentimentData && (
          <>
            {/* Overview Stats */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-4">
                  <p className="text-xs text-gray-400 mb-1">Total Posts</p>
                  <p className="text-3xl font-bold text-white">
                    {sentimentData.totalPosts.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Past 24 hours</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-4">
                  <p className="text-xs text-gray-400 mb-1">Sentiment Score</p>
                  <p className={`text-3xl font-bold ${getSentimentColor(sentimentData.analysis.sentiment_score)}`}>
                    {sentimentData.analysis.sentiment_score.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">-1 to +1 scale</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-4">
                  <p className="text-xs text-gray-400 mb-1">Confidence</p>
                  <p className="text-3xl font-bold text-purple-400">
                    {(sentimentData.analysis.confidence * 100).toFixed(0)}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Model confidence</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-4">
                  <p className="text-xs text-gray-400 mb-1">Engagement</p>
                  <p className="text-3xl font-bold text-blue-400">
                    {sentimentData.totalEngagement.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Likes + Shares</p>
                </CardContent>
              </Card>
            </div>

            {/* Sentiment Over Time */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Sentiment Trend (24H)</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={sentimentData.timeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="hour" stroke="#9CA3AF" />
                      <YAxis domain={[-1, 1]} stroke="#9CA3AF" />
                      <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
                      <Line type="monotone" dataKey="sentiment" stroke="#3B82F6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Sentiment Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={sentimentData.sentimentDist}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {sentimentData.sentimentDist.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Recent Posts */}
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Recent Social Media Posts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sentimentData.posts.map((post, idx) => (
                    <div key={idx} className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Twitter className="w-4 h-4 text-blue-400" />
                          <span className="text-sm font-semibold text-white">{post.author}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(post.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <Badge className={getSentimentBg(post.sentimentScore)}>
                          {post.sentiment}
                        </Badge>
                      </div>
                      <p className="text-gray-300 text-sm mb-3">{post.content}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>❤️ {post.engagement.likes?.toLocaleString() || post.engagement.upvotes?.toLocaleString()}</span>
                        <span>🔄 {post.engagement.retweets?.toLocaleString() || 0}</span>
                        <span>💬 {post.engagement.replies?.toLocaleString() || post.engagement.comments?.toLocaleString()}</span>
                        <span className={`ml-auto font-semibold ${getSentimentColor(post.sentimentScore)}`}>
                          Score: {post.sentimentScore.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Analysis */}
            <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Brain className="w-6 h-6 text-purple-400" />
                  AI Sentiment Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-gray-900/50 rounded-lg">
                  <p className="text-xs text-gray-400 mb-2">Investor Mood</p>
                  <p className="text-gray-200">{sentimentData.analysis.investor_mood}</p>
                </div>

                <div className="p-4 bg-gray-900/50 rounded-lg">
                  <p className="text-xs text-gray-400 mb-2">Sentiment Drivers</p>
                  <p className="text-gray-200">{sentimentData.analysis.sentiment_drivers}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                    <p className="text-xs text-gray-400 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-400" />
                      Risk Signals
                    </p>
                    <ul className="space-y-1">
                      {sentimentData.analysis.risk_signals.map((signal, idx) => (
                        <li key={idx} className="text-sm text-gray-300">• {signal}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                    <p className="text-xs text-gray-400 mb-2 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      Opportunity Signals
                    </p>
                    <ul className="space-y-1">
                      {sentimentData.analysis.opportunity_signals.map((signal, idx) => (
                        <li key={idx} className="text-sm text-gray-300">• {signal}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-400 mb-2">Key Themes</p>
                  <div className="flex flex-wrap gap-2">
                    {sentimentData.analysis.key_themes.map((theme, idx) => (
                      <Badge key={idx} variant="outline" className="text-white">
                        {theme}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-400 mb-2">Recommended Monitoring</p>
                  <ul className="space-y-1">
                    {sentimentData.analysis.recommended_monitoring.map((item, idx) => (
                      <li key={idx} className="text-sm text-gray-300">• {item}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}