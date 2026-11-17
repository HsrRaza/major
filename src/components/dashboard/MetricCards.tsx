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
      color: '#E53935',
    },
    {
      title: 'Complexity',
      score: subScores.complexity,
      icon: Cpu,
      description: `Avg branching: ${averageComplexity}/fn`,
      color: '#F59E0B',
    },
    {
      title: 'Security',
      score: subScores.security,
      icon: ShieldCheck,
      description: 'Zero injection, no hardcoded secrets',
      color: '#22C55E',
    },
    {
      title: 'Duplication',
      score: subScores.duplication,
      icon: Copy,
      description: 'AST cloned logic patterns',
      color: '#B3B3B3',
    },
    {
      title: 'Architecture',
      score: subScores.architecture,
      icon: Layers,
      description: 'Directed cycles & instability',
      color: '#E53935',
    },
    {
      title: 'Testing',
      score: subScores.testing,
      icon: Terminal,
      description: 'Virtual VM assertion harness',
      color: '#22C55E',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {metrics.map((m) => {
        const Icon = m.icon;
        const isOptimal = m.score >= 80;
        const isWarning = m.score >= 60 && m.score < 80;

        return (
          <div
            key={m.title}
            className="surface-card p-3 space-y-2 hover:border-[#383838] transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#858585] font-semibold">{m.title}</span>
              <Icon className="w-3.5 h-3.5" style={{ color: m.color }} />
            </div>

            <div>
              <div className="flex items-baseline gap-1.5 font-mono">
                <span className="text-xl font-black text-white">{m.score}</span>
                <span className="text-[10px] text-[#5C5C5C]">/100</span>
              </div>

              {/* Progress mini-bar */}
              <div className="w-full h-1 bg-[#1B1B1B] rounded-full overflow-hidden mt-1.5">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${m.score}%`,
                    backgroundColor: isOptimal ? '#22C55E' : isWarning ? '#F59E0B' : '#E53935',
                  }}
                />
              </div>
            </div>

            <p className="text-[10px] text-[#5C5C5C] font-mono truncate mt-1">
              {m.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}

