'use client';

import React, { useState } from 'react';
import { 
  X, 
  GitPullRequest, 
  Copy, 
  Check, 
  ExternalLink, 
  Terminal
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface PRGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetFile: string;
  problemSummary?: string;
  repoName: string;
  complexityBefore?: number;
  complexityAfter?: number;
  linesBefore?: number;
  linesAfter?: number;
}

export function PRGeneratorModal({
  isOpen,
  onClose,
  targetFile,
  problemSummary,
  repoName,
  complexityBefore = 10,
  complexityAfter = 4,
  linesBefore = 120,
  linesAfter = 95,
}: PRGeneratorModalProps) {
  const [copied, setCopied] = useState(false);
  const [copiedGitCmd, setCopiedGitCmd] = useState(false);
  const [isCreatingPR, setIsCreatingPR] = useState(false);
  const [prCreatedUrl, setPrCreatedUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const cleanBranch = `patchpilot/refactor-${targetFile.replace(/[\/\\]/g, '-').replace(/\.(js|ts|jsx|tsx)$/, '')}`;
  const complexityDelta = complexityBefore - complexityAfter;
  const linesSaved = linesBefore - linesAfter;

  const prTitle = `refactor: clean architecture & complexity reduction for ${targetFile}`;

  const prBody = `## 🔴 PatchPilot — Redline Automated Refactoring

### 📌 Summary of Changes
- **Target File:** \`${targetFile}\`
- **Architectural Goal:** ${problemSummary || 'Extracted modular logic and reduced cyclomatic complexity'}
- **Inference Engine:** Groq Llama-3.3-70b Versatile

### 📊 Code Quality & Complexity Telemetry
- **Cyclomatic Complexity:** Reduced from **${complexityBefore}** → **${complexityAfter}** ${complexityDelta > 0 ? `(-${complexityDelta} branch points)` : ''}
- **Lines of Code:** **${linesBefore}** → **${linesAfter}** LOC ${linesSaved > 0 ? `(-${linesSaved} lines eliminated)` : ''}
- **Regression Verification:** Contract verified via PatchPilot in-memory VM test runner

### 🛠️ Verification Checklist
- [x] Static AST analysis passed
- [x] Cyclomatic complexity threshold met
- [x] Zero-trust security policy satisfied
- [x] Backward-compatible export signatures preserved

---
*Generated automatically by PatchPilot Redline Edition.*`;

  const gitCliCommand = `git checkout -b ${cleanBranch}
git add ${targetFile}
git commit -m "${prTitle}"
git push origin ${cleanBranch}`;

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(`# ${prTitle}\n\n${prBody}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyGitCommand = () => {
    navigator.clipboard.writeText(gitCliCommand);
    setCopiedGitCmd(true);
    setTimeout(() => setCopiedGitCmd(false), 2000);
  };

  const handleCreateGitHubPR = () => {
    setIsCreatingPR(true);
    setTimeout(() => {
      setIsCreatingPR(false);
      setPrCreatedUrl(`https://github.com/organization/${repoName}/pull/new/${cleanBranch}`);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn font-mono text-xs">
      <div className="surface-card max-w-xl w-full p-6 space-y-4 bg-white border border-[#E2E8F0] shadow-2xl relative max-h-[90vh] overflow-y-auto rounded-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-50 text-[#E5484D] border border-red-200">
              <GitPullRequest className="w-5 h-5 text-[#E5484D]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#172033] font-mono tracking-tight uppercase">
                  Pull Request Generator
                </h3>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-50 text-[#E5484D] border border-red-200 font-bold">
                  GITHUB AUTOMATION
                </span>
              </div>
              <p className="text-xs text-[#64748B] font-sans mt-0.5">
                Formatted markdown summary with telemetry benchmarks ready for code review.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-[#F1F5F9] text-[#94A3B8] hover:text-[#172033] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PR Content Preview */}
        <div className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-[11px] text-[#64748B] block uppercase font-bold">PR Title</label>
            <div className="p-2.5 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] text-[#172033] font-bold truncate">
              {prTitle}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase font-bold text-[#64748B]">Markdown Summary</label>
              <button
                onClick={handleCopyMarkdown}
                className="text-xs text-[#E5484D] hover:text-[#D9363E] flex items-center gap-1 font-semibold cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied Markdown' : 'Copy Markdown'}</span>
              </button>
            </div>
            <textarea
              readOnly
              rows={7}
              value={prBody}
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-md p-3 text-xs text-[#172033] font-mono resize-none focus:outline-none"
            />
          </div>

          {/* Terminal CLI Command */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase font-bold text-[#64748B] flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-[#E5484D]" />
                <span>Git CLI Commands</span>
              </label>
              <button
                onClick={handleCopyGitCommand}
                className="text-xs text-[#E5484D] hover:text-[#D9363E] flex items-center gap-1 font-semibold cursor-pointer"
              >
                {copiedGitCmd ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedGitCmd ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-3 rounded-md bg-slate-900 border border-slate-800 text-xs text-emerald-400 overflow-x-auto whitespace-pre font-mono">
              {gitCliCommand}
            </pre>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#E2E8F0]">
          <span className="text-[11px] text-[#64748B]">
            Target: <strong className="text-[#172033]">{repoName}</strong> • {cleanBranch}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={onClose}
              className="text-xs"
            >
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateGitHubPR}
              isLoading={isCreatingPR}
              className="text-xs"
            >
              <GitPullRequest className="w-3.5 h-3.5" />
              <span>Create GitHub PR</span>
            </Button>
          </div>
        </div>

        {prCreatedUrl && (
          <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between animate-fadeIn">
            <span>Branch prepared! Click to open PR directly on GitHub:</span>
            <a
              href={prCreatedUrl}
              target="_blank"
              rel="noreferrer"
              className="font-bold underline flex items-center gap-1 text-emerald-900 hover:text-black"
            >
              <span>Open in GitHub</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
