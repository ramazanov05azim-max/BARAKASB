import { describe, expect, it } from 'vitest';
import { en } from './resources/en';
import { ru } from './resources/ru';

const boundaryKeys = [
  'coffeeOnboarding.managerTitle',
  'coffeeOnboarding.save',
  'universal.connectTitle',
  'universal.invalidCode',
  'workspace.employeeLoginTitle',
  'workspace.changeEmployee',
] as const;

describe('Coffee responsibility-boundary localization', () => {
  it.each(boundaryKeys)('provides distinct Russian and English text for %s', (key) => {
    expect(ru[key]).toBeTruthy();
    expect(en[key]).toBeTruthy();
    expect(en[key]).not.toBe(ru[key]);
  });
});
