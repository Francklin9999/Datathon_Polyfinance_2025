import React, { useState } from 'react';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit2, X, Check, Building2 } from 'lucide-react';

export default function PortfolioPill() {
  const { portfolio, updateHoldings, getPortfolioStats, isEqualWeight } = usePortfolio();
  const [isOpen, setIsOpen] = useState(false);
  const [editingHoldings, setEditingHoldings] = useState({});

  const stats = getPortfolioStats();

  if (!portfolio || !stats) {
    return null;
  }

  const handleEdit = () => {
    setEditingHoldings({ ...portfolio.holdings });
    setIsOpen(true);
  };

  const handleRemove = (ticker) => {
    const newHoldings = { ...editingHoldings };
    delete newHoldings[ticker];
    setEditingHoldings(newHoldings);
  };

  const handleAdd = (ticker) => {
    const upperTicker = ticker.toUpperCase().trim();
    if (upperTicker && !editingHoldings[upperTicker]) {
      setEditingHoldings({
        ...editingHoldings,
        [upperTicker]: 0
      });
    }
  };

  const handleSave = () => {
    // Rebalance to equal weight
    const tickers = Object.keys(editingHoldings);
    if (tickers.length === 0) return;

    const equalWeight = 1.0 / tickers.length;
    const rebalancedHoldings = {};
    tickers.forEach(ticker => {
      rebalancedHoldings[ticker] = equalWeight;
    });

    updateHoldings(rebalancedHoldings);
    setIsOpen(false);
  };

  const portfolioSource = isEqualWeight 
    ? `Equal-weight universe • ${stats.numHoldings} names`
    : `Custom portfolio • ${stats.numHoldings} names`;

  return (
    <>
      <Badge 
        variant="outline" 
        className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-gray-800/50 border-gray-700 text-white"
        onClick={handleEdit}
      >
        <Building2 className="w-4 h-4" />
        <span>{portfolioSource}</span>
        <Edit2 className="w-3 h-3 opacity-70" />
      </Badge>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Portfolio</DialogTitle>
            <DialogDescription className="text-gray-400">
              Add or remove tickers. Holdings will be rebalanced to equal weight.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white">Add Ticker</Label>
              <div className="flex gap-2">
                <Input
                  id="new-ticker"
                  placeholder="Enter ticker (e.g., AAPL)"
                  className="bg-gray-800 border-gray-700 text-white"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAdd(e.target.value);
                      e.target.value = '';
                    }
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Holdings ({Object.keys(editingHoldings).length})</Label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {Object.keys(editingHoldings).map((ticker) => (
                  <div
                    key={ticker}
                    className="flex items-center justify-between p-2 bg-gray-800 rounded border border-gray-700"
                  >
                    <span className="text-white font-mono">{ticker}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(ticker)}
                      className="h-8 w-8 p-0 hover:bg-red-900/30"
                    >
                      <X className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                ))}
                {Object.keys(editingHoldings).length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-4">No holdings. Add tickers above.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="border-gray-700 text-white hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={Object.keys(editingHoldings).length === 0}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="w-4 h-4 mr-2" />
                Save & Rebalance
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

