import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num);
}

export function getHealthColor(score: number): string {
  if (score >= 80) return '#22C55E';
  if (score >= 60) return '#F59E0B';
  return '#E53935';
}

export function getHealthBadgeClass(score: number): string {
  if (score >= 80) return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
  if (score >= 60) return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
  return 'bg-[#E53935]/15 border-[#E53935]/40 text-[#FF4D4D]';
}

export function getSeverityBadgeClass(severity: string): string {
  switch (severity) {
    case 'Critical':
      return 'bg-[#E53935]/15 text-[#FF4D4D] border border-[#E53935]/40 font-mono text-[10px] font-bold uppercase px-1.5 py-0.5 rounded';
    case 'High':
      return 'bg-amber-500/15 text-amber-400 border border-amber-500/35 font-mono text-[10px] font-bold uppercase px-1.5 py-0.5 rounded';
    case 'Medium':
      return 'bg-[#2B2B2B] text-[#D4D4D4] border border-[#383838] font-mono text-[10px] font-bold uppercase px-1.5 py-0.5 rounded';
    default:
      return 'bg-[#1B1B1B] text-[#858585] border border-[#2B2B2B] font-mono text-[10px] font-bold uppercase px-1.5 py-0.5 rounded';
  }
}

