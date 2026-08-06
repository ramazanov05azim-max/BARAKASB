import { describe, expect, it } from 'vitest';
import { createCoffeeCrashTestSeed } from '../coffee-crash-test-seed';
import type { CoffeeOperationalSnapshot, Recipe } from '../domain';
import { expandCoffeeRecipe } from './expansion';

const timestamp = '2026-08-06T10:00:00.000Z';
function snapshot(): CoffeeOperationalSnapshot {
  const seed = createCoffeeCrashTestSeed(timestamp);
  return {
    project: {
      id: 'p1',
      name: 'Кофейня',
      solutionStatus: 'configured',
      defaultLocationId: 'crash-location-main',
      ready: true,
      updatedAt: timestamp,
    },
    businessProfile: {
      businessName: 'Кофейня',
      legalName: '',
      brandName: '',
      description: '',
      logoPlaceholder: '',
      defaultCurrency: 'RUB',
      timezone: 'Europe/Moscow',
      country: 'Россия',
      language: 'ru',
      taxMode: '',
      receiptInformation: '',
      contactInformation: '',
      businessAddress: '',
      updatedAt: timestamp,
    },
    settings: {
      businessDayBoundary: '',
      brandAccent: '',
      locationPolicy: '',
      locale: 'ru',
      taxMode: '',
      receiptFooter: '',
      enabledModules: '',
      notificationMode: '',
      updatedAt: timestamp,
    },
    locations: seed.locations,
    floorPlanZones: seed.floorPlanZones,
    tables: seed.tables,
    warehouses: seed.warehouses,
    units: seed.units,
    ingredients: seed.ingredients,
    menuItems: seed.menuItems,
    menuCategories: seed.menuCategories,
    modifiers: seed.modifiers,
    recipes: seed.recipes,
    openingStockBalances: [],
    suppliers: seed.suppliers,
    employees: seed.employees,
    solutionStructure: {
      selectedModuleIds: [],
      workspaces: [],
      generatedAt: null,
      updatedAt: timestamp,
    },
  };
}

describe('Coffee Recipe Engine expansion', () => {
  it('applies output ratio and component loss exactly once', () => {
    const result = expandCoffeeRecipe({
      snapshot: snapshot(),
      productId: 'crash-item-espresso',
      quantity: 2,
      selectedModifiers: [],
    });
    expect(result.ok).toBe(true);
    if (result.ok)
      expect(
        result.requirements.find(
          (entry) => entry.resourceId === 'crash-ingredient-espresso-beans',
        )?.quantityBase,
      ).toBeCloseTo(37.08);
  });

  it('expands preparation and semi-finished recipes recursively', () => {
    const value = snapshot();
    const product = value.menuItems.find((item) => item.id === 'crash-item-espresso')!;
    const root = value.recipes.find((recipe) => recipe.id === product.recipeId)!;
    const nested: Recipe[] = [
      {
        ...root,
        id: 'recipe-preparation',
        target: { type: 'preparation', id: 'prep-1', name: 'Заготовка' },
        outputQuantity: 10,
        components: [
          {
            id: 'nested-ingredient',
            type: 'ingredient',
            referenceId: 'crash-ingredient-espresso-beans',
            grossQuantity: 20,
            unitId: 'unit-g',
            lossPercentage: 0,
            netQuantity: 20,
          },
        ],
      },
      {
        ...root,
        id: 'recipe-semi',
        target: { type: 'semi-finished', id: 'semi-1', name: 'Полуфабрикат' },
        outputQuantity: 2,
        components: [
          {
            id: 'nested-prep',
            type: 'preparation',
            referenceId: 'prep-1',
            grossQuantity: 5,
            unitId: 'unit-g',
            lossPercentage: 0,
            netQuantity: 5,
          },
        ],
      },
    ];
    root.components = [
      {
        id: 'root-semi',
        type: 'semi-finished',
        referenceId: 'semi-1',
        grossQuantity: 2,
        unitId: 'unit-g',
        lossPercentage: 0,
        netQuantity: 2,
      },
    ];
    value.recipes = [...value.recipes, ...nested];
    const result = expandCoffeeRecipe({
      snapshot: value,
      productId: product.id,
      quantity: 1,
      selectedModifiers: [],
    });
    expect(result.ok && result.requirements[0]?.quantityBase).toBe(10);
  });

  it('includes configured package/modifier effects without matching labels in service code', () => {
    const value = snapshot();
    const group = value.modifiers.find(
      (item) => item.id === 'crash-modifier-extra-shot',
    )!;
    group.consumptionEffects = [
      {
        optionName: '1 шот +90 ₽',
        mode: 'add',
        resourceId: 'crash-ingredient-cup-small',
        resourceType: 'package',
        quantity: 1,
        unitId: 'unit-pc',
      },
    ];
    const result = expandCoffeeRecipe({
      snapshot: value,
      productId: 'crash-item-espresso',
      quantity: 1,
      selectedModifiers: [{ modifierGroupId: group.id, optionName: '1 шот +90 ₽' }],
    });
    expect(
      result.ok &&
        result.requirements.some(
          (entry) => entry.resourceType === 'package' && entry.quantityBase === 1,
        ),
    ).toBe(true);
  });

  it('detects cycles and returns a clear non-throwing result', () => {
    const value = snapshot();
    const product = value.menuItems.find((item) => item.id === 'crash-item-espresso')!;
    const root = value.recipes.find((recipe) => recipe.id === product.recipeId)!;
    const cyclic: Recipe = {
      ...root,
      id: 'recipe-cycle',
      target: { type: 'preparation', id: 'cycle', name: 'Цикл' },
      components: [
        {
          id: 'self',
          type: 'preparation',
          referenceId: 'cycle',
          grossQuantity: 1,
          unitId: 'unit-g',
          lossPercentage: 0,
          netQuantity: 1,
        },
      ],
    };
    root.components = [
      {
        id: 'cycle-root',
        type: 'preparation',
        referenceId: 'cycle',
        grossQuantity: 1,
        unitId: 'unit-g',
        lossPercentage: 0,
        netQuantity: 1,
      },
    ];
    value.recipes = [...value.recipes, cyclic];
    expect(
      expandCoffeeRecipe({
        snapshot: value,
        productId: product.id,
        quantity: 1,
        selectedModifiers: [],
      }),
    ).toEqual({ ok: false, code: 'RECIPE_CYCLE' });
  });
});
