// @vitest-environment jsdom

import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { localCoffeeRepositories } from './repositories';

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
      localCoffeeRepositories.coffeeProject.initialize('project-a', 'Coffee A'),
      localCoffeeRepositories.coffeeProject.initialize('project-b', 'Coffee B'),
    ]);

    await localCoffeeRepositories.locations.create('project-a', {
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
      localCoffeeRepositories.locations.list('project-a'),
    ).resolves.toHaveLength(1);
    await expect(localCoffeeRepositories.locations.list('project-b')).resolves.toEqual(
      [],
    );
  });

  it('returns defensive copies instead of mutable stored references', async () => {
    await localCoffeeRepositories.coffeeProject.initialize(
      'project-copy',
      'Coffee Copy',
    );

    const first = await localCoffeeRepositories.loadSnapshot('project-copy');
    first.project.name = 'Mutated outside repository';
    first.roles.length = 0;

    const second = await localCoffeeRepositories.loadSnapshot('project-copy');
    expect(second.project.name).toBe('Coffee Copy');
    expect(second.roles.length).toBeGreaterThan(0);
  });

  it('rejects readiness while required setup steps are incomplete', async () => {
    await localCoffeeRepositories.coffeeProject.initialize(
      'project-incomplete',
      'Coffee Incomplete',
    );

    await expect(
      localCoffeeRepositories.coffeeProject.markReady('project-incomplete'),
    ).rejects.toMatchObject({
      code: 'invalid-operation',
    });
  });

  it('rejects references to locations owned by another Project', async () => {
    await Promise.all([
      localCoffeeRepositories.coffeeProject.initialize('project-one', 'Coffee One'),
      localCoffeeRepositories.coffeeProject.initialize('project-two', 'Coffee Two'),
    ]);
    const location = await localCoffeeRepositories.locations.create('project-one', {
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
    });

    await expect(
      localCoffeeRepositories.coffeeProject.setDefaultLocation(
        'project-two',
        location.id,
      ),
    ).rejects.toMatchObject({
      code: 'not-found',
    });
  });
});
