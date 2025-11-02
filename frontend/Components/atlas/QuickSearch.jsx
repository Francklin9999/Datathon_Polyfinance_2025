import React, { useState } from 'react';
import { Search, TrendingUp, DollarSign, Coins, Package } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export default function QuickSearch({ snapshots = [] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const allInstruments = React.useMemo(() => {
    const instruments = [];
    
    snapshots.forEach(snapshot => {
      snapshot.indices?.forEach(item => {
        instruments.push({ ...item, type: 'Equity', region: snapshot.region, icon: TrendingUp });
      });
      snapshot.fx?.forEach(item => {
        instruments.push({ ...item, type: 'FX', region: snapshot.region, icon: Coins });
      });
      snapshot.bonds?.forEach(item => {
        instruments.push({ ...item, type: 'Bond', region: snapshot.region, icon: DollarSign });
      });
      snapshot.commodities?.forEach(item => {
        instruments.push({ ...item, type: 'Commodity', region: snapshot.region, icon: Package });
      });
    });
    
    return instruments;
  }, [snapshots]);

  const filteredInstruments = allInstruments.filter(item => 
    item.symbol?.toLowerCase().includes(query.toLowerCase()) ||
    item.name?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Quick search (symbol or name)..."
            className="pl-10 bg-gray-800 border-gray-700 text-white w-64"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-gray-800 border-gray-700" align="start">
        <Command className="bg-gray-800">
          <CommandList>
            <CommandEmpty className="text-gray-400 py-6 text-center">No results found.</CommandEmpty>
            <CommandGroup>
              {filteredInstruments.slice(0, 10).map((item, idx) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={idx}
                    className="flex items-center justify-between p-3 hover:bg-gray-700 cursor-pointer text-white"
                    onSelect={() => {
                      setOpen(false);
                      setQuery('');
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="font-semibold">{item.symbol}</p>
                        <p className="text-xs text-gray-400">{item.name} • {item.region}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{item.price?.toFixed(2) || item.yield?.toFixed(2)}</p>
                      <p className={`text-xs ${item.chg1D >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {item.chg1D >= 0 ? '+' : ''}{item.chg1D?.toFixed(2)}%
                      </p>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}