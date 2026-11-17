import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl';
}

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  maxWidth = 'lg',
}: DialogProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '6xl': 'max-w-6xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative w-full rounded-xl bg-[#141414] border border-[#2B2B2B] shadow-2xl text-[#F5F5F5] flex flex-col max-h-[90vh] overflow-hidden z-10',
          maxWidthClasses[maxWidth],
          className
        )}
      >
        {(title || description) && (
          <div className="flex items-start justify-between border-b border-[#202020] px-5 py-4 shrink-0 bg-[#0D0D0D]">
            <div>
              {typeof title === 'string' ? (
                <h3 className="text-sm font-bold text-white font-mono tracking-wide">{title}</h3>
              ) : (
                title
              )}
              {description && (
                <p className="text-xs text-[#858585] mt-1 font-sans">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-[#858585] hover:text-white hover:bg-[#1B1B1B] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="overflow-y-auto p-5 flex-grow">
          {children}
        </div>
      </div>
    </div>
  );
}
