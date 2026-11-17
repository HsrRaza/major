'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FolderGit2, 
  Search, 
  Upload, 
  ArrowRight, 
  FileCode, 
  Activity, 
  GitBranch, 
  Sparkles,
  LayoutGrid,
  List,
  Clock,
  Bug,
  Code2
} from 'lucide-react';
import { useRepoStore } from '@/stores/repoStore';
import { Button } from '@/components/ui/Button';
import { RepoImporterModal } from '@/components/repository/RepoImporterModal';
import { analyzeCodebase } from '@/services/staticAnalyzer';
import { getHealthBadgeClass } from '@/lib/utils';

export default function RepositoriesPage() {
  const router = useRouter();
  const { repositories, activeRepoId, setActiveRepoId } = useRepoStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'files' | 'health'>('name');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [isImporterOpen, setIsImporterOpen] = useState(false);

  // Compute metrics for each repository
  const repoCards = repositories.map(repo => {
    const fileCount = Object.keys(repo.files).length;
    const totalLines = Object.values(repo.files).reduce((acc, code) => acc + (code?.split('\n').length || 0), 0);
    const analysis = analyzeCodebase(repo.files);

    return {
      ...repo,
      fileCount,
      totalLines,
      healthScore: analysis.healthScore,
      healthGrade: analysis.healthGrade,
      issuesCount: analysis.counts.totalIssues,
      criticalCount: analysis.counts.critical,
      language: repo.language || 'JavaScript',
      lastAnalyzed: 'Just now',
    };
  });

  const filtered = repoCards.filter(r =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.owner && r.owner.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (r.language && r.language.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'files') return b.fileCount - a.fileCount;
    if (sortBy === 'health') return b.healthScore - a.healthScore;
    return a.name.localeCompare(b.name);
  });

  const handleSelectRepo = (id: string) => {
    setActiveRepoId(id);
    router.push('/dashboard');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5 animate-fadeIn">
      {/* Top Header & Search / Filter Controls */}
      <div className="surface-card p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-[#141414] border border-[#E53935]/40 text-[#FF4D4D] flex items-center justify-center shadow-[0_0_10px_-2px_rgba(229,57,53,0.3)]">
            <FolderGit2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white font-mono flex items-center gap-2">
              Repository Workspaces
            </h1>
            <p className="text-xs text-[#858585] font-sans mt-0.5">
              Manage codebases, import GitHub repos, or switch active architectural evaluation targets.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* View Mode Switcher */}
          <div className="flex items-center rounded bg-[#0D0D0D] border border-[#2B2B2B] p-0.5 text-xs font-mono">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                viewMode === 'cards' ? 'bg-[#1B1B1B] text-[#FF4D4D] border border-[#2B2B2B]' : 'text-[#858585] hover:text-white'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-[#1B1B1B] text-[#FF4D4D] border border-[#2B2B2B]' : 'text-[#858585] hover:text-white'
              }`}
              title="Table List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#858585] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search repositories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#0D0D0D] border border-[#2B2B2B] rounded pl-9 pr-3.5 py-1.5 text-xs text-white font-mono placeholder-[#5C5C5C] focus:outline-none focus:border-[#E53935] w-44 sm:w-56"
            />
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="bg-[#0D0D0D] border border-[#2B2B2B] rounded px-3 py-1.5 text-xs text-[#F5F5F5] font-mono focus:outline-none focus:border-[#E53935]"
          >
            <option value="name">Sort by Name</option>
            <option value="health">Sort by Health</option>
            <option value="files">Sort by Files</option>
          </select>

          {/* Import New Repository Button */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsImporterOpen(true)}
            className="font-mono text-xs whitespace-nowrap"
          >
            <Upload className="w-3.5 h-3.5 text-white" />
            <span>Import Repo</span>
          </Button>
        </div>
      </div>

      {/* Cards View or Table View */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((repo) => {
            const isActive = repo.id === activeRepoId;

            return (
              <div
                key={repo.id}
                onClick={() => handleSelectRepo(repo.id)}
                className={`surface-card p-5 flex flex-col justify-between space-y-4 cursor-pointer group transition-all relative ${
                  isActive ? 'border-[#E53935] shadow-[0_0_16px_-3px_rgba(229,57,53,0.3)] bg-[#171717]' : 'hover:border-[#383838]'
                }`}
              >
                {isActive && (
                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#E53935]/15 text-[#FF4D4D] border border-[#E53935]/30">
                    Active
                  </span>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded bg-[#0D0D0D] border border-[#2B2B2B] flex items-center justify-center text-[#E53935]">
                      <FolderGit2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold font-mono text-white group-hover:text-[#FF4D4D] transition-colors">
                        {repo.name}
                      </h3>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-[#858585]">
                        <span>{repo.owner || 'acme'}</span>
                        <span>•</span>
                        <span className="text-[#B3B3B3]">{repo.language}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[#858585] font-sans line-clamp-2 leading-relaxed">
                    {repo.description || 'Source codebase analyzed with PatchPilot engine.'}
                  </p>
                </div>

                {/* Metrics Strip */}
                <div className="pt-3 border-t border-[#202020] space-y-3 font-mono text-xs">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded bg-[#0D0D0D] border border-[#2B2B2B]">
                      <span className="text-[10px] text-[#5C5C5C] block uppercase">Files</span>
                      <span className="font-bold text-white">{repo.fileCount}</span>
                    </div>
                    <div className="p-2 rounded bg-[#0D0D0D] border border-[#2B2B2B]">
                      <span className="text-[10px] text-[#5C5C5C] block uppercase">Issues</span>
                      <span className={`font-bold ${repo.issuesCount > 0 ? 'text-[#FF4D4D]' : 'text-emerald-400'}`}>
                        {repo.issuesCount}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-[#0D0D0D] border border-[#2B2B2B]">
                      <span className="text-[10px] text-[#5C5C5C] block uppercase">Health</span>
                      <span className={`font-bold ${repo.healthScore >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {repo.healthScore}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#858585] pt-1">
                    <span className="flex items-center gap-1.5">
                      <GitBranch className="w-3.5 h-3.5 text-[#E53935]" />
                      <span>{repo.defaultBranch || 'main'}</span>
                    </span>

                    <span className="text-[#FF4D4D] group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 font-semibold">
                      Open Workspace <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="surface-card overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-[#202020] text-[10px] text-[#858585] uppercase tracking-wider bg-[#0D0D0D]">
                <th className="py-3 px-4">Repository</th>
                <th className="py-3 px-4">Primary Language</th>
                <th className="py-3 px-4">Files</th>
                <th className="py-3 px-4">LOC</th>
                <th className="py-3 px-4">Issues</th>
                <th className="py-3 px-4">Health Index</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#202020]">
              {sorted.map((repo) => {
                const isActive = repo.id === activeRepoId;
                return (
                  <tr
                    key={repo.id}
                    onClick={() => handleSelectRepo(repo.id)}
                    className="hover:bg-[#1B1B1B] cursor-pointer group transition-colors"
                  >
                    <td className="py-3 px-4 flex items-center gap-2.5">
                      <FolderGit2 className="w-4 h-4 text-[#E53935]" />
                      <div>
                        <div className="font-bold text-white group-hover:text-[#FF4D4D] transition-colors">
                          {repo.name}
                        </div>
                        <div className="text-[10px] text-[#5C5C5C]">{repo.owner || 'acme'}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#B3B3B3]">{repo.language}</td>
                    <td className="py-3 px-4 text-white font-bold">{repo.fileCount}</td>
                    <td className="py-3 px-4 text-[#858585]">{repo.totalLines}</td>
                    <td className="py-3 px-4">
                      {repo.issuesCount > 0 ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#E53935]/15 text-[#FF4D4D] border border-[#E53935]/30">
                          {repo.issuesCount} findings
                        </span>
                      ) : (
                        <span className="text-[#5C5C5C] text-[10px]">Clean</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-bold ${getHealthBadgeClass(repo.healthScore)} px-2 py-0.5 rounded`}>
                        {repo.healthScore}/100
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isActive ? (
                        <span className="text-[10px] font-bold text-[#FF4D4D] bg-[#E53935]/15 px-2 py-0.5 rounded border border-[#E53935]/30">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#858585] group-hover:text-[#FF4D4D] inline-flex items-center gap-1 font-semibold">
                          Switch <ArrowRight className="w-3 h-3" />
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Repo Importer Modal */}
      <RepoImporterModal
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
      />
    </div>
  );
}

