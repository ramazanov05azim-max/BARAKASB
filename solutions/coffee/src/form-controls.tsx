'use client';

import { MediaValidationError, type ResolvedMediaUrl } from '@barakasb/frontend-media';
import { ImagePlus, RefreshCw, Trash2 } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import type { FieldOption } from './resource-definitions';
import { secondaryButtonClass } from './ui';

function selectedValues(value: string): Set<string> {
  return new Set(
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

export function ImageUploadField({
  label,
  value,
  uploadLabel,
  replaceLabel,
  removeLabel,
  previewLabel,
  processingLabel,
  unsupportedTypeError,
  fileTooLargeError,
  uploadError,
  legacyPreviewUrl,
  onUpload,
  resolvePreview,
  onChange,
}: {
  label: string;
  value: string;
  uploadLabel: string;
  replaceLabel: string;
  removeLabel: string;
  previewLabel: string;
  processingLabel: string;
  unsupportedTypeError: string;
  fileTooLargeError: string;
  uploadError: string;
  legacyPreviewUrl: string | undefined;
  onUpload: (file: File) => Promise<string>;
  resolvePreview: (assetId: string) => Promise<ResolvedMediaUrl | null>;
  onChange: (value: string) => void;
}) {
  const inputId = useId();
  const [resolvedPreview, setResolvedPreview] = useState<{
    assetId: string;
    url: string;
  } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    let lease: ResolvedMediaUrl | null = null;
    if (!value) {
      return () => {
        active = false;
      };
    }
    void resolvePreview(value)
      .then((resolved) => {
        if (!active) {
          resolved?.release();
          return;
        }
        lease = resolved;
        setResolvedPreview(resolved ? { assetId: value, url: resolved.url } : null);
      })
      .catch(() => {
        if (active) setResolvedPreview(null);
      });
    return () => {
      active = false;
      lease?.release();
    };
  }, [resolvePreview, value]);

  const previewUrl = value
    ? resolvedPreview?.assetId === value
      ? resolvedPreview.url
      : ''
    : (legacyPreviewUrl ?? '');
  const hasImage = Boolean(value || legacyPreviewUrl || previewUrl);

  async function upload(file: File): Promise<void> {
    setProcessing(true);
    setError('');
    try {
      onChange(await onUpload(file));
    } catch (caught) {
      setError(
        caught instanceof MediaValidationError
          ? caught.code === 'unsupported-type'
            ? unsupportedTypeError
            : caught.code === 'file-too-large'
              ? fileTooLargeError
              : uploadError
          : uploadError,
      );
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="sm:col-span-2">
      <span className="mb-2 block text-sm font-semibold">{label}</span>
      <div className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--subtle)] p-4 sm:flex-row sm:items-center">
        <div
          role="img"
          aria-label={previewLabel}
          className="grid aspect-[4/3] w-full max-w-48 place-items-center rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] bg-cover bg-center"
          style={previewUrl ? { backgroundImage: `url("${previewUrl}")` } : undefined}
        >
          {!previewUrl ? <ImagePlus className="size-7 text-[var(--muted)]" /> : null}
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <input
              id={inputId}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={processing}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                void upload(file);
                event.target.value = '';
              }}
            />
            <label htmlFor={inputId} className={secondaryButtonClass}>
              {hasImage ? (
                <RefreshCw className="size-4" />
              ) : (
                <ImagePlus className="size-4" />
              )}
              {processing ? processingLabel : hasImage ? replaceLabel : uploadLabel}
            </label>
            {hasImage ? (
              <button
                type="button"
                className={secondaryButtonClass}
                onClick={() => onChange('')}
              >
                <Trash2 className="size-4" />
                {removeLabel}
              </button>
            ) : null}
          </div>
          {error ? (
            <p role="alert" className="text-sm font-medium text-red-600">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function ReadableMultiSelectField({
  label,
  value,
  options,
  selectedLabel,
  emptyLabel,
  onChange,
}: {
  label: string;
  value: string;
  options: FieldOption[];
  selectedLabel: string;
  emptyLabel: string;
  onChange: (value: string) => void;
}) {
  const selected = selectedValues(value);
  const selectedOptions = options.filter((option) => selected.has(option.value));

  function toggle(optionValue: string, checked: boolean): void {
    const next = new Set(selected);
    if (checked) next.add(optionValue);
    else next.delete(optionValue);
    onChange([...next].join(','));
  }

  return (
    <fieldset className="sm:col-span-2">
      <legend className="mb-2 text-sm font-semibold">{label}</legend>
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-raised)] p-4">
        <div className="flex flex-wrap gap-2">
          {selectedOptions.length > 0 ? (
            <>
              <span className="sr-only">{selectedLabel}</span>
              {selectedOptions.map((option) => (
                <span
                  key={option.value}
                  className="rounded-full bg-[var(--action-soft)] px-3 py-1 text-xs font-semibold text-[var(--action)]"
                >
                  {option.label}
                </span>
              ))}
            </>
          ) : (
            <span className="text-sm text-[var(--muted)]">{emptyLabel}</span>
          )}
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {options.map((option) => (
            <label
              key={option.value}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-[var(--border)] px-3 py-2 text-sm font-medium"
            >
              <input
                type="checkbox"
                checked={selected.has(option.value)}
                onChange={(event) => toggle(option.value, event.target.checked)}
                className="size-4 accent-[var(--action)]"
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>
    </fieldset>
  );
}
