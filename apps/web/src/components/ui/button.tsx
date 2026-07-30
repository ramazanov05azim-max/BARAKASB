import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-[10px] px-4 text-sm font-semibold transition-[background,color,box-shadow,transform] duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-45 active:translate-y-px',
  {
    variants: {
      variant: {
        primary:
          'bg-[var(--action)] text-white shadow-sm hover:bg-[var(--action-hover)]',
        secondary:
          'border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--subtle)]',
        quiet: 'text-[var(--text)] hover:bg-[var(--subtle)]',
        destructive: 'bg-[var(--danger)] text-white hover:brightness-90',
      },
      size: {
        sm: 'min-h-9 px-3 text-[13px]',
        md: 'min-h-10 px-4',
        lg: 'min-h-12 px-5 text-[15px]',
        icon: 'size-11 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = 'Button';
