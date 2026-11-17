import React from 'react';
import { X, Sparkles, AlertOctagon, CheckCircle2, ShieldAlert, RotateCw, Lightbulb, Zap } from 'lucide-react';

export default function CodeReviewModal({ 
  issue, 
  explanation, 
  onClose, 
  onTriggerRefactor,
  isLoading 
}) {
  if (!issue) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#05080F]/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn font-sans">
      <div className="card-linear max-w-2xl w-full p-6 space-y-5 bg-[#090D16] border-[#6366F1]/40 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#1E293B] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#6366F1]/15 text-[#818CF8] border border-[#6366F1]/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 font-mono flex items-center gap-2">
                <span>AI Root-Cause Code Review</span>
                <span className="badge badge-critical text-[10px]">{issue.severity}</span>
              </h3>
              <p className="text-xs text-[#94A3B8] font-mono mt-0.5">{issue.filePath} (Line {issue.line})</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[#94A3B8] hover:text-white p-1.5 rounded-md hover:bg-[#111726] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="p-12 text-center text-[#94A3B8] space-y-3 font-mono">
            <RotateCw className="w-8 h-8 text-[#818CF8] animate-spin mx-auto" />
            <div className="text-xs text-slate-300 font-semibold">Groq Llama-3.3 LLM is analyzing code AST & security risks...</div>
          </div>
        ) : (
          <div className="space-y-4 text-xs leading-relaxed">
            {/* 1. What's Wrong */}
            <div className="p-4 bg-[#111726] rounded-[6px] border border-[#EF4444]/30 space-y-1.5">
              <div className="font-bold text-[#F87171] font-mono flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4 text-[#F87171]" /> 1. What's Wrong (Issue Diagnosis)
              </div>
              <p className="text-[#CBD5E1]">
                {explanation?.whatsWrong || issue.why}
              </p>
            </div>

            {/* 2. Why It's Problematic */}
            <div className="p-4 bg-[#111726] rounded-[6px] border border-[#F59E0B]/30 space-y-1.5">
              <div className="font-bold text-[#FBBF24] font-mono flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-[#FBBF24]" /> 2. Why It's Problematic (Technical Debt)
              </div>
              <p className="text-[#CBD5E1]">
                {explanation?.whyProblematic || 'High cyclomatic complexity degrades developer maintainability and makes unit test coverage difficult to achieve.'}
              </p>
            </div>

            {/* 3. Recommended Approach */}
            <div className="p-4 bg-[#111726] rounded-[6px] border border-[#10B981]/30 space-y-1.5">
              <div className="font-bold text-[#34D399] font-mono flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-[#34D399]" /> 3. Recommended Refactoring Approach
              </div>
              <p className="text-[#CBD5E1]">
                {explanation?.howToFix || issue.suggestedApproach}
              </p>
            </div>

            {/* Benefits & Risks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 bg-[#0B0F19] rounded-[6px] border border-[#10B981]/20 space-y-1">
                <div className="font-bold text-[#34D399] font-mono text-[11px]">Expected Benefits:</div>
                <ul className="list-disc list-inside text-[#94A3B8] space-y-1 text-[11px]">
                  {explanation?.expectedBenefits?.map((b, idx) => <li key={idx}>{b}</li>) || (
                    <>
                      <li>Reduced cyclomatic complexity</li>
                      <li>Enhanced unit test coverage</li>
                    </>
                  )}
                </ul>
              </div>

              <div className="p-3.5 bg-[#0B0F19] rounded-[6px] border border-[#EF4444]/20 space-y-1">
                <div className="font-bold text-[#F87171] font-mono text-[11px]">Potential Risks:</div>
                <ul className="list-disc list-inside text-[#94A3B8] space-y-1 text-[11px]">
                  {explanation?.potentialRisks?.map((r, idx) => <li key={idx}>{r}</li>) || (
                    <>
                      <li>Requires full regression test run</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1E293B]">
          <button
            onClick={onClose}
            className="btn-secondary text-xs py-2 px-4 font-mono"
          >
            Close
          </button>
          <button
            onClick={() => {
              onClose();
              onTriggerRefactor(issue);
            }}
            className="btn-primary text-xs py-2 px-4 font-mono font-bold"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Refactoring Proposal</span>
          </button>
        </div>
      </div>
    </div>
  );
}
