import { describe, expect, it } from 'vitest';
import {
  recipeEngineComponentTypes,
  recipeEngineTargetTypes,
  type RecipeEngineDefinition,
} from './contracts';

describe('Coffee Recipe Engine contracts', () => {
  it('supports the four approved target types', () => {
    expect(recipeEngineTargetTypes).toEqual([
      'product',
      'preparation',
      'semi-finished',
      'package',
    ]);
  });

  it('supports the four approved component types', () => {
    expect(recipeEngineComponentTypes).toEqual([
      'ingredient',
      'preparation',
      'semi-finished',
      'package',
    ]);
  });

  it('keeps a recipe project-scoped and free of inventory side effects', () => {
    const definition: RecipeEngineDefinition = {
      recipeId: 'recipe-1',
      projectId: 'project-1',
      solutionInstallationId: 'installation-1',
      target: { type: 'product', targetId: 'product-1' },
      output: { value: 1, unitId: 'piece' },
      components: [
        {
          componentId: 'component-1',
          type: 'ingredient',
          referenceId: 'ingredient-1',
          grossQuantity: { value: 18, unitId: 'gram' },
          lossPercentage: 0,
        },
      ],
      instructions: '',
      version: 1,
      status: 'draft',
      effectiveFrom: null,
    };

    expect(definition.projectId).toBe('project-1');
    expect(Object.keys(definition)).not.toContain('stockDeduction');
    expect(Object.keys(definition)).not.toContain('inventoryMovement');
  });
});
