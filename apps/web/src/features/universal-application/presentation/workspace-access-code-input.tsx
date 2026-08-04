'use client';

import { forwardRef, useId } from 'react';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/i18n/i18n-provider';
import {
  formatWorkspaceAccessCode,
  normalizeWorkspaceAccessCode,
} from '../domain/workspace-access-code';

export interface WorkspaceAccessCodeInputProps {
  value: string;
  onChange: (normalizedValue: string) => void;
  invalid?: boolean;
}

export const WorkspaceAccessCodeInput = forwardRef<
  HTMLInputElement,
  WorkspaceAccessCodeInputProps
>(({ value, onChange, invalid = false }, ref) => {
  const { t } = useTranslation();
  const inputId = useId();
  const descriptionId = `${inputId}-description`;
  const errorId = `${inputId}-error`;

  return (
    <div>
      <label htmlFor={inputId} className="text-sm font-semibold">
        {t('universal.codeLabel')}
      </label>
      <Input
        ref={ref}
        id={inputId}
        name="workspace-access-code"
        type="text"
        inputMode="numeric"
        enterKeyHint="go"
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        maxLength={14}
        value={formatWorkspaceAccessCode(value)}
        onChange={(event) => onChange(normalizeWorkspaceAccessCode(event.target.value))}
        aria-invalid={invalid}
        aria-describedby={`${descriptionId}${invalid ? ` ${errorId}` : ''}`}
        placeholder={t('universal.codePlaceholder')}
        className="mt-2 h-14 font-mono text-[clamp(1rem,4.8vw,1.25rem)] tracking-[0.08em] tabular-nums sm:text-xl sm:tracking-[0.12em]"
      />
      <p id={descriptionId} className="mt-2 text-xs leading-5 text-[var(--muted)]">
        {t('universal.codePrivacy')}
      </p>
      {invalid && (
        <p
          id={errorId}
          role="alert"
          className="mt-2 text-sm font-medium text-[var(--danger)]"
        >
          {t('universal.codeIncomplete')}
        </p>
      )}
    </div>
  );
});

WorkspaceAccessCodeInput.displayName = 'WorkspaceAccessCodeInput';
