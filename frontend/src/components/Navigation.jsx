import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText, Building2, BarChart3, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PortfolioPill from './PortfolioPill';

export default function Navigation() {
  const location = useLocation();
  
  const navItems = [
    { path: '/document-analyzer', label: 'Document Analyzer', icon: FileText },
    { path: '/company-assessment', label: 'Company Assessment', icon: Building2 },
    { path: '/portfolio-risk-dashboard', label: 'Risk Dashboard', icon: BarChart3 },
    { path: '/scenario-simulator', label: 'Scenario Simulator', icon: Activity }
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-gray-900 border-b border-gray-700 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-xl font-bold text-white">
            PolyFinance 2025
          </Link>
          <div className="flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.path} to={item.path}>
                  <Button
                    variant={isActive(item.path) ? 'default' : 'ghost'}
                    className={
                      isActive(item.path)
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
        <PortfolioPill />
      </div>
    </nav>
  );
}

