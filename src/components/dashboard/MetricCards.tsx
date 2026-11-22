'use client';

import React from 'react';
import { 
  ShieldCheck, 
  Cpu, 
  Layers, 
  Copy, 
  Terminal, 
  Wrench
} from 'lucide-react';
import { SubScores } from '@/types/analysis';

interface MetricCardsProps {
  subScores: SubScores;
  averageComplexity: number;
  totalLines: number;
}

export function MetricCards({ subScores, averageComplexity, totalLines }: MetricCardsProps) {
  const metrics = [
    {
      title: 'Maintainability',
      score: subScores.maintainability,
      icon: Wrench,
      description: 'Single Responsibility & modularity',
      color: '#E5484D',
    },
    {
      title: 'Complexity',
      score: subScores.complexity,
      icon: Cpu,
      description: `Avg branching: ${averageComplexity}/fn`,
      color: '#E9A23B',
    },
    {
      title: 'Security',
      score: subScores.security,
      icon: ShieldCheck,
      description: 'Zero injection, no hardcoded secrets',
      color: '#16A36A',
    },
    {
      title: 'Duplication',
      score: subScores.duplication,
      icon: Copy,
      description: 'AST cloned logic patterns',
      color: '#64748B',
    },
    {
      title: 'Architecture',
      score: subScores.architecture,
      icon: Layers,
      description: 'Directed cycles & instability',
      color: '#E5484D',
    },
    {
      title: 'Testing',
      score: subScores.testing,
      icon: Terminal,
      description: 'Virtual VM assertion harness',
      color: '#16A36A',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
      {metrics.map((m) => {
        const Icon = m.icon;
        const isOptimal = m.score >= 80;
        const isWarning = m.score >= 60 && m.score < 80;

        return (
          <div
            key={m.title}
            className="surface-card p-3.5 space-y-2.5 hover:border-[#CBD5E1] transition-all flex flex-col justify-between bg-white"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#64748B]">{m.title}</span>
              <Icon className="w-4 h-4" style={{ color: m.color }} />
            </div>

            <div>
              <div className="flex items-baseline gap-1.5 font-mono">
                <span className="text-xl font-bold text-[#172033]">{m.score}</span>
                <span className="text-xs text-[#94A3B8]">/100</span>
              </div>

              {/* Progress mini-bar */}
              <div className="w-full h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden mt-2">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${m.score}%`,
                    backgroundColor: isOptimal ? '#16A36A' : isWarning ? '#E9A23B' : '#E5484D',
                  }}
                />
              </div>
            </div>

            <p className="text-[11px] text-[#94A3B8] leading-tight line-clamp-1">
              {m.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}
