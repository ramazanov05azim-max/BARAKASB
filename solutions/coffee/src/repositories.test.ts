// @vitest-environment jsdom

import type { MediaAssetId } from '@barakasb/contracts-platform';
import type { MediaAssetService } from '@barakasb/frontend-media';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createCoffeeCrashTestSeed } from './coffee-crash-test-seed';
import {
  createLocalCoffeeManagerRepositories,
  localCoffeeManagerRepositories,
  localCoffeeOperationalReadRepository,
} from './repositories';

const storedValues = new Map<string, string>();
const localStorageAdapter: Storage = {
  get length() {
    return storedValues.size;
  },
  clear() {
    storedValues.clear();
  },
  getItem(key) {
    return storedValues.get(key) ?? null;
  },
  key(index) {
    return [...storedValues.keys()][index] ?? null;
  },
  removeItem(key) {
    storedValues.delete(key);
  },
  setItem(key, value) {
    storedValues.set(key, value);
  },
};

describe('local Coffee repository adapter', () => {
  beforeAll(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: localStorageAdapter,
    });
  });

  beforeEach(() => {
    window.localStorage.clear();
  });

  it('keeps prototype data isolated by Project identifier', async () => {
    await Promise.all([
      localCoffeeManagerRepositories.coffeeProject.initialize('project-a', 'Coffee A'),
      localCoffeeManagerRepositories.coffeeProject.initialize('project-b', 'Coffee B'),
    ]);

    await localCoffeeManagerRepositories.locations.create('project-a', {
      name: 'North',
      status: 'active',
      code: 'NORTH',
      locationType: 'coffee-shop',
      address: 'Address A',
      timezone: 'Europe/Moscow',
      currency: 'RUB',
      phone: '+70000000000',
      email: 'north@example.test',
      openingHours: '08:00-22:00',
      isDefault: false,
    });

    await expect(
      localCoffeeManagerRepositories.locations.list('project-a'),
    ).resolves.toHaveLength(1);
    await expect(
      localCoffeeManagerRepositories.locations.list('project-b'),
    ).resolves.toEqual([]);
  });

  it('returns defensive copies instead of mutable stored references', async () => {
    await localCoffeeManagerRepositories.coffeeProject.initialize(
      'project-copy',
      'Coffee Copy',
    );

    const first = await localCoffeeManagerRepositories.loadSnapshot('project-copy');
    first.project.name = 'Mutated outside repository';
    first.roles.length = 0;

    const second = await localCoffeeManagerRepositories.loadSnapshot('project-copy');
    expect(second.project.name).toBe('Coffee Copy');
    expect(second.roles.length).toBeGreaterThan(0);
  });

  it('migrates legacy recipes in place without resetting Coffee or creating warehouse movements', async () => {
    const projectId = 'project-recipe-migration';
    await localCoffeeManagerRepositories.coffeeProject.initialize(
      projectId,
      'Coffee сохранённый',
    );
    await localCoffeeManagerRepositories.developmentSeed.apply(
      projectId,
      createCoffeeCrashTestSeed('2026-07-31T12:00:00.000Z'),
    );
    const storageKey = `barakasb.mock.coffee.project.v1.${encodeURIComponent(
      projectId,
    )}`;
    const raw = JSON.parse(window.localStorage.getItem(storageKey) ?? '{}') as {
      project: { name: string };
      recipes: Array<Record<string, unknown>>;
      warehouses: unknown[];
      openingStockBalances: unknown[];
    };
    const originalWarehouseState = structuredClone(raw.warehouses);
    const originalBalances = structuredClone(raw.openingStockBalances);
    raw.project.name = 'Coffee сохранённый';
    raw.recipes[0] = {
      id: 'legacy-recipe',
      name: 'Старое имя',
      status: 'active',
      updatedAt: '2026-07-31T12:00:00.000Z',
      menuItemId: 'crash-item-espresso',
      outputQuantity: 1,
      outputUnitId: 'unit-portion',
      preparationInstructions: '',
      ingredientId: 'crash-ingredient-espresso-beans',
      ingredientQuantity: 18,
      ingredientUnitId: 'unit-g',
      wastePercentage: 3,
    };
    window.localStorage.setItem(storageKey, JSON.stringify(raw));

    const migrated = await localCoffeeManagerRepositories.loadSnapshot(projectId);
    expect(migrated.project.name).toBe('Coffee сохранённый');
    expect(migrated.recipes[0]).toMatchObject({
      id: 'legacy-recipe',
      name: 'Техкарта · Эспрессо',
      target: {
        type: 'menu-item',
        id: 'crash-item-espresso',
      },
      components: [
        {
          referenceId: 'crash-ingredient-espresso-beans',
          grossQuantity: 18,
          lossPercentage: 3,
          netQuantity: 17.46,
        },
      ],
    });
    expect(migrated.warehouses).toEqual(originalWarehouseState);
    expect(migrated.openingStockBalances).toEqual(originalBalances);

    const secondLoad = await localCoffeeManagerRepositories.loadSnapshot(projectId);
    expect(secondLoad.recipes).toEqual(migrated.recipes);
  });

  it('migrates legacy ingredient accounting in place without losing hidden data', async () => {
    const projectId = 'project-ingredient-migration';
    await localCoffeeManagerRepositories.coffeeProject.initialize(
      projectId,
      'Coffee сохранённый',
    );
    await localCoffeeManagerRepositories.developmentSeed.apply(
      projectId,
      createCoffeeCrashTestSeed('2026-07-31T12:00:00.000Z'),
    );
    const storageKey = `barakasb.mock.coffee.project.v1.${encodeURIComponent(
      projectId,
    )}`;
    const raw = JSON.parse(window.localStorage.getItem(storageKey) ?? '{}') as {
      project: { name: string };
      ingredients: Array<Record<string, unknown>>;
    };
    const ingredient = raw.ingredients[0]!;
    const hiddenValues = {
      minimumStock: ingredient.minimumStock,
      cost: ingredient.cost,
      supplierReferences: ingredient.supplierReferences,
      preferredSupplierId: ingredient.preferredSupplierId,
    };
    delete ingredient.accountingType;
    delete ingredient.purchasePackageSize;
    delete ingredient.barcode;
    raw.project.name = 'Coffee сохранённый';
    window.localStorage.setItem(storageKey, JSON.stringify(raw));

    const first = await localCoffeeManagerRepositories.loadSnapshot(projectId);
    expect(first.project.name).toBe('Coffee сохранённый');
    expect(first.ingredients[0]).toMatchObject({
      id: ingredient.id,
      accountingType: 'weight',
      purchasePackageSize: ingredient.conversionRate,
      barcode: '',
      ...hiddenValues,
    });
    const persisted = window.localStorage.getItem(storageKey);
    expect(persisted).toContain('"accountingType":"weight"');

    const second = await localCoffeeManagerRepositories.loadSnapshot(projectId);
    expect(second.ingredients).toEqual(first.ingredients);
  });

  it('creates a complete operating-hours profile for a new establishment', async () => {
    await localCoffeeManagerRepositories.coffeeProject.initialize(
      'project-hours',
      'Coffee Hours',
    );

    const snapshot = await localCoffeeManagerRepositories.loadSnapshot('project-hours');

    expect(snapshot.businessProfile.operatingDayStart).toBe('04:00');
    expect(snapshot.businessProfile.operatingDayEnd).toBe('03:59');
    expect(snapshot.businessProfile.operatingHours?.monday).toEqual({
      open: '08:00',
      close: '22:00',
    });
    expect(snapshot.businessProfile.operatingHours?.sunday).toEqual({
      open: '09:00',
      close: '21:00',
    });
  });

  it('rejects readiness while required setup steps are incomplete', async () => {
    await localCoffeeManagerRepositories.coffeeProject.initialize(
      'project-incomplete',
      'Coffee Incomplete',
    );

    await expect(
      localCoffeeManagerRepositories.coffeeProject.markReady('project-incomplete'),
    ).rejects.toMatchObject({
      code: 'invalid-operation',
    });
  });

  it('rejects references to locations owned by another Project', async () => {
    await Promise.all([
      localCoffeeManagerRepositories.coffeeProject.initialize(
        'project-one',
        'Coffee One',
      ),
      localCoffeeManagerRepositories.coffeeProject.initialize(
        'project-two',
        'Coffee Two',
      ),
    ]);
    const location = await localCoffeeManagerRepositories.locations.create(
      'project-one',
      {
        name: 'Only One',
        status: 'active',
        code: 'ONE',
        locationType: 'coffee-shop',
        address: 'Address One',
        timezone: 'Europe/Moscow',
        currency: 'RUB',
        phone: '+70000000001',
        email: 'one@example.test',
        openingHours: '08:00-22:00',
        isDefault: false,
      },
    );

    await expect(
      localCoffeeManagerRepositories.coffeeProject.setDefaultLocation(
        'project-two',
        location.id,
      ),
    ).rejects.toMatchObject({
      code: 'not-found',
    });
  });

  it('keeps the operational contract read-only', async () => {
    await localCoffeeManagerRepositories.coffeeProject.initialize(
      'project-operational',
      'Operational Coffee',
    );

    const snapshot =
      await localCoffeeOperationalReadRepository.load('project-operational');

    expect(snapshot.project.name).toBe('Operational Coffee');
    expect(Object.keys(localCoffeeOperationalReadRepository)).toEqual(['load']);
  });

  it('creates Operational Workspaces only for selected modules', async () => {
    await localCoffeeManagerRepositories.coffeeProject.initialize(
      'project-constructor',
      'Constructor Coffee',
    );

    const structure = await localCoffeeManagerRepositories.solutionConstructor.generate(
      'project-constructor',
      ['bar', 'manager'],
    );

    expect(structure.selectedModuleIds).toEqual(['bar', 'manager']);
    expect(structure.workspaces.map((workspace) => workspace.moduleId)).toEqual([
      'bar',
      'manager',
    ]);
    expect(
      structure.workspaces.some((workspace) => workspace.moduleId === 'kitchen'),
    ).toBe(false);
  });

  it('assigns one employee to multiple isolated workspaces', async () => {
    await localCoffeeManagerRepositories.coffeeProject.initialize(
      'project-assignments',
      'Assignments Coffee',
    );
    const employee = await localCoffeeManagerRepositories.employees.create(
      'project-assignments',
      {
        name: 'Анна Петрова',
        firstName: 'Анна',
        lastName: 'Петрова',
        position: 'Кассир',
        fullName: 'Анна Петрова',
        email: 'anna@example.test',
        phone: '+79990000000',
        employeeCode: 'EMP-001',
        assignedLocationIds: [],
        assignedRoleId: null,
        employmentStatus: 'active',
        hireDate: '2026-07-31',
        notes: '',
        status: 'active',
      },
    );
    const generated = await localCoffeeManagerRepositories.solutionConstructor.generate(
      'project-assignments',
      ['bar', 'kitchen'],
    );

    for (const workspace of generated.workspaces) {
      await localCoffeeManagerRepositories.solutionConstructor.assignEmployee(
        'project-assignments',
        workspace.id,
        employee.id,
        true,
      );
    }

    const structure =
      await localCoffeeManagerRepositories.solutionConstructor.get(
        'project-assignments',
      );
    expect(
      structure.workspaces.every((workspace) =>
        workspace.assignedEmployeeIds.includes(employee.id),
      ),
    ).toBe(true);
  });

  it('persists explicit Kitchen location, source warehouse and validated timing', async () => {
    const projectId = 'project-kitchen-configuration';
    await localCoffeeManagerRepositories.coffeeProject.initialize(
      projectId,
      'Kitchen Coffee',
    );
    await localCoffeeManagerRepositories.developmentSeed.apply(
      projectId,
      createCoffeeCrashTestSeed('2026-08-07T10:00:00.000Z'),
    );
    const structure = await localCoffeeManagerRepositories.solutionConstructor.generate(
      projectId,
      ['kitchen'],
    );
    const workspace = structure.workspaces[0]!;
    await localCoffeeManagerRepositories.solutionConstructor.assignLocation(
      projectId,
      workspace.id,
      'crash-location-production',
    );
    await localCoffeeManagerRepositories.solutionConstructor.assignSourceWarehouse(
      projectId,
      workspace.id,
      'crash-warehouse-kitchen',
    );
    await localCoffeeManagerRepositories.solutionConstructor.setPreparationTiming(
      projectId,
      workspace.id,
      { delayedMinutes: 10, criticalMinutes: 20 },
    );

    await expect(
      localCoffeeManagerRepositories.solutionConstructor.get(projectId),
    ).resolves.toMatchObject({
      workspaces: [
        {
          locationId: 'crash-location-production',
          sourceWarehouseId: 'crash-warehouse-kitchen',
          preparationTiming: { delayedMinutes: 10, criticalMinutes: 20 },
        },
      ],
    });
    await expect(
      localCoffeeManagerRepositories.solutionConstructor.setPreparationTiming(
        projectId,
        workspace.id,
        { delayedMinutes: 20, criticalMinutes: 10 },
      ),
    ).rejects.toMatchObject({ code: 'invalid-operation' });
  });

  it('deletes an image only after the last menu-item reference is removed', async () => {
    const remove = vi.fn();
    const mediaAssets = {
      remove,
      removeProject: vi.fn(),
    } as unknown as MediaAssetService;
    const repositories = createLocalCoffeeManagerRepositories(mediaAssets);
    const projectId = 'project-shared-media';
    const sharedImage = 'media-shared' as MediaAssetId;
    await repositories.coffeeProject.initialize(projectId, 'Shared Media Coffee');

    const common = {
      categoryId: 'category-1',
      description: '',
      barcode: '',
      sellingPrice: 350,
      taxCategory: 'standard',
      locationAvailability: '',
      imageAssetId: sharedImage,
      recipeId: '',
      modifierGroupIds: [],
      status: 'active' as const,
    };
    const first = await repositories.menuItems.create(projectId, {
      ...common,
      name: 'Капучино',
      sku: 'MENU-0001',
    });
    const second = await repositories.menuItems.create(projectId, {
      ...common,
      name: 'Латте',
      sku: 'MENU-0002',
    });

    await repositories.menuItems.remove(projectId, first.id);
    expect(remove).not.toHaveBeenCalled();
    await repositories.menuItems.remove(projectId, second.id);
    expect(remove).toHaveBeenCalledOnce();
    expect(remove).toHaveBeenCalledWith(projectId, sharedImage);
  });
});
