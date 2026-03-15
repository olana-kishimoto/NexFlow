import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border-0 px-2 py-0.5 text-10px font-medium transition-colors',
  {
    variants: {
      variant: {
        default:
          'bg-[#6366F1] text-white',
        secondary:
          'bg-[#FFFFFF] text-[#0F172A]',
        destructive:
          'bg-[#FEE2E2] text-[#EF4444]',
        outline: 'border border-[#E2E8F0] text-[#0F172A]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
