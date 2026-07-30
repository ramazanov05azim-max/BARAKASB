import * as React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-11 w-full rounded-[10px] border border-[var(--border)] bg-[var(--surface)] px-3.5 text-[15px] text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--action)] focus:ring-2 focus:ring-[var(--focus-soft)] disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
