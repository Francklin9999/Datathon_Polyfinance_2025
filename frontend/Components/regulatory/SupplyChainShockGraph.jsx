import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Package } from 'lucide-react';

export default function SupplyChainShockGraph({ regulation }) {
  const [selectedNode, setSelectedNode] = useState(null);

  // Extract supply chain data
  const components = regulation?.supply_chain_impact?.affected_components || [
    'Lithium batteries', 'Solar panels', 'Wind turbines', 'Electric motors'
  ];
  
  const suppliers = regulation?.supply_chain_impact?.affected_suppliers || [
    'CATL', 'LG Energy', 'First Solar', 'Vestas'
  ];

  // Build network graph data
  const nodes = [
    { id: 'regulation', label: regulation?.regulation_name?.substring(0, 20) || 'Regulation', type: 'regulation', x: 50, y: 10 },
    ...components.map((c, i) => ({ 
      id: `comp-${i}`, 
      label: c, 
      type: 'component', 
      x: 20 + (i * 60 / components.length), 
      y: 40 
    })),
    ...suppliers.map((s, i) => ({ 
      id: `supp-${i}`, 
      label: s, 
      type: 'supplier', 
      x: 20 + (i * 60 / suppliers.length), 
      y: 70 
    }))
  ];

  const links = [
    ...components.map((_, i) => ({ source: 'regulation', target: `comp-${i}`, strength: 'high' })),
    ...suppliers.map((_, i) => ({ source: `comp-${Math.floor(i / 2)}`, target: `supp-${i}`, strength: 'medium' }))
  ];

  const getNodeColor = (type) => {
    switch (type) {
      case 'regulation': return 'bg-red-500';
      case 'component': return 'bg-orange-500';
      case 'supplier': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-400" />
            Supply Chain Shock Graph
          </CardTitle>
          <Badge className="bg-orange-600 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {components.length + suppliers.length} affected nodes
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* SVG Graph Visualization */}
        <div className="relative w-full h-96 bg-gray-900/50 rounded-lg border border-gray-700 overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
            {/* Links */}
            <g className="links">
              {links.map((link, idx) => {
                const sourceNode = nodes.find(n => n.id === link.source);
                const targetNode = nodes.find(n => n.id === link.target);
                
                if (!sourceNode || !targetNode) return null;
                
                const strokeOpacity = link.strength === 'high' ? 0.8 : 0.4;
                
                return (
                  <line
                    key={idx}
                    x1={`${sourceNode.x}%`}
                    y1={`${sourceNode.y}%`}
                    x2={`${targetNode.x}%`}
                    y2={`${targetNode.y}%`}
                    stroke="#ef4444"
                    strokeWidth="0.5"
                    strokeOpacity={strokeOpacity}
                    strokeDasharray={link.strength === 'medium' ? '2,2' : '0'}
                  />
                );
              })}
            </g>

            {/* Nodes */}
            <g className="nodes">
              {nodes.map((node, idx) => {
                const isSelected = selectedNode === node.id;
                const nodeSize = node.type === 'regulation' ? 6 : 4;
                
                return (
                  <g key={idx} transform={`translate(${node.x}, ${node.y})`}>
                    <circle
                      cx="0"
                      cy="0"
                      r={nodeSize}
                      className={`${getNodeColor(node.type)} cursor-pointer transition-all ${
                        isSelected ? 'animate-pulse' : ''
                      }`}
                      fill="currentColor"
                      stroke={isSelected ? '#fff' : 'none'}
                      strokeWidth={isSelected ? '1' : '0'}
                      onClick={() => setSelectedNode(node.id)}
                    />
                    <text
                      x="0"
                      y={nodeSize + 4}
                      fontSize="3"
                      fill="#9ca3af"
                      textAnchor="middle"
                      className="pointer-events-none"
                    >
                      {node.label.length > 15 ? node.label.substring(0, 12) + '...' : node.label}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Legend */}
          <div className="absolute bottom-3 left-3 bg-gray-900/90 rounded p-2 text-xs">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-gray-300">Regulation</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-gray-300">Components</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-gray-300">Suppliers</span>
            </div>
          </div>
        </div>

        {/* Selected Node Details */}
        {selectedNode && (
          <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded">
            <p className="text-xs font-semibold text-blue-400 mb-1">
              Selected: {nodes.find(n => n.id === selectedNode)?.label}
            </p>
            <p className="text-xs text-gray-300">
              {nodes.find(n => n.id === selectedNode)?.type === 'regulation' && 
                'Root regulatory change driving supply chain impacts'}
              {nodes.find(n => n.id === selectedNode)?.type === 'component' && 
                'Critical component affected by new requirements'}
              {nodes.find(n => n.id === selectedNode)?.type === 'supplier' && 
                'Supplier exposed to component changes'}
            </p>
          </div>
        )}

        {/* Affected Components List */}
        <div className="mt-4">
          <p className="text-sm font-semibold text-gray-400 mb-2">Affected Components:</p>
          <div className="flex flex-wrap gap-2">
            {components.map((comp, idx) => (
              <Badge key={idx} className="bg-orange-600">
                {comp}
              </Badge>
            ))}
          </div>
        </div>

        {/* Affected Suppliers List */}
        <div className="mt-4">
          <p className="text-sm font-semibold text-gray-400 mb-2">Exposed Suppliers:</p>
          <div className="flex flex-wrap gap-2">
            {suppliers.map((supp, idx) => (
              <Badge key={idx} className="bg-yellow-600">
                {supp}
              </Badge>
            ))}
          </div>
        </div>

        {/* Risk Summary */}
        <div className="mt-4 p-3 bg-orange-900/20 border border-orange-500/30 rounded">
          <p className="text-xs font-semibold text-orange-300 mb-1">Supply Chain Risk Summary:</p>
          <p className="text-xs text-gray-300">
            {components.length} critical components and {suppliers.length} major suppliers face direct impact. 
            Ripple effects may propagate to downstream manufacturers and OEMs. 
            Monitor for procurement delays and cost inflation.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}