import * as React from 'react';
import { cn } from '@/lib/utils';

export function Badge({
  className,
  tone = 'neutral',
  ...props
}: React.ComponentProps<'span'> & {
  tone?: 'neutral' | 'success' | 'warning';
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold shadow-[inset_0_1px_0_rgb(255_255_255_/_60%)]',
        tone === 'success' &&
          'border-emerald-200/60 bg-emerald-50/80 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950',
        tone === 'warning' &&
          'border-amber-200/70 bg-amber-50/85 text-amber-800 dark:border-amber-800 dark:bg-amber-950',
        tone === 'neutral' &&
          'border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)]',
        className,
      )}
      {...props}
    />
  );
}
