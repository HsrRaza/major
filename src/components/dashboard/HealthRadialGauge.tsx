'use client';

import React from 'react';
import { Activity } from 'lucide-react';
import { getHealthColor } from '@/lib/utils';

interface HealthRadialGaugeProps {
  score: number;
  grade: string;
  explanation: string;
  timestamp?: string;
}

export function HealthRadialGauge({
  score,
  grade,
  explanation,
  timestamp,
}: HealthRadialGaugeProps) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const color = getHealthColor(score);
  const isDebt = score < 75;

  return (
    <div className="surface-card p-5 sm:p-6 flex flex-col justify-between space-y-4 h-full bg-white">
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#E5484D]" />
          <h3 className="font-semibold text-xs text-[#172033] uppercase tracking-wider font-mono">
            Overall Code Health Index
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#64748B]">Grade</span>
          <span className="px-2.5 py-0.5 rounded font-mono font-bold text-xs bg-[#F8FAFC] text-[#172033] border border-[#E2E8F0]">
            {grade}
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
        {/* SVG Radial Gauge */}
        <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
            <circle
              cx="64"
              cy="64"
              r={radius}
              fill="transparent"
              stroke="#E2E8F0"
              strokeWidth="9"
            />
            <circle
              cx="64"
              cy="64"
              r={radius}
              fill="transparent"
              stroke={color}
              strokeWidth="9"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
            <span className="text-3xl font-extrabold text-[#172033] tracking-tight">{score}</span>
            <span className="text-[10px] text-[#64748B] font-medium uppercase tracking-wider">out of 100</span>
          </div>
        </div>

        {/* Breakdown Text & Score Explanation */}
        <div className="space-y-2.5 flex-grow">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs font-semibold text-[#172033]">
              {score >= 80 ? 'Optimal Architecture' : score >= 60 ? 'Requires Refactoring' : 'Critical Technical Debt'}
            </span>
            {isDebt && (
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-red-50 text-[#E5484D] border border-red-200">
                Debt Alert
              </span>
            )}
          </div>

          <p className="text-xs text-[#64748B] font-sans leading-relaxed">
            {explanation}
          </p>

          {mounted && timestamp && (
            <div className="text-[11px] font-mono text-[#94A3B8] pt-1">
              Calculated {new Date(timestamp).toLocaleDateString()} at {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
