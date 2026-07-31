import * as React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-12 w-full rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface-raised)] px-4 text-[15px] text-[var(--text)] shadow-[inset_0_1px_0_rgb(255_255_255_/_70%),0_8px_20px_rgb(39_70_120_/_4%)] outline-none transition-[border-color,box-shadow,background] duration-200 placeholder:text-[var(--muted)] focus:border-[var(--action)] focus:bg-[var(--surface-solid)] focus:ring-4 focus:ring-[var(--focus-soft)] disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
