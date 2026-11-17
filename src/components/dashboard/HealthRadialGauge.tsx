'use client';

import React from 'react';
import { Activity, ShieldAlert, CheckCircle2, Flame } from 'lucide-react';
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
    <div className="surface-card p-4 sm:p-5 flex flex-col justify-between space-y-4 h-full">
      <div className="flex items-center justify-between border-b border-[#202020] pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#E53935]" />
          <h3 className="font-mono font-bold text-xs text-white uppercase tracking-wider">
            Overall Code Health Index
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-[#858585] uppercase">Grade</span>
          <span className="px-2 py-0.5 rounded font-mono font-black text-xs bg-[#1B1B1B] text-[#F5F5F5] border border-[#2B2B2B]">
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
              stroke="#1B1B1B"
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
            <span className="text-3xl font-black text-white tracking-tight">{score}</span>
            <span className="text-[9px] text-[#858585] font-semibold uppercase tracking-wider">out of 100</span>
          </div>
        </div>

        {/* Breakdown Text & Score Explanation */}
        <div className="space-y-2.5 flex-grow">
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs font-semibold font-mono text-white">
              {score >= 80 ? 'Optimal Architecture' : score >= 60 ? 'Requires Refactoring' : 'Critical Technical Debt'}
            </span>
            {isDebt && (
              <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded bg-[#E53935]/15 text-[#FF4D4D] border border-[#E53935]/30">
                Debt Alert
              </span>
            )}
          </div>

          <p className="text-xs text-[#B3B3B3] font-sans leading-relaxed">
            {explanation}
          </p>

          {mounted && timestamp && (
            <p className="text-[10px] font-mono text-[#5C5C5C]">
              Evaluated: {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

