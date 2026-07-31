'use client';

import * as Dialog from '@radix-ui/react-dialog';
import {
  Bell,
  Building2,
  Check,
  Coffee,
  FileText,
  Languages,
  Palette,
  Save,
  Settings,
  ShieldAlert,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import type { CoffeeSettings } from './domain';
import { useCoffeeTranslation, type CoffeeTranslationKey } from './i18n';
import { useCoffeeWorkspace } from './workspace-store';
import {
  PageHeader,
  Panel,
  PermissionDenied,
  RepositoryErrorState,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
  textareaClass,
} from './ui';

type SettingsSectionKey =
  | 'settings.general'
  | 'settings.branding'
  | 'settings.locations'
  | 'settings.localization'
  | 'settings.taxes'
  | 'settings.receipts'
  | 'settings.modules'
  | 'settings.notifications';

interface SettingsField {
  name: keyof Omit<CoffeeSettings, 'updatedAt'>;
  labelKey: CoffeeTranslationKey;
  type: 'text' | 'time' | 'textarea' | 'select';
  options?: Array<{ value: string; labelKey: CoffeeTranslationKey }>;
}

const sections: Array<{
  key: SettingsSectionKey;
  icon: typeof Settings;
  field: SettingsField;
}> = [
  {
    key: 'settings.general',
    icon: Settings,
    field: {
      name: 'businessDayBoundary',
      labelKey: 'settings.businessDayBoundary',
      type: 'time',
    },
  },
  {
    key: 'settings.branding',
    icon: Palette,
    field: {
      name: 'brandAccent',
      labelKey: 'settings.brandAccent',
      type: 'select',
      options: [
        { value: 'espresso', labelKey: 'settings.accentEspresso' },
        { value: 'neutral', labelKey: 'settings.accentNeutral' },
      ],
    },
  },
  {
    key: 'settings.locations',
    icon: Building2,
    field: {
      name: 'locationPolicy',
      labelKey: 'settings.locationPolicy',
      type: 'select',
      options: [
        { value: 'independent', labelKey: 'settings.locationsIndependent' },
        { value: 'template', labelKey: 'settings.locationsTemplate' },
      ],
    },
  },
  {
    key: 'settings.localization',
    icon: Languages,
    field: {
      name: 'locale',
      labelKey: 'fields.language',
      type: 'select',
      options: [
        { value: 'ru', labelKey: 'common.languageRussian' },
        { value: 'en', labelKey: 'common.languageEnglish' },
      ],
    },
  },
  {
    key: 'settings.taxes',
    icon: FileText,
    field: {
      name: 'taxMode',
      labelKey: 'fields.taxMode',
      type: 'select',
      options: [
        { value: 'standard', labelKey: 'options.standardTax' },
        { value: 'simplified', labelKey: 'options.simplifiedTax' },
      ],
    },
  },
  {
    key: 'settings.receipts',
    icon: FileText,
    field: {
      name: 'receiptFooter',
      labelKey: 'settings.receiptFooter',
      type: 'textarea',
    },
  },
  {
    key: 'settings.modules',
    icon: Coffee,
    field: {
      name: 'enabledModules',
      labelKey: 'settings.enabledModules',
      type: 'text',
    },
  },
  {
    key: 'settings.notifications',
    icon: Bell,
    field: {
      name: 'notificationMode',
      labelKey: 'settings.notificationMode',
      type: 'select',
      options: [
        { value: 'important', labelKey: 'settings.notificationsImportant' },
        { value: 'all', labelKey: 'settings.notificationsAll' },
      ],
    },
  },
];

export function CoffeeSettingsScreen() {
  const { t } = useCoffeeTranslation();
  const { snapshot, error, can, saveSettings } = useCoffeeWorkspace();
  const [selected, setSelected] = useState<SettingsSectionKey>('settings.general');
  const [form, setForm] = useState<CoffeeSettings | null>(
    () => snapshot?.settings ?? null,
  );
  const [fieldError, setFieldError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [dangerDone, setDangerDone] = useState(false);

  if (error) return <RepositoryErrorState />;
  if (!can('settings.manage')) return <PermissionDenied />;
  if (!form) return null;

  const section = sections.find((item) => item.key === selected) ?? sections[0];
  if (!section) return null;
  const field = section.field;
  const fieldValue = String(form[field.name]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!fieldValue.trim()) {
      setFieldError(t('validation.required'));
      return;
    }
    setFieldError('');
    setSubmitting(true);
    try {
      await saveSettings(form);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow={t('settings.eyebrow')}
        title={t('settings.title')}
        description={t('settings.description')}
      />
      <div className="grid gap-5 lg:grid-cols-[250px_1fr]">
        <Panel className="h-fit p-2">
          {sections.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setSelected(item.key);
                  setFieldError('');
                }}
                className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium ${
                  selected === item.key
                    ? 'bg-[var(--action-soft)] text-[var(--action)] dark:bg-[var(--action-soft)] dark:text-[var(--action)]'
                    : 'hover:bg-[var(--action-soft)] dark:hover:bg-white/7'
                }`}
              >
                <Icon className="size-4" />
                {t(item.key)}
              </button>
            );
          })}
        </Panel>
        <div className="space-y-5">
          <Panel className="p-6 sm:p-7">
            <h2 className="text-xl font-semibold">{t(selected)}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)] dark:text-[var(--text-secondary)]">
              {t('settings.sectionHelp')}
            </p>
            <form
              onSubmit={(event) => void handleSubmit(event)}
              className="mt-6"
              noValidate
            >
              <label className="block max-w-2xl">
                <span className="mb-2 block text-sm font-semibold">
                  {t(field.labelKey)}
                </span>
                {field.type === 'textarea' ? (
                  <textarea
                    value={fieldValue}
                    onChange={(event) => {
                      setForm({ ...form, [field.name]: event.target.value });
                      setFieldError('');
                    }}
                    className={textareaClass}
                    aria-invalid={Boolean(fieldError)}
                  />
                ) : field.type === 'select' ? (
                  <select
                    value={fieldValue}
                    onChange={(event) => {
                      setForm({ ...form, [field.name]: event.target.value });
                      setFieldError('');
                    }}
                    className={inputClass}
                    aria-invalid={Boolean(fieldError)}
                  >
                    {field.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {t(option.labelKey)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    value={fieldValue}
                    onChange={(event) => {
                      setForm({ ...form, [field.name]: event.target.value });
                      setFieldError('');
                    }}
                    className={inputClass}
                    aria-invalid={Boolean(fieldError)}
                  />
                )}
                {fieldError ? (
                  <span className="mt-1.5 block text-xs font-medium text-red-600">
                    {fieldError}
                  </span>
                ) : null}
              </label>

              {selected === 'settings.modules' ? (
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {[
                    'settings.modulePos',
                    'settings.moduleKitchen',
                    'settings.moduleInventory',
                    'settings.moduleFinance',
                  ].map((key) => (
                    <div
                      key={key}
                      className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-4 text-sm font-medium dark:border-white/10"
                    >
                      <ShieldAlert className="size-4 text-amber-600" />
                      {t(key as CoffeeTranslationKey)}
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="mt-7 flex justify-end border-t border-[var(--border)] pt-6 dark:border-white/10">
                <button
                  type="submit"
                  disabled={submitting}
                  className={primaryButtonClass}
                >
                  <Save className="size-4" />
                  {submitting ? t('common.saving') : t('common.save')}
                </button>
              </div>
            </form>
          </Panel>

          <Panel className="border-red-200 p-6 dark:border-red-950 sm:p-7">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 size-5 text-red-600" />
              <div>
                <h2 className="text-lg font-semibold">{t('settings.dangerZone')}</h2>
                <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)] dark:text-[var(--text-secondary)]">
                  {t('settings.dangerText')}
                </p>
              </div>
            </div>
            {dangerDone ? (
              <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                <Check className="size-4" />
                {t('settings.mockOperationComplete')}
              </p>
            ) : null}
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700"
              >
                {t('settings.resetSetup')}
              </button>
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                className={secondaryButtonClass}
              >
                {t('settings.archiveConfiguration')}
              </button>
            </div>
          </Panel>
        </div>
      </div>

      <Dialog.Root open={confirmOpen} onOpenChange={setConfirmOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[90] bg-black/35 backdrop-blur-sm" />
          <Dialog.Content className="floating-chrome fixed left-1/2 top-1/2 z-[100] w-[min(92vw,460px)] -translate-x-1/2 -translate-y-1/2 rounded-[24px] p-6">
            <Dialog.Title className="text-xl font-semibold">
              {t('settings.confirmTitle')}
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm leading-6 text-[var(--text-secondary)] dark:text-[var(--text-secondary)]">
              {t('settings.confirmText')}
            </Dialog.Description>
            <div className="mt-6 flex justify-end gap-3">
              <Dialog.Close asChild>
                <button type="button" className={secondaryButtonClass}>
                  {t('common.cancel')}
                </button>
              </Dialog.Close>
              <button
                type="button"
                onClick={() => {
                  setDangerDone(true);
                  setConfirmOpen(false);
                }}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700"
              >
                {t('settings.confirmAction')}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
