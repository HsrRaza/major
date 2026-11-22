'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FolderGit2, 
  Search, 
  Upload, 
  ArrowRight, 
  GitBranch, 
  LayoutGrid, 
  List
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
      <div className="surface-card p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-200 text-[#E5484D] flex items-center justify-center shadow-2xs">
            <FolderGit2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-[#172033] flex items-center gap-2">
              Repository Workspaces
            </h1>
            <p className="text-xs text-[#64748B] font-sans mt-0.5">
              Manage codebases, import GitHub repositories, or switch active architectural evaluation targets.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* View Mode Switcher */}
          <div className="flex items-center rounded-md bg-[#F1F5F9] border border-[#E2E8F0] p-0.5 text-xs">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                viewMode === 'cards' ? 'bg-white text-[#E5484D] shadow-2xs font-semibold' : 'text-[#64748B] hover:text-[#172033]'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-[#E5484D] shadow-2xs font-semibold' : 'text-[#64748B] hover:text-[#172033]'
              }`}
              title="Table List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search repositories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border border-[#E2E8F0] rounded-md pl-9 pr-3.5 py-1.5 text-xs text-[#172033] placeholder-[#94A3B8] focus:outline-none focus:border-[#E5484D] w-44 sm:w-56 shadow-2xs"
            />
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="bg-white border border-[#E2E8F0] rounded-md px-3 py-1.5 text-xs text-[#172033] font-medium focus:outline-none focus:border-[#E5484D] shadow-2xs"
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
            className="text-xs whitespace-nowrap"
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
                className={`surface-card p-5 flex flex-col justify-between space-y-4 cursor-pointer group transition-all relative bg-white ${
                  isActive ? 'border-[#E5484D] ring-2 ring-[#E5484D]/30 shadow-md' : 'hover:border-[#CBD5E1]'
                }`}
              >
                {isActive && (
                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-50 text-[#E5484D] border border-red-200">
                    Active
                  </span>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-[#E5484D]">
                      <FolderGit2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#172033] group-hover:text-[#E5484D] transition-colors">
                        {repo.name}
                      </h3>
                      <div className="flex items-center gap-2 text-[11px] text-[#64748B]">
                        <span>{repo.owner || 'acme'}</span>
                        <span>•</span>
                        <span className="text-[#475569]">{repo.language}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-[#64748B] font-sans line-clamp-2 leading-relaxed">
                    {repo.description || 'Source codebase analyzed with PatchPilot engine.'}
                  </p>
                </div>

                {/* Metrics Strip */}
                <div className="pt-3 border-t border-[#E2E8F0] space-y-3 text-xs">
                  <div className="grid grid-cols-3 gap-2 text-center font-mono">
                    <div className="p-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                      <span className="text-[10px] text-[#64748B] block uppercase font-medium">Files</span>
                      <span className="font-bold text-[#172033]">{repo.fileCount}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                      <span className="text-[10px] text-[#64748B] block uppercase font-medium">Issues</span>
                      <span className={`font-bold ${repo.issuesCount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {repo.issuesCount}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                      <span className="text-[10px] text-[#64748B] block uppercase font-medium">Health</span>
                      <span className={`font-bold ${repo.healthScore >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {repo.healthScore}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#64748B] pt-1 font-mono">
                    <span className="flex items-center gap-1.5">
                      <GitBranch className="w-3.5 h-3.5 text-[#E5484D]" />
                      <span>{repo.defaultBranch || 'main'}</span>
                    </span>

                    <span className="text-[#E5484D] group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 font-semibold">
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
        <div className="surface-card overflow-x-auto bg-white border border-[#E2E8F0] rounded-xl shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E2E8F0] text-[11px] text-[#64748B] uppercase tracking-wider bg-[#F8FAFC] font-semibold">
                <th className="py-3 px-4">Repository</th>
                <th className="py-3 px-4">Primary Language</th>
                <th className="py-3 px-4">Files</th>
                <th className="py-3 px-4">LOC</th>
                <th className="py-3 px-4">Issues</th>
                <th className="py-3 px-4">Health Index</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {sorted.map((repo) => {
                const isActive = repo.id === activeRepoId;
                return (
                  <tr
                    key={repo.id}
                    onClick={() => handleSelectRepo(repo.id)}
                    className="hover:bg-[#F8FAFC] cursor-pointer group transition-colors"
                  >
                    <td className="py-3 px-4 flex items-center gap-2.5">
                      <FolderGit2 className="w-4 h-4 text-[#E5484D]" />
                      <div>
                        <div className="font-bold text-[#172033] group-hover:text-[#E5484D] transition-colors">
                          {repo.name}
                        </div>
                        <div className="text-[10px] text-[#64748B] font-mono">{repo.owner || 'acme'}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[#475569]">{repo.language}</td>
                    <td className="py-3 px-4 text-[#172033] font-bold font-mono">{repo.fileCount}</td>
                    <td className="py-3 px-4 text-[#64748B] font-mono">{repo.totalLines}</td>
                    <td className="py-3 px-4">
                      {repo.issuesCount > 0 ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-600 border border-red-200 font-mono">
                          {repo.issuesCount} findings
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-medium text-xs">Clean</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-bold ${getHealthBadgeClass(repo.healthScore)} px-2 py-0.5 rounded font-mono`}>
                        {repo.healthScore}/100
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isActive ? (
                        <span className="text-[10px] font-bold text-[#E5484D] bg-red-50 px-2.5 py-1 rounded border border-red-200 font-mono">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="text-xs text-[#64748B] group-hover:text-[#E5484D] inline-flex items-center gap-1 font-semibold">
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
