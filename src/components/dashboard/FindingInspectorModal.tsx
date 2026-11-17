'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  AlertTriangle, 
  FileCode, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight,
  RefreshCw,
  Lightbulb,
  ExternalLink
} from 'lucide-react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { CodeIssue, IssueExplanation } from '@/types/issue';
import { explainIssueApi } from '@/lib/api';
import { getSeverityBadgeClass } from '@/lib/utils';
import { useRefactorStore } from '@/stores/refactorStore';
import { useRepoStore } from '@/stores/repoStore';

interface FindingInspectorModalProps {
  issue: CodeIssue | null;
  onClose: () => void;
}

export function FindingInspectorModal({ issue, onClose }: FindingInspectorModalProps) {
  const router = useRouter();
  const [explanation, setExplanation] = useState<IssueExplanation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { activeRepoId, getActiveRepo } = useRepoStore();
  const activeRepo = getActiveRepo();
  const { generateProposal } = useRefactorStore();

  useEffect(() => {
    if (!issue) {
      setExplanation(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    const fileContent = activeRepo?.files[issue.filePath] || issue.codeSnippet || '';

    explainIssueApi({
      issue,
      codeSnippet: fileContent.slice(0, 1500),
      filePath: issue.filePath,
    })
      .then((data) => {
        if (isMounted) {
          setExplanation(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setExplanation({
            isAiAvailable: false,
            whatsWrong: issue.why,
            whyProblematic: 'Violation creates cognitive overhead and potential runtime fragility.',
            howToFix: issue.suggestedApproach,
            expectedBenefits: ['Cleaner code structure', 'Reduced defect probability'],
            potentialRisks: ['Verify API signatures'],
            error: err.message,
          });
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [issue, activeRepo]);

  if (!issue) return null;

  const handleRefactor = () => {
    const originalCode = activeRepo?.files[issue.filePath] || '';
    generateProposal({
      filePath: issue.filePath,
      originalCode,
      issue,
    });
    onClose();
    router.push(`/refactor/${activeRepoId}`);
  };

  return (
    <Dialog
      isOpen={!!issue}
      onClose={onClose}
      maxWidth="2xl"
      title={
        <div className="flex items-center gap-2.5">
          <span className={getSeverityBadgeClass(issue.severity)}>
            {issue.severity}
          </span>
          <div>
            <h3 className="text-sm font-bold text-white font-mono">{issue.title}</h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-[#818CF8]" />
              <span>{issue.filePath}</span>
              <span className="text-slate-600">•</span>
              <span>Line {issue.line}:{issue.column}</span>
            </p>
          </div>
        </div>
      }
    >
      <div className="space-y-4 font-mono text-xs text-slate-200">
        {/* Code Snippet Box */}
        {issue.codeSnippet && (
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-[#858585] uppercase">Offending Code Snippet</span>
            <div className="p-3 rounded bg-[#0D0D0D] border border-[#2B2B2B] overflow-x-auto text-[#FF4D4D] font-mono text-[11px] leading-relaxed">
              <pre>{issue.codeSnippet}</pre>
            </div>
          </div>
        )}

        {/* AI Diagnostic Explanation */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-[#202020] pb-2">
            <div className="flex items-center gap-2 text-white font-semibold">
              <Sparkles className="w-4 h-4 text-[#E53935]" />
              <span>Structured Groq Diagnostic Report</span>
            </div>
            {isLoading && (
              <span className="flex items-center gap-1 text-[11px] text-[#FF4D4D]">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Querying Llama-3.3-70b...
              </span>
            )}
          </div>

          {explanation && (
            <div className="space-y-3 font-sans text-xs">
              <div className="p-3 rounded bg-[#0D0D0D] border border-[#2B2B2B] space-y-1">
                <span className="font-mono text-[11px] text-amber-400 font-bold block">What is wrong:</span>
                <p className="text-[#F5F5F5] leading-relaxed">{explanation.whatsWrong}</p>
              </div>

              <div className="p-3 rounded bg-[#0D0D0D] border border-[#2B2B2B] space-y-1">
                <span className="font-mono text-[11px] text-[#FF4D4D] font-bold block">Why it matters & potential risks:</span>
                <p className="text-[#B3B3B3] leading-relaxed">{explanation.whyProblematic}</p>
              </div>

              <div className="p-3 rounded bg-[#0D0D0D] border border-[#2B2B2B] space-y-1">
                <span className="font-mono text-[11px] text-emerald-400 font-bold block">Recommended Refactoring Approach:</span>
                <p className="text-[#F5F5F5] leading-relaxed">{explanation.howToFix}</p>
              </div>

              {explanation.expectedBenefits?.length > 0 && (
                <div className="space-y-1">
                  <span className="font-mono text-[11px] text-[#858585] font-bold uppercase">Expected Benefits:</span>
                  <ul className="space-y-1">
                    {explanation.expectedBenefits.map((b, i) => (
                      <li key={i} className="flex items-center gap-2 text-[#B3B3B3]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="pt-3 border-t border-[#202020] flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleRefactor}
          >
            <Sparkles className="w-4 h-4 text-white" />
            <span>Refactor in Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
