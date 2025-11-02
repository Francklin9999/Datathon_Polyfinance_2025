
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator } from 'lucide-react';

export default function OptionsPricingCalculator({ risk }) {
  const [optionInputs, setOptionInputs] = useState({
    S: 5987,
    K: 6000,
    T: 0.25,
    r: 0.045,
    sigma: 0.15,
    type: 'C'
  });
  const [greeks, setGreeks] = useState(null);

  const calculateBlackScholes = () => {
    const { S, K, T, r, sigma, type } = optionInputs;
    
    const d1 = (Math.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * Math.sqrt(T));
    const d2 = d1 - sigma * Math.sqrt(T);
    
    const normCDF = (x) => {
      const t = 1 / (1 + 0.2316419 * Math.abs(x));
      const d = 0.3989423 * Math.exp(-x * x / 2);
      const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
      return x > 0 ? 1 - prob : prob;
    };
    
    const Nd1 = normCDF(d1);
    const Nd2 = normCDF(d2);
    const nd1 = Math.exp(-d1 * d1 / 2) / Math.sqrt(2 * Math.PI);
    
    let price, delta, gamma, theta, vega, rho;
    
    if (type === 'C') {
      price = S * Nd1 - K * Math.exp(-r * T) * Nd2;
      delta = Nd1;
      theta = -(S * nd1 * sigma) / (2 * Math.sqrt(T)) - r * K * Math.exp(-r * T) * Nd2;
      rho = K * T * Math.exp(-r * T) * Nd2;
    } else {
      price = K * Math.exp(-r * T) * (1 - Nd2) - S * (1 - Nd1);
      delta = Nd1 - 1;
      theta = -(S * nd1 * sigma) / (2 * Math.sqrt(T)) + r * K * Math.exp(-r * T) * (1 - Nd2);
      rho = -K * T * Math.exp(-r * T) * (1 - Nd2);
    }
    
    gamma = nd1 / (S * sigma * Math.sqrt(T));
    vega = S * nd1 * Math.sqrt(T) / 100;
    
    setGreeks({
      price: price.toFixed(2),
      delta: delta.toFixed(4),
      gamma: gamma.toFixed(6),
      theta: (theta / 365).toFixed(4),
      vega: vega.toFixed(4),
      rho: (rho / 100).toFixed(4)
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Options Pricing Calculator</h2>
          <p className="text-sm text-gray-400">Black-Scholes model with Greeks computation</p>
        </div>
      </div>

      {/* Calculator */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calculator className="w-5 h-5 text-cyan-400" />
            Black-Scholes Calculator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-6">
            {/* Inputs Column 1 */}
            <div className="space-y-4">
              <div>
                <Label className="text-gray-400 text-xs">Spot Price (S)</Label>
                <Input
                  type="number"
                  value={optionInputs.S}
                  onChange={(e) => setOptionInputs({...optionInputs, S: parseFloat(e.target.value)})}
                  className="bg-gray-900 border-gray-700 text-white font-mono"
                />
              </div>
              <div>
                <Label className="text-gray-400 text-xs">Strike Price (K)</Label>
                <Input
                  type="number"
                  value={optionInputs.K}
                  onChange={(e) => setOptionInputs({...optionInputs, K: parseFloat(e.target.value)})}
                  className="bg-gray-900 border-gray-700 text-white font-mono"
                />
              </div>
            </div>

            {/* Inputs Column 2 */}
            <div className="space-y-4">
              <div>
                <Label className="text-gray-400 text-xs">Time to Expiry (Years)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={optionInputs.T}
                  onChange={(e) => setOptionInputs({...optionInputs, T: parseFloat(e.target.value)})}
                  className="bg-gray-900 border-gray-700 text-white font-mono"
                />
              </div>
              <div>
                <Label className="text-gray-400 text-xs">Risk-Free Rate (r)</Label>
                <Input
                  type="number"
                  step="0.001"
                  value={optionInputs.r}
                  onChange={(e) => setOptionInputs({...optionInputs, r: parseFloat(e.target.value)})}
                  className="bg-gray-900 border-gray-700 text-white font-mono"
                />
              </div>
            </div>

            {/* Inputs Column 3 */}
            <div className="space-y-4">
              <div>
                <Label className="text-gray-400 text-xs">Volatility (σ)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={optionInputs.sigma}
                  onChange={(e) => setOptionInputs({...optionInputs, sigma: parseFloat(e.target.value)})}
                  className="bg-gray-900 border-gray-700 text-white font-mono"
                />
              </div>
              <div>
                <Label className="text-gray-400 text-xs">Option Type</Label>
                <Select value={optionInputs.type} onValueChange={(value) => setOptionInputs({...optionInputs, type: value})}>
                  <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="C">Call Option</SelectItem>
                    <SelectItem value="P">Put Option</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Results Column */}
            <div className="space-y-4">
              <Button 
                onClick={calculateBlackScholes} 
                className="w-full bg-cyan-600 hover:bg-cyan-700"
              >
                Calculate
              </Button>
              {greeks && (
                <div className="space-y-2 p-4 bg-gray-900/50 rounded-lg border border-cyan-500/30">
                  <div className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400 text-xs">Price:</span>
                    <span className="text-white font-bold text-lg">${greeks.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs">Delta (Δ):</span>
                    <span className="text-white font-mono text-sm">{greeks.delta}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs">Gamma (Γ):</span>
                    <span className="text-white font-mono text-sm">{greeks.gamma}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs">Theta (Θ):</span>
                    <span className="text-white font-mono text-sm">{greeks.theta}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs">Vega (ν):</span>
                    <span className="text-white font-mono text-sm">{greeks.vega}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs">Rho (ρ):</span>
                    <span className="text-white font-mono text-sm">{greeks.rho}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Market Context */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <p className="text-xs text-gray-400 mb-2">Implied Vol (VIX)</p>
            <p className="text-3xl font-bold text-white">{risk?.vix?.toFixed(2) || 'N/A'}</p>
            <p className="text-xs text-gray-400 mt-1">Current market IV</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <p className="text-xs text-gray-400 mb-2">Realized Vol (20D)</p>
            <p className="text-3xl font-bold text-white">{risk?.volatility20d?.toFixed(2) || 'N/A'}%</p>
            <p className="text-xs text-gray-400 mt-1">Historical volatility</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <p className="text-xs text-gray-400 mb-2">Vol Premium</p>
            <p className="text-3xl font-bold text-yellow-400">
              {((risk?.vix || 0) - (risk?.volatility20d || 0)).toFixed(2)}
            </p>
            <p className="text-xs text-gray-400 mt-1">IV - RV spread</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
