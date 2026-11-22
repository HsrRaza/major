import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'ai';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'secondary', size = 'sm', isLoading, disabled, children, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium transition-all rounded-md select-none focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer gap-2';

    const sizeClasses = {
      xs: 'px-2 py-1 text-[11px] font-mono',
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-xs font-semibold',
      lg: 'px-5 py-2.5 text-sm font-semibold',
    };

    const variantClasses = {
      primary: 'bg-[#E5484D] text-white hover:bg-[#D9363E] active:bg-[#C52B33] shadow-sm shadow-[#E5484D]/20 border border-[#E5484D] font-medium tracking-wide',
      secondary: 'bg-white text-[#172033] hover:bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#CBD5E1] shadow-xs',
      danger: 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 hover:border-red-300',
      ghost: 'bg-transparent text-[#64748B] hover:text-[#172033] hover:bg-[#F1F5F9]',
      outline: 'bg-white text-[#172033] hover:text-[#E5484D] border border-[#E2E8F0] hover:border-[#E5484D] hover:bg-[#FFF1F2]',
      ai: 'bg-white text-[#172033] hover:bg-[#FFF1F2] border border-[#FECDD3] hover:border-[#E5484D] shadow-xs relative overflow-hidden',
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
