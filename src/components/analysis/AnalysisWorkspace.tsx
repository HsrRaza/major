'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Bug, 
  Search, 
  Sparkles, 
  ShieldAlert, 
  Zap, 
  Layers, 
  Copy, 
  FileCode, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle,
  RotateCcw,
  SlidersHorizontal,
  Flame,
  Check
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
    <div className="space-y-4 animate-fadeIn">
      {/* Top Header & Search Bar */}
      <div className="surface-card p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-[#141414] border border-[#E53935]/40 text-[#FF4D4D] flex items-center justify-center shadow-[0_0_10px_-2px_rgba(229,57,53,0.3)]">
            <Bug className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white font-mono flex items-center gap-2">
              Code Analysis & Smells Inspector
            </h1>
            <p className="text-xs text-[#858585] font-sans mt-0.5">
              Deterministic AST violations with line/column evidence, severity rankings, and AI-assisted refactoring.
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-[#858585] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search rules, files, keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0D0D0D] border border-[#2B2B2B] rounded pl-9 pr-3.5 py-1.5 text-xs text-[#F5F5F5] font-mono focus:outline-none focus:border-[#E53935]"
          />
        </div>
      </div>

      {/* Severity Overview Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-xs">
        <div 
          onClick={() => setSelectedSeverity('All')}
          className={`p-3 rounded surface-card cursor-pointer transition-all ${
            selectedSeverity === 'All' ? 'border-[#E53935] bg-[#1B1B1B]' : 'hover:border-[#383838]'
          }`}
        >
          <span className="text-[10px] text-[#858585] uppercase block">Total Issues</span>
          <span className="text-xl font-black text-white">{counts.totalIssues}</span>
        </div>

        <div 
          onClick={() => setSelectedSeverity('Critical')}
          className={`p-3 rounded surface-card cursor-pointer transition-all ${
            selectedSeverity === 'Critical' ? 'border-[#E53935] bg-[#1B1B1B]' : 'hover:border-[#383838]'
          }`}
        >
          <span className="text-[10px] text-[#FF4D4D] uppercase font-bold block">Critical</span>
          <span className="text-xl font-black text-[#FF4D4D]">{counts.critical}</span>
        </div>

        <div 
          onClick={() => setSelectedSeverity('High')}
          className={`p-3 rounded surface-card cursor-pointer transition-all ${
            selectedSeverity === 'High' ? 'border-[#E53935] bg-[#1B1B1B]' : 'hover:border-[#383838]'
          }`}
        >
          <span className="text-[10px] text-amber-400 uppercase font-bold block">High</span>
          <span className="text-xl font-black text-amber-400">{counts.high}</span>
        </div>

        <div 
          onClick={() => setSelectedSeverity('Medium')}
          className={`p-3 rounded surface-card cursor-pointer transition-all ${
            selectedSeverity === 'Medium' ? 'border-[#E53935] bg-[#1B1B1B]' : 'hover:border-[#383838]'
          }`}
        >
          <span className="text-[10px] text-[#B3B3B3] uppercase font-bold block">Medium</span>
          <span className="text-xl font-black text-[#D4D4D4]">{counts.medium}</span>
        </div>

        <div 
          onClick={() => setSelectedSeverity('Low')}
          className={`p-3 rounded surface-card cursor-pointer transition-all ${
            selectedSeverity === 'Low' ? 'border-[#E53935] bg-[#1B1B1B]' : 'hover:border-[#383838]'
          }`}
        >
          <span className="text-[10px] text-[#5C5C5C] uppercase font-bold block">Low</span>
          <span className="text-xl font-black text-[#858585]">{counts.low}</span>
        </div>
      </div>

      {/* Filter Toolbar Strip */}
      <div className="surface-card p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-[#5C5C5C] uppercase font-bold mr-1">Category:</span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded text-xs transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#E53935] text-white font-bold shadow-sm shadow-[#E53935]/30'
                  : 'bg-[#0D0D0D] text-[#858585] hover:text-white border border-[#2B2B2B]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* Sort Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-[#5C5C5C] uppercase font-bold">Sort:</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-[#0D0D0D] border border-[#2B2B2B] text-[#F5F5F5] rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-[#E53935]"
            >
              <option value="severity">By Severity</option>
              <option value="file">By File</option>
              <option value="line">By Line</option>
            </select>
          </div>

          {/* File selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-[#5C5C5C] uppercase font-bold">File:</span>
            <select
              value={selectedFile}
              onChange={(e) => setSelectedFile(e.target.value)}
              className="bg-[#0D0D0D] border border-[#2B2B2B] text-[#F5F5F5] rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-[#E53935] max-w-[160px] truncate"
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
        <div className="flex items-center justify-between text-xs font-mono text-[#858585] px-1">
          <span>Found {sortedIssues.length} issues in active repository</span>
        </div>

        {sortedIssues.length === 0 ? (
          <div className="surface-card p-12 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <h4 className="text-sm font-mono font-bold text-white">No Issues Found Matching Filter</h4>
            <p className="text-xs text-[#858585] max-w-sm mx-auto">
              Try adjusting your category, severity, or search query.
            </p>
          </div>
        ) : (
          sortedIssues.map((issue) => (
            <div
              key={issue.id}
              className="surface-card p-4 space-y-2.5 hover:border-[#E53935]/50 transition-all group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={getSeverityBadgeClass(issue.severity)}>
                    {issue.severity}
                  </span>
                  <span className="text-[10px] font-mono text-[#858585] px-2 py-0.5 rounded bg-[#0D0D0D] border border-[#2B2B2B]">
                    {issue.category}
                  </span>
                  <span className="text-xs font-mono font-bold text-white group-hover:text-[#FF4D4D] transition-colors">
                    {issue.title}
                  </span>
                  <span className="text-[10px] font-mono text-[#5C5C5C] px-1.5 py-0.5 rounded bg-[#1B1B1B]">
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

              <div className="flex items-center gap-2 text-[11px] font-mono text-[#858585]">
                <span className="flex items-center gap-1 text-[#F5F5F5]">
                  <FileCode className="w-3 h-3 text-[#E53935]" />
                  <span>{issue.filePath}:{issue.line}</span>
                </span>
                <span className="text-[#5C5C5C]">•</span>
                <span className="text-[#B3B3B3] font-sans">{issue.why}</span>
              </div>

              {issue.suggestedApproach && (
                <div className="text-[11px] font-mono text-[#858585] bg-[#0D0D0D] p-2 rounded border border-[#202020] flex items-center gap-2">
                  <span className="text-emerald-400 font-bold uppercase text-[10px]">Suggested Fix:</span>
                  <span className="truncate text-[#B3B3B3]">{issue.suggestedApproach}</span>
                </div>
              )}

              {issue.codeSnippet && (
                <div className="p-2.5 rounded bg-[#090909] border border-[#2B2B2B] text-[11px] font-mono text-[#FF4D4D] overflow-x-auto max-h-24">
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

