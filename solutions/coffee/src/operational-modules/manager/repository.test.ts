// @vitest-environment jsdom
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLocalCoffeeManagerWorkspaceRepository } from './repository';

describe('local Coffee Manager workspace repository', () => {
  const values = new Map<string, string>();
  const storage: Storage = {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  };

  beforeAll(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: storage,
    });
  });

  beforeEach(() => values.clear());

  it('persists only UI preferences and survives repository recreation', async () => {
    const repository = createLocalCoffeeManagerWorkspaceRepository();
    await repository.save('project-1', 'environment-1', 'employee-1', {
      schemaVersion: 1,
      selectedSection: 'warnings',
      warningsOnly: true,
      hiddenPanelKeys: ['sales'],
    });
    expect(
      await createLocalCoffeeManagerWorkspaceRepository().load(
        'project-1',
        'environment-1',
        'employee-1',
      ),
    ).toEqual({
      schemaVersion: 1,
      selectedSection: 'warnings',
      warningsOnly: true,
      hiddenPanelKeys: ['sales'],
    });
    expect([...values.values()].join(' ')).not.toContain('warningId');
  });

  it('isolates preferences by Project, Business Environment and employee', async () => {
    const repository = createLocalCoffeeManagerWorkspaceRepository();
    await repository.save('project-1', 'environment-1', 'employee-1', {
      schemaVersion: 1,
      selectedSection: 'warehouse',
      warningsOnly: false,
      hiddenPanelKeys: [],
    });
    expect(
      (await repository.load('project-2', 'environment-1', 'employee-1'))
        .selectedSection,
    ).toBe('overview');
    expect(
      (await repository.load('project-1', 'environment-2', 'employee-1'))
        .selectedSection,
    ).toBe('overview');
    expect(
      (await repository.load('project-1', 'environment-1', 'employee-2'))
        .selectedSection,
    ).toBe('overview');
  });

  it('normalizes repeated UI keys and notifies the current tab', async () => {
    const repository = createLocalCoffeeManagerWorkspaceRepository();
    const listener = vi.fn();
    const unsubscribe = repository.subscribe('project-1', listener);
    const saved = await repository.save('project-1', 'environment-1', 'employee-1', {
      schemaVersion: 1,
      selectedSection: 'events',
      warningsOnly: false,
      hiddenPanelKeys: ['sales', 'sales'],
    });
    expect(saved.hiddenPanelKeys).toEqual(['sales']);
    expect(listener).toHaveBeenCalledOnce();
    unsubscribe();
  });
});
