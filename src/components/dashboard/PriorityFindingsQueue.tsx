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
      <div className="surface-card p-8 text-center space-y-2 bg-white">
        <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
        <h4 className="text-sm font-semibold text-[#172033]">No Critical or High Issues Detected</h4>
        <p className="text-xs text-[#64748B]">All scanned files meet security thresholds and maintainability guidelines.</p>
      </div>
    );
  }

  return (
    <div className="surface-card p-5 sm:p-6 space-y-4 bg-white">
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#E5484D]" />
          <h4 className="font-semibold text-xs text-[#172033] uppercase tracking-wider font-mono">
            Priority Action Findings
          </h4>
        </div>
        <span className="text-xs text-[#64748B]">
          Top {priorityIssues.length} high-severity items
        </span>
      </div>

      <div className="space-y-3">
        {priorityIssues.map((issue) => (
          <div
            key={issue.id}
            className="p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#CBD5E1] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
          >
            <div className="space-y-1.5 flex-grow">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={getSeverityBadgeClass(issue.severity)}>
                  {issue.severity}
                </span>
                <span className="text-[10px] font-mono text-[#64748B] px-2 py-0.5 rounded bg-white border border-[#E2E8F0]">
                  {issue.category}
                </span>
                <span className="text-xs font-semibold text-[#172033]">
                  {issue.title}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-[#64748B] font-mono">
                <span className="flex items-center gap-1 text-[#172033]">
                  <FileCode className="w-3.5 h-3.5 text-[#E5484D]" />
                  <span>{issue.filePath}:{issue.line}</span>
                </span>
                <span className="text-[#CBD5E1]">•</span>
                <span className="truncate max-w-sm text-[#64748B] font-sans">{issue.why}</span>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="secondary"
                size="xs"
                onClick={() => onSelectIssueForReview(issue)}
                className="text-xs"
              >
                Inspect
              </Button>

              <Button
                variant="primary"
                size="xs"
                onClick={() => handleRefactor(issue)}
                className="text-xs"
              >
                <Sparkles className="w-3 h-3" />
                <span>Refactor</span>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
