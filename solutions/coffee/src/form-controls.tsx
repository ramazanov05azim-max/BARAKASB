'use client';

import { ImagePlus, RefreshCw, Trash2 } from 'lucide-react';
import { useId } from 'react';
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

async function imageFileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(String(reader.result ?? '')));
    reader.addEventListener('error', () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}

export function ImageUploadField({
  label,
  value,
  uploadLabel,
  replaceLabel,
  removeLabel,
  previewLabel,
  onChange,
}: {
  label: string;
  value: string;
  uploadLabel: string;
  replaceLabel: string;
  removeLabel: string;
  previewLabel: string;
  onChange: (value: string) => void;
}) {
  const inputId = useId();

  return (
    <div className="sm:col-span-2">
      <span className="mb-2 block text-sm font-semibold">{label}</span>
      <div className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--subtle)] p-4 sm:flex-row sm:items-center">
        <div
          role="img"
          aria-label={previewLabel}
          className="grid aspect-[4/3] w-full max-w-48 place-items-center rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] bg-cover bg-center"
          style={value ? { backgroundImage: `url("${value}")` } : undefined}
        >
          {!value ? <ImagePlus className="size-7 text-[var(--muted)]" /> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            id={inputId}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              void imageFileToDataUrl(file).then(onChange);
              event.target.value = '';
            }}
          />
          <label htmlFor={inputId} className={secondaryButtonClass}>
            {value ? (
              <RefreshCw className="size-4" />
            ) : (
              <ImagePlus className="size-4" />
            )}
            {value ? replaceLabel : uploadLabel}
          </label>
          {value ? (
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
