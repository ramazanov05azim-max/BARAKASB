import type { Ingredient, UnitOfMeasure } from './domain';

export type IngredientAccountingType = 'weight' | 'volume' | 'pieces';

export interface IngredientMigrationResult {
  ingredients: Ingredient[];
  migratedCount: number;
}

const accountingTypeByDimension: Record<string, IngredientAccountingType | undefined> =
  {
    mass: 'weight',
    volume: 'volume',
    count: 'pieces',
  };

export function accountingTypeForBaseUnit(
  baseUnitId: string,
  units: ReadonlyArray<UnitOfMeasure>,
): IngredientAccountingType | null {
  const dimension = units.find((unit) => unit.id === baseUnitId)?.dimension;
  return dimension ? (accountingTypeByDimension[dimension] ?? null) : null;
}

export function baseUnitForAccountingType(
  accountingType: IngredientAccountingType,
  units: ReadonlyArray<UnitOfMeasure>,
): UnitOfMeasure | null {
  const dimension =
    accountingType === 'weight'
      ? 'mass'
      : accountingType === 'volume'
        ? 'volume'
        : 'count';
  const preferredSymbols =
    accountingType === 'weight'
      ? ['g', 'г']
      : accountingType === 'volume'
        ? ['ml', 'мл']
        : ['pc', 'pcs', 'шт', 'шт.'];
  return (
    units.find(
      (unit) =>
        unit.dimension === dimension &&
        preferredSymbols.includes(unit.symbol.trim().toLocaleLowerCase()),
    ) ??
    units.find((unit) => unit.dimension === dimension) ??
    null
  );
}

export function migrateLegacyIngredients(
  ingredients: ReadonlyArray<Ingredient>,
  units: ReadonlyArray<UnitOfMeasure>,
): IngredientMigrationResult {
  let migratedCount = 0;
  const migrated = ingredients.map((ingredient) => {
    if (
      ingredient.accountingType &&
      Number.isFinite(ingredient.purchasePackageSize) &&
      Number(ingredient.purchasePackageSize) > 0 &&
      typeof ingredient.barcode === 'string'
    ) {
      return ingredient;
    }
    const accountingType = accountingTypeForBaseUnit(ingredient.baseUnitId, units);
    if (!accountingType) {
      if (ingredient.accountingConfigurationWarning) return ingredient;
      migratedCount += 1;
      return {
        ...ingredient,
        accountingConfigurationWarning: 'ACCOUNTING_TYPE_REQUIRES_REVIEW',
      };
    }
    migratedCount += 1;
    return {
      ...ingredient,
      accountingType,
      purchasePackageSize:
        Number.isFinite(ingredient.purchasePackageSize) &&
        Number(ingredient.purchasePackageSize) > 0
          ? ingredient.purchasePackageSize
          : ingredient.conversionRate,
      barcode: ingredient.barcode ?? '',
      accountingConfigurationWarning: undefined,
    };
  });
  return { ingredients: migrated, migratedCount };
}
