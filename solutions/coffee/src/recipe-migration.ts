import type {
  MenuItem,
  Recipe,
  RecipeComponent,
  RecipeComponentType,
  RecipeTarget,
  RecipeTargetType,
} from './domain';

interface LegacyRecipeRecord {
  id?: unknown;
  name?: unknown;
  status?: unknown;
  updatedAt?: unknown;
  menuItemId?: unknown;
  outputQuantity?: unknown;
  outputUnitId?: unknown;
  preparationInstructions?: unknown;
  ingredientId?: unknown;
  ingredientQuantity?: unknown;
  ingredientUnitId?: unknown;
  wastePercentage?: unknown;
  ingredientRows?: unknown;
  version?: unknown;
  effectiveDate?: unknown;
  preparationLocationId?: unknown;
  calculatedCost?: unknown;
  salePrice?: unknown;
  grossMargin?: unknown;
  target?: unknown;
  components?: unknown;
}

export interface RecipeMigrationResult {
  recipes: Recipe[];
  migratedCount: number;
  failedCount: number;
}

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

export function recipeNetQuantity(
  grossQuantity: number,
  lossPercentage: number,
): number {
  return Number((grossQuantity * (1 - lossPercentage / 100)).toFixed(6));
}

export function recipeTitle(target: RecipeTarget): string {
  return `Техкарта · ${target.name.trim()}`;
}

function numberValue(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function validTarget(value: unknown): value is RecipeTarget {
  if (!value || typeof value !== 'object') return false;
  const target = value as Record<string, unknown>;
  return (
    targetTypes.includes(target.type as RecipeTargetType) &&
    typeof target.id === 'string' &&
    Boolean(target.id.trim()) &&
    typeof target.name === 'string' &&
    Boolean(target.name.trim())
  );
}

function validComponent(value: unknown): value is RecipeComponent {
  if (!value || typeof value !== 'object') return false;
  const component = value as Record<string, unknown>;
  return (
    typeof component.id === 'string' &&
    componentTypes.includes(component.type as RecipeComponentType) &&
    typeof component.referenceId === 'string' &&
    Boolean(component.referenceId.trim()) &&
    typeof component.unitId === 'string' &&
    Boolean(component.unitId.trim()) &&
    numberValue(component.grossQuantity) !== null &&
    Number(component.grossQuantity) > 0 &&
    numberValue(component.lossPercentage) !== null &&
    Number(component.lossPercentage) >= 0 &&
    Number(component.lossPercentage) <= 100
  );
}

function normalizedCurrentRecipe(record: LegacyRecipeRecord): Recipe | null {
  if (!validTarget(record.target) || !Array.isArray(record.components)) return null;
  if (!record.components.every(validComponent)) return null;
  const components = record.components.map((component) => ({
    ...component,
    netQuantity: recipeNetQuantity(component.grossQuantity, component.lossPercentage),
  }));
  return {
    ...(record as unknown as Recipe),
    name: recipeTitle(record.target),
    target: record.target,
    components,
  };
}

function legacyComponents(record: LegacyRecipeRecord): RecipeComponent[] | null {
  const rows = Array.isArray(record.ingredientRows)
    ? record.ingredientRows
    : record.ingredientId
      ? [
          {
            ingredientId: record.ingredientId,
            quantity: record.ingredientQuantity,
            unitId: record.ingredientUnitId,
          },
        ]
      : [];
  if (rows.length === 0) return null;
  const defaultLoss = numberValue(record.wastePercentage) ?? 0;
  const result: RecipeComponent[] = [];
  for (const [index, value] of rows.entries()) {
    if (!value || typeof value !== 'object') return null;
    const row = value as Record<string, unknown>;
    const referenceId =
      typeof row.ingredientId === 'string' ? row.ingredientId.trim() : '';
    const grossQuantity = numberValue(row.quantity);
    const unitId = typeof row.unitId === 'string' ? row.unitId.trim() : '';
    if (!referenceId || grossQuantity === null || grossQuantity <= 0 || !unitId) {
      return null;
    }
    const lossPercentage = index === 0 ? defaultLoss : 0;
    result.push({
      id: `component-${String(index + 1).padStart(2, '0')}-${referenceId}`,
      type: 'ingredient',
      referenceId,
      grossQuantity,
      unitId,
      lossPercentage,
      netQuantity: recipeNetQuantity(grossQuantity, lossPercentage),
    });
  }
  return result;
}

function migrateOne(
  record: LegacyRecipeRecord,
  menuItems: readonly MenuItem[],
): Recipe | null {
  const current = normalizedCurrentRecipe(record);
  if (current) return current;
  const menuItemId =
    typeof record.menuItemId === 'string' ? record.menuItemId.trim() : '';
  const menuItem = menuItems.find((candidate) => candidate.id === menuItemId);
  const components = legacyComponents(record);
  if (!menuItem || !components) return null;
  const target: RecipeTarget = {
    type: 'menu-item',
    id: menuItem.id,
    name: menuItem.name,
  };
  const preserved = { ...record };
  delete preserved.menuItemId;
  delete preserved.ingredientId;
  delete preserved.ingredientQuantity;
  delete preserved.ingredientUnitId;
  delete preserved.wastePercentage;
  delete preserved.ingredientRows;
  return {
    ...(preserved as unknown as Recipe),
    name: recipeTitle(target),
    target,
    components,
  };
}

export function migrateLegacyRecipes(
  records: readonly unknown[],
  menuItems: readonly MenuItem[],
): RecipeMigrationResult {
  let migratedCount = 0;
  let failedCount = 0;
  const recipes = records.map((value) => {
    const record = value as LegacyRecipeRecord;
    const alreadyCurrent =
      validTarget(record.target) && Array.isArray(record.components);
    const migrated = migrateOne(record, menuItems);
    if (!migrated) {
      failedCount += 1;
      return value as Recipe;
    }
    if (!alreadyCurrent) migratedCount += 1;
    return migrated;
  });
  return { recipes, migratedCount, failedCount };
}
