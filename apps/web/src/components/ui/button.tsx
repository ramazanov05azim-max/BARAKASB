import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export const buttonVariants = cva(
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--radius-control)] px-4 text-sm font-semibold tracking-[-0.01em] transition-[background,color,border-color,box-shadow,transform] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--canvas)] disabled:pointer-events-none disabled:opacity-45 active:translate-y-px',
  {
    variants: {
      variant: {
        primary:
          'border border-blue-500/30 bg-[linear-gradient(180deg,#2b78ff_0%,var(--action)_100%)] text-white shadow-[0_10px_24px_rgb(23_105_255_/_24%),inset_0_1px_0_rgb(255_255_255_/_30%)] hover:-translate-y-0.5 hover:bg-[var(--action-hover)] hover:shadow-[0_14px_30px_rgb(23_105_255_/_30%),inset_0_1px_0_rgb(255_255_255_/_34%)]',
        secondary:
          'border border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text)] shadow-[var(--shadow-control)] backdrop-blur-xl hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:bg-[var(--surface-solid)]',
        quiet:
          'border border-transparent text-[var(--text)] hover:border-[var(--border)] hover:bg-[var(--surface)]',
        destructive:
          'border border-red-500/20 bg-[var(--danger)] text-white shadow-[0_10px_24px_rgb(202_49_68_/_18%)] hover:-translate-y-0.5 hover:brightness-95',
      },
      size: {
        sm: 'min-h-9 px-3 text-[13px]',
        md: 'min-h-10 px-4',
        lg: 'min-h-12 px-5 text-[15px] sm:px-6',
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
