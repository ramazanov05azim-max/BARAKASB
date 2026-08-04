import {
  Boxes,
  BriefcaseBusiness,
  Building2,
  ClipboardCheck,
  Coffee,
  CookingPot,
  FileBarChart,
  Gauge,
  LockKeyhole,
  Map,
  PackageOpen,
  Plus,
  Settings,
  ShieldCheck,
  Store,
  Users,
  Wheat,
} from 'lucide-react';
import type { CoffeeCapability } from './domain';
import type { CoffeeTranslationKey } from './i18n';

type IconComponent = typeof Gauge;

export interface CoffeeNavigationItem {
  key: CoffeeTranslationKey;
  suffix: string;
  icon: IconComponent;
  capability?: CoffeeCapability;
}

export interface CoffeeNavigationGroup {
  key?: CoffeeTranslationKey;
  items: CoffeeNavigationItem[];
}

export const coffeeNavigationGroups: CoffeeNavigationGroup[] = [
  {
    items: [
      { key: 'nav.overview', suffix: '', icon: Gauge },
      { key: 'nav.setup', suffix: '/setup', icon: ClipboardCheck },
    ],
  },
  {
    key: 'nav.menu',
    items: [
      {
        key: 'nav.categories',
        suffix: '/menu/categories',
        icon: Boxes,
        capability: 'menu.read',
      },
      {
        key: 'nav.items',
        suffix: '/menu/items',
        icon: Coffee,
        capability: 'menu.read',
      },
      {
        key: 'nav.modifiers',
        suffix: '/menu/modifiers',
        icon: Plus,
        capability: 'menu.read',
      },
      {
        key: 'nav.recipes',
        suffix: '/recipes',
        icon: CookingPot,
        capability: 'recipes.read',
      },
    ],
  },
  {
    key: 'nav.inventory',
    items: [
      {
        key: 'nav.ingredients',
        suffix: '/inventory/ingredients',
        icon: Wheat,
        capability: 'inventory.read',
      },
      {
        key: 'nav.units',
        suffix: '/inventory/units',
        icon: PackageOpen,
        capability: 'inventory.read',
      },
      {
        key: 'nav.warehouses',
        suffix: '/inventory/warehouses',
        icon: Store,
        capability: 'inventory.read',
      },
    ],
  },
  {
    items: [
      {
        key: 'nav.suppliers',
        suffix: '/suppliers',
        icon: BriefcaseBusiness,
        capability: 'suppliers.read',
      },
      {
        key: 'nav.employees',
        suffix: '/employees',
        icon: Users,
        capability: 'employees.read',
      },
      {
        key: 'nav.roles',
        suffix: '/employees/roles',
        icon: ShieldCheck,
        capability: 'roles.read',
      },
      {
        key: 'nav.permissions',
        suffix: '/employees/permissions',
        icon: LockKeyhole,
        capability: 'roles.read',
      },
      {
        key: 'nav.workstations',
        suffix: '/workstations',
        icon: Building2,
        capability: 'workstations.read',
      },
      {
        key: 'nav.floorPlan',
        suffix: '/floor-plan',
        icon: Map,
        capability: 'locations.manage',
      },
      {
        key: 'nav.reports',
        suffix: '/reports',
        icon: FileBarChart,
        capability: 'reports.read',
      },
      {
        key: 'nav.settings',
        suffix: '/settings',
        icon: Settings,
        capability: 'settings.manage',
      },
    ],
  },
];

export const coffeeQuickActions: Array<
  Pick<CoffeeNavigationItem, 'key' | 'suffix' | 'icon'>
> = [
  { key: 'quick.addLocation', suffix: '/setup/locations', icon: Building2 },
  { key: 'quick.addMenuItem', suffix: '/menu/items', icon: Coffee },
  { key: 'quick.addIngredient', suffix: '/inventory/ingredients', icon: Wheat },
  { key: 'quick.inviteEmployee', suffix: '/employees', icon: Users },
];

export function findCoffeeNavigationItem(
  pathname: string,
  base: string,
): CoffeeNavigationItem | undefined {
  return coffeeNavigationGroups
    .flatMap((group) => group.items)
    .find((item) => pathname === `${base}${item.suffix}`);
}
