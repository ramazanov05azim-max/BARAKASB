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
      'production',
      'finance',
      'crm',
      'delivery',
      'pickup',
    ]) {
      expect(operationalModulePresentationRegistry.has(workspaceType)).toBe(false);
    }
  });

  it('registers Warehouse through its manifest rather than a host route condition', () => {
    const warehouse = operationalModulePresentationRegistry.get('warehouse');
    expect(warehouse?.manifest.identity.moduleKey).toBe('warehouse');
    expect(warehouse?.manifest.navigation).toHaveLength(6);
  });

  it('registers Purchaser through its manifest rather than a host route condition', () => {
    const purchaser = operationalModulePresentationRegistry.get('purchasing');
    expect(purchaser?.manifest.identity.moduleKey).toBe('purchasing');
    expect(purchaser?.manifest.navigation).toHaveLength(5);
  });

  it('registers Manager as one read-only operational module', () => {
    const manager = operationalModulePresentationRegistry.get('manager');
    expect(manager?.manifest.identity.moduleKey).toBe('manager');
    expect(manager?.manifest.navigation).toHaveLength(5);
    expect(
      manager?.manifest.declaredCapabilities.every((capability) =>
        capability.endsWith('.read'),
      ),
    ).toBe(true);
  });
});
