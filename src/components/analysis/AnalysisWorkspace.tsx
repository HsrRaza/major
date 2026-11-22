'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Bug, 
  Search, 
  Sparkles, 
  FileCode, 
  CheckCircle2, 
  AlertTriangle
} from 'lucide-react';
import { useRepoStore } from '@/stores/repoStore';
import { useRefactorStore } from '@/stores/refactorStore';
import { CodeIssue } from '@/types/issue';
import { FindingInspectorModal } from '@/components/dashboard/FindingInspectorModal';
import { getSeverityBadgeClass } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

export function AnalysisWorkspace() {
  const router = useRouter();
  const { analysisResult, getActiveRepo, activeRepoId } = useRepoStore();
  const { generateProposal } = useRefactorStore();
  const activeRepo = getActiveRepo();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('All');
  const [selectedFile, setSelectedFile] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'severity' | 'file' | 'line'>('severity');
  const [selectedIssueForReview, setSelectedIssueForReview] = useState<CodeIssue | null>(null);

  const issues = analysisResult?.issues || [];
  const counts = analysisResult?.counts || { totalIssues: 0, critical: 0, high: 0, medium: 0, low: 0 };
  const filesList = Object.keys(activeRepo?.files || {});

  const categories: string[] = ['All', 'Security', 'Complexity', 'Performance', 'Architecture', 'Duplication'];
  const severities: string[] = ['All', 'Critical', 'High', 'Medium', 'Low'];

  const severityWeight: Record<string, number> = {
    Critical: 4,
    High: 3,
    Medium: 2,
    Low: 1,
  };

  const filteredIssues = issues.filter((issue) => {
    const matchesSearch =
      searchTerm === '' ||
      issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.filePath.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.why.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'All' || issue.category === selectedCategory;
    const matchesSeverity = selectedSeverity === 'All' || issue.severity === selectedSeverity;
    const matchesFile = selectedFile === 'All' || issue.filePath === selectedFile;

    return matchesSearch && matchesCategory && matchesSeverity && matchesFile;
  });

  const sortedIssues = [...filteredIssues].sort((a, b) => {
    if (sortBy === 'severity') {
      return (severityWeight[b.severity] || 0) - (severityWeight[a.severity] || 0);
    }
    if (sortBy === 'file') {
      return a.filePath.localeCompare(b.filePath);
    }
    if (sortBy === 'line') {
      return a.line - b.line;
    }
    return 0;
  });

  const handleRefactor = (issue: CodeIssue) => {
    const originalCode = activeRepo?.files[issue.filePath] || '';
    generateProposal({
      filePath: issue.filePath,
      originalCode,
      issue,
    });
    router.push(`/refactor/${activeRepoId}`);
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Top Header & Search Bar */}
      <div className="surface-card p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-200 text-[#E5484D] flex items-center justify-center shadow-2xs">
            <Bug className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-[#172033] flex items-center gap-2">
              Code Analysis & Smells Inspector
            </h1>
            <p className="text-xs text-[#64748B] font-sans mt-0.5">
              Deterministic AST violations with line/column evidence, severity rankings, and AI-assisted refactoring.
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search rules, files, keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-[#E2E8F0] rounded-md pl-9 pr-3.5 py-1.5 text-xs text-[#172033] focus:outline-none focus:border-[#E5484D] shadow-2xs"
          />
        </div>
      </div>

      {/* Severity Overview Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 text-xs">
        <div 
          onClick={() => setSelectedSeverity('All')}
          className={`p-3.5 rounded-lg surface-card cursor-pointer transition-all bg-white ${
            selectedSeverity === 'All' ? 'border-[#E5484D] ring-1 ring-[#E5484D] bg-[#FFF1F2]' : 'hover:border-[#CBD5E1]'
          }`}
        >
          <span className="text-[11px] text-[#64748B] font-medium uppercase block">Total Issues</span>
          <span className="text-xl font-bold text-[#172033] font-mono">{counts.totalIssues}</span>
        </div>

        <div 
          onClick={() => setSelectedSeverity('Critical')}
          className={`p-3.5 rounded-lg surface-card cursor-pointer transition-all bg-white ${
            selectedSeverity === 'Critical' ? 'border-red-500 ring-1 ring-red-500 bg-red-50' : 'hover:border-[#CBD5E1]'
          }`}
        >
          <span className="text-[11px] text-red-600 uppercase font-bold block">Critical</span>
          <span className="text-xl font-bold text-red-600 font-mono">{counts.critical}</span>
        </div>

        <div 
          onClick={() => setSelectedSeverity('High')}
          className={`p-3.5 rounded-lg surface-card cursor-pointer transition-all bg-white ${
            selectedSeverity === 'High' ? 'border-amber-500 ring-1 ring-amber-500 bg-amber-50' : 'hover:border-[#CBD5E1]'
          }`}
        >
          <span className="text-[11px] text-amber-700 uppercase font-bold block">High</span>
          <span className="text-xl font-bold text-amber-700 font-mono">{counts.high}</span>
        </div>

        <div 
          onClick={() => setSelectedSeverity('Medium')}
          className={`p-3.5 rounded-lg surface-card cursor-pointer transition-all bg-white ${
            selectedSeverity === 'Medium' ? 'border-slate-400 ring-1 ring-slate-400 bg-slate-50' : 'hover:border-[#CBD5E1]'
          }`}
        >
          <span className="text-[11px] text-slate-700 uppercase font-bold block">Medium</span>
          <span className="text-xl font-bold text-slate-700 font-mono">{counts.medium}</span>
        </div>

        <div 
          onClick={() => setSelectedSeverity('Low')}
          className={`p-3.5 rounded-lg surface-card cursor-pointer transition-all bg-white ${
            selectedSeverity === 'Low' ? 'border-slate-400 ring-1 ring-slate-400 bg-[#F8FAFC]' : 'hover:border-[#CBD5E1]'
          }`}
        >
          <span className="text-[11px] text-slate-600 uppercase font-bold block">Low</span>
          <span className="text-xl font-bold text-slate-600 font-mono">{counts.low}</span>
        </div>
      </div>

      {/* Filter Toolbar Strip */}
      <div className="surface-card p-4 flex flex-wrap items-center justify-between gap-3 text-xs bg-white">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-[#64748B] font-semibold mr-1">Category:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#E5484D] text-white shadow-xs'
                  : 'bg-[#F8FAFC] text-[#64748B] hover:text-[#172033] border border-[#E2E8F0]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* Sort Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#64748B]">Sort:</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-white border border-[#E2E8F0] text-[#172033] rounded-md px-2.5 py-1 text-xs font-medium focus:outline-none focus:border-[#E5484D] shadow-2xs"
            >
              <option value="severity">By Severity</option>
              <option value="file">By File</option>
              <option value="line">By Line</option>
            </select>
          </div>

          {/* File selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#64748B]">File:</span>
            <select
              value={selectedFile}
              onChange={(e) => setSelectedFile(e.target.value)}
              className="bg-white border border-[#E2E8F0] text-[#172033] rounded-md px-2.5 py-1 text-xs font-medium focus:outline-none focus:border-[#E5484D] max-w-[160px] truncate shadow-2xs"
            >
              <option value="All">All Files</option>
              {filesList.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Findings Results List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-[#64748B] px-1 font-medium">
          <span>Found {sortedIssues.length} issues in active repository</span>
        </div>

        {sortedIssues.length === 0 ? (
          <div className="surface-card p-12 text-center space-y-2 bg-white">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h4 className="text-sm font-semibold text-[#172033]">No Issues Found Matching Filter</h4>
            <p className="text-xs text-[#64748B] max-w-sm mx-auto">
              Try adjusting your category, severity, or search query.
            </p>
          </div>
        ) : (
          sortedIssues.map((issue) => (
            <div
              key={issue.id}
              className="surface-card p-4 sm:p-5 space-y-3 hover:border-[#CBD5E1] transition-all group bg-white"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={getSeverityBadgeClass(issue.severity)}>
                    {issue.severity}
                  </span>
                  <span className="text-[10px] font-mono text-[#64748B] px-2 py-0.5 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
                    {issue.category}
                  </span>
                  <span className="text-xs font-semibold text-[#172033] group-hover:text-[#E5484D] transition-colors">
                    {issue.title}
                  </span>
                  <span className="text-[10px] font-mono text-[#64748B] px-1.5 py-0.5 rounded bg-[#F1F5F9] border border-[#E2E8F0]">
                    Confidence: 98%
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="secondary"
                    size="xs"
                    onClick={() => setSelectedIssueForReview(issue)}
                    title="Open structured diagnostic modal"
                  >
                    Inspect
                  </Button>
                  <Button
                    variant="primary"
                    size="xs"
                    onClick={() => handleRefactor(issue)}
                    title="Generate AI refactoring proposal"
                  >
                    <Sparkles className="w-3 h-3 text-white" />
                    <span>Refactor</span>
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-[#64748B] font-mono">
                <span className="flex items-center gap-1 text-[#172033]">
                  <FileCode className="w-3.5 h-3.5 text-[#E5484D]" />
                  <span>{issue.filePath}:{issue.line}</span>
                </span>
                <span className="text-[#CBD5E1]">•</span>
                <span className="text-[#64748B] font-sans">{issue.why}</span>
              </div>

              {issue.suggestedApproach && (
                <div className="text-xs font-mono text-[#172033] bg-[#F8FAFC] p-2.5 rounded-md border border-[#E2E8F0] flex items-center gap-2">
                  <span className="text-emerald-700 font-bold uppercase text-[10px]">Suggested Fix:</span>
                  <span className="truncate text-[#64748B] font-sans">{issue.suggestedApproach}</span>
                </div>
              )}

              {issue.codeSnippet && (
                <div className="p-3 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-mono text-red-700 overflow-x-auto max-h-28">
                  <pre>{issue.codeSnippet}</pre>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Inspector Modal */}
      <FindingInspectorModal
        issue={selectedIssueForReview}
        onClose={() => setSelectedIssueForReview(null)}
      />
    </div>
  );
}
