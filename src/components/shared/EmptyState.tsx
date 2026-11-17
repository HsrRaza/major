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
    <div className={cn('surface-card p-10 text-center flex flex-col items-center justify-center space-y-3 bg-[#0D0D0D]', className)}>
      <div className="w-12 h-12 rounded-lg bg-[#141414] border border-[#2B2B2B] flex items-center justify-center text-[#FF4D4D] shadow-inner">
        <Icon className="w-6 h-6 text-[#FF4D4D]" />
      </div>
      <h3 className="text-sm font-bold text-[#F5F5F5] font-mono uppercase tracking-tight">{title}</h3>
      <p className="text-xs text-[#858585] max-w-sm leading-relaxed font-sans">{description}</p>
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
    <div className={cn('animate-pulse rounded bg-[#141414] border border-[#202020]', className)} />
  );
}
