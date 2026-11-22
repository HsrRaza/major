'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  Check, 
  X, 
  Download, 
  Columns, 
  AlignLeft, 
  FileCode, 
  AlertTriangle, 
  RefreshCw, 
  TrendingDown, 
  Search, 
  GitPullRequest 
} from 'lucide-react';
import { useRepoStore } from '@/stores/repoStore';
import { useRefactorStore } from '@/stores/refactorStore';
import { useHistoryStore } from '@/stores/historyStore';
import { Button } from '@/components/ui/Button';
import { downloadPatchFile } from '@/lib/api';
import { RefactorAuditLog } from '@/types/refactor';
import { PRGeneratorModal } from './PRGeneratorModal';

// Dynamic import of Monaco DiffEditor for Next.js SSR safety
const DiffEditor = dynamic(
  () => import('@monaco-editor/react').then((mod) => mod.DiffEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-[#F8FAFC] text-xs font-mono text-[#64748B]">
        <RefreshCw className="w-4 h-4 animate-spin mr-2 text-[#E5484D]" />
        Loading Monaco Diff Editor...
      </div>
    ),
  }
);

export function RefactoringStudio() {
  const router = useRouter();
  const { 
    getActiveRepo, 
    activeRepoId, 
    selectedFilePath, 
    setSelectedFilePath, 
    updateActiveRepoFile,
    analysisResult 
  } = useRepoStore();

  const { proposal, isGenerating, generateProposal, selectedIssue, clearProposal } = useRefactorStore();
  const { addLog } = useHistoryStore();

  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');
  const [customPrompt, setCustomPrompt] = useState('');
  const [fileSearchTerm, setFileSearchTerm] = useState('');
  const [isPRModalOpen, setIsPRModalOpen] = useState(false);

  const activeRepo = getActiveRepo();
  const repoFiles = activeRepo?.files || {};
  const currentFile = selectedFilePath || Object.keys(repoFiles)[0] || '';
  const originalCode = repoFiles[currentFile] || '';

  const refactoredCode = proposal?.refactoredCode || originalCode;
  const metricsDelta = proposal?.metricsDelta;

  const promptPresets = [
    'Eliminate deeply nested conditionals using guard clauses',
    'Extract validator and helper routines into modular functions',
    'Remove unsafe eval and replace with safe math token parser',
    'Batch sequential loop queries with Promise.all to fix N+1',
    'Decouple circular dependencies and add strict type assertions',
  ];

  const handleTriggerRefactor = (promptToUse?: string) => {
    generateProposal({
      filePath: currentFile,
      originalCode,
      issue: selectedIssue,
      customPrompt: promptToUse || customPrompt,
    });
  };

  const handleAcceptRefactor = () => {
    if (!proposal || !proposal.refactoredCode) return;

    // Update active repository state
    updateActiveRepoFile(currentFile, proposal.refactoredCode);

    // Save to audit history
    const log: RefactorAuditLog = {
      id: `RF-${Date.now().toString().slice(-4)}`,
      file: currentFile,
      problem: proposal.summary || 'Applied clean architecture refactoring',
      originalCode,
      refactoredCode: proposal.refactoredCode,
      complexityBefore: metricsDelta?.complexityBefore || 1,
      complexityAfter: metricsDelta?.complexityAfter || 1,
      linesBefore: metricsDelta?.linesBefore || originalCode.split('\n').length,
      linesAfter: metricsDelta?.linesAfter || proposal.refactoredCode.split('\n').length,
      status: 'Applied',
      model: 'Groq Llama-3.3-70b',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    addLog(log);

    // Redirect to test runner to automatically verify regressions
    router.push(`/tests/${activeRepoId}`);
  };

  const handleRejectRefactor = () => {
    clearProposal();
  };

  const handleDownloadPatch = async () => {
    if (!proposal || !proposal.refactoredCode) return;
    try {
      await downloadPatchFile({
        filePath: currentFile,
        originalCode,
        refactoredCode: proposal.refactoredCode,
      });
    } catch (err) {
      console.error('Patch download error:', err);
    }
  };

  const fileIssues = (analysisResult?.issues || []).filter((i) => i.filePath === currentFile);

  const filteredFileList = Object.keys(repoFiles).filter((path) =>
    path.toLowerCase().includes(fileSearchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Top Header & Actions Strip */}
      <div className="surface-card p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-200 text-[#E5484D] flex items-center justify-center shadow-2xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-[#172033] flex items-center gap-2">
              AI Refactoring Studio & Monaco Diff Engine
            </h1>
            <p className="text-xs text-[#64748B] font-sans mt-0.5">
              Targeted AST transformation with Groq Llama-3.3-70b, regression verification, and RFC Git patch export.
            </p>
          </div>
        </div>

        {/* View mode toggle & accept/reject actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View mode switch */}
          <div className="flex items-center rounded-md bg-[#F1F5F9] border border-[#E2E8F0] p-0.5 text-xs">
            <button
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors cursor-pointer font-medium ${
                viewMode === 'split' ? 'bg-white text-[#E5484D] shadow-2xs font-semibold' : 'text-[#64748B] hover:text-[#172033]'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Split</span>
            </button>
            <button
              onClick={() => setViewMode('unified')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors cursor-pointer font-medium ${
                viewMode === 'unified' ? 'bg-white text-[#E5484D] shadow-2xs font-semibold' : 'text-[#64748B] hover:text-[#172033]'
              }`}
            >
              <AlignLeft className="w-3.5 h-3.5" />
              <span>Unified</span>
            </button>
          </div>

          {proposal && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRejectRefactor}
                className="text-xs text-[#64748B] hover:text-[#172033]"
                title="Discard this AI proposal"
              >
                <X className="w-3.5 h-3.5" />
                <span>Discard</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPatch}
                className="text-xs"
                title="Download standard unified .patch file"
              >
                <Download className="w-3.5 h-3.5 text-[#172033]" />
                <span>Patch</span>
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsPRModalOpen(true)}
                className="text-xs text-[#E5484D] hover:text-[#D9363E]"
                title="Create GitHub Pull Request"
              >
                <GitPullRequest className="w-3.5 h-3.5 text-[#E5484D]" />
                <span>Create PR</span>
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={handleAcceptRefactor}
                className="text-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Accept & Verify</span>
              </Button>
            </>
          )}

          <Button
            variant="ai"
            size="sm"
            onClick={() => handleTriggerRefactor()}
            isLoading={isGenerating}
            className="text-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#E5484D]" />
            <span>{isGenerating ? 'Generating...' : 'Refactor File'}</span>
          </Button>
        </div>
      </div>

      {/* 3-Panel Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* PANEL 1: Left File Tree & Analysis Findings */}
        <div className="lg:col-span-3 space-y-3">
          <div className="surface-card p-3.5 space-y-2.5 bg-white">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2 text-xs text-[#64748B]">
              <span className="font-bold text-[#172033] uppercase text-[10px] tracking-wider font-mono">Files in Workspace</span>
              <span className="font-mono">{filteredFileList.length} files</span>
            </div>

            {/* File search box */}
            <div className="relative">
              <Search className="w-3 h-3 text-[#94A3B8] absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search files..."
                value={fileSearchTerm}
                onChange={(e) => setFileSearchTerm(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-md pl-7 pr-2.5 py-1.5 text-xs text-[#172033] font-mono placeholder-[#94A3B8] focus:outline-none focus:border-[#E5484D]"
              />
            </div>

            <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
              {filteredFileList.map((path) => {
                const isSelected = path === currentFile;
                const pathIssues = (analysisResult?.issues || []).filter((i) => i.filePath === path);

                return (
                  <button
                    key={path}
                    onClick={() => setSelectedFilePath(path)}
                    className={`w-full flex items-center justify-between p-2 rounded-md text-left text-xs font-mono transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#FFF1F2] text-[#E5484D] border-l-2 border-[#E5484D] font-bold shadow-2xs'
                        : 'text-[#64748B] hover:text-[#172033] hover:bg-[#F8FAFC] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileCode className="w-3.5 h-3.5 shrink-0 text-[#64748B]" />
                      <span className="truncate">{path}</span>
                    </div>
                    {pathIssues.length > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-red-50 text-red-600 border border-red-200 shrink-0 font-mono">
                        {pathIssues.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active File Findings */}
          <div className="surface-card p-3.5 space-y-2.5 bg-white">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2 text-xs text-[#64748B]">
              <span className="font-bold text-[#172033] uppercase text-[10px] tracking-wider font-mono">Findings in Selected File</span>
              <span className="text-[#E5484D] font-bold font-mono">{fileIssues.length}</span>
            </div>

            {fileIssues.length === 0 ? (
              <p className="text-xs text-[#94A3B8] font-sans p-2">
                No detected AST violations in this file.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 text-xs">
                {fileIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="p-2.5 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-red-600 font-bold">{issue.severity}</span>
                      <span className="text-[#94A3B8]">L:{issue.line}</span>
                    </div>
                    <p className="text-[#172033] truncate text-xs font-medium">{issue.title}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* PANEL 2: Center Monaco Diff Editor */}
        <div className="lg:col-span-6 space-y-3">
          <div className="surface-card p-2 rounded-xl h-[580px] flex flex-col overflow-hidden bg-white border border-[#E2E8F0] shadow-sm">
            <div className="flex items-center justify-between px-3.5 py-2 border-b border-[#E2E8F0] text-xs font-mono text-[#64748B] shrink-0 bg-[#F8FAFC]">
              <span className="flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-[#E5484D]" />
                <span className="text-[#172033] font-bold">{currentFile}</span>
              </span>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="text-red-600 font-semibold">Original (Base)</span>
                <span>⇄</span>
                <span className="text-emerald-600 font-semibold">Refactored (AI)</span>
              </div>
            </div>

            <div className="flex-grow w-full h-full relative">
              <DiffEditor
                original={originalCode}
                modified={refactoredCode}
                language="javascript"
                theme="vs"
                options={{
                  renderSideBySide: viewMode === 'split',
                  readOnly: true,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 12,
                  fontFamily: "'JetBrains Mono', monospace",
                  smoothScrolling: true,
                  renderIndicators: true,
                  originalEditable: false,
                }}
              />
            </div>
          </div>
        </div>

        {/* PANEL 3: Right AI Explanation & Telemetry */}
        <div className="lg:col-span-3 space-y-3">
          {/* Before / After Metrics Delta */}
          {metricsDelta && (
            <div className="surface-card p-3.5 space-y-2.5 text-xs bg-white">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                <span className="font-bold text-[#172033] uppercase text-[10px] tracking-wider font-mono">Impact Metrics Delta</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1 text-[11px] font-mono">
                  <TrendingDown className="w-3 h-3" />
                  Improved
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center pt-1 font-mono">
                <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[10px] text-[#64748B] block">Cyclomatic</span>
                  <div className="flex items-center justify-center gap-1.5 font-bold pt-1">
                    <span className="text-red-600">{metricsDelta.complexityBefore}</span>
                    <span>→</span>
                    <span className="text-emerald-600">{metricsDelta.complexityAfter}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[10px] text-[#64748B] block">Total Lines</span>
                  <div className="flex items-center justify-center gap-1.5 font-bold pt-1">
                    <span className="text-[#64748B]">{metricsDelta.linesBefore}</span>
                    <span>→</span>
                    <span className="text-[#172033]">{metricsDelta.linesAfter}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI Explanation & Risks */}
          <div className="surface-card p-3.5 space-y-2.5 text-xs bg-white">
            <div className="flex items-center gap-2 border-b border-[#E2E8F0] pb-2 text-[#172033] font-bold text-[11px] uppercase font-mono">
              <Sparkles className="w-3.5 h-3.5 text-[#E5484D]" />
              <span>Architectural Explanation</span>
            </div>

            <p className="text-xs text-[#64748B] font-sans leading-relaxed">
              {proposal?.summary || 'Select a prompt preset below or customize instructions to transform this module.'}
            </p>

            {proposal?.riskAssessment && proposal.riskAssessment.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] text-amber-700 uppercase font-bold flex items-center gap-1 font-mono">
                  <AlertTriangle className="w-3 h-3" />
                  Regression Watchouts:
                </span>
                <ul className="space-y-1 font-sans text-xs text-[#64748B]">
                  {proposal.riskAssessment.map((risk, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-[#94A3B8]">•</span>
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Prompt Presets & Custom Input */}
          <div className="surface-card p-3.5 space-y-2.5 bg-white">
            <span className="text-[10px] font-mono text-[#64748B] uppercase font-bold block">
              Quick Prompt Presets
            </span>
            <div className="space-y-1.5 font-sans text-xs">
              {promptPresets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleTriggerRefactor(preset)}
                  className="w-full text-left p-2 rounded-md bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#475569] hover:text-[#172033] border border-[#E2E8F0] text-xs transition-colors truncate block cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>

            <div className="pt-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleTriggerRefactor();
                }}
                className="space-y-2"
              >
                <textarea
                  rows={2}
                  placeholder="Custom refactoring instructions..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-md p-2 text-xs text-[#172033] font-mono placeholder-[#94A3B8] focus:outline-none focus:border-[#E5484D]"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isGenerating}
                  className="w-full text-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Execute Custom Refactor</span>
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <PRGeneratorModal
        isOpen={isPRModalOpen}
        onClose={() => setIsPRModalOpen(false)}
        targetFile={currentFile}
        problemSummary={proposal?.summary}
        repoName={activeRepo?.name || 'repository'}
        complexityBefore={metricsDelta?.complexityBefore}
        complexityAfter={metricsDelta?.complexityAfter}
        linesBefore={metricsDelta?.linesBefore}
        linesAfter={metricsDelta?.linesAfter}
      />
    </div>
  );
}
