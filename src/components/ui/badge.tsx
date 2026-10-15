import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'chartreuse' | 'outline' | 'destructive' | 'warning' | 'success' | 'dark' | 'muted';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-[#F2EFE9] text-[#171717] border-[#E6E4DE]',
    chartreuse: 'bg-[#D7FF64] text-[#121606] font-medium border-[#C5F54A]',
    outline: 'bg-transparent text-[#171717] border-[#E6E4DE]',
    destructive: 'bg-[#FFEBEA] text-[#E5484D] border-[#FDB8B6]',
    warning: 'bg-[#FFF8E6] text-[#B7791F] border-[#FEEBC8]',
    success: 'bg-[#EBF8F2] text-[#23784F] border-[#B7EBCE]',
    dark: 'bg-[#1C1C1A] text-[#F7F6F2] border-[#2F2F2C]',
    muted: 'bg-[#F2EFE9] text-[#777777] border-transparent',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-mono rounded-md border transition-colors',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
