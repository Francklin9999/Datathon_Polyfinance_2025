import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Globe, Clock, FileText, Video, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function HeaderBar({ 
  currentRegion = 'GLOBAL',
  marketStatus = 'CLOSED',
  language = 'EN',
  onLanguageChange,
  onSummarize,
  onGeneratePDF,
  onCreateVideo,
  engineMode = 'Offline'
}) {
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const regions = [
    { code: 'GLOBAL', label: 'Global', path: 'Index' },
    { code: 'US', label: 'US', path: 'US' },
    { code: 'EU', label: 'Europe', path: 'EU' },
    { code: 'ASIA', label: 'Asia', path: 'Asia' }
  ];

  const statusColors = {
    OPEN: 'bg-green-500',
    PREOPEN: 'bg-yellow-500',
    CLOSED: 'bg-gray-500'
  };

  return (
    <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          {/* Left: Branding & Region Nav */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">CDPQ Atlas</h1>
                <p className="text-xs text-gray-400">Cognitive Market Assistant</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Tabs value={currentRegion} className="w-auto">
                <TabsList className="bg-gray-800">
                  {regions.map(region => (
                    <TabsTrigger key={region.code} value={region.code} asChild>
                      <Link 
                        to={createPageUrl(region.path)}
                        className={location.pathname === createPageUrl(region.path) ? 'data-[state=active]:bg-blue-600' : ''}
                      >
                        {region.label}
                      </Link>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

              <Badge variant="outline" className={`${statusColors[marketStatus]} text-white border-0`}>
                {marketStatus}
              </Badge>
            </div>
          </div>

          {/* Right: Clock, Language, Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-gray-300">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-mono">
                {currentTime.toLocaleTimeString('en-US', { hour12: false })}
              </span>
            </div>

            <div className="flex gap-2">
              <Button
                variant={language === 'EN' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onLanguageChange?.('EN')}
                className="w-12"
              >
                EN
              </Button>
              <Button
                variant={language === 'FR' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onLanguageChange?.('FR')}
                className="w-12"
              >
                FR
              </Button>
            </div>

            <Badge variant="secondary" className="bg-blue-900 text-blue-200">
              {engineMode}
            </Badge>

            <div className="flex gap-2">
              <Button
                onClick={onSummarize}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Summarize
              </Button>
              <Button
                onClick={onGeneratePDF}
                size="sm"
                variant="outline"
              >
                <FileText className="w-4 h-4 mr-2" />
                PDF
              </Button>
              <Button
                onClick={onCreateVideo}
                size="sm"
                variant="outline"
              >
                <Video className="w-4 h-4 mr-2" />
                Video
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}