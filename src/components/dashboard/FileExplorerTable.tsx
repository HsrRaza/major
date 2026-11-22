'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileCode, 
  Search, 
  ChevronRight
} from 'lucide-react';
import { useRepoStore } from '@/stores/repoStore';
import { FileItem } from '@/types/repository';

export function FileExplorerTable() {
  const router = useRouter();
  const { getActiveRepo, analysisResult, activeRepoId, setSelectedFilePath } = useRepoStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLayer, setSelectedLayer] = useState<string>('All');

  const activeRepo = getActiveRepo();
  const fileMetrics = analysisResult?.fileMetrics || {};
  const repoFiles = activeRepo?.files || {};

  const fileList: FileItem[] = Object.keys(repoFiles).map((path) => {
    const metrics = fileMetrics[path] || {
      lineCount: repoFiles[path]?.split('\n').length || 0,
      complexity: 1,
      layer: 'General',
      maintainabilityIndex: 85,
      issuesCount: 0,
    };

    return {
      path,
      name: path.split('/').pop() || path,
      lines: metrics.lineCount,
      complexity: metrics.complexity,
      layer: metrics.layer,
      maintainabilityIndex: metrics.maintainabilityIndex,
      issuesCount: metrics.issuesCount,
      risk: metrics.complexity > 14 || metrics.issuesCount > 2 ? 'High' : (metrics.complexity > 8 || metrics.issuesCount > 0 ? 'Medium' : 'Low'),
    };
  });

  const layers = ['All', 'Controller', 'Service', 'Repository', 'Utility', 'Config', 'Test', 'Component'];

  const filtered = fileList.filter((f) => {
    const matchesSearch = searchTerm === '' || f.path.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLayer = selectedLayer === 'All' || f.layer === selectedLayer;
    return matchesSearch && matchesLayer;
  });

  const handleOpenFile = (path: string) => {
    setSelectedFilePath(path);
    router.push(`/refactor/${activeRepoId}`);
  };

  return (
    <div className="surface-card p-5 sm:p-6 space-y-4 bg-white">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-[#E5484D]" />
          <h4 className="font-semibold text-xs text-[#172033] uppercase tracking-wider font-mono">
            Workspace Source Code Files
          </h4>
          <span className="text-xs text-[#64748B]">({fileList.length} indexed)</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Layer Filter */}
          <select
            value={selectedLayer}
            onChange={(e) => setSelectedLayer(e.target.value)}
            className="bg-white border border-[#E2E8F0] text-xs text-[#172033] font-medium rounded-md px-2.5 py-1.5 focus:outline-none focus:border-[#E5484D] shadow-2xs"
          >
            {layers.map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Filter files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border border-[#E2E8F0] rounded-md pl-8 pr-3 py-1.5 text-xs text-[#172033] placeholder-[#94A3B8] focus:outline-none focus:border-[#E5484D] w-40 sm:w-48 shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* File Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[11px] text-[#64748B] font-semibold uppercase tracking-wider">
              <th className="py-2.5 px-3">File Path</th>
              <th className="py-2.5 px-3">Layer</th>
              <th className="py-2.5 px-3">Lines</th>
              <th className="py-2.5 px-3">Complexity</th>
              <th className="py-2.5 px-3">Maintainability</th>
              <th className="py-2.5 px-3">Issues</th>
              <th className="py-2.5 px-3">Risk Tier</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-[#94A3B8]">
                  No matching files found.
                </td>
              </tr>
            ) : (
              filtered.map((file) => (
                <tr
                  key={file.path}
                  className="hover:bg-[#F8FAFC] transition-colors cursor-pointer group"
                  onClick={() => handleOpenFile(file.path)}
                >
                  <td className="py-2.5 px-3 font-mono font-medium text-[#172033] flex items-center gap-2">
                    <FileCode className="w-3.5 h-3.5 text-[#64748B] group-hover:text-[#E5484D] transition-colors" />
                    <span>{file.path}</span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]">
                      {file.layer}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[#64748B]">{file.lines}</td>
                  <td className="py-2.5 px-3 font-mono font-semibold text-[#172033]">{file.complexity}</td>
                  <td className="py-2.5 px-3 font-mono">
                    <span className={file.maintainabilityIndex > 75 ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'}>
                      {file.maintainabilityIndex}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono">
                    {file.issuesCount > 0 ? (
                      <span className="text-red-600 font-bold px-1.5 py-0.5 rounded bg-red-50 border border-red-200">
                        {file.issuesCount}
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-medium">0</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-mono">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        file.risk === 'High'
                          ? 'bg-red-50 text-red-600 border border-red-200'
                          : file.risk === 'Medium'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {file.risk}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span className="inline-flex items-center gap-1 text-[11px] text-[#64748B] group-hover:text-[#E5484D] font-medium">
                      Open <ChevronRight className="w-3 h-3" />
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
