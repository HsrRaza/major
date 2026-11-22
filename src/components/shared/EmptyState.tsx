import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('surface-card p-10 text-center flex flex-col items-center justify-center space-y-3 bg-white', className)}>
      <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-[#E5484D]">
        <Icon className="w-6 h-6 text-[#E5484D]" />
      </div>
      <h3 className="text-sm font-bold text-[#172033] font-mono tracking-tight">{title}</h3>
      <p className="text-xs text-[#64748B] max-w-sm leading-relaxed font-sans">{description}</p>
      {actionLabel && onAction && (
        <div className="pt-2">
          <Button variant="primary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

export function SkeletonLoader({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse rounded-md bg-[#F1F5F9] border border-[#E2E8F0]', className)} />
  );
}
