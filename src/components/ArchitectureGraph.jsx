import React, { useState, useMemo } from 'react';
import { 
  Layers, 
  AlertTriangle, 
  Cpu, 
  Database, 
  Server, 
  RefreshCw, 
  FileCode, 
  CheckCircle2, 
  Info,
  X,
  Filter,
  ArrowRight,
  Sparkles,
  Zap,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Search,
  Activity,
  ShieldAlert
} from 'lucide-react';

export default function ArchitectureGraph({ 
  activeRepo,
  analysisResult,
  onTriggerRefactor
}) {
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [layerFilter, setLayerFilter] = useState('All');
  const [showCircularOnly, setShowCircularOnly] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const fileMetrics = analysisResult?.fileMetrics || {};
  const adjacencyList = analysisResult?.adjacencyList || {};
  const circularDeps = analysisResult?.circularDependencies || [];
  const couplingMap = analysisResult?.couplingMap || {};
  const issues = analysisResult?.issues || [];

  // 1. Generate Dynamic Nodes & Layout from Real Files
  const { dynamicNodes, dynamicEdges } = useMemo(() => {
    const files = Object.keys(activeRepo?.files || {});
    if (files.length === 0) return { dynamicNodes: [], dynamicEdges: [] };

    // Group files by Layer for structured topological column layout
    const layerColumns = {
      'Controller': 0,
      'Component': 0,
      'Service': 1,
      'Repository': 2,
      'Utility': 3,
      'Config': 3,
      'Test': 3,
      'General': 1
    };

    const layerColors = {
      'Controller': '#06B6D4',
      'Service': '#818CF8',
      'Repository': '#10B981',
      'Utility': '#F59E0B',
      'Config': '#64748B',
      'Test': '#A855F7',
      'Component': '#EC4899',
      'General': '#818CF8'
    };

    const columnBuckets = [[], [], [], []];
    files.forEach(file => {
      const metrics = fileMetrics[file] || { layer: 'General', complexity: 1, lineCount: 0 };
      const colIndex = layerColumns[metrics.layer] ?? 1;
      columnBuckets[colIndex].push(file);
    });

    // Compute coordinates
    const nodes = [];
    const colXSpacing = 260;
    const startX = 140;

    columnBuckets.forEach((bucket, colIdx) => {
      const colX = startX + (colIdx * colXSpacing);
      const totalInCol = bucket.length;
      const startY = 100;
      const ySpacing = Math.max(90, Math.min(140, 500 / Math.max(1, totalInCol)));

      bucket.forEach((file, rowIdx) => {
        const metrics = fileMetrics[file] || { layer: 'General', complexity: 1, lineCount: 0 };
        const coupling = couplingMap[file] || { afferent: 0, efferent: 0, instability: 0, isHotspot: false };
        const fileIssues = issues.filter(i => i.filePath === file);

        // Check if node is part of a circular dependency
        const isCircular = circularDeps.some(c => 
          c.nodes?.includes(file) || c.source === file || c.target === file
        );

        nodes.push({
          id: file,
          label: file.split('/').pop() || file,
          path: file,
          layer: metrics.layer,
          color: layerColors[metrics.layer] || '#818CF8',
          x: colX,
          y: startY + (rowIdx * ySpacing),
          complexity: metrics.complexity,
          lines: metrics.lineCount,
          isCircular,
          isHotspot: coupling.isHotspot,
          afferent: coupling.afferent,
          efferent: coupling.efferent,
          instability: coupling.instability,
          issuesCount: fileIssues.length,
          deps: adjacencyList[file] || []
        });
      });
    });

    // Compute directed edges
    const edges = [];
    nodes.forEach(sourceNode => {
      const targets = adjacencyList[sourceNode.id] || [];
      targets.forEach(targetId => {
        const targetNode = nodes.find(n => n.id === targetId);
        if (targetNode) {
          // Check if edge is circular
          const isEdgeCircular = circularDeps.some(c => 
            (c.source === sourceNode.id && c.target === targetNode.id) ||
            (c.source === targetNode.id && c.target === sourceNode.id)
          );

          edges.push({
            id: `${sourceNode.id}->${targetNode.id}`,
            source: sourceNode,
            target: targetNode,
            isCircular: isEdgeCircular
          });
        }
      });
    });

    return { dynamicNodes: nodes, dynamicEdges: edges };
  }, [activeRepo, fileMetrics, adjacencyList, circularDeps, couplingMap, issues]);

  // Filter nodes
  const filteredNodes = dynamicNodes.filter(node => {
    const matchesLayer = layerFilter === 'All' || node.layer === layerFilter;
    const matchesCircular = !showCircularOnly || node.isCircular;
    const matchesSearch = searchTerm === '' || 
      node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.path.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesLayer && matchesCircular && matchesSearch;
  });

  const selectedNode = dynamicNodes.find(n => n.id === selectedNodeId) || null;

  return (
    <div className="space-y-4 font-sans text-slate-100 animate-fadeIn relative">
      {/* Top Header & Interactive Filter Bar */}
      <div className="card-linear p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#090D16]">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="p-2 rounded-lg bg-[#6366F1]/15 text-[#818CF8] border border-[#6366F1]/30">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              Dynamic Architecture & Module Dependency Visualizer
            </h2>
            <p className="text-xs text-[#94A3B8] font-sans mt-0.5">
              Topological module import graph derived from AST parsing. Highlights cycles, afferent coupling, and hotspots.
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Search File */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-2.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter nodes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#111726] border border-[#1E293B] rounded-[6px] pl-8 pr-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-[#6366F1] w-36 sm:w-44"
            />
          </div>

          {/* Layer Filter Dropdown */}
          <select
            value={layerFilter}
            onChange={(e) => setLayerFilter(e.target.value)}
            className="bg-[#111726] border border-[#1E293B] rounded-[6px] px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-[#6366F1]"
          >
            <option value="All">All Layers</option>
            <option value="Controller">Controllers</option>
            <option value="Service">Services</option>
            <option value="Repository">Repositories</option>
            <option value="Utility">Utilities</option>
            <option value="Config">Config</option>
            <option value="Test">Tests</option>
          </select>

          {/* Circular Dependencies Toggle */}
          <button
            onClick={() => setShowCircularOnly(!showCircularOnly)}
            className={`px-3 py-1.5 rounded-[6px] text-xs font-mono font-semibold flex items-center gap-1.5 border transition-all ${
              showCircularOnly
                ? 'bg-[#EF4444]/20 text-[#F87171] border-[#EF4444]/40 shadow-sm'
                : 'bg-[#111726] text-[#94A3B8] border-[#1E293B] hover:text-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-[#EF4444]" />
            <span>Circular Only ({circularDeps.length})</span>
          </button>

          {/* Zoom Controls */}
          <div className="flex items-center rounded-[6px] bg-[#111726] border border-[#1E293B] p-0.5">
            <button
              onClick={() => setZoomLevel(prev => Math.max(0.6, prev - 0.15))}
              className="p-1 hover:text-white text-[#94A3B8]"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 text-[10px] font-mono text-slate-300">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel(prev => Math.min(1.6, prev + 0.15))}
              className="p-1 hover:text-white text-[#94A3B8]"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1 hover:text-white text-[#94A3B8]"
              title="Reset Zoom"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div className="card-linear p-2 bg-[#090D16] relative overflow-hidden border-[#1E293B] min-h-[540px] flex items-center justify-center">
        {/* Background Grid Accent */}
        <div 
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(#6366F1 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        ></div>

        {/* Circular Dependency Warning Alert Banner */}
        {circularDeps.length > 0 && (
          <div className="absolute top-4 left-4 z-20 max-w-md p-3 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/35 text-xs text-[#FCA5A5] font-mono space-y-1 backdrop-blur-md shadow-xl animate-fadeIn">
            <div className="flex items-center gap-2 font-bold text-[#F87171]">
              <AlertTriangle className="w-4 h-4 animate-pulse" />
              <span>Architectural Cycle Detected!</span>
            </div>
            <p className="text-[11px] text-[#CBD5E1] font-sans">
              Modules in red contain reciprocal import dependencies ({circularDeps.map(c => c.key).join(', ')}). This tightly couples modules and risks undefined runtime values.
            </p>
          </div>
        )}

        {/* Dynamic SVG Graph Canvas */}
        <div className="w-full h-full overflow-auto flex items-center justify-center p-6">
          <svg 
            width={Math.max(1000, 1100 * zoomLevel)} 
            height={Math.max(540, 600 * zoomLevel)}
            viewBox={`0 0 1100 600`}
            className="transition-transform duration-200 select-none"
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
          >
            {/* Arrowhead Marker Definitions */}
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748B" />
              </marker>
              <marker id="arrow-circular" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#EF4444" />
              </marker>
              <marker id="arrow-active" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#818CF8" />
              </marker>
            </defs>

            {/* Render Directed Edges */}
            {dynamicEdges.map(edge => {
              const isSelected = selectedNodeId === edge.source.id || selectedNodeId === edge.target.id;
              const isCirc = edge.isCircular;

              // Cubic bezier curve between nodes
              const sx = edge.source.x;
              const sy = edge.source.y;
              const tx = edge.target.x;
              const ty = edge.target.y;
              const dx = (tx - sx) / 2;
              const pathData = `M ${sx} ${sy} C ${sx + dx} ${sy}, ${tx - dx} ${ty}, ${tx} ${ty}`;

              return (
                <path
                  key={edge.id}
                  d={pathData}
                  fill="none"
                  stroke={
                    isCirc ? '#EF4444' : 
                    isSelected ? '#818CF8' : '#334155'
                  }
                  strokeWidth={isCirc ? 2.5 : (isSelected ? 2 : 1.2)}
                  strokeDasharray={isCirc ? '4 3' : 'none'}
                  markerEnd={
                    isCirc ? 'url(#arrow-circular)' : 
                    isSelected ? 'url(#arrow-active)' : 'url(#arrow)'
                  }
                  className={`transition-all duration-300 ${isCirc ? 'animate-pulse' : ''}`}
                />
              );
            })}

            {/* Render Nodes */}
            {filteredNodes.map(node => {
              const isSelected = selectedNodeId === node.id;
              const nodeWidth = 150;
              const nodeHeight = 56;

              return (
                <g 
                  key={node.id} 
                  transform={`translate(${node.x - nodeWidth / 2}, ${node.y - nodeHeight / 2})`}
                  onClick={() => setSelectedNodeId(node.id)}
                  className="cursor-pointer group"
                >
                  {/* Outer Node Container Rect */}
                  <rect
                    width={nodeWidth}
                    height={nodeHeight}
                    rx="8"
                    fill="#111726"
                    stroke={
                      node.isCircular ? '#EF4444' : 
                      isSelected ? '#818CF8' : '#1E293B'
                    }
                    strokeWidth={node.isCircular || isSelected ? 2 : 1}
                    className={`transition-all ${
                      node.isCircular ? 'filter drop-shadow(0 0 6px rgba(239,68,68,0.4))' : 
                      isSelected ? 'filter drop-shadow(0 0 8px rgba(99,102,241,0.5))' : ''
                    }`}
                  />

                  {/* Left Layer Color Strip */}
                  <rect
                    width="4"
                    height={nodeHeight}
                    rx="2"
                    fill={node.color}
                  />

                  {/* Node Label (Basename) */}
                  <text
                    x="12"
                    y="22"
                    fill="#F8FAFC"
                    fontSize="11"
                    fontFamily="JetBrains Mono, monospace"
                    fontWeight="bold"
                    className="group-hover:fill-[#818CF8] transition-colors"
                  >
                    {node.label.length > 15 ? node.label.slice(0, 14) + '…' : node.label}
                  </text>

                  {/* Layer Subtitle */}
                  <text
                    x="12"
                    y="38"
                    fill="#94A3B8"
                    fontSize="9"
                    fontFamily="Inter, sans-serif"
                  >
                    {node.layer} • {node.lines} LOC
                  </text>

                  {/* Complexity Badge on Top Right */}
                  <g transform={`translate(${nodeWidth - 36}, 8)`}>
                    <rect
                      width="26"
                      height="16"
                      rx="4"
                      fill={
                        node.complexity > 14 ? 'rgba(239, 68, 68, 0.2)' :
                        node.complexity > 8 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)'
                      }
                      stroke={
                        node.complexity > 14 ? '#EF4444' :
                        node.complexity > 8 ? '#F59E0B' : '#10B981'
                      }
                      strokeWidth="1"
                    />
                    <text
                      x="13"
                      y="11"
                      textAnchor="middle"
                      fill={
                        node.complexity > 14 ? '#F87171' :
                        node.complexity > 8 ? '#FBBF24' : '#34D399'
                      }
                      fontSize="9"
                      fontFamily="JetBrains Mono, monospace"
                      fontWeight="bold"
                    >
                      {node.complexity}
                    </text>
                  </g>

                  {/* Circular Warning Icon on Top Left */}
                  {node.isCircular && (
                    <circle
                      cx="0"
                      cy="0"
                      r="6"
                      fill="#EF4444"
                      className="animate-pulse"
                    />
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Node Inspector Drawer */}
        {selectedNode && (
          <div className="absolute right-4 top-4 bottom-4 w-80 bg-[#090D16]/95 border border-[#1E293B] rounded-xl p-4 shadow-2xl backdrop-blur-md z-30 font-mono text-xs flex flex-col justify-between animate-slideUp">
            <div className="space-y-3 overflow-y-auto pr-1">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-[#1E293B] pb-2">
                <div className="space-y-0.5 truncate">
                  <span className="text-[10px] text-[#818CF8] uppercase font-bold tracking-wider">
                    {selectedNode.layer} Module Inspector
                  </span>
                  <h3 className="font-bold text-white text-sm truncate" title={selectedNode.path}>
                    {selectedNode.label}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedNodeId(null)}
                  className="p-1 text-[#94A3B8] hover:text-white rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-1.5">
                {selectedNode.isCircular && (
                  <span className="badge badge-critical flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Circular Dependency</span>
                  </span>
                )}
                {selectedNode.isHotspot && (
                  <span className="badge badge-high flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    <span>Architectural Hotspot</span>
                  </span>
                )}
                <span className="badge badge-medium">
                  {selectedNode.lines} LOC
                </span>
              </div>

              {/* Coupling Telemetry */}
              <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-[#111726] border border-[#1E293B] text-center">
                <div>
                  <span className="text-[10px] text-[#94A3B8] block">Afferent (Ca)</span>
                  <span className="font-bold text-white text-xs">{selectedNode.afferent}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#94A3B8] block">Efferent (Ce)</span>
                  <span className="font-bold text-white text-xs">{selectedNode.efferent}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#94A3B8] block">Instability</span>
                  <span className="font-bold text-[#818CF8] text-xs">{selectedNode.instability}</span>
                </div>
              </div>

              {/* Cyclomatic Complexity */}
              <div className="p-2.5 rounded-lg bg-[#111726] border border-[#1E293B] space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#94A3B8]">Cyclomatic Complexity</span>
                  <span className={`font-bold ${
                    selectedNode.complexity > 14 ? 'text-[#F87171]' :
                    selectedNode.complexity > 8 ? 'text-[#FBBF24]' : 'text-[#34D399]'
                  }`}>
                    {selectedNode.complexity}
                  </span>
                </div>
                <div className="w-full bg-[#090D16] rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="h-full bg-[#818CF8] rounded-full"
                    style={{ width: `${Math.min(100, selectedNode.complexity * 5)}%` }}
                  ></div>
                </div>
              </div>

              {/* Dependencies (Imports) */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">
                  Outgoing Imports ({selectedNode.deps.length})
                </span>
                <div className="max-h-24 overflow-y-auto space-y-1">
                  {selectedNode.deps.length > 0 ? (
                    selectedNode.deps.map((dep, idx) => (
                      <div key={idx} className="p-1.5 rounded bg-[#111726] text-[10px] text-slate-300 truncate">
                        → {dep}
                      </div>
                    ))
                  ) : (
                    <div className="text-[10px] text-[#64748B]">Leaf module (no internal imports)</div>
                  )}
                </div>
              </div>

              {/* Detected Issues */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider">
                  Module Smells & Issues ({selectedNode.issuesCount})
                </span>
                <div className="max-h-28 overflow-y-auto space-y-1">
                  {selectedNode.issuesCount > 0 ? (
                    issues.filter(i => i.filePath === selectedNode.path).map((issue) => (
                      <div key={issue.id} className="p-1.5 rounded bg-[#111726] border border-[#1E293B] space-y-0.5">
                        <span className={`text-[9px] font-bold ${
                          issue.severity === 'Critical' ? 'text-[#F87171]' : 'text-[#FBBF24]'
                        }`}>
                          [{issue.severity}] {issue.type}
                        </span>
                        <p className="text-[10px] text-[#94A3B8] truncate">{issue.title}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-[10px] text-[#34D399] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>No active lint or complexity violations</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div className="pt-3 border-t border-[#1E293B]">
              <button
                onClick={() => {
                  const targetIssue = issues.find(i => i.filePath === selectedNode.path) || {
                    filePath: selectedNode.path,
                    title: `Refactor ${selectedNode.label}`,
                    why: 'Eliminate modular smells and reduce complexity.'
                  };
                  onTriggerRefactor(targetIssue);
                }}
                className="w-full btn-primary text-xs py-2 justify-center font-bold"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Refactor with AI Studio</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
