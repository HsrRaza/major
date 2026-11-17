import React, { useState } from 'react';
import * as Diff from 'diff';
import { 
  Sparkles, 
  Check, 
  X, 
  Edit3, 
  FileCode, 
  Columns, 
  AlignLeft, 
  AlertOctagon, 
  CheckCircle2, 
  ArrowLeft,
  RotateCw,
  Zap,
  Lightbulb,
  Copy,
  Terminal,
  ChevronRight,
  TrendingDown,
  Download,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

export default function DiffViewer({ 
  refactorProposal, 
  issue,
  onApplyRefactor, 
  onRejectRefactor, 
  onRePrompt,
  isGenerating 
}) {
  const [viewMode, setViewMode] = useState('unified'); // 'unified' | 'split'
  const [promptText, setPromptText] = useState('');
  const [copied, setCopied] = useState(false);

  const presetPrompts = [
    'Eliminate deeply nested conditionals with guard clauses',
    'Extract helper validator functions into clean sub-routines',
    'Remove unsafe eval and replace with safe math parsing',
    'Batch async queries with Promise.all to avoid N+1',
    'Add comprehensive JSDoc type annotations and parameter guards'
  ];

  if (!refactorProposal) {
    return (
      <div className="card-linear p-12 text-center text-[#94A3B8] space-y-4 font-sans animate-fadeIn">
        <div className="w-14 h-14 rounded-2xl bg-[#6366F1]/15 text-[#818CF8] border border-[#6366F1]/30 flex items-center justify-center mx-auto shadow-lg shadow-[#6366F1]/20">
          <Sparkles className="w-7 h-7 text-[#818CF8] animate-pulse" />
        </div>
        <div className="text-base font-bold text-slate-100 font-mono">Refactoring Studio Ready</div>
        <p className="text-xs text-[#94A3B8] max-w-md mx-auto leading-relaxed font-sans">
          Select an issue or file from the <strong>Dashboard</strong>, <strong>Issue Explorer</strong>, or <strong>Architecture Graph</strong> and click <strong>"Refactor with AI"</strong> to generate a clean Git-style diff.
        </p>
      </div>
    );
  }

  if (refactorProposal.isAiAvailable === false || refactorProposal.error) {
    return (
      <div className="card-linear p-8 text-center text-[#94A3B8] space-y-4 font-sans animate-fadeIn bg-[#090D16] border-[#EF4444]/30">
        <div className="w-14 h-14 rounded-2xl bg-[#EF4444]/15 text-[#F87171] border border-[#EF4444]/30 flex items-center justify-center mx-auto shadow-lg shadow-[#EF4444]/20">
          <AlertTriangle className="w-7 h-7 text-[#F87171]" />
        </div>
        <div className="text-base font-bold text-white font-mono">AI Refactoring Engine Offline</div>
        <div className="max-w-md mx-auto p-3 rounded bg-[#111726] border border-[#1E293B] text-xs font-mono text-[#FCA5A5] text-left">
          {refactorProposal.error || 'Groq API Key is expired or unavailable.'}
        </div>
        <p className="text-xs text-[#94A3B8] max-w-md mx-auto leading-relaxed font-sans">
          To enable live LLM refactorings with Llama-3.3-70b, update your <code>GROQ_API_KEY</code> in the <code>.env</code> file.
        </p>
        <button
          onClick={onRejectRefactor}
          className="btn-secondary text-xs py-2 px-4 font-mono font-semibold"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const { 
    filePath, 
    originalCode = '', 
    refactoredCode = '', 
    metricsDelta, 
    summary,
    riskAssessment = [],
    patch = '' 
  } = refactorProposal;

  // Compute dynamic line-by-line diff using 'diff' package
  const diffParts = Diff.diffLines(originalCode, refactoredCode);

  // Compute unified diff lines
  const unifiedLines = [];
  let origLineNum = 1;
  let refactLineNum = 1;

  diffParts.forEach((part) => {
    const lines = part.value.replace(/\n$/, '').split('\n');
    lines.forEach((line) => {
      if (part.added) {
        unifiedLines.push({
          type: 'add',
          origNum: null,
          refactNum: refactLineNum++,
          content: line
        });
      } else if (part.removed) {
        unifiedLines.push({
          type: 'del',
          origNum: origLineNum++,
          refactNum: null,
          content: line
        });
      } else {
        unifiedLines.push({
          type: 'normal',
          origNum: origLineNum++,
          refactNum: refactLineNum++,
          content: line
        });
      }
    });
  });

  // Compute split diff rows
  const splitRows = [];
  let sOrigNum = 1;
  let sRefactNum = 1;

  for (let i = 0; i < diffParts.length; i++) {
    const part = diffParts[i];
    const nextPart = diffParts[i + 1];

    if (part.removed && nextPart && nextPart.added) {
      // Side-by-side replacement block
      const delLines = part.value.replace(/\n$/, '').split('\n');
      const addLines = nextPart.value.replace(/\n$/, '').split('\n');
      const maxLen = Math.max(delLines.length, addLines.length);

      for (let j = 0; j < maxLen; j++) {
        splitRows.push({
          left: delLines[j] !== undefined ? { num: sOrigNum++, content: delLines[j], type: 'del' } : null,
          right: addLines[j] !== undefined ? { num: sRefactNum++, content: addLines[j], type: 'add' } : null
        });
      }
      i++; // Skip nextPart
    } else if (part.removed) {
      const delLines = part.value.replace(/\n$/, '').split('\n');
      delLines.forEach(line => {
        splitRows.push({
          left: { num: sOrigNum++, content: line, type: 'del' },
          right: null
        });
      });
    } else if (part.added) {
      const addLines = part.value.replace(/\n$/, '').split('\n');
      addLines.forEach(line => {
        splitRows.push({
          left: null,
          right: { num: sRefactNum++, content: line, type: 'add' }
        });
      });
    } else {
      const normalLines = part.value.replace(/\n$/, '').split('\n');
      normalLines.forEach(line => {
        splitRows.push({
          left: { num: sOrigNum++, content: line, type: 'normal' },
          right: { num: sRefactNum++, content: line, type: 'normal' }
        });
      });
    }
  }

  // Handle Download Patch
  const handleDownloadPatch = () => {
    const patchContent = patch || Diff.createTwoFilesPatch(
      `a/${filePath}`,
      `b/${filePath}`,
      originalCode,
      refactoredCode,
      'original',
      'refactored'
    );
    const blob = new Blob([patchContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patchpilot-${filePath.replace(/[\/\\]/g, '-')}.patch`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle Copy Diff
  const handleCopyDiff = () => {
    navigator.clipboard.writeText(refactoredCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCustomPromptSubmit = (e) => {
    e.preventDefault();
    if (promptText.trim()) {
      onRePrompt(promptText.trim());
      setPromptText('');
    }
  };

  const complexityDelta = (metricsDelta?.complexityBefore || 1) - (metricsDelta?.complexityAfter || 1);
  const complexityPercent = Math.round((complexityDelta / Math.max(1, metricsDelta?.complexityBefore || 1)) * 100);
  const linesDelta = (metricsDelta?.linesBefore || 0) - (metricsDelta?.linesAfter || 0);

  return (
    <div className="space-y-4 font-sans text-slate-100 animate-fadeIn">
      {/* Top Header Bar */}
      <div className="card-linear p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#090D16]">
        <div className="flex items-center gap-3 truncate">
          <div className="p-2 rounded-lg bg-[#6366F1]/15 text-[#818CF8] border border-[#6366F1]/30 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="truncate">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm font-mono truncate">{filePath}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#10B981]/15 text-[#34D399] border border-[#10B981]/30">
                Ready to Apply
              </span>
            </div>
            <p className="text-xs text-[#94A3B8] font-sans mt-0.5 truncate">
              {summary || 'AI-assisted architectural refactoring'}
            </p>
          </div>
        </div>

        {/* View Mode Toggle & Primary Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Split / Unified View Toggle */}
          <div className="flex items-center rounded-[6px] bg-[#111726] border border-[#1E293B] p-0.5">
            <button
              onClick={() => setViewMode('unified')}
              className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-[4px] flex items-center gap-1.5 transition-all ${
                viewMode === 'unified' 
                  ? 'bg-[#6366F1] text-white shadow-sm' 
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <AlignLeft className="w-3.5 h-3.5" />
              <span>Unified</span>
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-[4px] flex items-center gap-1.5 transition-all ${
                viewMode === 'split' 
                  ? 'bg-[#6366F1] text-white shadow-sm' 
                  : 'text-[#94A3B8] hover:text-white'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Split</span>
            </button>
          </div>

          <button
            onClick={handleDownloadPatch}
            className="btn-secondary text-xs py-1.5 px-3 font-mono"
            title="Download Git .patch file"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download .patch</span>
          </button>

          <button
            onClick={handleCopyDiff}
            className="btn-secondary text-xs py-1.5 px-3 font-mono"
            title="Copy full refactored code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#34D399]" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy Code'}</span>
          </button>

          <button
            onClick={onRejectRefactor}
            className="btn-danger text-xs py-1.5 px-3 font-mono font-semibold"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reject</span>
          </button>

          <button
            onClick={onApplyRefactor}
            className="btn-success text-xs py-1.5 px-4 font-mono font-bold"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply to Codebase</span>
          </button>
        </div>
      </div>

      {/* Metrics Delta Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card-linear p-3 bg-[#090D16] space-y-1">
          <span className="text-[10px] text-[#94A3B8] font-mono block">Cyclomatic Complexity</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#F87171] line-through font-mono">{metricsDelta?.complexityBefore || 1}</span>
            <span className="text-xs text-[#64748B]">→</span>
            <span className="text-sm font-bold text-[#34D399] font-mono">{metricsDelta?.complexityAfter || 1}</span>
            {complexityDelta > 0 && (
              <span className="text-[10px] text-[#34D399] bg-[#10B981]/15 px-1.5 py-0.2 rounded font-mono font-bold">
                -{complexityPercent}%
              </span>
            )}
          </div>
        </div>

        <div className="card-linear p-3 bg-[#090D16] space-y-1">
          <span className="text-[10px] text-[#94A3B8] font-mono block">Lines of Code (LOC)</span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">{metricsDelta?.linesBefore || 0}</span>
            <span className="text-xs text-[#64748B]">→</span>
            <span className="text-sm font-bold text-white font-mono">{metricsDelta?.linesAfter || 0}</span>
            {linesDelta > 0 && (
              <span className="text-[10px] text-[#818CF8] bg-[#6366F1]/15 px-1.5 py-0.2 rounded font-mono font-bold">
                -{linesDelta} lines
              </span>
            )}
          </div>
        </div>

        <div className="card-linear p-3 bg-[#090D16] space-y-1">
          <span className="text-[10px] text-[#94A3B8] font-mono block">Safety Guard & Testing</span>
          <div className="flex items-center gap-1.5 text-xs font-mono text-[#34D399] font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#34D399]" />
            <span>Ready for Sandbox</span>
          </div>
        </div>

        <div className="card-linear p-3 bg-[#090D16] space-y-1">
          <span className="text-[10px] text-[#94A3B8] font-mono block">AI Engine Used</span>
          <div className="flex items-center gap-1.5 text-xs font-mono text-[#818CF8] font-semibold">
            <Zap className="w-3.5 h-3.5 text-[#818CF8]" />
            <span>Groq Llama-3.3-70b</span>
          </div>
        </div>
      </div>

      {/* Risk Assessment Watchouts (If Any) */}
      {riskAssessment.length > 0 && (
        <div className="card-linear p-3 bg-[#111726] border-[#F59E0B]/30 flex items-start gap-2.5 text-xs font-mono text-[#FBBF24]">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#FBBF24]" />
          <div>
            <span className="font-bold block">Refactoring Watchpoints & Regression Risks:</span>
            <ul className="list-disc list-inside text-[11px] text-slate-300 font-sans mt-0.5 space-y-0.5">
              {riskAssessment.map((risk, idx) => (
                <li key={idx}>{risk}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* High-Density Diff Viewport */}
      <div className="card-linear bg-[#090D16] overflow-hidden border-[#1E293B]">
        {/* Diff Container Toolbar */}
        <div className="px-4 py-2 border-b border-[#1E293B] bg-[#0D121F] flex items-center justify-between text-xs font-mono text-[#94A3B8]">
          <span className="flex items-center gap-2">
            <FileCode className="w-3.5 h-3.5 text-[#818CF8]" />
            <span>{filePath}</span>
          </span>
          <span className="text-[10px] text-[#64748B]">
            {viewMode === 'unified' ? 'Unified Git Patch' : 'Split Side-by-Side'}
          </span>
        </div>

        {/* UNIFIED DIFF VIEW */}
        {viewMode === 'unified' && (
          <div className="diff-container max-h-[520px] overflow-y-auto">
            {unifiedLines.map((line, idx) => (
              <div 
                key={idx} 
                className={`diff-row ${
                  line.type === 'add' ? 'diff-add' :
                  line.type === 'del' ? 'diff-del' : ''
                }`}
              >
                <div className="diff-line-num">{line.origNum || ''}</div>
                <div className="diff-line-num">{line.refactNum || ''}</div>
                <div className="diff-content font-mono">
                  {line.type === 'add' ? '+ ' : line.type === 'del' ? '- ' : '  '}
                  {line.content}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SPLIT DIFF VIEW */}
        {viewMode === 'split' && (
          <div className="split-diff-grid max-h-[520px] overflow-y-auto font-mono text-xs">
            <div className="split-diff-pane border-r border-[#1E293B]">
              <div className="p-2 border-b border-[#1E293B] bg-[#0D121F] text-[10px] font-bold text-slate-400 uppercase">
                Original Version
              </div>
              {splitRows.map((row, idx) => (
                <div 
                  key={idx} 
                  className={`diff-row ${row.left?.type === 'del' ? 'diff-del' : ''}`}
                >
                  <div className="diff-line-num">{row.left?.num || ''}</div>
                  <div className="diff-content font-mono">
                    {row.left ? (row.left.type === 'del' ? '- ' : '  ') + row.left.content : ''}
                  </div>
                </div>
              ))}
            </div>

            <div className="split-diff-pane">
              <div className="p-2 border-b border-[#1E293B] bg-[#0D121F] text-[10px] font-bold text-[#34D399] uppercase">
                AI Refactored Version
              </div>
              {splitRows.map((row, idx) => (
                <div 
                  key={idx} 
                  className={`diff-row ${row.right?.type === 'add' ? 'diff-add' : ''}`}
                >
                  <div className="diff-line-num">{row.right?.num || ''}</div>
                  <div className="diff-content font-mono">
                    {row.right ? (row.right.type === 'add' ? '+ ' : '  ') + row.right.content : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Custom Refactoring Instructions & Re-Prompt Studio */}
      <div className="card-linear p-4 space-y-3 bg-[#090D16]">
        <div className="flex items-center gap-2">
          <Edit3 className="w-4 h-4 text-[#818CF8]" />
          <h4 className="text-xs font-bold text-white font-mono">Refine or Re-Prompt AI Refactoring</h4>
        </div>

        {/* Quick Preset Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-[#64748B] font-mono mr-1">Presets:</span>
          {presetPrompts.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => onRePrompt(preset)}
              disabled={isGenerating}
              className="text-[10px] font-mono px-2.5 py-1 rounded bg-[#111726] border border-[#1E293B] text-slate-300 hover:text-white hover:border-[#6366F1]/50 transition-all text-left"
            >
              {preset}
            </button>
          ))}
        </div>

        {/* Custom Input Prompt */}
        <form onSubmit={handleCustomPromptSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="Type custom instructions (e.g. 'Extract stock verification into separate repo method')..."
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            disabled={isGenerating}
            className="flex-grow bg-[#111726] border border-[#1E293B] rounded-[6px] px-3.5 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-[#6366F1]"
          />
          <button
            type="submit"
            disabled={isGenerating || !promptText.trim()}
            className="btn-primary text-xs py-2 px-4 font-mono font-bold"
          >
            {isGenerating ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>{isGenerating ? 'Refactoring...' : 'Refactor Again'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
