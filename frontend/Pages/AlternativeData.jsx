import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Database, Satellite, CreditCard, Globe, TrendingUp, AlertCircle, Smartphone } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';

export default function AlternativeData() {
  const [dataSource, setDataSource] = useState('satellite');

  // Alternative data sources
  const dataSources = [
    {
      id: 'satellite',
      name: 'Satellite Imagery',
      icon: Satellite,
      description: 'Parking lot traffic, shipping activity, agricultural yields',
      providers: ['Orbital Insight', 'Planet Labs', 'Maxar'],
      updateFrequency: 'Daily',
      coverage: 'Global',
      latency: '24-48 hours',
      cost: '$$$',
      alpha: 'High'
    },
    {
      id: 'credit',
      name: 'Credit Card Transactions',
      icon: CreditCard,
      description: 'Consumer spending patterns, retail foot traffic',
      providers: ['Second Measure', 'Facteus', 'Affinity'],
      updateFrequency: 'Weekly',
      coverage: 'US, UK, EU',
      latency: '7-10 days',
      cost: '$$$$',
      alpha: 'Very High'
    },
    {
      id: 'webscraping',
      name: 'Web Scraping',
      icon: Globe,
      description: 'Product pricing, job postings, sentiment',
      providers: ['Thinknum', 'YipitData', 'Custom'],
      updateFrequency: 'Real-time',
      coverage: 'Global',
      latency: 'Minutes',
      cost: '$',
      alpha: 'Medium'
    },
    {
      id: 'mobile',
      name: 'Mobile Location Data',
      icon: Smartphone,
      description: 'Store visits, foot traffic patterns',
      providers: ['Placer.ai', 'SafeGraph', 'Foursquare'],
      updateFrequency: 'Daily',
      coverage: 'US, Select Markets',
      latency: '1-3 days',
      cost: '$$',
      alpha: 'High'
    }
  ];

  // Satellite imagery analysis - parking lot traffic
  const parkingLotData = Array.from({ length: 12 }, (_, i) => ({
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
    walmart: 75 + Math.random() * 20,
    target: 65 + Math.random() * 25,
    amazon: 80 + Math.random() * 15,
    revenue: 1000 + i * 50 + Math.random() * 100
  }));

  // Credit card spending trends
  const spendingTrends = [
    { category: 'Retail', mom: 5.2, yoy: 12.3, forecast: 14.8, confidence: 0.85 },
    { category: 'Dining', mom: 3.1, yoy: 8.7, forecast: 9.2, confidence: 0.78 },
    { category: 'Travel', mom: 8.9, yoy: 25.4, forecast: 28.1, confidence: 0.92 },
    { category: 'Entertainment', mom: -2.3, yoy: 6.1, forecast: 5.8, confidence: 0.71 },
    { category: 'Groceries', mom: 1.5, yoy: 4.2, forecast: 4.5, confidence: 0.88 },
    { category: 'Gas', mom: -4.2, yoy: -8.5, forecast: -9.2, confidence: 0.82 }
  ];

  // Web scraping - job postings
  const jobPostings = Array.from({ length: 24 }, (_, i) => ({
    week: `W${i + 1}`,
    tech: 5000 + Math.random() * 2000,
    finance: 3000 + Math.random() * 1000,
    retail: 4000 + Math.random() * 1500,
    healthcare: 6000 + Math.random() * 2500
  }));

  // Foot traffic analysis
  const footTraffic = [
    { store: 'Walmart', visits: 1250000, mom: 4.2, yoy: 8.5, conversionRate: 0.42 },
    { store: 'Target', visits: 950000, mom: 6.1, yoy: 12.3, conversionRate: 0.38 },
    { store: 'Costco', visits: 1100000, mom: 5.8, yoy: 15.2, conversionRate: 0.55 },
    { store: 'Home Depot', visits: 800000, mom: 3.2, yoy: 7.8, conversionRate: 0.35 },
    { store: 'Best Buy', visits: 450000, mom: -1.5, yoy: 2.1, conversionRate: 0.28 }
  ];

  // Alternative data signals
  const dataSignals = [
    {
      company: 'Tesla (TSLA)',
      signal: 'Bullish',
      confidence: 0.82,
      dataPoints: [
        { source: 'Satellite', metric: 'Gigafactory Activity', value: '+25% YoY' },
        { source: 'Web Scraping', metric: 'Online Inventory', value: '-15% (Low stock)' },
        { source: 'Mobile', metric: 'Showroom Visits', value: '+18% MoM' }
      ],
      recommendation: 'BUY',
      targetChange: '+12-15%'
    },
    {
      company: 'Walmart (WMT)',
      signal: 'Neutral',
      confidence: 0.65,
      dataPoints: [
        { source: 'Satellite', metric: 'Parking Lot Traffic', value: '+3% MoM' },
        { source: 'Credit Card', metric: 'Transaction Volume', value: '+4.5% YoY' },
        { source: 'Mobile', metric: 'Store Visits', value: '+2% MoM' }
      ],
      recommendation: 'HOLD',
      targetChange: '+2-5%'
    },
    {
      company: 'Amazon (AMZN)',
      signal: 'Bullish',
      confidence: 0.91,
      dataPoints: [
        { source: 'Web Scraping', metric: 'Product Reviews', value: '+35% QoQ' },
        { source: 'Satellite', metric: 'Warehouse Expansion', value: '+8 new facilities' },
        { source: 'Credit Card', metric: 'Online Spending', value: '+22% YoY' }
      ],
      recommendation: 'STRONG BUY',
      targetChange: '+18-22%'
    }
  ];

  // Data quality metrics
  const dataQuality = {
    coverage: 92.5,
    accuracy: 88.3,
    timeliness: 95.1,
    consistency: 90.7
  };

  const getSignalColor = (signal) => {
    if (signal === 'Bullish') return 'bg-green-600';
    if (signal === 'Bearish') return 'bg-red-600';
    return 'bg-gray-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Database className="w-8 h-8 text-green-400" />
            Alternative Data Laboratory
          </h1>
          <p className="text-gray-400 mt-1">Integrate satellite imagery, credit card data, web scraping, and mobile location data into quantitative models</p>
        </div>

        {/* Data Sources Overview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {dataSources.map((source) => {
            const Icon = source.icon;
            return (
              <Card 
                key={source.id}
                className={`bg-gray-800/50 border-gray-700 cursor-pointer hover:border-green-500/50 transition-all ${
                  dataSource === source.id ? 'border-green-500' : ''
                }`}
                onClick={() => setDataSource(source.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <Icon className="w-6 h-6 text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold text-sm">{source.name}</h3>
                      <Badge className={`text-xs ${
                        source.alpha === 'Very High' ? 'bg-green-600' :
                        source.alpha === 'High' ? 'bg-blue-600' :
                        'bg-gray-600'
                      }`}>
                        {source.alpha} Alpha
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">{source.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Data Quality Dashboard */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Data Quality Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6">
              {Object.entries(dataQuality).map(([key, value]) => (
                <div key={key}>
                  <p className="text-sm text-gray-400 mb-2 capitalize">{key}</p>
                  <div className="relative">
                    <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
                      <div 
                        className={`h-full rounded-full ${
                          value > 90 ? 'bg-green-500' :
                          value > 80 ? 'bg-blue-500' :
                          'bg-yellow-500'
                        }`}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                    <p className="text-xl font-bold text-white">{value}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Alternative Data Signals */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Live Alternative Data Signals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dataSignals.map((item, idx) => (
                <div key={idx} className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h4 className="text-xl font-bold text-white">{item.company}</h4>
                      <Badge className={getSignalColor(item.signal)}>
                        {item.signal}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {(item.confidence * 100).toFixed(0)}% Confidence
                      </Badge>
                    </div>
                    <div className="text-right">
                      <Badge className={item.recommendation.includes('BUY') ? 'bg-green-600' : 'bg-gray-600'}>
                        {item.recommendation}
                      </Badge>
                      <p className="text-sm text-gray-400 mt-1">Target: {item.targetChange}</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-3">
                    {item.dataPoints.map((dp, i) => (
                      <div key={i} className="p-3 bg-gray-800/50 rounded border border-gray-700">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs text-gray-400">{dp.source}</p>
                          <TrendingUp className="w-3 h-3 text-green-400" />
                        </div>
                        <p className="text-sm font-semibold text-white">{dp.metric}</p>
                        <p className="text-lg font-bold text-green-400">{dp.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Satellite Imagery - Parking Lot Traffic */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Satellite className="w-5 h-5 text-green-400" />
                Satellite: Parking Lot Traffic Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={parkingLotData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
                  <Legend />
                  <Line type="monotone" dataKey="walmart" stroke="#3B82F6" name="Walmart" />
                  <Line type="monotone" dataKey="target" stroke="#EF4444" name="Target" />
                  <Line type="monotone" dataKey="amazon" stroke="#F59E0B" name="Amazon Facilities" />
                </LineChart>
              </ResponsiveContainer>

              <div className="mt-4 p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
                <p className="text-sm text-green-300">
                  <TrendingUp className="w-4 h-4 inline mr-1" />
                  Amazon warehouse activity up 25% YoY - strong indicator of logistics expansion ahead of earnings
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Credit Card Spending Trends */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-400" />
                Credit Card: Spending Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {spendingTrends.map((trend, idx) => (
                  <div key={idx} className="p-3 bg-gray-900/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-semibold">{trend.category}</span>
                      <Badge variant="outline" className="text-xs">
                        {(trend.confidence * 100).toFixed(0)}% confidence
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-gray-400">MoM</p>
                        <p className={`font-semibold ${trend.mom >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {trend.mom >= 0 ? '+' : ''}{trend.mom}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">YoY</p>
                        <p className={`font-semibold ${trend.yoy >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {trend.yoy >= 0 ? '+' : ''}{trend.yoy}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Forecast</p>
                        <p className={`font-semibold ${trend.forecast >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {trend.forecast >= 0 ? '+' : ''}{trend.forecast}%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Web Scraping - Job Postings */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-purple-400" />
                Web Scraping: Job Postings Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={jobPostings}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="week" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
                  <Legend />
                  <Area type="monotone" dataKey="tech" stackId="1" stroke="#3B82F6" fill="#3B82F6" />
                  <Area type="monotone" dataKey="finance" stackId="1" stroke="#10B981" fill="#10B981" />
                  <Area type="monotone" dataKey="retail" stackId="1" stroke="#F59E0B" fill="#F59E0B" />
                  <Area type="monotone" dataKey="healthcare" stackId="1" stroke="#8B5CF6" fill="#8B5CF6" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Mobile Location - Foot Traffic */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-cyan-400" />
                Mobile Location: Store Foot Traffic
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {footTraffic.map((store, idx) => (
                  <div key={idx} className="p-3 bg-gray-900/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-semibold">{store.store}</span>
                      <span className="text-sm text-gray-400">{store.visits.toLocaleString()} visits</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm mb-2">
                      <div>
                        <p className="text-xs text-gray-400">MoM</p>
                        <p className={`font-semibold ${store.mom >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {store.mom >= 0 ? '+' : ''}{store.mom}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">YoY</p>
                        <p className={`font-semibold ${store.yoy >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {store.yoy >= 0 ? '+' : ''}{store.yoy}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Conversion</p>
                        <p className="font-semibold text-white">{(store.conversionRate * 100).toFixed(0)}%</p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="h-full bg-cyan-500 rounded-full" 
                        style={{ width: `${store.conversionRate * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Integration Guide */}
        <Card className="bg-gradient-to-r from-green-900/20 to-blue-900/20 border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-white font-semibold mb-1">Alternative Data Integration Strategy</h4>
                <p className="text-sm text-gray-300">
                  Combine multiple alternative data sources for strongest signals. Satellite + credit card data shows 82% correlation with earnings beats. 
                  Mobile location + web scraping provides 7-10 day lead time on comp store sales. Always validate with traditional fundamentals.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}