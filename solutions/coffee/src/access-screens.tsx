'use client';

import { Check, LockKeyhole, ShieldCheck, UserRoundPlus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import type { CoffeeRoleId } from './domain';
import { useCoffeeTranslation, type CoffeeTranslationKey } from './i18n';
import { useCoffeeWorkspace } from './workspace-store';
import {
  PageHeader,
  Panel,
  PermissionDenied,
  RepositoryErrorState,
  inputClass,
  primaryButtonClass,
} from './ui';

export function CoffeeRolesScreen() {
  const { t } = useCoffeeTranslation();
  const { snapshot, error, can, assignRole } = useCoffeeWorkspace();
  const [employeeId, setEmployeeId] = useState('');
  const [roleId, setRoleId] = useState<CoffeeRoleId | ''>('');
  const [submitting, setSubmitting] = useState(false);

  if (error) return <RepositoryErrorState />;
  if (!snapshot) return null;
  if (!can('roles.read')) return <PermissionDenied />;

  const canAssign = can('roles.assign');

  const handleAssign = async (event: FormEvent) => {
    event.preventDefault();
    if (!employeeId) return;
    setSubmitting(true);
    try {
      await assignRole(employeeId, roleId || null);
      setEmployeeId('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader title={t('roles.title')} description={t('roles.description')} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {snapshot.roles.map((role) => (
          <Panel key={role.id} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <span className="grid size-10 place-items-center rounded-xl bg-[#f1e7de] text-[#6f442d] dark:bg-[#4a3023] dark:text-[#ecc7a8]">
                <ShieldCheck className="size-4" />
              </span>
              <span className="rounded-full bg-black/5 px-2.5 py-1 text-xs font-semibold dark:bg-white/8">
                {role.assignmentCount} · {t('roles.assignmentCount')}
              </span>
            </div>
            <h2 className="mt-5 font-semibold">
              {t(role.nameKey as CoffeeTranslationKey)}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#766b61] dark:text-[#aaa096]">
              {t(role.descriptionKey as CoffeeTranslationKey)}
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {role.capabilities.slice(0, 4).map((capability) => (
                <code
                  key={capability}
                  className="rounded-md bg-black/5 px-2 py-1 text-[11px] dark:bg-white/8"
                >
                  {capability}
                </code>
              ))}
              {role.capabilities.length > 4 ? (
                <span className="px-1 py-1 text-xs text-[#766b61] dark:text-[#aaa096]">
                  +{role.capabilities.length - 4}
                </span>
              ) : null}
            </div>
          </Panel>
        ))}
      </div>

      {canAssign ? (
        <Panel className="mt-6 max-w-3xl p-6">
          <div className="flex items-start gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[#f1e7de] text-[#6f442d] dark:bg-[#4a3023] dark:text-[#ecc7a8]">
              <UserRoundPlus className="size-4" />
            </span>
            <div>
              <h2 className="font-semibold">{t('roles.assign')}</h2>
              <p className="mt-1 text-sm text-[#766b61] dark:text-[#aaa096]">
                {snapshot.employees.length
                  ? t('roles.description')
                  : t('roles.noEmployees')}
              </p>
            </div>
          </div>
          <form
            onSubmit={(event) => void handleAssign(event)}
            className="mt-6 grid gap-4 sm:grid-cols-[1fr_1fr_auto]"
          >
            <label>
              <span className="mb-2 block text-sm font-semibold">
                {t('roles.selectEmployee')}
              </span>
              <select
                value={employeeId}
                onChange={(event) => setEmployeeId(event.target.value)}
                className={inputClass}
                required
              >
                <option value="">{t('common.notConfigured')}</option>
                {snapshot.employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.fullName}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-2 block text-sm font-semibold">
                {t('roles.selectRole')}
              </span>
              <select
                value={roleId}
                onChange={(event) => setRoleId(event.target.value as CoffeeRoleId)}
                className={inputClass}
              >
                <option value="">{t('roles.removeAssignment')}</option>
                {snapshot.roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {t(role.nameKey as CoffeeTranslationKey)}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              disabled={!employeeId || submitting}
              className={`${primaryButtonClass} self-end`}
            >
              <Check className="size-4" />
              {submitting ? t('common.saving') : t('roles.assign')}
            </button>
          </form>
        </Panel>
      ) : null}
    </>
  );
}

export function CoffeePermissionsScreen() {
  const { t } = useCoffeeTranslation();
  const { snapshot, error, can } = useCoffeeWorkspace();

  if (error) return <RepositoryErrorState />;
  if (!snapshot) return null;
  if (!can('roles.read')) return <PermissionDenied />;

  return (
    <>
      <PageHeader
        title={t('permissions.title')}
        description={t('permissions.description')}
      />
      <div className="mb-5 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
        <LockKeyhole className="mt-0.5 size-4 shrink-0" />
        {t('permissions.disclaimer')}
      </div>
      <Panel className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[1080px] w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-black/8 text-xs text-[#766b61] dark:border-white/10 dark:text-[#aaa096]">
                <th className="sticky left-0 bg-[#fffefa] px-5 py-4 font-semibold dark:bg-[#1c1916]">
                  {t('common.details')}
                </th>
                {snapshot.roles.map((role) => (
                  <th key={role.id} className="px-4 py-4 text-center font-semibold">
                    {t(role.nameKey as CoffeeTranslationKey)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/7 dark:divide-white/8">
              {snapshot.permissions.map((permission) => (
                <tr key={`${permission.moduleKey}-${permission.capabilityKey}`}>
                  <td className="sticky left-0 bg-[#fffefa] px-5 py-4 dark:bg-[#1c1916]">
                    <p className="text-sm font-semibold">
                      {t(permission.moduleKey as CoffeeTranslationKey)}
                    </p>
                    <code className="mt-1 block text-[11px] text-[#766b61] dark:text-[#aaa096]">
                      {permission.capabilityKey}
                    </code>
                  </td>
                  {snapshot.roles.map((role) => {
                    const grant = permission.grants[role.id];
                    return (
                      <td key={role.id} className="px-4 py-4 text-center">
                        <span
                          className={`inline-flex min-h-7 items-center rounded-full px-2.5 text-[11px] font-semibold ${
                            grant === 'allowed'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : grant === 'limited'
                                ? 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-black/5 text-[#766b61] dark:bg-white/8 dark:text-[#aaa096]'
                          }`}
                        >
                          {t(
                            grant === 'allowed'
                              ? 'permissions.allowed'
                              : grant === 'limited'
                                ? 'permissions.limited'
                                : 'permissions.denied',
                          )}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
