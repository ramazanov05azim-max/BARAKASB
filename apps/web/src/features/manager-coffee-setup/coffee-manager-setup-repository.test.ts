import {
  localCoffeeManagerRepositories,
  localCoffeeOperationalReadRepository,
} from '@barakasb/solution-coffee';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createLocalBusinessEnvironmentDirectory } from '@/features/universal-application/infrastructure/local-business-environment-directory';
import type { ProjectSummary } from '@/lib/mock-repository';
import {
  coffeeCrashTestEnvironmentId,
  coffeeCrashTestProjectId,
  coffeeCrashTestProjectName,
  createCoffeeManagerSetupRepository,
  generateLocalBusinessEnvironmentCode,
  type CoffeeEstablishmentInput,
} from './coffee-manager-setup-repository';

const establishment: CoffeeEstablishmentInput = {
  establishmentName: 'North Star',
  legalName: 'North Star Coffee LLC',
  ownerName: 'Alex Morgan',
  country: 'RU',
  city: 'Moscow',
  address: '12 Tverskaya Street',
  timezone: 'Europe/Moscow',
  currency: 'RUB',
  language: 'ru',
  phone: '+7 999 123-45-67',
  email: 'owner@north-star.test',
};

function project(id = 'coffee-1', name = 'North Star'): ProjectSummary {
  return {
    id,
    name,
    solutionId: 'coffee',
    categoryId: 'food',
    status: 'active',
    role: 'owner',
    createdAt: '2026-07-31T10:00:00.000Z',
  };
}

function createRepository() {
  const projects = new Map<string, ProjectSummary>();
  const directory = createLocalBusinessEnvironmentDirectory(window.localStorage);
  const platformProjects = {
    ensureProject: vi.fn(async (value: ProjectSummary) => {
      const existing = projects.get(value.id);
      if (existing) return structuredClone(existing);
      projects.set(value.id, structuredClone(value));
      return structuredClone(value);
    }),
    deleteProject: vi.fn(async (id: string) => {
      projects.delete(id);
    }),
  };
  return {
    repository: createCoffeeManagerSetupRepository({
      storage: window.localStorage,
      platformProjects,
      coffeeRepositories: localCoffeeManagerRepositories,
      directory: directory.writer,
      now: () => '2026-07-31T10:00:00.000Z',
    }),
    resolver: directory.resolver,
    projects,
  };
}

describe('Coffee Manager setup repository', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('generates a deterministic immutable 16-digit code in Manager', async () => {
    const { repository } = createRepository();
    await repository.install(project());
    const first = await repository.configure('coffee-1', establishment);
    const updated = await repository.configure('coffee-1', {
      ...establishment,
      address: '25 Garden Street',
    });

    expect(first.businessEnvironmentCode).toMatch(/^\d{16}$/);
    expect(first.businessEnvironmentCode).toBe(
      generateLocalBusinessEnvironmentCode(establishment, new Set()),
    );
    expect(updated.businessEnvironmentCode).toBe(first.businessEnvironmentCode);
    expect(updated.establishment?.address).toBe('25 Garden Street');
  });

  it('resolves manager-created codes and keeps projects isolated', async () => {
    const { repository, resolver } = createRepository();
    await repository.install(project());
    await repository.install(project('coffee-2', 'Blue Bottle'));
    const first = await repository.configure('coffee-1', establishment);
    const second = await repository.configure('coffee-2', {
      ...establishment,
      establishmentName: 'Blue Bottle',
      email: 'owner@blue-bottle.test',
    });

    expect(first.businessEnvironmentCode).not.toBe(second.businessEnvironmentCode);
    expect(await resolver.resolve(first.businessEnvironmentCode ?? '')).toMatchObject({
      projectId: 'coffee-1',
    });
    expect(await resolver.resolve(second.businessEnvironmentCode ?? '')).toMatchObject({
      projectId: 'coffee-2',
    });
  });

  it('persists setup across repository recreation', async () => {
    const beforeRefresh = createRepository().repository;
    await beforeRefresh.install(project());
    const configured = await beforeRefresh.configure('coffee-1', establishment);

    const afterRefresh = createRepository().repository;
    expect(await afterRefresh.get('coffee-1')).toEqual(configured);
  });

  it('installs one idempotent, fully populated canonical crash-test environment', async () => {
    const { repository, resolver, projects } = createRepository();
    const first = await repository.installCrashTest();
    const second = await repository.installCrashTest();
    const snapshot = await localCoffeeOperationalReadRepository.load(
      coffeeCrashTestProjectId,
    );

    expect(second).toEqual(first);
    expect(projects.size).toBe(1);
    expect(first.project.name).toBe(coffeeCrashTestProjectName);
    expect(first.project.displayName).toBe('Север Coffee Lab — CRASH TEST');
    expect(first.businessEnvironmentId).toBe(coffeeCrashTestEnvironmentId);
    expect(first.businessEnvironmentCode).toBe('5715422156485027');
    expect(await resolver.resolve(first.businessEnvironmentCode ?? '')).toMatchObject({
      projectId: coffeeCrashTestProjectId,
      businessEnvironmentId: coffeeCrashTestEnvironmentId,
    });
    expect(snapshot.locations).toHaveLength(2);
    expect(snapshot.warehouses).toHaveLength(4);
    expect(snapshot.units).toHaveLength(8);
    expect(snapshot.ingredients.length).toBeGreaterThanOrEqual(30);
    expect(snapshot.menuItems.length).toBeGreaterThanOrEqual(20);
    expect(snapshot.modifiers.length).toBeGreaterThanOrEqual(4);
    expect(snapshot.recipes.length).toBeGreaterThanOrEqual(15);
    expect(snapshot.openingStockBalances).toHaveLength(snapshot.ingredients.length);
    expect(snapshot.suppliers).toHaveLength(5);
    expect(snapshot.employees).toHaveLength(5);
    expect(
      snapshot.openingStockBalances.some((balance) => balance.quantity === 0),
    ).toBe(true);
    expect(
      snapshot.recipes.every(
        (recipe) =>
          (recipe.ingredientRows?.length ?? 0) > 0 && (recipe.calculatedCost ?? 0) > 0,
      ),
    ).toBe(true);
    const ingredientIds = new Set(
      snapshot.ingredients.map((ingredient) => ingredient.id),
    );
    const menuItemIds = new Set(snapshot.menuItems.map((item) => item.id));
    const warehouseIds = new Set(snapshot.warehouses.map((warehouse) => warehouse.id));
    expect(
      snapshot.recipes.every(
        (recipe) =>
          menuItemIds.has(recipe.menuItemId) &&
          recipe.ingredientRows?.every((row) => ingredientIds.has(row.ingredientId)),
      ),
    ).toBe(true);
    expect(
      snapshot.openingStockBalances.every(
        (balance) =>
          ingredientIds.has(balance.ingredientId) &&
          warehouseIds.has(balance.warehouseId),
      ),
    ).toBe(true);
  });

  it('deletes the canonical environment without recreating it', async () => {
    const { repository, projects } = createRepository();
    await repository.installCrashTest();
    await repository.deleteCrashTest();

    expect(projects.size).toBe(0);
    expect(await repository.get(coffeeCrashTestProjectId)).toBeNull();
    expect(await repository.list()).toHaveLength(0);
  });
});
