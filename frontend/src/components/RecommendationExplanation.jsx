import React, { useState } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { HelpCircle, Loader2, FileText, TrendingUp } from 'lucide-react';
import { api } from '@/api/apiClient';

/**
 * RecommendationExplanation component
 * Displays a "?" button that shows detailed explanation based on SEC filings and market sentiment
 * 
 * @param {Object} props
 * @param {string|Array<string>} props.tickers - Single ticker string or array of tickers (e.g., ["TSLA", "F"] for sell/buy)
 * @param {string} props.type - Type of recommendation: 'stock_replacement', 'sector_rotation', 'geographic_reallocation', or 'general'
 * @param {Object} props.context - Additional context like sector, region, etc.
 * @param {string} props.reason - The existing reason text (shown as fallback)
 */
export default function RecommendationExplanation({ tickers, type = 'general', context = {}, reason = '' }) {
  const [open, setOpen] = useState(false);
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleOpenChange = async (isOpen) => {
    setOpen(isOpen);
    
    if (isOpen && !explanation && !loading) {
      await fetchExplanation();
    }
  };

  const handleMouseEnter = () => {
    if (!open && !explanation && !loading) {
      setOpen(true);
      fetchExplanation();
    }
  };

  const handleMouseLeave = () => {
    // Keep open on mouse leave to allow reading
    // User can close by clicking outside
  };

  const fetchExplanation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Normalize tickers to array
      const tickerArray = Array.isArray(tickers) ? tickers : (tickers ? [tickers] : []);
      const validTickers = tickerArray.filter(t => t && typeof t === 'string' && t.trim());
      
      if (validTickers.length === 0) {
        // For non-ticker based recommendations (sector rotation, geographic), generate general explanation
        setExplanation({
          secFilings: null,
          marketSentiment: null,
          explanation: reason || `This recommendation is based on regulatory risk analysis and portfolio optimization principles.`,
          sources: []
        });
        setLoading(false);
        return;
      }

      // Fetch SEC filing analysis and market sentiment for each ticker
      const promises = [];
      
      for (const ticker of validTickers) {
        // Fetch sentiment
        promises.push(
          api.analytics.getSentiment(ticker).catch(err => {
            console.warn(`Failed to fetch sentiment for ${ticker}:`, err);
            return { symbol: ticker, sentiment: null, error: err.message };
          })
        );

        // Fetch SEC filing analysis (NLP quant strategy or 10K analysis)
        promises.push(
          api.analytics.nlpQuantStrategy(ticker, null, null, []).catch(err => {
            console.warn(`Failed to fetch SEC analysis for ${ticker}:`, err);
            // Try alternative: 10K analysis
            return api.analytics.analyzeTenK(ticker).catch(err2 => {
              console.warn(`Failed to fetch 10K for ${ticker}:`, err2);
              return { ticker, analysis: null, error: err2.message };
            });
          })
        );
      }

      const results = await Promise.all(promises);
      
      // Process results
      const sentiments = results.filter((r, i) => i % 2 === 0);
      const filings = results.filter((r, i) => i % 2 === 1);

      // Build explanation
      let secFilingsText = '';
      let sentimentText = '';
      const sources = [];

      // SEC Filing Analysis
      if (filings.length > 0) {
        const validFilings = filings.filter(f => f && !f.error);
        if (validFilings.length > 0) {
          secFilingsText = validFilings.map((filing, idx) => {
            const ticker = validTickers[idx] || validTickers[0];
            let filingInfo = `**${ticker} SEC Filings Analysis:**\n`;
            
            if (filing.signals) {
              filingInfo += `- Trading Signal: ${filing.signals.recommendation || 'Neutral'}\n`;
              filingInfo += `- Risk Level: ${filing.signals.risk_level || 'Moderate'}\n`;
            }
            if (filing.sentiment_scores) {
              const sentiment = filing.sentiment_scores.overall || filing.sentiment_scores.compound || 0;
              filingInfo += `- Overall Sentiment: ${sentiment > 0 ? 'Positive' : sentiment < 0 ? 'Negative' : 'Neutral'}\n`;
            }
            if (filing.risk_analysis) {
              filingInfo += `- Risk Factors: ${filing.risk_analysis.count || 0} identified\n`;
            }
            if (filing.forward_statements && filing.forward_statements.length > 0) {
              filingInfo += `- Forward-Looking Statements: ${filing.forward_statements.length} found\n`;
            }
            
            return filingInfo;
          }).join('\n');
        }
      }

      // Market Sentiment
      if (sentiments.length > 0) {
        const validSentiments = sentiments.filter(s => s && !s.error && s.sentiment);
        if (validSentiments.length > 0) {
          sentimentText = validSentiments.map((sent, idx) => {
            const ticker = validTickers[idx] || validTickers[0];
            const sentiment = sent.sentiment || sent;
            return `**${ticker} Market Sentiment:**\n- Overall: ${sentiment.overall || sentiment.score || 'Neutral'}\n- Trends: ${sentiment.trends || 'Stable'}\n`;
          }).join('\n');
        }
      }

      // Build comprehensive explanation
      let fullExplanation = reason ? `${reason}\n\n` : '';
      
      if (type === 'stock_replacement') {
        fullExplanation += `**Why this replacement?**\n\n`;
        if (validTickers.length >= 2) {
          fullExplanation += `**Selling ${validTickers[0]}:**\n`;
          if (secFilingsText || sentimentText) {
            fullExplanation += `Based on SEC filings and market sentiment analysis, ${validTickers[0]} shows elevated risk factors that warrant reduction in portfolio exposure.\n\n`;
          }
          fullExplanation += `**Buying ${validTickers[1]}:**\n`;
          if (secFilingsText || sentimentText) {
            fullExplanation += `${validTickers[1]} demonstrates lower regulatory risk and more favorable sentiment indicators, making it a suitable replacement within the same sector.\n\n`;
          }
        }
      } else if (type === 'sector_rotation') {
        fullExplanation += `**Why this sector adjustment?**\n\n`;
        fullExplanation += `This recommendation is based on regulatory risk assessment and sector-level exposure analysis. `;
        if (context.sector) {
          fullExplanation += `The ${context.sector} sector `;
        }
        fullExplanation += `has been evaluated for regulatory compliance, geographic exposure, and market sentiment trends.`;
      } else if (type === 'geographic_reallocation') {
        fullExplanation += `**Why this geographic change?**\n\n`;
        fullExplanation += `This reallocation addresses geographic concentration risk and regulatory environment considerations. `;
        if (context.region) {
          fullExplanation += `${context.region} `;
        }
        fullExplanation += `exposure has been adjusted based on regulatory risk assessment and market stability indicators.`;
      }

      if (secFilingsText || sentimentText) {
        fullExplanation += `\n\n${secFilingsText}${secFilingsText && sentimentText ? '\n' : ''}${sentimentText}`;
      }

      setExplanation({
        secFilings: secFilingsText,
        marketSentiment: sentimentText,
        explanation: fullExplanation || reason || 'Analysis based on regulatory risk assessment.',
        sources: validTickers.map(t => ({ ticker: t, type: 'SEC Filing Analysis' }))
      });

    } catch (err) {
      console.error('Error fetching explanation:', err);
      setError(err.message || 'Failed to fetch detailed explanation');
      setExplanation({
        explanation: reason || 'Unable to load detailed explanation. The recommendation is based on regulatory risk analysis.',
        error: true
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <div className="inline-block" onMouseEnter={handleMouseEnter}>
        <PopoverTrigger asChild>
          <button
            className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors ml-2 cursor-help"
            aria-label="Show explanation"
            title="Hover or click for detailed explanation"
          >
            <HelpCircle className="w-3 h-3" />
          </button>
        </PopoverTrigger>
      </div>
      <PopoverContent className="w-96 max-w-[90vw] bg-gray-900 border-gray-700 text-white p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-blue-400" />
            <h4 className="font-semibold text-white">Decision Explanation</h4>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-blue-400 mr-2" />
              <span className="text-sm text-gray-400">Analyzing SEC filings and market sentiment...</span>
            </div>
          )}

          {error && (
            <div className="text-sm text-red-400 bg-red-900/20 p-2 rounded">
              {error}
            </div>
          )}

          {explanation && !loading && (
            <div className="space-y-3">
              <div className="text-sm text-gray-300 whitespace-pre-wrap">
                {explanation.explanation.split('\n').map((line, idx) => {
                  if (line.startsWith('**') && line.endsWith('**')) {
                    return <div key={idx} className="font-semibold text-white mt-2 mb-1">{line.replace(/\*\*/g, '')}</div>;
                  }
                  return <div key={idx}>{line}</div>;
                })}
              </div>

              {explanation.sources && explanation.sources.length > 0 && (
                <div className="pt-3 border-t border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-xs font-semibold text-gray-400">Data Sources</span>
                  </div>
                  <div className="space-y-1">
                    {explanation.sources.map((source, idx) => (
                      <div key={idx} className="text-xs text-gray-500">
                        • {source.ticker}: {source.type}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!explanation && !loading && (
            <div className="text-sm text-gray-400">
              {reason || 'Click to load detailed explanation based on SEC filings and market sentiment.'}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

