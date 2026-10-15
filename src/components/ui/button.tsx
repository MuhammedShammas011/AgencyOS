import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'dark' | 'chartreuse' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const base = 'inline-flex items-center justify-center font-medium transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171717] focus-visible:ring-offset-2';
    
    const variants = {
      primary: 'bg-[#171717] text-[#FFFFFF] hover:bg-[#2C2C29] active:bg-[#000000] rounded-md shadow-xs',
      secondary: 'bg-[#FFFFFF] text-[#171717] border border-[#E6E4DE] hover:bg-[#F7F6F2] hover:border-[#D1CFC7] active:bg-[#EFECE5] rounded-md shadow-2xs',
      outline: 'bg-transparent text-[#171717] border border-[#E6E4DE] hover:bg-[#F2EFE9] rounded-md',
      ghost: 'bg-transparent text-[#171717] hover:bg-[#F2EFE9] active:bg-[#EAE7DF] rounded-md',
      chartreuse: 'bg-[#D7FF64] text-[#121606] font-semibold hover:bg-[#C5F54A] active:bg-[#B3E538] rounded-md shadow-xs border border-[#C5F54A]',
      dark: 'bg-[#1C1C1A] text-[#F7F6F2] hover:bg-[#2F2F2C] border border-[#2F2F2C] rounded-md',
      danger: 'bg-[#FFEBEA] text-[#E5484D] border border-[#FDB8B6] hover:bg-[#FDD8D7] rounded-md',
    };

    const sizes = {
      sm: 'h-8 px-2.5 text-xs tracking-tight',
      md: 'h-9 px-3.5 text-sm',
      lg: 'h-10 px-5 text-sm tracking-tight',
      icon: 'h-9 w-9 p-0',
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };
