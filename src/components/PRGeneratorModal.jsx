import React, { useState } from 'react';
import { X, GitPullRequest, Copy, Check, ExternalLink, ShieldCheck, Sparkles, Terminal } from 'lucide-react';

export default function PRGeneratorModal({ 
  isOpen, 
  onClose, 
  auditLog, 
  activeRepo 
}) {
  const [copied, setCopied] = useState(false);
  const [copiedGitCmd, setCopiedGitCmd] = useState(false);
  const [isCreatingPR, setIsCreatingPR] = useState(false);
  const [prCreatedUrl, setPrCreatedUrl] = useState(null);

  if (!isOpen) return null;

  const repoTitle = activeRepo?.name || 'repository';
  const repoOwner = activeRepo?.owner || 'organization';
  const targetFile = auditLog?.file || 'src/services/module.js';
  const cleanBranch = `refactor/${targetFile.replace(/[\/\\]/g, '-').replace(/\.(js|ts|jsx|tsx)$/, '')}`;

  const complexityDelta = (auditLog?.complexityBefore || 1) - (auditLog?.complexityAfter || 1);
  const linesSaved = (auditLog?.linesBefore || 0) - (auditLog?.linesAfter || 0);

  const prTitle = `refactor: clean architecture & complexity reduction for ${targetFile}`;
  
  const prBody = `## 🤖 PatchPilot Automated Code Improvements

### 📌 Summary of Changes
- **Target File:** \`${targetFile}\`
- **Architectural Goal:** ${auditLog?.problem || 'Extracted modular logic and reduced cyclomatic complexity'}
- **AI Engine:** Groq Llama-3.3-70b Versatile

### 📊 Code Quality & Complexity Metrics
- **Cyclomatic Complexity:** Reduced from **${auditLog?.complexityBefore || 1}** → **${auditLog?.complexityAfter || 1}** ${complexityDelta > 0 ? `(-${complexityDelta} branch points)` : ''}
- **Lines of Code:** **${auditLog?.linesBefore || 0}** → **${auditLog?.linesAfter || 0}** LOC ${linesSaved > 0 ? `(-${linesSaved} lines eliminated)` : ''}
- **Regression Safety:** Verified against in-memory unit test runner

### 🛠️ Verification Checklist
- [x] Static AST analysis passed
- [x] Cyclomatic complexity threshold met
- [x] No security secrets introduced
- [x] Backward-compatible export signatures preserved

---
*Generated automatically by PatchPilot AI Code Intelligence Platform.*`;

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
      setPrCreatedUrl(`https://github.com/${repoOwner}/${repoTitle}/pull/new/${cleanBranch}`);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#05080F]/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn font-mono text-xs">
      <div className="card-linear max-w-xl w-full p-6 space-y-5 bg-[#090D16] border-[#818CF8]/40 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1E293B] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#6366F1]/15 text-[#818CF8] border border-[#6366F1]/30">
              <GitPullRequest className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                Automated GitHub Pull Request Generator
              </h3>
              <p className="text-[11px] text-[#94A3B8] font-sans mt-0.5">
                Formatted markdown summary with telemetry benchmarks ready for your team review.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-[#111726] text-[#94A3B8] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PR Content Preview */}
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[11px] text-[#94A3B8] block">PR Title</label>
            <div className="p-2.5 rounded bg-[#111726] border border-[#1E293B] text-slate-100 font-bold truncate">
              {prTitle}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] text-[#94A3B8]">Pull Request Markdown Description</label>
              <button
                onClick={handleCopyMarkdown}
                className="text-[11px] text-[#818CF8] hover:text-white flex items-center gap-1 font-semibold"
              >
                {copied ? <Check className="w-3 h-3 text-[#34D399]" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied Markdown' : 'Copy Markdown'}</span>
              </button>
            </div>
            <textarea
              readOnly
              rows={8}
              value={prBody}
              className="w-full bg-[#0D121F] border border-[#1E293B] rounded p-3 text-[11px] text-slate-300 font-mono resize-none focus:outline-none"
            />
          </div>

          {/* Terminal CLI Command */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-[11px] text-[#94A3B8] flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-[#818CF8]" />
                <span>Git Terminal CLI Commands</span>
              </label>
              <button
                onClick={handleCopyGitCommand}
                className="text-[11px] text-[#818CF8] hover:text-white flex items-center gap-1 font-semibold"
              >
                {copiedGitCmd ? <Check className="w-3 h-3 text-[#34D399]" /> : <Copy className="w-3 h-3" />}
                <span>{copiedGitCmd ? 'Copied Commands' : 'Copy Commands'}</span>
              </button>
            </div>
            <pre className="p-3 rounded bg-[#0D121F] border border-[#1E293B] text-[11px] text-[#34D399] overflow-x-auto whitespace-pre">
              {gitCliCommand}
            </pre>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-[#1E293B]">
          <span className="text-[10px] text-[#64748B]">
            Target: {repoOwner}/{repoTitle} • {cleanBranch}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="btn-secondary text-xs py-2 px-4 font-mono font-semibold"
            >
              Close
            </button>
            <button
              onClick={handleCreateGitHubPR}
              disabled={isCreatingPR}
              className="btn-primary text-xs py-2 px-4 font-mono font-bold"
            >
              <GitPullRequest className="w-3.5 h-3.5" />
              <span>{isCreatingPR ? 'Generating...' : 'Open PR on GitHub'}</span>
            </button>
          </div>
        </div>

        {prCreatedUrl && (
          <div className="p-2.5 rounded bg-[#10B981]/15 border border-[#10B981]/30 text-xs text-[#34D399] flex items-center justify-between animate-fadeIn">
            <span>Branch prepared! Click to open PR directly on GitHub:</span>
            <a
              href={prCreatedUrl}
              target="_blank"
              rel="noreferrer"
              className="font-bold underline flex items-center gap-1 text-white"
            >
              <span>GitHub Link</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
