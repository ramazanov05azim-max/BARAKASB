'use client';

import { Save } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import type { BusinessProfile } from './domain';
import { useCoffeeTranslation, type CoffeeTranslationKey } from './i18n';
import { useCoffeeWorkspace } from './workspace-store';
import {
  PageHeader,
  Panel,
  RepositoryErrorState,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
  textareaClass,
} from './ui';

type ProfileField = {
  name: keyof Omit<BusinessProfile, 'updatedAt'>;
  labelKey: CoffeeTranslationKey;
  type: 'text' | 'textarea' | 'select';
  required?: boolean;
  options?: Array<{
    value: string;
    label?: string;
    labelKey?: CoffeeTranslationKey;
  }>;
};

const fields: ProfileField[] = [
  {
    name: 'businessName',
    labelKey: 'fields.businessName',
    type: 'text',
    required: true,
  },
  { name: 'legalName', labelKey: 'fields.legalName', type: 'text', required: true },
  { name: 'brandName', labelKey: 'fields.brandName', type: 'text', required: true },
  { name: 'description', labelKey: 'fields.description', type: 'textarea' },
  { name: 'logoPlaceholder', labelKey: 'fields.logoPlaceholder', type: 'text' },
  {
    name: 'defaultCurrency',
    labelKey: 'fields.defaultCurrency',
    type: 'select',
    required: true,
    options: [
      { value: 'RUB', label: 'RUB' },
      { value: 'USD', label: 'USD' },
      { value: 'EUR', label: 'EUR' },
    ],
  },
  { name: 'timezone', labelKey: 'fields.timezone', type: 'text', required: true },
  { name: 'country', labelKey: 'fields.country', type: 'text', required: true },
  {
    name: 'language',
    labelKey: 'fields.language',
    type: 'select',
    required: true,
    options: [
      { value: 'ru', labelKey: 'common.languageRussian' },
      { value: 'en', labelKey: 'common.languageEnglish' },
    ],
  },
  {
    name: 'taxMode',
    labelKey: 'fields.taxMode',
    type: 'select',
    required: true,
    options: [
      { value: 'standard', labelKey: 'options.standardTax' },
      { value: 'simplified', labelKey: 'options.simplifiedTax' },
    ],
  },
  {
    name: 'receiptInformation',
    labelKey: 'fields.receiptInformation',
    type: 'textarea',
  },
  {
    name: 'contactInformation',
    labelKey: 'fields.contactInformation',
    type: 'textarea',
    required: true,
  },
  {
    name: 'businessAddress',
    labelKey: 'fields.businessAddress',
    type: 'textarea',
    required: true,
  },
];

export function BusinessProfileScreen() {
  const { t } = useCoffeeTranslation();
  const { snapshot, error, can, saveBusinessProfile } = useCoffeeWorkspace();
  const [form, setForm] = useState<BusinessProfile | null>(
    () => snapshot?.businessProfile ?? null,
  );
  const [errors, setErrors] = useState<
    Partial<Record<keyof BusinessProfile, CoffeeTranslationKey>>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [discardPrompt, setDiscardPrompt] = useState(false);

  if (error) return <RepositoryErrorState />;
  if (!form) return null;

  const canManage = can('project.manage') || can('settings.manage');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: Partial<Record<keyof BusinessProfile, CoffeeTranslationKey>> = {};
    for (const field of fields) {
      if (field.required && !String(form[field.name]).trim()) {
        nextErrors[field.name] = 'validation.required';
      }
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setSubmitting(true);
    try {
      await saveBusinessProfile(form);
      setDirty(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow={t('profile.eyebrow')}
        title={t('profile.title')}
        description={t('profile.description')}
      />
      <Panel className="max-w-4xl p-5 sm:p-7">
        <form onSubmit={(event) => void handleSubmit(event)} noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            {fields.map((field) => {
              const fieldError = errors[field.name];
              return (
                <label
                  key={field.name}
                  className={
                    field.type === 'textarea' ||
                    field.name === 'description' ||
                    field.name === 'logoPlaceholder'
                      ? 'sm:col-span-2'
                      : ''
                  }
                >
                  <span className="mb-2 block text-sm font-semibold">
                    {t(field.labelKey)}
                    {field.required ? (
                      <span className="ml-1 text-red-600" aria-hidden="true">
                        *
                      </span>
                    ) : null}
                  </span>
                  {field.type === 'textarea' ? (
                    <textarea
                      value={String(form[field.name])}
                      disabled={!canManage}
                      onChange={(event) => {
                        setForm({ ...form, [field.name]: event.target.value });
                        setDirty(true);
                      }}
                      className={textareaClass}
                      aria-invalid={Boolean(fieldError)}
                    />
                  ) : field.type === 'select' ? (
                    <select
                      value={String(form[field.name])}
                      disabled={!canManage}
                      onChange={(event) => {
                        setForm({ ...form, [field.name]: event.target.value });
                        setDirty(true);
                      }}
                      className={inputClass}
                      aria-invalid={Boolean(fieldError)}
                    >
                      {field.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.labelKey ? t(option.labelKey) : option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={String(form[field.name])}
                      disabled={!canManage}
                      onChange={(event) => {
                        setForm({ ...form, [field.name]: event.target.value });
                        setDirty(true);
                      }}
                      className={inputClass}
                      aria-invalid={Boolean(fieldError)}
                    />
                  )}
                  {field.name === 'logoPlaceholder' ? (
                    <span className="mt-1.5 block text-xs text-[var(--text-secondary)] dark:text-[var(--text-secondary)]">
                      {t('profile.logoHelp')}
                    </span>
                  ) : null}
                  {fieldError ? (
                    <span className="mt-1.5 block text-xs font-medium text-red-600">
                      {t(fieldError)}
                    </span>
                  ) : null}
                </label>
              );
            })}
          </div>

          {discardPrompt ? (
            <div className="mt-6 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm sm:flex-row sm:items-center dark:border-amber-900 dark:bg-amber-950/30">
              <span className="font-medium">{t('resource.unsaved')}</span>
              <div className="ml-auto flex gap-2">
                <button
                  type="button"
                  onClick={() => setDiscardPrompt(false)}
                  className={secondaryButtonClass}
                >
                  {t('resource.keepEditing')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setForm(snapshot?.businessProfile ?? form);
                    setDirty(false);
                    setDiscardPrompt(false);
                  }}
                  className={secondaryButtonClass}
                >
                  {t('resource.discard')}
                </button>
              </div>
            </div>
          ) : null}

          <div className="mt-7 flex flex-wrap justify-end gap-3 border-t border-[var(--border)] pt-6 dark:border-white/10">
            <button
              type="button"
              disabled={!dirty}
              onClick={() => (dirty ? setDiscardPrompt(true) : undefined)}
              className={secondaryButtonClass}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={!canManage || submitting}
              className={primaryButtonClass}
            >
              <Save className="size-4" />
              {submitting ? t('common.saving') : t('profile.save')}
            </button>
          </div>
        </form>
      </Panel>
    </>
  );
}
