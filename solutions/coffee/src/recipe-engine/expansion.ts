import type {
  CoffeeOperationalSnapshot,
  ModifierConsumptionEffect,
  Recipe,
  RecipeComponentType,
  StockedResourceType,
} from '../domain';

export interface ExpandedRecipeRequirement {
  readonly resourceId: string;
  readonly resourceType: StockedResourceType;
  readonly quantityBase: number;
  readonly baseUnit: 'g' | 'ml' | 'pc';
}

export type RecipeExpansionResult =
  | {
      readonly ok: true;
      readonly requirements: ReadonlyArray<ExpandedRecipeRequirement>;
    }
  | { readonly ok: false; readonly code: 'RECIPE_NOT_FOUND' | 'RECIPE_CYCLE' };

function baseUnit(
  snapshot: CoffeeOperationalSnapshot,
  resourceId: string,
): 'g' | 'ml' | 'pc' {
  const ingredient = snapshot.ingredients.find((item) => item.id === resourceId);
  if (ingredient?.accountingType === 'volume') return 'ml';
  if (ingredient?.accountingType === 'pieces') return 'pc';
  const unit = snapshot.units.find((item) => item.id === ingredient?.baseUnitId);
  if (unit?.dimension === 'volume') return 'ml';
  if (unit?.dimension === 'count') return 'pc';
  return 'g';
}

function toBase(
  snapshot: CoffeeOperationalSnapshot,
  quantity: number,
  unitId: string,
): number {
  const unit = snapshot.units.find((candidate) => candidate.id === unitId);
  if (!unit) return quantity;
  return quantity * unit.conversionRate;
}

function targetRecipe(
  snapshot: CoffeeOperationalSnapshot,
  type: Exclude<RecipeComponentType, 'ingredient'>,
  id: string,
): Recipe | null {
  return (
    snapshot.recipes.find(
      (recipe) =>
        recipe.status === 'active' &&
        recipe.target.type === type &&
        recipe.target.id === id,
    ) ?? null
  );
}

export function expandCoffeeRecipe(input: {
  readonly snapshot: CoffeeOperationalSnapshot;
  readonly productId: string;
  readonly quantity: number;
  readonly selectedModifiers: ReadonlyArray<{
    readonly modifierGroupId: string;
    readonly optionName: string;
  }>;
}): RecipeExpansionResult {
  const { snapshot } = input;
  const item = snapshot.menuItems.find((candidate) => candidate.id === input.productId);
  const initial = item?.recipeId
    ? snapshot.recipes.find(
        (recipe) => recipe.id === item.recipeId && recipe.status === 'active',
      )
    : undefined;
  if (!item || !initial) return { ok: false, code: 'RECIPE_NOT_FOUND' };

  const totals = new Map<string, ExpandedRecipeRequirement>();
  const add = (
    resourceId: string,
    resourceType: StockedResourceType,
    quantityBase: number,
  ): void => {
    const key = `${resourceType}:${resourceId}`;
    const existing = totals.get(key);
    totals.set(key, {
      resourceId,
      resourceType,
      baseUnit: baseUnit(snapshot, resourceId),
      quantityBase: (existing?.quantityBase ?? 0) + quantityBase,
    });
  };

  const visit = (
    recipe: Recipe,
    requestedOutput: number,
    path: ReadonlySet<string>,
  ): boolean => {
    if (path.has(recipe.id)) return false;
    const nextPath = new Set(path).add(recipe.id);
    const ratio = requestedOutput / recipe.outputQuantity;
    for (const component of recipe.components) {
      const quantity =
        component.grossQuantity * (1 + component.lossPercentage / 100) * ratio;
      if (component.type === 'ingredient') {
        add(
          component.referenceId,
          'ingredient',
          toBase(snapshot, quantity, component.unitId),
        );
        continue;
      }
      const nested = targetRecipe(snapshot, component.type, component.referenceId);
      if (nested) {
        if (!visit(nested, quantity, nextPath)) return false;
        continue;
      }
      if (
        snapshot.ingredients.some((resource) => resource.id === component.referenceId)
      ) {
        add(
          component.referenceId,
          component.type,
          toBase(snapshot, quantity, component.unitId),
        );
        continue;
      }
      throw new Error('recipe-not-found');
    }
    return true;
  };

  try {
    if (!visit(initial, input.quantity, new Set())) {
      return { ok: false, code: 'RECIPE_CYCLE' };
    }
  } catch {
    return { ok: false, code: 'RECIPE_NOT_FOUND' };
  }

  const effects: ModifierConsumptionEffect[] = input.selectedModifiers.flatMap(
    (selection) => {
      const group = snapshot.modifiers.find(
        (candidate) => candidate.id === selection.modifierGroupId,
      );
      return (group?.consumptionEffects ?? []).filter(
        (effect) => effect.optionName === selection.optionName,
      );
    },
  );
  for (const effect of effects) {
    if (effect.mode === 'replace' && effect.replacesResourceId) {
      for (const [key, requirement] of totals) {
        if (requirement.resourceId === effect.replacesResourceId) totals.delete(key);
      }
    }
    add(
      effect.resourceId,
      effect.resourceType,
      toBase(snapshot, effect.quantity * input.quantity, effect.unitId),
    );
  }
  return { ok: true, requirements: [...totals.values()] };
}
