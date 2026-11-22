'use client';

import React from 'react';
import { AlertOctagon, AlertTriangle, Info, CheckCircle2, Bug } from 'lucide-react';
import { AnalysisCounts } from '@/types/analysis';

interface IssueDistributionProps {
  counts: AnalysisCounts;
}

export function IssueDistribution({ counts }: IssueDistributionProps) {
  const total = counts.totalIssues || 1;

  const distribution = [
    { label: 'Critical', count: counts.critical, color: '#DC2626', icon: AlertOctagon, bg: 'bg-red-50', border: 'border-red-200' },
    { label: 'High', count: counts.high, color: '#D97706', icon: AlertTriangle, bg: 'bg-amber-50', border: 'border-amber-200' },
    { label: 'Medium', count: counts.medium, color: '#475569', icon: Info, bg: 'bg-slate-50', border: 'border-slate-200' },
    { label: 'Low', count: counts.low, color: '#64748B', icon: CheckCircle2, bg: 'bg-[#F8FAFC]', border: 'border-[#E2E8F0]' },
  ];

  return (
    <div className="surface-card p-5 sm:p-6 space-y-4 h-full flex flex-col justify-between bg-white">
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-[#E5484D]" />
          <h4 className="font-semibold text-xs text-[#172033] uppercase tracking-wider font-mono">
            Issue Severity Distribution
          </h4>
        </div>
        <span className="text-xs text-[#64748B]">
          Total: <strong className="text-[#172033]">{counts.totalIssues} findings</strong>
        </span>
      </div>

      {/* Segmented Bar */}
      <div className="w-full h-2.5 rounded-full bg-[#F1F5F9] flex overflow-hidden">
        {distribution.map((d) => {
          if (d.count === 0) return null;
          const percentage = (d.count / total) * 100;
          return (
            <div
              key={d.label}
              style={{ width: `${percentage}%`, backgroundColor: d.color }}
              title={`${d.label}: ${d.count} issues (${Math.round(percentage)}%)`}
              className="h-full transition-all"
            />
          );
        })}
      </div>

      {/* Legend & Counts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
        {distribution.map((d) => {
          const Icon = d.icon;
          return (
            <div key={d.label} className={`p-2.5 rounded-lg ${d.bg} border ${d.border} space-y-1`}>
              <div className="flex items-center gap-1.5 text-[11px] text-[#64748B]">
                <Icon className="w-3.5 h-3.5" style={{ color: d.color }} />
                <span>{d.label}</span>
              </div>
              <div className="text-lg font-bold text-[#172033] font-mono">{d.count}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
