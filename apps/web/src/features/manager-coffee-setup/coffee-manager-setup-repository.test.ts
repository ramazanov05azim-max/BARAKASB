import {
  localCoffeeManagerRepositories,
  localCoffeeOperationalReadRepository,
} from '@barakasb/solution-coffee';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createLocalBusinessEnvironmentDirectory } from '@/features/universal-application/infrastructure/local-business-environment-directory';
import type { ProjectSummary } from '@/lib/mock-repository';
import {
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

function createRepository({ demoEnabled = false } = {}) {
  const projects = new Map<string, ProjectSummary>();
  const directory = createLocalBusinessEnvironmentDirectory(window.localStorage);
  const platformProjects = {
    ensureProject: vi.fn(async (value: ProjectSummary) => {
      const existing = projects.get(value.id);
      if (existing) return existing;
      projects.set(value.id, structuredClone(value));
      return structuredClone(value);
    }),
    deleteProject: vi.fn(async (id: string) => {
      projects.delete(id);
    }),
    getProject: vi.fn(async (id: string) => projects.get(id) ?? null),
  };
  return {
    repository: createCoffeeManagerSetupRepository({
      storage: window.localStorage,
      platformProjects,
      coffeeRepositories: localCoffeeManagerRepositories,
      directory: directory.writer,
      developmentDemoEnabled: demoEnabled,
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

  it('generates a deterministic 16-digit code only after manager configuration', async () => {
    const { repository } = createRepository();
    await repository.install(project());

    expect((await repository.get('coffee-1'))?.businessEnvironmentCode).toBeNull();

    const configured = await repository.configure('coffee-1', establishment);

    expect(configured.businessEnvironmentCode).toMatch(/^\d{16}$/);
    expect(configured.businessEnvironmentCode).toBe(
      generateLocalBusinessEnvironmentCode(establishment, new Set()),
    );
  });

  it('keeps the generated code immutable across configuration updates', async () => {
    const { repository } = createRepository();
    await repository.install(project());
    const first = await repository.configure('coffee-1', establishment);
    const updated = await repository.configure('coffee-1', {
      ...establishment,
      address: '25 Garden Street',
    });

    expect(updated.businessEnvironmentCode).toBe(first.businessEnvironmentCode);
    expect(updated.establishment?.address).toBe('25 Garden Street');
  });

  it('resolves manager-created codes and keeps multiple projects isolated', async () => {
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

  it('seeds a deterministic and idempotent removable development demo', async () => {
    const { repository } = createRepository({ demoEnabled: true });
    const first = await repository.seedDevelopmentDemo();
    const second = await repository.seedDevelopmentDemo();
    const snapshot = await localCoffeeOperationalReadRepository.load(
      'demo-coffee-north-star',
    );

    expect(second).toEqual(first);
    expect(snapshot.warehouses).toHaveLength(1);
    expect(snapshot.ingredients).toHaveLength(4);
    expect(snapshot.menuItems).toHaveLength(3);
    expect(snapshot.recipes.length).toBeGreaterThanOrEqual(2);
    expect(snapshot.menuItems.every((item) => item.sellingPrice > 0)).toBe(true);
    expect(snapshot.ingredients.every((item) => item.cost > 0)).toBe(true);
    expect(snapshot.openingStockBalances).toHaveLength(4);

    await repository.removeDevelopmentDemo();
    expect(await repository.seedDevelopmentDemo()).toBeNull();
    expect(await repository.get('demo-coffee-north-star')).toBeNull();
  });

  it('does not seed the development demo when disabled', async () => {
    expect(await createRepository().repository.seedDevelopmentDemo()).toBeNull();
  });
});
