import * as React from 'react';

import { cn } from '@/lib/utils';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-[#2A2A2A] bg-[#141414] px-3 py-2 text-13px text-[#EDEDED] placeholder-[#555555] transition-colors placeholder:text-[#555555] focus-visible:outline-none focus-visible:border-[#6366F1] focus-visible:ring-1 focus-visible:ring-[#6366F1] disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
