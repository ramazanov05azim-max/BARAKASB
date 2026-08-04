import { describe, expect, it } from 'vitest';
import {
  coffeeNavigationGroups,
  coffeeQuickActions,
  findCoffeeNavigationItem,
} from './coffee-navigation';

const base = '/projects/project-1/coffee';

describe('Coffee administration navigation', () => {
  it('opens menu business screens directly without an overview destination', () => {
    const menuGroup = coffeeNavigationGroups.find((group) => group.key === 'nav.menu');

    expect(menuGroup?.items.map((item) => [item.key, item.suffix])).toEqual([
      ['nav.categories', '/menu/categories'],
      ['nav.items', '/menu/items'],
      ['nav.modifiers', '/menu/modifiers'],
      ['nav.recipes', '/recipes'],
    ]);
    expect(menuGroup?.items.some((item) => item.suffix === '/menu')).toBe(false);
  });

  it('opens inventory business screens directly without an overview destination', () => {
    const inventoryGroup = coffeeNavigationGroups.find(
      (group) => group.key === 'nav.inventory',
    );

    expect(inventoryGroup?.items.map((item) => [item.key, item.suffix])).toEqual([
      ['nav.ingredients', '/inventory/ingredients'],
      ['nav.units', '/inventory/units'],
      ['nav.warehouses', '/inventory/warehouses'],
    ]);
    expect(inventoryGroup?.items.some((item) => item.suffix === '/inventory')).toBe(
      false,
    );
  });

  it('resolves breadcrumbs for every preserved working page', () => {
    expect(findCoffeeNavigationItem(`${base}/menu/categories`, base)?.key).toBe(
      'nav.categories',
    );
    expect(findCoffeeNavigationItem(`${base}/menu/items`, base)?.key).toBe('nav.items');
    expect(findCoffeeNavigationItem(`${base}/menu/modifiers`, base)?.key).toBe(
      'nav.modifiers',
    );
    expect(findCoffeeNavigationItem(`${base}/recipes`, base)?.key).toBe('nav.recipes');
    expect(findCoffeeNavigationItem(`${base}/inventory/ingredients`, base)?.key).toBe(
      'nav.ingredients',
    );
    expect(findCoffeeNavigationItem(`${base}/inventory/units`, base)?.key).toBe(
      'nav.units',
    );
    expect(findCoffeeNavigationItem(`${base}/inventory/warehouses`, base)?.key).toBe(
      'nav.warehouses',
    );
  });

  it('contains no duplicate, removed, or broken configured destinations', () => {
    const suffixes = coffeeNavigationGroups.flatMap((group) =>
      group.items.map((item) => item.suffix),
    );

    expect(new Set(suffixes).size).toBe(suffixes.length);
    expect(suffixes).not.toContain('/menu');
    expect(suffixes).not.toContain('/inventory');
    expect(coffeeQuickActions.map((action) => action.suffix)).not.toContain('/menu');
    expect(coffeeQuickActions.map((action) => action.suffix)).not.toContain(
      '/inventory',
    );
  });
});
