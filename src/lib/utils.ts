import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num);
}

export function getHealthColor(score: number): string {
  if (score >= 80) return '#16A36A';
  if (score >= 60) return '#E9A23B';
  return '#E5484D';
}

export function getHealthBadgeClass(score: number): string {
  if (score >= 80) return 'bg-emerald-50 border-emerald-200 text-emerald-700';
  if (score >= 60) return 'bg-amber-50 border-amber-200 text-amber-700';
  return 'bg-red-50 border-red-200 text-red-600';
}

export function getSeverityBadgeClass(severity: string): string {
  switch (severity) {
    case 'Critical':
      return 'bg-red-50 text-red-600 border border-red-200 font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded';
    case 'High':
      return 'bg-amber-50 text-amber-700 border border-amber-200 font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded';
    case 'Medium':
      return 'bg-slate-100 text-slate-700 border border-slate-200 font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded';
    default:
      return 'bg-slate-50 text-slate-600 border border-slate-200 font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded';
  }
}
