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
          'flex h-9 w-full rounded-md border border-[#2A2A2A] bg-[#141414] px-3 py-2 text-13px text-[#EDEDED] placeholder-[#555555] transition-colors file:border-0 file:bg-transparent file:text-13px file:font-medium file:text-[#EDEDED] focus-visible:outline-none focus-visible:border-[#6366F1] focus-visible:ring-1 focus-visible:ring-[#6366F1] disabled:cursor-not-allowed disabled:opacity-50',
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
