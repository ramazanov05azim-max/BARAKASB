import { describe, expect, it } from 'vitest';
import { operationalModulePresentationRegistry } from './operational-module-composition';

describe('Operational Module browser composition', () => {
  it('registers Bar as the reference Coffee workspace', () => {
    const bar = operationalModulePresentationRegistry.get('bar');

    expect(bar?.manifest.identity).toEqual({
      solutionKey: 'coffee',
      moduleKey: 'bar',
      contractVersion: '1.0.0',
    });
  });

  it('does not register future business modules as placeholders', () => {
    for (const workspaceType of [
      'kitchen',
      'warehouse',
      'purchasing',
      'production',
      'finance',
      'crm',
      'delivery',
      'pickup',
    ]) {
      expect(operationalModulePresentationRegistry.has(workspaceType)).toBe(false);
    }
  });
});
