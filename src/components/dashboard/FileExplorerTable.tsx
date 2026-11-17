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
    <div className="surface-card p-4 sm:p-5 space-y-3.5">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#202020] pb-3">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-[#E53935]" />
          <h4 className="font-mono font-bold text-xs text-white uppercase tracking-wider">
            Workspace Source Code Files
          </h4>
          <span className="text-[11px] font-mono text-[#858585]">({fileList.length} indexed)</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Layer Filter */}
          <select
            value={selectedLayer}
            onChange={(e) => setSelectedLayer(e.target.value)}
            className="bg-[#0D0D0D] border border-[#2B2B2B] text-xs text-[#F5F5F5] font-mono rounded px-2.5 py-1 focus:outline-none focus:border-[#E53935]"
          >
            {layers.map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#858585] absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Filter files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#0D0D0D] border border-[#2B2B2B] rounded pl-8 pr-3 py-1 text-xs text-white font-mono placeholder-[#5C5C5C] focus:outline-none focus:border-[#E53935] w-40 sm:w-48"
            />
          </div>
        </div>
      </div>

      {/* File Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="border-b border-[#202020] text-[10px] text-[#858585] uppercase tracking-wider">
              <th className="py-2.5 px-3">File Path</th>
              <th className="py-2.5 px-3">Layer</th>
              <th className="py-2.5 px-3">Lines</th>
              <th className="py-2.5 px-3">Complexity</th>
              <th className="py-2.5 px-3">Issues</th>
              <th className="py-2.5 px-3">Maintainability</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#202020]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-[#858585]">
                  No files matching &quot;{searchTerm}&quot;
                </td>
              </tr>
            ) : (
              filtered.map((file) => (
                <tr
                  key={file.path}
                  onClick={() => handleOpenFile(file.path)}
                  className="hover:bg-[#1B1B1B] cursor-pointer group transition-colors"
                >
                  <td className="py-2.5 px-3 flex items-center gap-2">
                    <FileCode className="w-3.5 h-3.5 text-[#5C5C5C] group-hover:text-[#FF4D4D] transition-colors" />
                    <span className="text-[#F5F5F5] group-hover:text-white font-medium">{file.path}</span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1B1B1B] border border-[#2B2B2B] text-[#858585]">
                      {file.layer}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-[#858585]">{file.lines}</td>
                  <td className="py-2.5 px-3">
                    <span className={file.complexity > 12 ? 'text-[#FF4D4D] font-bold' : file.complexity > 6 ? 'text-amber-400' : 'text-[#B3B3B3]'}>
                      {file.complexity}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    {file.issuesCount > 0 ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#E53935]/15 text-[#FF4D4D] border border-[#E53935]/30">
                        {file.issuesCount} finding{file.issuesCount > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span className="text-[#5C5C5C] text-[10px]">Clean</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1.5 bg-[#1B1B1B] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${file.maintainabilityIndex}%`,
                            backgroundColor: file.maintainabilityIndex >= 75 ? '#22C55E' : file.maintainabilityIndex >= 50 ? '#F59E0B' : '#E53935',
                          }}
                        />
                      </div>
                      <span className="text-[11px] text-[#858585]">{file.maintainabilityIndex}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span className="text-[11px] text-[#FF4D4D] opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1">
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

