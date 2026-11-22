'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Node,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { 
  Network, 
  Search, 
  AlertTriangle, 
  Sparkles, 
  X, 
  FileCode
} from 'lucide-react';
import { CustomNode } from './CustomNode';
import { useRepoStore } from '@/stores/repoStore';
import { useRefactorStore } from '@/stores/refactorStore';
import { Button } from '@/components/ui/Button';
import { GraphNodeData } from '@/types/graph';

const nodeTypes = {
  fileNode: CustomNode,
};

export function ArchitectureFlowGraph() {
  const router = useRouter();
  const { analysisResult, getActiveRepo, activeRepoId, setSelectedFilePath } = useRepoStore();
  const { generateProposal } = useRefactorStore();

  const [selectedNodeData, setSelectedNodeData] = useState<GraphNodeData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [layerFilter, setLayerFilter] = useState('All');
  const [showCircularOnly, setShowCircularOnly] = useState(false);

  const activeRepo = getActiveRepo();
  const fileMetrics = analysisResult?.fileMetrics || {};
  const adjacencyList = analysisResult?.adjacencyList || {};
  const circularDeps = analysisResult?.circularDependencies || [];
  const couplingMap = analysisResult?.couplingMap || {};
  const issues = analysisResult?.issues || [];

  // Generate Topological React Flow Nodes & Edges
  const { flowNodes, flowEdges } = useMemo(() => {
    const files = Object.keys(activeRepo?.files || {});
    if (files.length === 0) return { flowNodes: [], flowEdges: [] };

    const layerColumns: Record<string, number> = {
      Controller: 0,
      Component: 0,
      Service: 1,
      Repository: 2,
      Utility: 3,
      Config: 3,
      Test: 3,
      General: 1,
    };

    const layerColors: Record<string, string> = {
      Controller: '#E5484D',
      Service: '#64748B',
      Repository: '#16A36A',
      Utility: '#E9A23B',
      Config: '#94A3B8',
      Test: '#16A36A',
      Component: '#475569',
      General: '#64748B',
    };

    const columnBuckets: string[][] = [[], [], [], []];
    files.forEach((file) => {
      const metrics = fileMetrics[file] || { layer: 'General', complexity: 1, lineCount: 0 };
      const colIdx = layerColumns[metrics.layer] ?? 1;
      columnBuckets[colIdx].push(file);
    });

    const nodes: Node<GraphNodeData>[] = [];
    const colXSpacing = 320;
    const startX = 60;

    columnBuckets.forEach((bucket, colIdx) => {
      const colX = startX + colIdx * colXSpacing;
      const totalInCol = bucket.length;
      const startY = 80;
      const ySpacing = Math.max(110, Math.min(150, 600 / Math.max(1, totalInCol)));

      bucket.forEach((file, rowIdx) => {
        const metrics = fileMetrics[file] || { layer: 'General', complexity: 1, lineCount: 0 };
        const coupling = couplingMap[file] || { afferent: 0, efferent: 0, instability: 0, isHotspot: false };
        const fileIssues = issues.filter((i) => i.filePath === file);

        const isCircular = circularDeps.some(
          (c) => c.nodes?.includes(file) || c.source === file || c.target === file
        );

        const nodeData: GraphNodeData = {
          id: file,
          label: file.split('/').pop() || file,
          path: file,
          layer: metrics.layer,
          color: layerColors[metrics.layer] || '#64748B',
          complexity: metrics.complexity,
          lines: metrics.lineCount,
          isCircular,
          isHotspot: coupling.isHotspot,
          afferent: coupling.afferent,
          efferent: coupling.efferent,
          instability: coupling.instability,
          issuesCount: fileIssues.length,
          deps: adjacencyList[file] || [],
        };

        nodes.push({
          id: file,
          type: 'fileNode',
          position: { x: colX, y: startY + rowIdx * ySpacing },
          data: nodeData,
        });
      });
    });

    // Compute Directed Edges
    const edges: Edge[] = [];
    Object.entries(adjacencyList).forEach(([sourceFile, targets]) => {
      targets.forEach((targetFile) => {
        const isCycleEdge = circularDeps.some(
          (c) =>
            (c.source === sourceFile && c.target === targetFile) ||
            (c.source === targetFile && c.target === sourceFile)
        );

        edges.push({
          id: `edge-${sourceFile}-${targetFile}`,
          source: sourceFile,
          target: targetFile,
          animated: isCycleEdge,
          style: {
            stroke: isCycleEdge ? '#DC2626' : '#CBD5E1',
            strokeWidth: isCycleEdge ? 2.5 : 1.5,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isCycleEdge ? '#DC2626' : '#94A3B8',
          },
          data: { isCircular: isCycleEdge },
        });
      });
    });

    return { flowNodes: nodes, flowEdges: edges };
  }, [activeRepo, fileMetrics, adjacencyList, circularDeps, couplingMap, issues]);

  // Filter nodes according to search & layer & circular
  const filteredNodes = useMemo(() => {
    return flowNodes.filter((node) => {
      const data = node.data;
      const matchesSearch =
        searchTerm === '' ||
        data.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        data.path.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLayer = layerFilter === 'All' || data.layer === layerFilter;
      const matchesCircular = !showCircularOnly || data.isCircular;
      return matchesSearch && matchesLayer && matchesCircular;
    });
  }, [flowNodes, searchTerm, layerFilter, showCircularOnly]);

  const [nodes, setNodes, onNodesChange] = useNodesState<any>(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  React.useEffect(() => {
    setNodes(filteredNodes as any);
    setEdges(flowEdges);
  }, [filteredNodes, flowEdges, setNodes, setEdges]);

  const onNodeClick = useCallback((_: any, node: any) => {
    setSelectedNodeData(node.data as GraphNodeData);
  }, []);

  const handleRefactorFile = (filePath: string) => {
    const originalCode = activeRepo?.files[filePath] || '';
    const fileIssue = issues.find((i) => i.filePath === filePath);
    generateProposal({
      filePath,
      originalCode,
      issue: fileIssue || null,
      customPrompt: 'Decouple tightly bound circular dependencies and reduce cyclomatic branching.',
    });
    router.push(`/refactor/${activeRepoId}`);
  };

  const layers = ['All', 'Controller', 'Service', 'Repository', 'Utility', 'Config', 'Test'];

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Top Controls Bar */}
      <div className="surface-card p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-200 text-[#E5484D] flex items-center justify-center shadow-2xs">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-[#172033] flex items-center gap-2">
              Architecture & Dependency Flow Visualizer
            </h1>
            <p className="text-xs text-[#64748B] font-sans mt-0.5">
              Live DAG with cycle detection, afferent/efferent coupling metrics, and architectural hotspot analysis.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Circular Only Toggle */}
          <button
            onClick={() => setShowCircularOnly((prev) => !prev)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              showCircularOnly
                ? 'bg-red-50 text-red-700 border border-red-300 font-semibold'
                : 'bg-white text-[#64748B] hover:text-[#172033] border border-[#E2E8F0]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-[#E5484D]" />
            <span>Circular Cycles Only</span>
          </button>

          {/* Layer Filter */}
          <select
            value={layerFilter}
            onChange={(e) => setLayerFilter(e.target.value)}
            className="bg-white border border-[#E2E8F0] rounded-md px-2.5 py-1.5 text-xs text-[#172033] font-medium focus:outline-none focus:border-[#E5484D] shadow-2xs"
          >
            {layers.map((l) => (
              <option key={l} value={l}>
                Layer: {l}
              </option>
            ))}
          </select>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Filter nodes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border border-[#E2E8F0] rounded-md pl-8 pr-3 py-1.5 text-xs text-[#172033] placeholder-[#94A3B8] focus:outline-none focus:border-[#E5484D] w-40 sm:w-48 shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* Main Graph Canvas Area */}
      <div className="relative w-full h-[620px] rounded-xl border border-[#E2E8F0] overflow-hidden bg-white shadow-sm">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.2}
          maxZoom={2}
        >
          <Background color="#E2E8F0" gap={24} size={1.5} />
          <Controls className="!bg-white !border-[#E2E8F0] !fill-[#64748B] !shadow-sm !rounded-md" />
          <MiniMap
            nodeColor={(node: any) => node.data?.isCircular ? '#DC2626' : '#CBD5E1'}
            className="!bg-white !border-[#E2E8F0] !rounded-lg !shadow-sm"
          />
        </ReactFlow>

        {/* Selected Node Inspector Drawer (Right Panel) */}
        {selectedNodeData && (
          <div className="absolute top-4 right-4 w-80 max-w-[90vw] surface-card p-4 space-y-3 z-10 animate-fadeIn bg-white/95 backdrop-blur-md shadow-xl border border-[#E2E8F0] rounded-xl text-xs">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-[#E5484D]" />
                <h4 className="text-xs font-mono font-bold text-[#172033] truncate max-w-[200px]">
                  {selectedNodeData.label}
                </h4>
              </div>
              <button
                onClick={() => setSelectedNodeData(null)}
                className="p-1 rounded text-[#94A3B8] hover:text-[#172033] hover:bg-[#F1F5F9]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                <span className="text-[10px] text-[#64748B] uppercase block">Full File Path</span>
                <span className="text-[#172033] break-all text-[11px] font-medium">{selectedNodeData.path}</span>
              </div>

              {/* Coupling Metrics Grid */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[10px] text-[#64748B] block uppercase" title="Afferent: Number of modules depending on this file">
                    Inbound
                  </span>
                  <span className="font-bold text-[#172033] text-sm">{selectedNodeData.afferent}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[10px] text-[#64748B] block uppercase" title="Efferent: Number of modules this file imports">
                    Outbound
                  </span>
                  <span className="font-bold text-[#172033] text-sm">{selectedNodeData.efferent}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[10px] text-[#64748B] block uppercase" title="Instability Factor (0 = Stable, 1 = Volatile)">
                    Instability
                  </span>
                  <span className="font-bold text-[#E5484D] text-sm">{selectedNodeData.instability}</span>
                </div>
              </div>

              {selectedNodeData.isCircular && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 space-y-1 font-sans text-xs">
                  <div className="flex items-center gap-1.5 font-bold font-mono">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Circular Dependency Loop</span>
                  </div>
                  <p>Part of a cyclic module recursion that causes unpredictable runtime imports.</p>
                </div>
              )}

              {/* Dependencies List */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] text-[#64748B] uppercase font-bold">Imported Dependencies ({selectedNodeData.deps.length}):</span>
                {selectedNodeData.deps.length === 0 ? (
                  <p className="text-xs text-[#94A3B8] font-sans">No local module dependencies.</p>
                ) : (
                  <ul className="space-y-1 max-h-24 overflow-y-auto pr-1">
                    {selectedNodeData.deps.map((dep, idx) => (
                      <li key={idx} className="p-1.5 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-[11px] text-[#475569] truncate">
                        {dep}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  variant="primary"
                  size="xs"
                  onClick={() => handleRefactorFile(selectedNodeData.path)}
                  className="w-full text-xs"
                >
                  <Sparkles className="w-3 h-3 text-white" />
                  <span>Refactor in Studio</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
