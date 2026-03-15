import * as React from 'react';

import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-9 w-full rounded-md border border-[#E2E8F0] bg-[#FFFFFF] px-3 py-2 text-13px text-[#0F172A] placeholder-[#94A3B8] transition-colors file:border-0 file:bg-transparent file:text-13px file:font-medium file:text-[#0F172A] focus-visible:outline-none focus-visible:border-[#6366F1] focus-visible:ring-1 focus-visible:ring-[#6366F1] disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
