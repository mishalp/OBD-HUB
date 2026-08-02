'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger';

export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const variantClass: Record<ButtonVariant, string> = {
  primary:
    'bg-[#D32F2F] text-white hover:bg-[#B71C1C] shadow-sm disabled:bg-[#D32F2F]/50',
  secondary:
    'bg-white text-[#111827] border border-[#E5E7EB] hover:bg-[#FAFAFA] shadow-sm',
  outline:
    'bg-transparent text-[#111827] border border-[#E5E7EB] hover:bg-[#FAFAFA]',
  ghost: 'bg-transparent text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827]',
  danger:
    'bg-[#DC2626] text-white hover:bg-[#B91C1C] shadow-sm disabled:bg-[#DC2626]/50',
};

const sizeClass: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-sm gap-2',
  icon: 'h-10 w-10 p-0 justify-center',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      type = 'button',
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D32F2F]/30 focus-visible:ring-offset-1',
          'disabled:cursor-not-allowed disabled:opacity-60',
          variantClass[variant],
          sizeClass[size],
          className,
        )}
        {...props}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : leftIcon}
        {children}
        {!loading ? rightIcon : null}
      </button>
    );
  },
);

Button.displayName = 'Button';
