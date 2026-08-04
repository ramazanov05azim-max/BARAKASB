'use client';

import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import type {
  CoffeeSnapshot,
  RecipeComponent,
  RecipeComponentType,
  RecipeTarget,
  RecipeTargetType,
} from './domain';
import { useCoffeeTranslation, type CoffeeTranslationKey } from './i18n';
import { recipeNetQuantity } from './recipe-migration';
import { inputClass, quietButtonClass, secondaryButtonClass } from './ui';

const targetTypes: readonly RecipeTargetType[] = [
  'menu-item',
  'preparation',
  'semi-finished',
];
const componentTypes: readonly RecipeComponentType[] = [
  'ingredient',
  'preparation',
  'semi-finished',
];

function newId(prefix: string): string {
  const suffix =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${suffix}`;
}

function parseTarget(value: string): RecipeTarget {
  try {
    const parsed = JSON.parse(value) as Partial<RecipeTarget>;
    if (parsed.type && targetTypes.includes(parsed.type)) {
      return {
        type: parsed.type,
        id: typeof parsed.id === 'string' ? parsed.id : '',
        name: typeof parsed.name === 'string' ? parsed.name : '',
      };
    }
  } catch {
    // Invalid persisted form state is presented as an empty target.
  }
  return { type: 'menu-item', id: '', name: '' };
}

function parseComponents(value: string): RecipeComponent[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? (parsed as RecipeComponent[]) : [];
  } catch {
    return [];
  }
}

function targetTypeLabel(
  type: RecipeTargetType | RecipeComponentType,
  t: ReturnType<typeof useCoffeeTranslation>['t'],
): string {
  if (type === 'preparation') return t('recipe.targetPreparation');
  if (type === 'semi-finished') return t('recipe.targetSemiFinished');
  if (type === 'menu-item') return t('recipe.targetMenuItem');
  return t('fields.ingredient');
}

export function RecipeTargetField({
  value,
  snapshot,
  error,
  onChange,
}: {
  value: string;
  snapshot: CoffeeSnapshot;
  error: CoffeeTranslationKey | undefined;
  onChange: (value: string) => void;
}) {
  const { t } = useCoffeeTranslation();
  const target = parseTarget(value);
  const update = (next: RecipeTarget) => onChange(JSON.stringify(next));

  return (
    <fieldset className="sm:col-span-2">
      <legend className="mb-2 text-sm font-semibold">
        {t('fields.recipeTarget')}
        <span className="ml-1 text-red-600" aria-hidden="true">
          *
        </span>
      </legend>
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="mb-2 block text-sm font-medium">
            {t('recipe.targetType')}
          </span>
          <select
            aria-label={t('recipe.targetType')}
            value={target.type}
            onChange={(event) =>
              update({
                type: event.target.value as RecipeTargetType,
                id: '',
                name: '',
              })
            }
            className={inputClass}
          >
            {targetTypes.map((type) => (
              <option key={type} value={type}>
                {targetTypeLabel(type, t)}
              </option>
            ))}
          </select>
        </label>

        {target.type === 'menu-item' ? (
          <label>
            <span className="mb-2 block text-sm font-medium">
              {t('fields.menuItem')}
            </span>
            <select
              aria-label={t('fields.menuItem')}
              value={target.id}
              onChange={(event) => {
                const menuItem = snapshot.menuItems.find(
                  (candidate) => candidate.id === event.target.value,
                );
                update({
                  type: 'menu-item',
                  id: menuItem?.id ?? '',
                  name: menuItem?.name ?? '',
                });
              }}
              className={inputClass}
            >
              <option value="">{t('common.notConfigured')}</option>
              {snapshot.menuItems.map((menuItem) => (
                <option key={menuItem.id} value={menuItem.id}>
                  {menuItem.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label>
            <span className="mb-2 block text-sm font-medium">
              {t('recipe.targetName')}
            </span>
            <input
              aria-label={t('recipe.targetName')}
              value={target.name}
              onChange={(event) => update({ ...target, name: event.target.value })}
              className={inputClass}
            />
          </label>
        )}
      </div>
      {error ? (
        <span className="mt-1.5 block text-xs font-medium text-red-600">
          {t(error)}
        </span>
      ) : null}
    </fieldset>
  );
}

export function RecipeComponentsField({
  value,
  snapshot,
  error,
  onChange,
}: {
  value: string;
  snapshot: CoffeeSnapshot;
  error: CoffeeTranslationKey | undefined;
  onChange: (value: string) => void;
}) {
  const { t } = useCoffeeTranslation();
  const components = parseComponents(value);
  const update = (next: RecipeComponent[]) => onChange(JSON.stringify(next));

  const referenceOptions = (type: RecipeComponentType) => {
    if (type === 'ingredient') {
      return snapshot.ingredients.map((ingredient) => ({
        id: ingredient.id,
        name: ingredient.name,
      }));
    }
    return snapshot.recipes
      .filter((recipe) => recipe.target?.type === type)
      .map((recipe) => ({ id: recipe.target.id, name: recipe.target.name }));
  };

  const patchComponent = (index: number, patch: Partial<RecipeComponent>): void => {
    const next = components.map((component, candidateIndex) => {
      if (candidateIndex !== index) return component;
      const patched = { ...component, ...patch };
      return {
        ...patched,
        netQuantity: recipeNetQuantity(
          Number(patched.grossQuantity) || 0,
          Number(patched.lossPercentage) || 0,
        ),
      };
    });
    update(next);
  };

  const move = (index: number, direction: -1 | 1): void => {
    const destination = index + direction;
    if (destination < 0 || destination >= components.length) return;
    const next = [...components];
    const selected = next[index];
    const displaced = next[destination];
    if (!selected || !displaced) return;
    next[index] = displaced;
    next[destination] = selected;
    update(next);
  };

  return (
    <fieldset className="sm:col-span-2">
      <legend className="mb-3 text-sm font-semibold">
        {t('fields.recipeComponents')}
        <span className="ml-1 text-red-600" aria-hidden="true">
          *
        </span>
      </legend>
      <div className="space-y-3">
        {components.map((component, index) => (
          <div
            key={component.id}
            className="rounded-2xl border border-[var(--line)] bg-white/70 p-4 dark:bg-white/[0.03]"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold">
                {index + 1}. {targetTypeLabel(component.type, t)}
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className={quietButtonClass}
                  aria-label={t('recipe.moveUp')}
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  <ArrowUp className="size-4" />
                </button>
                <button
                  type="button"
                  className={quietButtonClass}
                  aria-label={t('recipe.moveDown')}
                  disabled={index === components.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ArrowDown className="size-4" />
                </button>
                <button
                  type="button"
                  className={quietButtonClass}
                  aria-label={t('recipe.removeComponent')}
                  onClick={() =>
                    update(
                      components.filter(
                        (_, candidateIndex) => candidateIndex !== index,
                      ),
                    )
                  }
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <label>
                <span className="mb-1.5 block text-xs font-medium">
                  {t('recipe.componentType')}
                </span>
                <select
                  aria-label={`${t('recipe.componentType')} ${index + 1}`}
                  value={component.type}
                  className={inputClass}
                  onChange={(event) =>
                    patchComponent(index, {
                      type: event.target.value as RecipeComponentType,
                      referenceId: '',
                    })
                  }
                >
                  {componentTypes.map((type) => (
                    <option key={type} value={type}>
                      {targetTypeLabel(type, t)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-medium">
                  {t('recipe.componentReference')}
                </span>
                <select
                  aria-label={`${t('recipe.componentReference')} ${index + 1}`}
                  value={component.referenceId}
                  className={inputClass}
                  onChange={(event) =>
                    patchComponent(index, { referenceId: event.target.value })
                  }
                >
                  <option value="">{t('recipe.selectComponent')}</option>
                  {referenceOptions(component.type).map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-medium">
                  {t('recipe.grossQuantity')}
                </span>
                <input
                  aria-label={`${t('recipe.grossQuantity')} ${index + 1}`}
                  type="number"
                  min="0.000001"
                  step="any"
                  value={component.grossQuantity}
                  className={inputClass}
                  onChange={(event) =>
                    patchComponent(index, {
                      grossQuantity: Number(event.target.value),
                    })
                  }
                />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-medium">
                  {t('recipe.unit')}
                </span>
                <select
                  aria-label={`${t('recipe.unit')} ${index + 1}`}
                  value={component.unitId}
                  className={inputClass}
                  onChange={(event) =>
                    patchComponent(index, { unitId: event.target.value })
                  }
                >
                  <option value="">{t('common.notConfigured')}</option>
                  {snapshot.units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name} ({unit.symbol})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-medium">
                  {t('recipe.lossPercentage')}
                </span>
                <input
                  aria-label={`${t('recipe.lossPercentage')} ${index + 1}`}
                  type="number"
                  min="0"
                  max="100"
                  step="any"
                  value={component.lossPercentage}
                  className={inputClass}
                  onChange={(event) =>
                    patchComponent(index, {
                      lossPercentage: Number(event.target.value),
                    })
                  }
                />
              </label>
            </div>
            <p className="mt-3 text-xs text-[var(--muted)]">
              {t('recipe.netQuantity')}: {component.netQuantity}
            </p>
          </div>
        ))}
      </div>

      <button
        type="button"
        className={`${secondaryButtonClass} mt-3`}
        onClick={() =>
          update([
            ...components,
            {
              id: newId('recipe-component'),
              type: 'ingredient',
              referenceId: '',
              grossQuantity: 1,
              unitId: '',
              lossPercentage: 0,
              netQuantity: 1,
            },
          ])
        }
      >
        <Plus className="size-4" />
        {t('recipe.addComponent')}
      </button>
      {components.length === 0 ? (
        <p className="mt-2 text-xs text-[var(--muted)]">{t('recipe.noComponents')}</p>
      ) : null}
      {error ? (
        <span className="mt-1.5 block text-xs font-medium text-red-600">
          {t(error)}
        </span>
      ) : null}
    </fieldset>
  );
}
