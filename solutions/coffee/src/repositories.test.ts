// @vitest-environment jsdom

import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
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
});
