import { describe, expect, it } from 'vitest';
import { createCoffeeCrashTestSeed } from './coffee-crash-test-seed';
import type { CoffeeSnapshot } from './domain';
import { resourceDeletionDependencies } from './resource-deletion';

function snapshot(): CoffeeSnapshot {
  const seed = createCoffeeCrashTestSeed('2026-07-31T12:00:00.000Z');
  return {
    project: {
      id: 'project',
      name: 'Coffee',
      solutionStatus: 'configured',
      defaultLocationId: seed.locations[0]!.id,
      ready: true,
      updatedAt: '2026-07-31T12:00:00.000Z',
    },
    businessProfile: {
      defaultWarehouseId: seed.warehouses[0]!.id,
    } as CoffeeSnapshot['businessProfile'],
    settings: {} as CoffeeSnapshot['settings'],
    ...seed,
    solutionStructure: {
      selectedModuleIds: ['bar'],
      workspaces: [],
      generatedAt: null,
      updatedAt: '2026-07-31T12:00:00.000Z',
    },
    roles: [],
    permissions: [],
    setupSteps: [],
    activities: [],
    currentRoleId: 'owner',
    developmentSeedId: seed.id,
  };
}

describe('safe resource deletion dependencies', () => {
  it('returns readable recipe names for a referenced ingredient', () => {
    const state = snapshot();
    const ingredient = state.ingredients.find((item) =>
      state.recipes.some((recipe) =>
        recipe.components.some((component) => component.referenceId === item.id),
      ),
    )!;
    const dependencies = resourceDeletionDependencies(
      state,
      'ingredients',
      ingredient.id,
    );
    expect(
      dependencies.find((dependency) => dependency.label === 'recipes')?.names[0],
    ).toMatch(/Техкарта/u);
    expect(JSON.stringify(dependencies)).not.toContain(ingredient.id);
  });

  it('allows an unused reference entity to be deleted', () => {
    const state = snapshot();
    state.workstations.push({
      id: 'unused-workstation',
      name: 'Резервное место',
      workstationType: 'manager',
      locationId: state.locations[0]!.id,
      registerId: '',
      printer: '',
      enabledModules: '',
      status: 'inactive',
      updatedAt: '2026-07-31T12:00:00.000Z',
    });
    expect(
      resourceDeletionDependencies(state, 'workstations', 'unused-workstation'),
    ).toEqual([]);
  });
});
