import { describe, expect, it } from 'vitest';
import type { MenuItem, Recipe } from './domain';
import {
  migrateLegacyRecipes,
  recipeNetQuantity,
  recipeTitle,
} from './recipe-migration';

const menuItem = {
  id: 'menu-latte',
  name: 'Айс-латте',
} as MenuItem;

const legacyRecipe = {
  id: 'recipe-latte',
  name: 'Старое ручное название',
  status: 'active',
  updatedAt: '2026-07-31T12:00:00.000Z',
  menuItemId: menuItem.id,
  outputQuantity: 350,
  outputUnitId: 'unit-ml',
  preparationInstructions: '',
  ingredientId: 'ingredient-milk',
  ingredientQuantity: 220,
  ingredientUnitId: 'unit-ml',
  wastePercentage: 3,
};

function currentRecipe(
  targetType: Recipe['target']['type'],
  componentType: Recipe['components'][number]['type'],
): Recipe {
  const target = {
    type: targetType,
    id: `target-${targetType}`,
    name: `Цель ${targetType}`,
  };
  return {
    id: `recipe-${targetType}`,
    name: 'Будет заменено автоматически',
    status: 'inactive',
    updatedAt: '2026-07-31T12:00:00.000Z',
    target,
    outputQuantity: 1,
    outputUnitId: 'unit-piece',
    preparationInstructions: '',
    components: [
      {
        id: 'component-1',
        type: componentType,
        referenceId: `reference-${componentType}`,
        grossQuantity: 10,
        unitId: 'unit-g',
        lossPercentage: 10,
        netQuantity: 0,
      },
      {
        id: 'component-2',
        type: 'ingredient',
        referenceId: 'ingredient-water',
        grossQuantity: 50,
        unitId: 'unit-ml',
        lossPercentage: 0,
        netQuantity: 50,
      },
    ],
  };
}

describe('Coffee recipe migration and model', () => {
  it('migrates a legacy single ingredient without losing recipe data', () => {
    const result = migrateLegacyRecipes([legacyRecipe], [menuItem]);
    expect(result).toMatchObject({ migratedCount: 1, failedCount: 0 });
    expect(result.recipes[0]).toMatchObject({
      id: legacyRecipe.id,
      name: 'Техкарта · Айс-латте',
      status: 'active',
      target: { type: 'menu-item', id: menuItem.id, name: menuItem.name },
      outputQuantity: 350,
      outputUnitId: 'unit-ml',
      preparationInstructions: '',
      components: [
        {
          type: 'ingredient',
          referenceId: 'ingredient-milk',
          grossQuantity: 220,
          unitId: 'unit-ml',
          lossPercentage: 3,
          netQuantity: 213.4,
        },
      ],
    });
    expect(result.recipes[0]).not.toHaveProperty('ingredientId');
    expect(result.recipes[0]).not.toHaveProperty('menuItemId');
  });

  it('is idempotent and never applies component loss twice', () => {
    const first = migrateLegacyRecipes([legacyRecipe], [menuItem]);
    const second = migrateLegacyRecipes(first.recipes, [menuItem]);
    expect(second.migratedCount).toBe(0);
    expect(second.failedCount).toBe(0);
    expect(second.recipes).toEqual(first.recipes);
    expect(recipeNetQuantity(220, 3)).toBe(213.4);
  });

  it.each([
    ['menu-item', 'ingredient'],
    ['preparation', 'preparation'],
    ['semi-finished', 'semi-finished'],
  ] as const)(
    'supports a %s target and a %s component with multiple ordered components',
    (targetType, componentType) => {
      const recipe = currentRecipe(targetType, componentType);
      const result = migrateLegacyRecipes([recipe], [menuItem]);
      expect(result).toMatchObject({ migratedCount: 0, failedCount: 0 });
      expect(result.recipes[0]?.target.type).toBe(targetType);
      expect(result.recipes[0]?.components).toHaveLength(2);
      expect(result.recipes[0]?.components[0]).toMatchObject({
        type: componentType,
        grossQuantity: 10,
        unitId: 'unit-g',
        lossPercentage: 10,
        netQuantity: 9,
      });
      expect(result.recipes[0]?.outputQuantity).toBe(1);
      expect(result.recipes[0]?.outputUnitId).toBe('unit-piece');
      expect(result.recipes[0]?.preparationInstructions).toBe('');
      expect(result.recipes[0]?.name).toBe(recipeTitle(recipe.target));
    },
  );

  it('preserves the original record byte-for-byte when migration cannot resolve it', () => {
    const broken = {
      ...legacyRecipe,
      id: 'recipe-broken',
      menuItemId: 'missing-menu-item',
    };
    const result = migrateLegacyRecipes([broken], [menuItem]);
    expect(result).toMatchObject({ migratedCount: 0, failedCount: 1 });
    expect(result.recipes[0]).toBe(broken);
    expect(result.recipes[0]).toEqual(broken);
  });
});
