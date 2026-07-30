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
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
        tone === 'success' && 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950',
        tone === 'warning' && 'bg-amber-50 text-amber-800 dark:bg-amber-950',
        tone === 'neutral' && 'bg-[var(--subtle)] text-[var(--text-secondary)]',
        className,
      )}
      {...props}
    />
  );
}
