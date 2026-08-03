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
});
