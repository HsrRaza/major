'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShieldAlert, 
  Sparkles, 
  FileCode, 
  CheckCircle2
} from 'lucide-react';
import { CodeIssue } from '@/types/issue';
import { Button } from '@/components/ui/Button';
import { getSeverityBadgeClass } from '@/lib/utils';
import { useRefactorStore } from '@/stores/refactorStore';
import { useRepoStore } from '@/stores/repoStore';

interface PriorityFindingsQueueProps {
  issues: CodeIssue[];
  onSelectIssueForReview: (issue: CodeIssue) => void;
}

export function PriorityFindingsQueue({
  issues,
  onSelectIssueForReview,
}: PriorityFindingsQueueProps) {
  const router = useRouter();
  const activeRepoId = useRepoStore((state) => state.activeRepoId);
  const activeRepo = useRepoStore((state) => state.getActiveRepo());
  const { generateProposal } = useRefactorStore();

  const priorityIssues = issues
    .filter(i => i.severity === 'Critical' || i.severity === 'High')
    .slice(0, 5);

  const handleRefactor = (issue: CodeIssue) => {
    const originalCode = activeRepo?.files[issue.filePath] || '';
    generateProposal({
      filePath: issue.filePath,
      originalCode,
      issue,
    });
    router.push(`/refactor/${activeRepoId}`);
  };

  if (priorityIssues.length === 0) {
    return (
      <div className="surface-card p-6 text-center space-y-2">
        <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
        <h4 className="text-xs font-mono font-bold text-white">No Critical or High Issues Detected</h4>
        <p className="text-xs text-[#858585]">All scanned files meet security thresholds and maintainability guidelines.</p>
      </div>
    );
  }

  return (
    <div className="surface-card p-4 sm:p-5 space-y-3.5">
      <div className="flex items-center justify-between border-b border-[#202020] pb-2.5">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#E53935]" />
          <h4 className="font-mono font-bold text-xs text-white uppercase tracking-wider">
            Priority Action Findings
          </h4>
        </div>
        <span className="text-[11px] font-mono text-[#858585]">
          Top {priorityIssues.length} high-severity items
        </span>
      </div>

      <div className="space-y-2.5">
        {priorityIssues.map((issue) => (
          <div
            key={issue.id}
            className="p-3 rounded bg-[#0D0D0D] border border-[#2B2B2B] hover:border-[#E53935]/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={getSeverityBadgeClass(issue.severity)}>
                  {issue.severity}
                </span>
                <span className="text-[10px] font-mono text-[#858585] px-1.5 py-0.5 rounded bg-[#141414] border border-[#2B2B2B]">
                  {issue.category}
                </span>
                <span className="text-xs font-mono font-bold text-[#F5F5F5] group-hover:text-white">
                  {issue.title}
                </span>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-[#858585] font-mono">
                <span className="flex items-center gap-1 text-[#F5F5F5]">
                  <FileCode className="w-3 h-3 text-[#E53935]" />
                  <span>{issue.filePath}:{issue.line}</span>
                </span>
                <span className="text-[#5C5C5C]">•</span>
                <span className="truncate max-w-sm text-[#858585] font-sans">{issue.why}</span>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="secondary"
                size="xs"
                onClick={() => onSelectIssueForReview(issue)}
                title="View structured diagnostic explanation"
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
        ))}
      </div>
    </div>
  );
}

