import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-13px font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6366F1] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-[#6366F1] text-white hover:bg-[#4F46E5]',
        destructive:
          'bg-[#EF4444] text-white hover:bg-[#DC2626]',
        outline:
          'border border-[#2A2A2A] bg-transparent text-[#EDEDED] hover:bg-[#1F1F1F] hover:text-[#EDEDED]',
        secondary:
          'bg-[#1A1A1A] text-[#EDEDED] hover:bg-[#252525]',
        ghost: 'text-[#888888] hover:bg-[#1F1F1F] hover:text-[#EDEDED]',
        link: 'text-[#6366F1] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-8 px-3 py-2',
        sm: 'h-7 rounded-md px-2 text-12px',
        lg: 'h-9 rounded-md px-6',
        icon: 'h-7 w-7',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
