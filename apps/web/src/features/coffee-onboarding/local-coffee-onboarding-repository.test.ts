import type {
  BusinessProfileRepository,
  CoffeeProjectRepository,
  CoffeeSettingsRepository,
} from '@barakasb/solution-coffee';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockRepository, ProjectSummary } from '@/lib/mock-repository';
import {
  createLocalCoffeeOnboardingRepository,
  generateLocalBusinessEnvironmentCode,
  type CoffeeEstablishmentInput,
} from './local-coffee-onboarding-repository';

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

function createDependencies() {
  let projectSequence = 0;
  const createProject = vi.fn(
    async ({
      name,
    }: {
      name: string;
      categoryId: 'food';
      solutionId: 'coffee';
    }): Promise<ProjectSummary> => {
      projectSequence += 1;
      return {
        id: `coffee-${projectSequence}`,
        name,
        solutionId: 'coffee',
        categoryId: 'food',
        status: 'active',
        role: 'owner',
        createdAt: '2026-07-31T10:00:00.000Z',
      };
    },
  );
  const initialize = vi.fn(async (projectId: string, projectName: string) => ({
    id: projectId,
    name: projectName,
    solutionStatus: 'setup-required' as const,
    defaultLocationId: null,
    ready: false,
    updatedAt: '2026-07-31T10:00:00.000Z',
  }));
  const getProfile = vi.fn(async () => ({
    businessName: '',
    legalName: '',
    brandName: '',
    description: '',
    logoPlaceholder: '',
    defaultCurrency: 'RUB',
    timezone: 'Europe/Moscow',
    country: 'RU',
    language: 'ru' as const,
    taxMode: 'standard',
    receiptInformation: '',
    contactInformation: '',
    businessAddress: '',
    updatedAt: '2026-07-31T10:00:00.000Z',
  }));
  const updateProfile = vi.fn(
    async (_projectId: string, profile: Awaited<ReturnType<typeof getProfile>>) =>
      profile,
  );
  const getSettings = vi.fn(async () => ({
    businessDayBoundary: '04:00',
    brandAccent: 'espresso',
    locationPolicy: 'independent',
    locale: 'ru' as const,
    taxMode: 'standard',
    receiptFooter: '',
    enabledModules: 'menu',
    notificationMode: 'important',
    updatedAt: '2026-07-31T10:00:00.000Z',
  }));
  const updateSettings = vi.fn(
    async (_projectId: string, settings: Awaited<ReturnType<typeof getSettings>>) =>
      settings,
  );

  return {
    dependencies: {
      storage: window.localStorage,
      platformProjects: {
        createProject,
      } satisfies Pick<MockRepository, 'createProject'>,
      coffeeRepositories: {
        coffeeProject: {
          initialize,
        } satisfies Pick<CoffeeProjectRepository, 'initialize'>,
        businessProfile: {
          get: getProfile,
          update: updateProfile,
        } satisfies Pick<BusinessProfileRepository, 'get' | 'update'>,
        settings: {
          get: getSettings,
          update: updateSettings,
        } satisfies Pick<CoffeeSettingsRepository, 'get' | 'update'>,
      },
      now: () => '2026-07-31T10:00:00.000Z',
    },
    spies: {
      createProject,
      initialize,
      updateProfile,
      updateSettings,
    },
  };
}

describe('local Coffee onboarding repository', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('creates an establishment and initializes the Coffee repositories', async () => {
    const { dependencies, spies } = createDependencies();
    const repository = createLocalCoffeeOnboardingRepository(dependencies);

    const record = await repository.create(establishment);

    expect(record.establishment).toEqual(establishment);
    expect(record.project).toMatchObject({
      id: 'coffee-1',
      name: 'North Star',
      solutionId: 'coffee',
    });
    expect(spies.createProject).toHaveBeenCalledOnce();
    expect(spies.initialize).toHaveBeenCalledWith('coffee-1', 'North Star');
    expect(spies.updateProfile).toHaveBeenCalledWith(
      'coffee-1',
      expect.objectContaining({
        businessName: 'North Star',
        legalName: 'North Star Coffee LLC',
        country: 'RU',
        defaultCurrency: 'RUB',
        timezone: 'Europe/Moscow',
        language: 'ru',
        contactInformation: 'Alex Morgan · +7 999 123-45-67 · owner@north-star.test',
        businessAddress: 'Moscow, 12 Tverskaya Street',
      }),
    );
    expect(spies.updateSettings).toHaveBeenCalledWith(
      'coffee-1',
      expect.objectContaining({ locale: 'ru' }),
    );
  });

  it('generates the same 16-digit code for the same seed when storage is empty', () => {
    const first = generateLocalBusinessEnvironmentCode(establishment, new Set());
    const second = generateLocalBusinessEnvironmentCode(establishment, new Set());

    expect(first).toMatch(/^\d{16}$/);
    expect(second).toBe(first);
  });

  it('generates a unique deterministic fallback when the first code is occupied', () => {
    const first = generateLocalBusinessEnvironmentCode(establishment, new Set());
    const second = generateLocalBusinessEnvironmentCode(
      establishment,
      new Set([first]),
    );

    expect(second).toMatch(/^\d{16}$/);
    expect(second).not.toBe(first);
    expect(generateLocalBusinessEnvironmentCode(establishment, new Set([first]))).toBe(
      second,
    );
  });

  it('resolves a locally generated code', async () => {
    const { dependencies } = createDependencies();
    const repository = createLocalCoffeeOnboardingRepository(dependencies);
    const created = await repository.create(establishment);

    const resolved = await repository.resolve(created.businessEnvironmentCode);

    expect(resolved).toEqual(created);
  });

  it('rejects incomplete and unknown codes', async () => {
    const { dependencies } = createDependencies();
    const repository = createLocalCoffeeOnboardingRepository(dependencies);

    expect(await repository.resolve('1234')).toBeNull();
    expect(await repository.resolve('9999999999999999')).toBeNull();
  });

  it('keeps multiple Coffee Projects isolated by code', async () => {
    const { dependencies } = createDependencies();
    const repository = createLocalCoffeeOnboardingRepository(dependencies);
    const first = await repository.create(establishment);
    const second = await repository.create({
      ...establishment,
      establishmentName: 'Blue Bottle',
      address: '25 Garden Street',
      email: 'owner@blue-bottle.test',
    });

    expect(first.businessEnvironmentCode).not.toBe(second.businessEnvironmentCode);
    expect((await repository.resolve(first.businessEnvironmentCode))?.project.id).toBe(
      'coffee-1',
    );
    expect((await repository.resolve(second.businessEnvironmentCode))?.project.id).toBe(
      'coffee-2',
    );
  });

  it('persists the complete establishment in localStorage', async () => {
    const { dependencies } = createDependencies();
    const repository = createLocalCoffeeOnboardingRepository(dependencies);

    await repository.create(establishment);

    expect(window.localStorage.length).toBe(1);
    expect(await repository.list()).toEqual([
      expect.objectContaining({
        establishment,
        businessEnvironmentCode: expect.stringMatching(/^\d{16}$/),
      }),
    ]);
  });

  it('survives a browser refresh represented by a new repository instance', async () => {
    const firstDependencies = createDependencies().dependencies;
    const beforeRefresh = createLocalCoffeeOnboardingRepository(firstDependencies);
    const created = await beforeRefresh.create(establishment);

    const afterRefresh = createLocalCoffeeOnboardingRepository(
      createDependencies().dependencies,
    );

    expect(await afterRefresh.hasProjects()).toBe(true);
    expect(await afterRefresh.resolve(created.businessEnvironmentCode)).toEqual(
      created,
    );
  });
});
