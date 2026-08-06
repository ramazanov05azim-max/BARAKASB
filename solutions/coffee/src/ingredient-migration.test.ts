import { describe, expect, it } from 'vitest';
import type { Ingredient, UnitOfMeasure } from './domain';
import { migrateLegacyIngredients } from './ingredient-migration';

const units: UnitOfMeasure[] = [
  {
    id: 'unit-g',
    name: 'Грамм',
    symbol: 'г',
    dimension: 'mass',
    conversionTargetId: '',
    conversionRate: 1,
    status: 'active',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

const legacy: Ingredient = {
  id: 'ingredient-coffee',
  name: 'Кофе',
  sku: 'INV-COFFEE',
  category: 'Кофе',
  baseUnitId: 'unit-g',
  purchaseUnitId: 'unit-kg',
  conversionRate: 1000,
  minimumStock: 500,
  cost: 2.5,
  supplierReferences: 'supplier-a',
  status: 'active',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('legacy ingredient migration', () => {
  it('derives accounting data and remains idempotent without losing hidden values', () => {
    const first = migrateLegacyIngredients([legacy], units);
    expect(first.migratedCount).toBe(1);
    expect(first.ingredients[0]).toMatchObject({
      id: legacy.id,
      accountingType: 'weight',
      purchasePackageSize: 1000,
      barcode: '',
      minimumStock: 500,
      cost: 2.5,
      supplierReferences: 'supplier-a',
    });
    const second = migrateLegacyIngredients(first.ingredients, units);
    expect(second.migratedCount).toBe(0);
    expect(second.ingredients).toEqual(first.ingredients);
  });

  it('preserves an unknown record and adds a review warning', () => {
    const result = migrateLegacyIngredients(
      [{ ...legacy, baseUnitId: 'custom-unknown' }],
      units,
    );
    expect(result.ingredients[0]).toMatchObject({
      id: legacy.id,
      baseUnitId: 'custom-unknown',
      conversionRate: 1000,
      accountingConfigurationWarning: 'ACCOUNTING_TYPE_REQUIRES_REVIEW',
    });
  });
});
