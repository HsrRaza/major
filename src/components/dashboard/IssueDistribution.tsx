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
    { label: 'Critical', count: counts.critical, color: '#E53935', icon: AlertOctagon, textClass: 'text-[#FF4D4D]' },
    { label: 'High', count: counts.high, color: '#F59E0B', icon: AlertTriangle, textClass: 'text-amber-400' },
    { label: 'Medium', count: counts.medium, color: '#858585', icon: Info, textClass: 'text-[#D4D4D4]' },
    { label: 'Low', count: counts.low, color: '#5C5C5C', icon: CheckCircle2, textClass: 'text-[#858585]' },
  ];

  return (
    <div className="surface-card p-4 sm:p-5 space-y-3.5 h-full flex flex-col justify-between">
      <div className="flex items-center justify-between border-b border-[#202020] pb-2.5">
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-[#E53935]" />
          <h4 className="font-mono font-bold text-xs text-white uppercase tracking-wider">
            Issue Severity Distribution
          </h4>
        </div>
        <span className="text-[11px] font-mono text-[#858585]">
          Total: <strong className="text-white">{counts.totalIssues} findings</strong>
        </span>
      </div>

      {/* Segmented Bar */}
      <div className="w-full h-2 rounded bg-[#1B1B1B] flex overflow-hidden">
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-xs">
        {distribution.map((d) => {
          const Icon = d.icon;
          return (
            <div key={d.label} className="p-2 rounded bg-[#0D0D0D] border border-[#2B2B2B] space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] text-[#858585]">
                <Icon className="w-3 h-3" style={{ color: d.color }} />
                <span>{d.label}</span>
              </div>
              <div className="text-base font-black text-white">{d.count}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

