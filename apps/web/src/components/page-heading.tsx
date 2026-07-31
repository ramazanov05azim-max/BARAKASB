import type { ReactNode } from 'react';

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between lg:mb-12">
      <div className="max-w-3xl">
        {eyebrow && (
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--action)]">
            {eyebrow}
          </p>
        )}
        <h1 className="text-4xl font-semibold leading-[1.04] tracking-[-0.048em] sm:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[var(--text-secondary)]">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}
