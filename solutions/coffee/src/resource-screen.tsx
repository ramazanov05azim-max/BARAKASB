'use client';

import * as Dialog from '@radix-ui/react-dialog';
import {
  ArrowDownAZ,
  CalendarClock,
  Check,
  Copy,
  Edit3,
  MoreHorizontal,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useId, useMemo, useState, type FormEvent } from 'react';
import type { CollectionEntity, CollectionKey, FormValues } from './domain';
import { ImageUploadField, ReadableMultiSelectField } from './form-controls';
import { useCoffeeTranslation, type CoffeeTranslationKey } from './i18n';
import {
  initialValues,
  resourceDefinitions,
  type FieldDefinition,
} from './resource-definitions';
import { entityToValues, useCoffeeWorkspace } from './workspace-store';
import {
  PageHeader,
  Panel,
  PermissionDenied,
  PreviewBanner,
  RepositoryErrorState,
  StatusBadge,
  inputClass,
  primaryButtonClass,
  quietButtonClass,
  secondaryButtonClass,
  textareaClass,
} from './ui';

interface ValidationErrors {
  [field: string]: CoffeeTranslationKey;
}

export function CoffeeResourceScreen({ kind }: { kind: CollectionKey }) {
  const { t } = useCoffeeTranslation();
  const {
    snapshot,
    error,
    can,
    createResource,
    updateResource,
    duplicateResource,
    toggleResourceStatus,
    setDefaultLocation,
  } = useCoffeeWorkspace();
  const definition = resourceDefinitions[kind];
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sort, setSort] = useState<'name' | 'updated'>('name');
  const [formValues, setFormValues] = useState<FormValues | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [discardPrompt, setDiscardPrompt] = useState(false);
  const [statusTarget, setStatusTarget] = useState<CollectionEntity | null>(null);

  const records = useMemo(() => {
    if (!snapshot) return [];
    const list = [...snapshot[kind]] as CollectionEntity[];
    return list
      .filter((record) => {
        const searchMatch = [
          record.name,
          ...definition.summaryFields.map((field) => {
            const recordValues = entityToValues(record);
            return recordValues[field] ?? '';
          }),
        ]
          .join(' ')
          .toLowerCase()
          .includes(query.toLowerCase().trim());
        const statusMatch = statusFilter === 'all' || record.status === statusFilter;
        return searchMatch && statusMatch;
      })
      .sort((left, right) =>
        sort === 'name'
          ? left.name.localeCompare(right.name)
          : right.updatedAt.localeCompare(left.updatedAt),
      );
  }, [definition.summaryFields, kind, query, snapshot, sort, statusFilter]);

  if (error) return <RepositoryErrorState />;
  if (!snapshot) return null;
  if (!can(definition.readCapability)) return <PermissionDenied />;

  const canManage = can(definition.manageCapability);
  const allRecords = snapshot[kind] as CollectionEntity[];
  const filtered = query.trim() !== '' || statusFilter !== 'all';

  const startCreate = () => {
    setEditingId(null);
    setFormValues(initialValues(definition));
    setErrors({});
    setDirty(false);
    setDiscardPrompt(false);
  };

  const startEdit = (record: CollectionEntity) => {
    setEditingId(record.id);
    setFormValues(entityToValues(record));
    setErrors({});
    setDirty(false);
    setDiscardPrompt(false);
  };

  const closeForm = () => {
    setFormValues(null);
    setEditingId(null);
    setErrors({});
    setDirty(false);
    setDiscardPrompt(false);
  };

  const validate = (values: FormValues): ValidationErrors => {
    const next: ValidationErrors = {};
    for (const field of definition.fields.filter(
      (candidate) => candidate.visibleWhen?.(snapshot) ?? true,
    )) {
      const current = values[field.name]?.trim() ?? '';
      if (field.required && !current) {
        next[field.name] = 'validation.required';
        continue;
      }
      if (
        field.type === 'email' &&
        current &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(current)
      ) {
        next[field.name] = 'validation.email';
      }
      if (field.type === 'tel' && current && !/^[+\d][\d\s()-]{6,}$/.test(current)) {
        next[field.name] = 'validation.phone';
      }
      if (field.type === 'number' && current) {
        const numberValue = Number(current);
        if (!Number.isFinite(numberValue) || numberValue < (field.min ?? 0)) {
          next[field.name] =
            (field.min ?? 0) > 0 ? 'validation.positive' : 'validation.number';
        }
      }
    }
    const minimum = Number(values.minimumSelections ?? 0);
    const maximum = Number(values.maximumSelections ?? 0);
    if (
      kind === 'modifiers' &&
      Number.isFinite(minimum) &&
      Number.isFinite(maximum) &&
      maximum < minimum
    ) {
      next.maximumSelections = 'validation.selectionRange';
    }
    if (kind === 'units' && values.conversionTargetId) {
      const target = snapshot.units.find(
        (unit) => unit.id === values.conversionTargetId,
      );
      const visited = new Set<string>();
      let cursor = target;
      while (cursor) {
        if (
          cursor.id === editingId ||
          visited.has(cursor.id) ||
          cursor.dimension !== values.dimension
        ) {
          next.conversionTargetId = 'validation.circularConversion';
          break;
        }
        visited.add(cursor.id);
        cursor = snapshot.units.find((unit) => unit.id === cursor?.conversionTargetId);
      }
    }
    return next;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!formValues) return;
    const nextErrors = validate(formValues);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setSubmitting(true);
    try {
      if (editingId) await updateResource(kind, editingId, formValues);
      else await createResource(kind, formValues);
      closeForm();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title={t(definition.titleKey)}
        description={t(definition.descriptionKey)}
        action={
          canManage ? (
            <button type="button" onClick={startCreate} className={primaryButtonClass}>
              <Plus className="size-4" />
              {t(definition.addKey)}
            </button>
          ) : undefined
        }
      />
      <PreviewBanner />

      {!canManage ? (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          <p className="font-semibold">{t('resource.permissionReadOnly')}</p>
          <p className="mt-1">{t('resource.permissionReadOnlyText')}</p>
        </div>
      ) : null}

      {formValues ? (
        <Panel className="mb-6 p-5 sm:p-7">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">
                {t(editingId ? 'resource.editTitle' : 'resource.createTitle')}
              </h2>
              {Object.keys(errors).length > 0 ? (
                <p className="mt-2 text-sm font-medium text-red-600" role="alert">
                  {t('resource.formErrors')}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => (dirty ? setDiscardPrompt(true) : closeForm())}
              className={quietButtonClass}
              aria-label={t('common.close')}
            >
              <X className="size-4" />
            </button>
          </div>
          <form onSubmit={(event) => void handleSubmit(event)} noValidate>
            <div className="grid gap-5 sm:grid-cols-2">
              {definition.fields
                .filter((field) => field.visibleWhen?.(snapshot) ?? true)
                .map((field) => (
                  <ResourceField
                    key={field.name}
                    field={field}
                    value={formValues[field.name] ?? ''}
                    error={errors[field.name]}
                    snapshot={snapshot}
                    onChange={(nextValue) => {
                      setFormValues({ ...formValues, [field.name]: nextValue });
                      setDirty(true);
                      if (errors[field.name]) {
                        setErrors((current) => {
                          const next = { ...current };
                          delete next[field.name];
                          return next;
                        });
                      }
                    }}
                  />
                ))}
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
                    onClick={closeForm}
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
                onClick={() => (dirty ? setDiscardPrompt(true) : closeForm())}
                className={secondaryButtonClass}
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={primaryButtonClass}
              >
                <Check className="size-4" />
                {submitting ? t('common.saving') : t('common.save')}
              </button>
            </div>
          </form>
        </Panel>
      ) : null}

      <Panel className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-[var(--border)] p-4 dark:border-white/10 md:flex-row">
          <label className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
            <span className="sr-only">{t('common.search')}</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('resource.searchPlaceholder')}
              className={`${inputClass} pl-10`}
            />
          </label>
          <label className="relative">
            <SlidersHorizontal className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
            <span className="sr-only">{t('common.filter')}</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={`${inputClass} min-w-44 pl-10`}
            >
              <option value="all">{t('resource.statusAll')}</option>
              <option value="active">{t('common.active')}</option>
              <option value="inactive">{t('common.inactive')}</option>
              <option value="draft">{t('common.draft')}</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => setSort(sort === 'name' ? 'updated' : 'name')}
            className={secondaryButtonClass}
          >
            {sort === 'name' ? (
              <ArrowDownAZ className="size-4" />
            ) : (
              <CalendarClock className="size-4" />
            )}
            {t(sort === 'name' ? 'resource.sortName' : 'resource.sortUpdated')}
          </button>
        </div>

        {records.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <MoreHorizontal className="mx-auto size-7 text-[var(--action)] dark:text-[var(--action)]" />
            <h2 className="mt-5 text-xl font-semibold">
              {t(filtered ? 'resource.noResults' : 'resource.noItems')}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--text-secondary)] dark:text-[var(--text-secondary)]">
              {t(filtered ? 'resource.noResultsText' : 'resource.noItemsText')}
            </p>
            {filtered ? (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setStatusFilter('all');
                }}
                className={`${secondaryButtonClass} mt-5`}
              >
                {t('resource.clearFilters')}
              </button>
            ) : canManage ? (
              <button
                type="button"
                onClick={startCreate}
                className={`${primaryButtonClass} mt-5`}
              >
                <Plus className="size-4" />
                {t(definition.addKey)}
              </button>
            ) : null}
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full border-collapse text-left">
                <thead className="sticky top-0 z-10 bg-[var(--surface-raised)] backdrop-blur-xl">
                  <tr className="border-b border-[var(--border)] text-xs text-[var(--text-secondary)] dark:border-white/10 dark:text-[var(--text-secondary)]">
                    <th className="px-5 py-3 font-semibold">{t('common.name')}</th>
                    {definition.summaryFields.slice(0, 2).map((fieldName) => {
                      const field = definition.fields.find(
                        (candidate) => candidate.name === fieldName,
                      );
                      return (
                        <th key={fieldName} className="px-5 py-3 font-semibold">
                          {field ? t(field.labelKey) : fieldName}
                        </th>
                      );
                    })}
                    <th className="px-5 py-3 font-semibold">{t('common.status')}</th>
                    <th className="px-5 py-3 text-right font-semibold">
                      {t('common.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] dark:divide-white/8">
                  {records.map((record) => (
                    <ResourceTableRow
                      key={record.id}
                      record={record}
                      definition={definition}
                      canManage={canManage}
                      isDefault={
                        kind === 'locations' &&
                        snapshot.project.defaultLocationId === record.id
                      }
                      onEdit={() => startEdit(record)}
                      onDuplicate={() =>
                        void duplicateResource(kind, record.id, t('common.copySuffix'))
                      }
                      onStatus={() => setStatusTarget(record)}
                      onDefault={() => void setDefaultLocation(record.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-[var(--border)] md:hidden dark:divide-white/8">
              {records.map((record) => (
                <ResourceMobileCard
                  key={record.id}
                  record={record}
                  definition={definition}
                  canManage={canManage}
                  isDefault={
                    kind === 'locations' &&
                    snapshot.project.defaultLocationId === record.id
                  }
                  onEdit={() => startEdit(record)}
                  onStatus={() => setStatusTarget(record)}
                  onDefault={() => void setDefaultLocation(record.id)}
                />
              ))}
            </div>
          </>
        )}
      </Panel>

      <Dialog.Root
        open={Boolean(statusTarget)}
        onOpenChange={(open) => (!open ? setStatusTarget(null) : undefined)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[90] bg-black/35 backdrop-blur-sm" />
          <Dialog.Content className="floating-chrome fixed left-1/2 top-1/2 z-[100] w-[min(92vw,460px)] -translate-x-1/2 -translate-y-1/2 rounded-[24px] p-6">
            <Dialog.Title className="text-xl font-semibold">
              {t('resource.deactivateConfirm')}
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm leading-6 text-[var(--text-secondary)] dark:text-[var(--text-secondary)]">
              {t('resource.deactivateText')}
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
                  if (statusTarget) {
                    void toggleResourceStatus(kind, statusTarget.id);
                    setStatusTarget(null);
                  }
                }}
                className={primaryButtonClass}
              >
                {t('common.confirm')}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <span className="sr-only">{allRecords.length}</span>
    </>
  );
}

function ResourceField({
  field,
  value,
  error,
  snapshot,
  onChange,
}: {
  field: FieldDefinition;
  value: string;
  error: CoffeeTranslationKey | undefined;
  snapshot: NonNullable<ReturnType<typeof useCoffeeWorkspace>['snapshot']>;
  onChange: (value: string) => void;
}) {
  const { t } = useCoffeeTranslation();
  const inputId = useId();
  const options = field.optionsFrom?.(snapshot) ?? field.options;
  if (field.type === 'image') {
    return (
      <ImageUploadField
        label={t(field.labelKey)}
        value={value}
        uploadLabel={t('form.imageUpload')}
        replaceLabel={t('form.imageReplace')}
        removeLabel={t('form.imageRemove')}
        previewLabel={t('form.imagePreview')}
        onChange={onChange}
      />
    );
  }
  if (field.type === 'multi-select') {
    const normalizedValue =
      field.name === 'locationAvailability'
        ? value
            .split(',')
            .map((token) => token.trim())
            .filter(Boolean)
            .map(
              (token) =>
                snapshot.locations.find(
                  (location) => location.id === token || location.name === token,
                )?.id ?? token,
            )
            .join(',')
        : value;
    return (
      <ReadableMultiSelectField
        label={t(field.labelKey)}
        value={normalizedValue}
        options={(options ?? []).map((option) => ({
          ...option,
          label: option.labelKey ? t(option.labelKey) : (option.label ?? ''),
        }))}
        selectedLabel={t('form.selectedValues')}
        emptyLabel={t('form.noValuesSelected')}
        onChange={onChange}
      />
    );
  }
  const selectOptions =
    field.name === 'status' &&
    value === 'draft' &&
    !options?.some((option) => option.value === 'draft')
      ? options?.map((option) =>
          option.value === 'inactive' ? { ...option, value: 'draft' } : option,
        )
      : options;
  return (
    <label className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
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
          id={inputId}
          aria-label={t(field.labelKey)}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={textareaClass}
          aria-invalid={Boolean(error)}
        />
      ) : field.type === 'select' ? (
        <select
          id={inputId}
          aria-label={t(field.labelKey)}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={inputClass}
          aria-invalid={Boolean(error)}
        >
          {!value ? <option value="">{t('common.notConfigured')}</option> : null}
          {selectOptions?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.labelKey ? t(option.labelKey) : option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={inputId}
          aria-label={t(field.labelKey)}
          type={field.type}
          min={field.min}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={inputClass}
          aria-invalid={Boolean(error)}
        />
      )}
      {error ? (
        <span className="mt-1.5 block text-xs font-medium text-red-600">
          {t(error)}
        </span>
      ) : null}
      {field.helperKey && !error ? (
        <span className="mt-1.5 block text-xs leading-5 text-[var(--muted)]">
          {t(field.helperKey)}
        </span>
      ) : null}
    </label>
  );
}

function ResourceTableRow({
  record,
  definition,
  canManage,
  isDefault,
  onEdit,
  onDuplicate,
  onStatus,
  onDefault,
}: {
  record: CollectionEntity;
  definition: (typeof resourceDefinitions)[CollectionKey];
  canManage: boolean;
  isDefault: boolean;
  onEdit: () => void;
  onDuplicate: () => void;
  onStatus: () => void;
  onDefault: () => void;
}) {
  const { t } = useCoffeeTranslation();
  const values = entityToValues(record);
  return (
    <tr className="transition hover:bg-blue-50/45">
      <td className="px-5 py-4">
        <p className="text-sm font-semibold">{record.name}</p>
        {isDefault ? (
          <span className="mt-1 inline-flex text-xs font-medium text-[var(--action)] dark:text-[var(--action)]">
            {t('common.default')}
          </span>
        ) : null}
      </td>
      {definition.summaryFields.slice(0, 2).map((fieldName) => (
        <td
          key={fieldName}
          className="max-w-56 truncate px-5 py-4 text-sm text-[var(--text-secondary)] dark:text-[var(--text-secondary)]"
        >
          {values[fieldName] || '—'}
        </td>
      ))}
      <td className="px-5 py-4">
        <StatusBadge status={record.status} />
      </td>
      <td className="px-5 py-4">
        <div className="flex justify-end gap-1">
          {canManage && !isDefault && definition.kind === 'locations' ? (
            <button type="button" onClick={onDefault} className={quietButtonClass}>
              {t('locations.setDefault')}
            </button>
          ) : null}
          {canManage && definition.duplicate ? (
            <button
              type="button"
              onClick={onDuplicate}
              className={quietButtonClass}
              aria-label={t('common.duplicate')}
            >
              <Copy className="size-4" />
            </button>
          ) : null}
          {canManage ? (
            <>
              <button
                type="button"
                onClick={onEdit}
                className={quietButtonClass}
                aria-label={t('common.edit')}
              >
                <Edit3 className="size-4" />
              </button>
              <button type="button" onClick={onStatus} className={quietButtonClass}>
                {t(
                  record.status === 'active' ? 'common.deactivate' : 'common.activate',
                )}
              </button>
            </>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

function ResourceMobileCard({
  record,
  definition,
  canManage,
  isDefault,
  onEdit,
  onStatus,
  onDefault,
}: {
  record: CollectionEntity;
  definition: (typeof resourceDefinitions)[CollectionKey];
  canManage: boolean;
  isDefault: boolean;
  onEdit: () => void;
  onStatus: () => void;
  onDefault: () => void;
}) {
  const { t } = useCoffeeTranslation();
  const values = entityToValues(record);
  return (
    <article className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold">{record.name}</h2>
          {isDefault ? (
            <p className="mt-1 text-xs font-medium text-[var(--action)] dark:text-[var(--action)]">
              {t('common.default')}
            </p>
          ) : null}
        </div>
        <StatusBadge status={record.status} />
      </div>
      <dl className="mt-4 grid gap-3 text-sm">
        {definition.summaryFields.slice(0, 3).map((fieldName) => {
          const field = definition.fields.find(
            (candidate) => candidate.name === fieldName,
          );
          return (
            <div key={fieldName} className="flex justify-between gap-4">
              <dt className="text-[var(--text-secondary)] dark:text-[var(--text-secondary)]">
                {field ? t(field.labelKey) : fieldName}
              </dt>
              <dd className="max-w-[55%] truncate text-right font-medium">
                {values[fieldName] || '—'}
              </dd>
            </div>
          );
        })}
      </dl>
      {canManage ? (
        <div className="mt-5 flex flex-wrap gap-2 border-t border-[var(--border)] pt-4">
          {!isDefault && definition.kind === 'locations' ? (
            <button type="button" onClick={onDefault} className={secondaryButtonClass}>
              {t('locations.setDefault')}
            </button>
          ) : null}
          <button type="button" onClick={onEdit} className={secondaryButtonClass}>
            <Edit3 className="size-4" />
            {t('common.edit')}
          </button>
          <button type="button" onClick={onStatus} className={secondaryButtonClass}>
            {t(record.status === 'active' ? 'common.deactivate' : 'common.activate')}
          </button>
        </div>
      ) : null}
    </article>
  );
}
