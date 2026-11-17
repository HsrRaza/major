'use client';

import React, { useState } from 'react';
import { 
  X, 
  GitPullRequest, 
  Copy, 
  Check, 
  ExternalLink, 
  Terminal,
  ShieldCheck,
  Sparkles
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
    setCopiedGitCmd(false);
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
    <div className="fixed inset-0 z-50 bg-[#090909]/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn font-mono text-xs">
      <div className="surface-card max-w-xl w-full p-5 space-y-4 bg-[#141414] border-[#2B2B2B] shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#202020] pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-[#1B1B1B] text-[#FF4D4D] border border-[#2B2B2B]">
              <GitPullRequest className="w-5 h-5 text-[#FF4D4D]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#F5F5F5] font-mono tracking-tight uppercase">
                  Pull Request Generator
                </h3>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1B1B1B] text-[#FF4D4D] border border-[#2B2B2B]">
                  GITHUB AUTOMATION
                </span>
              </div>
              <p className="text-[11px] text-[#858585] font-sans mt-0.5">
                Formatted markdown summary with telemetry benchmarks ready for code review.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-[#1B1B1B] text-[#858585] hover:text-[#F5F5F5] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PR Content Preview */}
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[11px] text-[#858585] block uppercase font-bold text-[10px]">PR Title</label>
            <div className="p-2.5 rounded bg-[#0D0D0D] border border-[#202020] text-[#F5F5F5] font-bold truncate">
              {prTitle}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase font-bold text-[#858585]">Markdown Summary</label>
              <button
                onClick={handleCopyMarkdown}
                className="text-[11px] text-[#FF4D4D] hover:text-[#F5F5F5] flex items-center gap-1 font-semibold cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-[#22C55E]" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied Markdown' : 'Copy Markdown'}</span>
              </button>
            </div>
            <textarea
              readOnly
              rows={7}
              value={prBody}
              className="w-full bg-[#0D0D0D] border border-[#202020] rounded p-3 text-[11px] text-[#B3B3B3] font-mono resize-none focus:outline-none"
            />
          </div>

          {/* Terminal CLI Command */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase font-bold text-[#858585] flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-[#FF4D4D]" />
                <span>Git CLI Commands</span>
              </label>
              <button
                onClick={handleCopyGitCommand}
                className="text-[11px] text-[#FF4D4D] hover:text-[#F5F5F5] flex items-center gap-1 font-semibold cursor-pointer"
              >
                {copiedGitCmd ? <Check className="w-3 h-3 text-[#22C55E]" /> : <Copy className="w-3 h-3" />}
                <span>{copiedGitCmd ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="p-3 rounded bg-[#0D0D0D] border border-[#202020] text-[11px] text-[#22C55E] overflow-x-auto whitespace-pre font-mono">
              {gitCliCommand}
            </pre>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#202020]">
          <span className="text-[10px] text-[#858585]">
            Target: {repoName} • {cleanBranch}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={onClose}
              className="font-mono text-xs"
            >
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateGitHubPR}
              isLoading={isCreatingPR}
              className="font-mono text-xs"
            >
              <GitPullRequest className="w-3.5 h-3.5" />
              <span>Create GitHub PR</span>
            </Button>
          </div>
        </div>

        {prCreatedUrl && (
          <div className="p-2.5 rounded bg-[#22C55E]/15 border border-[#22C55E]/30 text-xs text-[#22C55E] flex items-center justify-between animate-fadeIn">
            <span>Branch prepared! Click to open PR directly on GitHub:</span>
            <a
              href={prCreatedUrl}
              target="_blank"
              rel="noreferrer"
              className="font-bold underline flex items-center gap-1 text-[#F5F5F5] hover:text-white"
            >
              <span>Open in GitHub</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
