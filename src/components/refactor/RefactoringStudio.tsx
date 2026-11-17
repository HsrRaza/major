'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  Check, 
  X, 
  RotateCcw, 
  Download, 
  Columns, 
  AlignLeft, 
  FileCode, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Send,
  Layers,
  ArrowRight,
  TrendingDown,
  Info,
  Search,
  CheckCheck,
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
      <div className="flex items-center justify-center h-full bg-[#0D0D0D] text-xs font-mono text-[#858585]">
        <RefreshCw className="w-4 h-4 animate-spin mr-2 text-[#E53935]" />
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
      <div className="surface-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-[#141414] border border-[#E53935]/40 text-[#FF4D4D] flex items-center justify-center shadow-[0_0_10px_-2px_rgba(229,57,53,0.3)]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              AI Refactoring Studio & Monaco Diff Engine
            </h1>
            <p className="text-xs text-[#858585] font-sans mt-0.5">
              Targeted AST transformation with Groq Llama-3.3-70b, regression verification, and RFC Git patch export.
            </p>
          </div>
        </div>

        {/* View mode toggle & accept/reject actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View mode switch */}
          <div className="flex items-center rounded bg-[#0D0D0D] border border-[#2B2B2B] p-0.5 text-xs font-mono">
            <button
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors cursor-pointer ${
                viewMode === 'split' ? 'bg-[#1B1B1B] text-[#FF4D4D] border border-[#2B2B2B] font-bold' : 'text-[#858585] hover:text-white'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Split</span>
            </button>
            <button
              onClick={() => setViewMode('unified')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors cursor-pointer ${
                viewMode === 'unified' ? 'bg-[#1B1B1B] text-[#FF4D4D] border border-[#2B2B2B] font-bold' : 'text-[#858585] hover:text-white'
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
                className="font-mono text-xs text-[#858585] hover:text-white"
                title="Discard this AI proposal"
              >
                <X className="w-3.5 h-3.5" />
                <span>Discard</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPatch}
                className="font-mono text-xs"
                title="Download standard unified .patch file"
              >
                <Download className="w-3.5 h-3.5 text-white" />
                <span>Patch</span>
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsPRModalOpen(true)}
                className="font-mono text-xs text-[#FF4D4D] hover:text-white"
                title="Create GitHub Pull Request"
              >
                <GitPullRequest className="w-3.5 h-3.5 text-[#FF4D4D]" />
                <span>Create PR</span>
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={handleAcceptRefactor}
                className="font-mono text-xs"
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
            className="font-mono text-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#FF4D4D]" />
            <span>{isGenerating ? 'Generating...' : 'Refactor File'}</span>
          </Button>
        </div>
      </div>

      {/* 3-Panel Main Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* PANEL 1: Left File Tree & Analysis Findings */}
        <div className="lg:col-span-3 space-y-3">
          <div className="surface-card p-3 space-y-2">
            <div className="flex items-center justify-between border-b border-[#202020] pb-2 text-xs font-mono text-[#858585]">
              <span className="font-bold text-white uppercase text-[10px]">Files in Workspace</span>
              <span>{filteredFileList.length} files</span>
            </div>

            {/* File search box */}
            <div className="relative">
              <Search className="w-3 h-3 text-[#5C5C5C] absolute left-2 top-2" />
              <input
                type="text"
                placeholder="Search files..."
                value={fileSearchTerm}
                onChange={(e) => setFileSearchTerm(e.target.value)}
                className="w-full bg-[#0D0D0D] border border-[#2B2B2B] rounded pl-7 pr-2 py-1 text-[11px] text-white font-mono placeholder-[#5C5C5C] focus:outline-none focus:border-[#E53935]"
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
                    className={`w-full flex items-center justify-between p-2 rounded text-left text-xs font-mono transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#1B1B1B] text-white border-l-2 border-[#E53935] font-bold shadow-sm'
                        : 'text-[#858585] hover:text-white hover:bg-[#141414] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileCode className="w-3.5 h-3.5 shrink-0 text-[#858585]" />
                      <span className="truncate">{path}</span>
                    </div>
                    {pathIssues.length > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-[#E53935]/15 text-[#FF4D4D] border border-[#E53935]/30 shrink-0">
                        {pathIssues.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active File Findings */}
          <div className="surface-card p-3 space-y-2">
            <div className="flex items-center justify-between border-b border-[#202020] pb-2 text-xs font-mono text-[#858585]">
              <span className="font-bold text-white uppercase text-[10px]">Findings in Selected File</span>
              <span className="text-[#FF4D4D] font-bold">{fileIssues.length}</span>
            </div>

            {fileIssues.length === 0 ? (
              <p className="text-xs text-[#5C5C5C] font-mono p-2">
                No detected AST violations in this file.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 font-mono text-[11px]">
                {fileIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="p-2 rounded bg-[#0D0D0D] border border-[#2B2B2B] space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[#FF4D4D] font-bold">{issue.severity}</span>
                      <span className="text-[#5C5C5C]">L:{issue.line}</span>
                    </div>
                    <p className="text-[#F5F5F5] truncate">{issue.title}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* PANEL 2: Center Monaco Diff Editor */}
        <div className="lg:col-span-6 space-y-3">
          <div className="surface-card p-2 rounded-xl h-[580px] flex flex-col overflow-hidden bg-[#0D0D0D] border border-[#2B2B2B]">
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#202020] text-xs font-mono text-[#858585] shrink-0 bg-[#090909]">
              <span className="flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-[#E53935]" />
                <span className="text-white font-bold">{currentFile}</span>
              </span>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="text-[#EF4444] font-semibold">Original (Base)</span>
                <span>⇄</span>
                <span className="text-[#22C55E] font-semibold">Refactored (AI)</span>
              </div>
            </div>

            <div className="flex-grow w-full h-full relative">
              <DiffEditor
                original={originalCode}
                modified={refactoredCode}
                language="javascript"
                theme="vs-dark"
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
            <div className="surface-card p-3 space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-[#202020] pb-1.5">
                <span className="font-bold text-white uppercase text-[10px]">Impact Metrics Delta</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                  <TrendingDown className="w-3 h-3" />
                  Improved
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center pt-1">
                <div className="p-2 rounded bg-[#0D0D0D] border border-[#2B2B2B]">
                  <span className="text-[10px] text-[#5C5C5C] block">Cyclomatic</span>
                  <div className="flex items-center justify-center gap-1.5 font-bold pt-0.5">
                    <span className="text-[#FF4D4D]">{metricsDelta.complexityBefore}</span>
                    <span>→</span>
                    <span className="text-emerald-400">{metricsDelta.complexityAfter}</span>
                  </div>
                </div>

                <div className="p-2 rounded bg-[#0D0D0D] border border-[#2B2B2B]">
                  <span className="text-[10px] text-[#5C5C5C] block">Total Lines</span>
                  <div className="flex items-center justify-center gap-1.5 font-bold pt-0.5">
                    <span className="text-[#858585]">{metricsDelta.linesBefore}</span>
                    <span>→</span>
                    <span className="text-white">{metricsDelta.linesAfter}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI Explanation & Risks */}
          <div className="surface-card p-3 space-y-3 font-mono text-xs">
            <div className="flex items-center gap-2 border-b border-[#202020] pb-2 text-white font-bold text-[11px] uppercase">
              <Sparkles className="w-3.5 h-3.5 text-[#E53935]" />
              <span>Architectural Explanation</span>
            </div>

            <p className="text-xs text-[#B3B3B3] font-sans leading-relaxed">
              {proposal?.summary || 'Select a prompt preset below or customize instructions to transform this module.'}
            </p>

            {proposal?.riskAssessment && proposal.riskAssessment.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] text-amber-400 uppercase font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Regression Watchouts:
                </span>
                <ul className="space-y-1 font-sans text-[11px] text-[#858585]">
                  {proposal.riskAssessment.map((risk, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-[#5C5C5C]">•</span>
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Prompt Presets & Custom Input */}
          <div className="surface-card p-3 space-y-2">
            <span className="text-[10px] font-mono text-[#858585] uppercase font-bold block">
              Quick Prompt Presets
            </span>
            <div className="space-y-1 font-sans text-xs">
              {promptPresets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleTriggerRefactor(preset)}
                  className="w-full text-left p-1.5 rounded bg-[#0D0D0D] hover:bg-[#1B1B1B] text-[#B3B3B3] hover:text-white border border-[#2B2B2B] text-[11px] transition-colors truncate block cursor-pointer"
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
                  className="w-full bg-[#0D0D0D] border border-[#2B2B2B] rounded p-2 text-xs text-white font-mono placeholder-[#5C5C5C] focus:outline-none focus:border-[#E53935]"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isGenerating}
                  className="w-full font-mono text-xs"
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

