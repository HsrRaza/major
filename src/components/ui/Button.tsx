import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'ai';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'secondary', size = 'sm', isLoading, disabled, children, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium transition-all rounded-[6px] select-none focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer gap-2';

    const sizeClasses = {
      xs: 'px-2 py-1 text-[11px] font-mono',
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-xs font-semibold',
      lg: 'px-5 py-2.5 text-sm font-semibold',
    };

    const variantClasses = {
      primary: 'bg-[#E53935] text-white hover:bg-[#FF4D4D] active:bg-[#C62828] shadow-sm shadow-[#E53935]/25 border border-[#FF4D4D]/30 font-medium tracking-wide',
      secondary: 'bg-[#141414] text-[#F5F5F5] hover:bg-[#1B1B1B] hover:text-white border border-[#2B2B2B] hover:border-[#383838]',
      danger: 'bg-red-500/15 text-[#FF4D4D] hover:bg-red-500/25 border border-[#E53935]/30 hover:border-[#E53935]/60',
      ghost: 'bg-transparent text-[#B3B3B3] hover:text-[#F5F5F5] hover:bg-[#1B1B1B]',
      outline: 'bg-transparent text-[#F5F5F5] hover:text-white border border-[#2B2B2B] hover:border-[#E53935]/60 hover:bg-[#141414]',
      ai: 'bg-[#141414] text-[#F5F5F5] hover:bg-[#1B1B1B] border border-[#E53935]/60 hover:border-[#FF4D4D] shadow-[0_0_12px_-2px_rgba(229,57,53,0.35)] relative overflow-hidden',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseClasses, sizeClasses[size], variantClasses[variant], className)}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-1.5 h-3.5 w-3.5 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
