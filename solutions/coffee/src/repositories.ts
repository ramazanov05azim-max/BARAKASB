'use client';

import type {
  CoffeeCapability,
  CoffeeRole,
  CoffeeRoleId,
  CoffeeSnapshot,
  CollectionEntityMap,
  CollectionKey,
  PermissionRow,
  SetupStep,
  SetupStepStatus,
} from './domain';
import {
  CoffeeRepositoryError,
  type CoffeeRepositories,
  type CollectionRepository,
} from './repository-contracts';

const storagePrefix = 'barakasb.mock.coffee.project.v1';

const wait = async (milliseconds = 120): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
};

const now = (): string => new Date().toISOString();

const createId = (prefix: string): string =>
  `${prefix}-${globalThis.crypto?.randomUUID?.().slice(0, 8) ?? Date.now().toString(36)}`;

const allCapabilities: CoffeeCapability[] = [
  'project.manage',
  'locations.read',
  'locations.manage',
  'menu.read',
  'menu.manage',
  'recipes.read',
  'recipes.manage',
  'inventory.read',
  'inventory.manage',
  'suppliers.read',
  'suppliers.manage',
  'employees.read',
  'employees.manage',
  'roles.read',
  'roles.assign',
  'workstations.read',
  'workstations.manage',
  'reports.read',
  'settings.manage',
];

const roles: CoffeeRole[] = [
  {
    id: 'owner',
    nameKey: 'roles.owner',
    descriptionKey: 'roles.ownerDescription',
    capabilities: allCapabilities,
    assignmentCount: 1,
  },
  {
    id: 'administrator',
    nameKey: 'roles.administrator',
    descriptionKey: 'roles.administratorDescription',
    capabilities: allCapabilities.filter(
      (capability) => capability !== 'project.manage',
    ),
    assignmentCount: 0,
  },
  {
    id: 'location-manager',
    nameKey: 'roles.locationManager',
    descriptionKey: 'roles.locationManagerDescription',
    capabilities: [
      'locations.read',
      'menu.read',
      'menu.manage',
      'recipes.read',
      'inventory.read',
      'suppliers.read',
      'employees.read',
      'workstations.read',
      'reports.read',
    ],
    assignmentCount: 0,
  },
  {
    id: 'cashier',
    nameKey: 'roles.cashier',
    descriptionKey: 'roles.cashierDescription',
    capabilities: ['menu.read', 'locations.read', 'workstations.read'],
    assignmentCount: 0,
  },
  {
    id: 'barista',
    nameKey: 'roles.barista',
    descriptionKey: 'roles.baristaDescription',
    capabilities: ['menu.read', 'recipes.read', 'locations.read'],
    assignmentCount: 0,
  },
  {
    id: 'kitchen',
    nameKey: 'roles.kitchen',
    descriptionKey: 'roles.kitchenDescription',
    capabilities: ['menu.read', 'recipes.read', 'locations.read'],
    assignmentCount: 0,
  },
  {
    id: 'inventory',
    nameKey: 'roles.inventory',
    descriptionKey: 'roles.inventoryDescription',
    capabilities: [
      'inventory.read',
      'inventory.manage',
      'suppliers.read',
      'locations.read',
    ],
    assignmentCount: 0,
  },
  {
    id: 'finance',
    nameKey: 'roles.finance',
    descriptionKey: 'roles.financeDescription',
    capabilities: ['reports.read', 'suppliers.read'],
    assignmentCount: 0,
  },
  {
    id: 'analyst',
    nameKey: 'roles.analyst',
    descriptionKey: 'roles.analystDescription',
    capabilities: ['reports.read', 'menu.read', 'inventory.read'],
    assignmentCount: 0,
  },
];

const permissionRows: PermissionRow[] = [
  ['permissions.projectAdministration', 'project.manage', ['owner']],
  [
    'permissions.locations',
    'locations.manage',
    ['owner', 'administrator', 'location-manager'],
  ],
  ['permissions.menu', 'menu.manage', ['owner', 'administrator', 'location-manager']],
  ['permissions.recipes', 'recipes.manage', ['owner', 'administrator']],
  [
    'permissions.inventory',
    'inventory.manage',
    ['owner', 'administrator', 'inventory'],
  ],
  ['permissions.suppliers', 'suppliers.manage', ['owner', 'administrator']],
  ['permissions.employees', 'employees.manage', ['owner', 'administrator']],
  ['permissions.pos', 'menu.read', ['owner', 'location-manager', 'cashier']],
  ['permissions.kitchen', 'recipes.read', ['owner', 'barista', 'kitchen']],
  ['permissions.finance', 'reports.read', ['owner', 'finance']],
  ['permissions.analytics', 'reports.read', ['owner', 'analyst']],
  [
    'permissions.reports',
    'reports.read',
    ['owner', 'administrator', 'location-manager', 'finance', 'analyst'],
  ],
].map(([moduleKey, capabilityKey, allowed]) => ({
  moduleKey: moduleKey as string,
  capabilityKey: capabilityKey as string,
  grants: Object.fromEntries(
    (allowed as CoffeeRoleId[]).map((roleId) => [roleId, 'allowed']),
  ) as PermissionRow['grants'],
}));

const setupDefinitions: Array<Pick<SetupStep, 'id' | 'labelKey' | 'hrefSuffix'>> = [
  {
    id: 'business-profile',
    labelKey: 'setup.businessProfile',
    hrefSuffix: '/setup/business-profile',
  },
  { id: 'location', labelKey: 'setup.firstLocation', hrefSuffix: '/setup/locations' },
  { id: 'register', labelKey: 'setup.registers', hrefSuffix: '/setup/registers' },
  {
    id: 'workstation',
    labelKey: 'setup.workstations',
    hrefSuffix: '/workstations',
  },
  {
    id: 'menu-category',
    labelKey: 'setup.menuCategories',
    hrefSuffix: '/menu/categories',
  },
  { id: 'menu-item', labelKey: 'setup.menuItems', hrefSuffix: '/menu/items' },
  {
    id: 'ingredient',
    labelKey: 'setup.ingredients',
    hrefSuffix: '/inventory/ingredients',
  },
  { id: 'recipe', labelKey: 'setup.recipes', hrefSuffix: '/recipes' },
  {
    id: 'warehouse',
    labelKey: 'setup.warehouse',
    hrefSuffix: '/inventory/warehouses',
  },
  { id: 'supplier', labelKey: 'setup.suppliers', hrefSuffix: '/suppliers' },
  { id: 'employee', labelKey: 'setup.employees', hrefSuffix: '/employees' },
  { id: 'role', labelKey: 'setup.assignRoles', hrefSuffix: '/employees/roles' },
  { id: 'review', labelKey: 'setup.review', hrefSuffix: '/setup' },
  { id: 'ready', labelKey: 'setup.ready', hrefSuffix: '/setup' },
];

function initialSnapshot(projectId: string, projectName: string): CoffeeSnapshot {
  const timestamp = now();
  return {
    project: {
      id: projectId,
      name: projectName,
      solutionStatus: 'setup-required',
      defaultLocationId: null,
      ready: false,
      updatedAt: timestamp,
    },
    businessProfile: {
      businessName: projectName,
      legalName: '',
      brandName: projectName,
      description: '',
      logoPlaceholder: '',
      defaultCurrency: 'RUB',
      timezone: 'Europe/Moscow',
      country: 'RU',
      language: 'ru',
      taxMode: 'standard',
      receiptInformation: '',
      contactInformation: '',
      businessAddress: '',
      updatedAt: timestamp,
    },
    settings: {
      businessDayBoundary: '04:00',
      brandAccent: 'espresso',
      locationPolicy: 'independent',
      locale: 'ru',
      taxMode: 'standard',
      receiptFooter: '',
      enabledModules: 'menu,recipes,inventory-setup',
      notificationMode: 'important',
      updatedAt: timestamp,
    },
    locations: [],
    registers: [],
    workstations: [],
    menuCategories: [],
    menuItems: [],
    modifiers: [],
    recipes: [],
    ingredients: [],
    units: [
      {
        id: 'unit-g',
        name: 'Gram',
        symbol: 'g',
        dimension: 'mass',
        conversionTargetId: 'unit-kg',
        conversionRate: 0.001,
        status: 'active',
        updatedAt: timestamp,
      },
      {
        id: 'unit-kg',
        name: 'Kilogram',
        symbol: 'kg',
        dimension: 'mass',
        conversionTargetId: '',
        conversionRate: 1,
        status: 'active',
        updatedAt: timestamp,
      },
      {
        id: 'unit-ml',
        name: 'Milliliter',
        symbol: 'ml',
        dimension: 'volume',
        conversionTargetId: 'unit-l',
        conversionRate: 0.001,
        status: 'active',
        updatedAt: timestamp,
      },
      {
        id: 'unit-l',
        name: 'Liter',
        symbol: 'l',
        dimension: 'volume',
        conversionTargetId: '',
        conversionRate: 1,
        status: 'active',
        updatedAt: timestamp,
      },
      {
        id: 'unit-pc',
        name: 'Piece',
        symbol: 'pc',
        dimension: 'count',
        conversionTargetId: '',
        conversionRate: 1,
        status: 'active',
        updatedAt: timestamp,
      },
    ],
    warehouses: [],
    suppliers: [],
    employees: [],
    roles: structuredClone(roles),
    permissions: structuredClone(permissionRows),
    setupSteps: setupDefinitions.map((step, index) => ({
      ...step,
      status: index === 0 ? 'incomplete' : 'blocked',
    })),
    activities: [
      {
        id: createId('activity'),
        actionKey: 'activity.solutionInstalled',
        target: projectName,
        occurredAt: timestamp,
      },
    ],
    currentRoleId: 'owner',
  };
}

function storageKey(projectId: string): string {
  return `${storagePrefix}.${encodeURIComponent(projectId)}`;
}

function readSnapshot(projectId: string, projectName?: string): CoffeeSnapshot {
  if (typeof window === 'undefined') {
    return initialSnapshot(projectId, projectName ?? 'Coffee Project');
  }
  const stored = window.localStorage.getItem(storageKey(projectId));
  if (!stored) {
    const snapshot = initialSnapshot(projectId, projectName ?? 'Coffee Project');
    writeSnapshot(projectId, snapshot);
    return snapshot;
  }
  try {
    const parsed = JSON.parse(stored) as CoffeeSnapshot;
    if (!parsed.settings) {
      parsed.settings = initialSnapshot(projectId, parsed.project.name).settings;
      writeSnapshot(projectId, parsed);
    }
    return parsed;
  } catch {
    throw new CoffeeRepositoryError('corrupt-data');
  }
}

function writeSnapshot(projectId: string, snapshot: CoffeeSnapshot): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(storageKey(projectId), JSON.stringify(snapshot));
}

function appendActivity(
  snapshot: CoffeeSnapshot,
  actionKey: string,
  target: string,
): void {
  snapshot.activities = [
    {
      id: createId('activity'),
      actionKey,
      target,
      occurredAt: now(),
    },
    ...snapshot.activities,
  ].slice(0, 12);
}

function unlockAfterCompletion(steps: SetupStep[], completedId: SetupStep['id']): void {
  const index = steps.findIndex((step) => step.id === completedId);
  if (index < 0) return;
  const step = steps[index];
  if (step) step.status = 'complete';
  const next = steps[index + 1];
  if (next?.status === 'blocked') next.status = 'incomplete';
}

function completeStep(snapshot: CoffeeSnapshot, stepId: SetupStep['id']): SetupStep[] {
  unlockAfterCompletion(snapshot.setupSteps, stepId);
  return snapshot.setupSteps;
}

const stepForCollection: Partial<Record<CollectionKey, SetupStep['id']>> = {
  locations: 'location',
  registers: 'register',
  workstations: 'workstation',
  menuCategories: 'menu-category',
  menuItems: 'menu-item',
  ingredients: 'ingredient',
  recipes: 'recipe',
  warehouses: 'warehouse',
  suppliers: 'supplier',
  employees: 'employee',
};

function collectionRepository<K extends CollectionKey>(
  key: K,
): CollectionRepository<CollectionEntityMap[K]> {
  return {
    async list(projectId) {
      await wait();
      const list = readSnapshot(projectId)[key] as CollectionEntityMap[K][];
      return structuredClone(list);
    },
    async create(projectId, input) {
      await wait(180);
      const snapshot = readSnapshot(projectId);
      const entity = {
        ...input,
        id: createId(key),
        updatedAt: now(),
      } as CollectionEntityMap[K];
      const list = snapshot[key] as CollectionEntityMap[K][];
      list.push(entity);
      const setupStep = stepForCollection[key];
      if (setupStep) completeStep(snapshot, setupStep);
      appendActivity(snapshot, 'activity.created', entity.name);
      writeSnapshot(projectId, snapshot);
      return structuredClone(entity);
    },
    async update(projectId, id, input) {
      await wait(160);
      const snapshot = readSnapshot(projectId);
      const list = snapshot[key] as CollectionEntityMap[K][];
      const index = list.findIndex((item) => item.id === id);
      const current = list[index];
      if (!current) throw new CoffeeRepositoryError('not-found');
      const updated = {
        ...current,
        ...input,
        id,
        updatedAt: now(),
      } as CollectionEntityMap[K];
      list[index] = updated;
      appendActivity(snapshot, 'activity.updated', updated.name);
      writeSnapshot(projectId, snapshot);
      return structuredClone(updated);
    },
  };
}

export const localCoffeeRepositories: CoffeeRepositories = {
  coffeeProject: {
    async initialize(projectId, projectName) {
      await wait(80);
      const snapshot = readSnapshot(projectId, projectName);
      if (snapshot.project.name === 'Coffee Project' && projectName) {
        snapshot.project.name = projectName;
        snapshot.project.updatedAt = now();
        writeSnapshot(projectId, snapshot);
      }
      return structuredClone(snapshot.project);
    },
    async get(projectId) {
      await wait();
      return structuredClone(readSnapshot(projectId).project);
    },
    async setDefaultLocation(projectId, locationId) {
      await wait(120);
      const snapshot = readSnapshot(projectId);
      if (!snapshot.locations.some((location) => location.id === locationId)) {
        throw new CoffeeRepositoryError('not-found');
      }
      snapshot.project.defaultLocationId = locationId;
      snapshot.locations = snapshot.locations.map((location) => ({
        ...location,
        isDefault: location.id === locationId,
      }));
      snapshot.project.updatedAt = now();
      appendActivity(
        snapshot,
        'activity.defaultLocation',
        snapshot.locations.find((location) => location.id === locationId)?.name ?? '',
      );
      writeSnapshot(projectId, snapshot);
      return structuredClone(snapshot.project);
    },
    async markReady(projectId) {
      await wait(220);
      const snapshot = readSnapshot(projectId);
      const prerequisiteSteps = snapshot.setupSteps.filter(
        (step) => step.id !== 'ready',
      );
      if (prerequisiteSteps.some((step) => step.status !== 'complete')) {
        throw new CoffeeRepositoryError('invalid-operation');
      }
      completeStep(snapshot, 'ready');
      snapshot.project.ready = true;
      snapshot.project.solutionStatus = 'configured';
      snapshot.project.updatedAt = now();
      appendActivity(snapshot, 'activity.projectReady', snapshot.project.name);
      writeSnapshot(projectId, snapshot);
      return structuredClone(snapshot.project);
    },
  },
  businessProfile: {
    async get(projectId) {
      await wait();
      return structuredClone(readSnapshot(projectId).businessProfile);
    },
    async update(projectId, profile) {
      await wait(180);
      const snapshot = readSnapshot(projectId);
      snapshot.businessProfile = { ...profile, updatedAt: now() };
      completeStep(snapshot, 'business-profile');
      appendActivity(snapshot, 'activity.profileUpdated', profile.businessName);
      writeSnapshot(projectId, snapshot);
      return structuredClone(snapshot.businessProfile);
    },
  },
  settings: {
    async get(projectId) {
      await wait();
      return structuredClone(readSnapshot(projectId).settings);
    },
    async update(projectId, settings) {
      await wait(160);
      const snapshot = readSnapshot(projectId);
      snapshot.settings = { ...settings, updatedAt: now() };
      appendActivity(snapshot, 'activity.settingsUpdated', snapshot.project.name);
      writeSnapshot(projectId, snapshot);
      return structuredClone(snapshot.settings);
    },
  },
  locations: collectionRepository('locations'),
  registers: collectionRepository('registers'),
  workstations: collectionRepository('workstations'),
  menuCategories: collectionRepository('menuCategories'),
  menuItems: collectionRepository('menuItems'),
  modifiers: collectionRepository('modifiers'),
  recipes: collectionRepository('recipes'),
  ingredients: collectionRepository('ingredients'),
  units: collectionRepository('units'),
  warehouses: collectionRepository('warehouses'),
  suppliers: collectionRepository('suppliers'),
  employees: collectionRepository('employees'),
  roles: {
    async list(projectId) {
      await wait();
      return structuredClone(readSnapshot(projectId).roles);
    },
    async assign(projectId, employeeId, roleId) {
      await wait(160);
      const snapshot = readSnapshot(projectId);
      const employee = snapshot.employees.find((item) => item.id === employeeId);
      if (!employee) throw new CoffeeRepositoryError('not-found');
      const previousRole = snapshot.roles.find(
        (role) => role.id === employee.assignedRoleId,
      );
      const nextRole = roleId
        ? snapshot.roles.find((role) => role.id === roleId)
        : undefined;
      if (roleId && !nextRole) throw new CoffeeRepositoryError('not-found');
      employee.assignedRoleId = roleId;
      employee.updatedAt = now();
      if (previousRole && previousRole.assignmentCount > 0) {
        previousRole.assignmentCount -= 1;
      }
      if (nextRole) {
        nextRole.assignmentCount += 1;
        completeStep(snapshot, 'role');
      }
      appendActivity(snapshot, 'activity.roleAssigned', employee.fullName);
      writeSnapshot(projectId, snapshot);
    },
  },
  permissions: {
    async list(projectId) {
      await wait();
      return structuredClone(readSnapshot(projectId).permissions);
    },
    async capabilitiesForRole(projectId, roleId) {
      await wait(60);
      const role = readSnapshot(projectId).roles.find((item) => item.id === roleId);
      return structuredClone(role?.capabilities ?? []);
    },
    async setPreviewRole(projectId, roleId) {
      await wait(60);
      const snapshot = readSnapshot(projectId);
      if (!snapshot.roles.some((role) => role.id === roleId)) {
        throw new CoffeeRepositoryError('not-found');
      }
      snapshot.currentRoleId = roleId;
      writeSnapshot(projectId, snapshot);
    },
  },
  setupChecklist: {
    async list(projectId) {
      await wait();
      return structuredClone(readSnapshot(projectId).setupSteps);
    },
    async complete(projectId, stepId) {
      await wait(120);
      const snapshot = readSnapshot(projectId);
      const target = snapshot.setupSteps.find((step) => step.id === stepId);
      if (!target || target.status === 'blocked') {
        throw new CoffeeRepositoryError('invalid-operation');
      }
      completeStep(snapshot, stepId);
      appendActivity(snapshot, 'activity.stepCompleted', target.labelKey);
      writeSnapshot(projectId, snapshot);
      return structuredClone(snapshot.setupSteps);
    },
  },
  activity: {
    async list(projectId) {
      await wait();
      return structuredClone(readSnapshot(projectId).activities);
    },
  },
  async loadSnapshot(projectId) {
    await wait(220);
    return structuredClone(readSnapshot(projectId));
  },
};

export function setupStatusCounts(steps: SetupStep[]): Record<SetupStepStatus, number> {
  return steps.reduce<Record<SetupStepStatus, number>>(
    (counts, step) => {
      counts[step.status] += 1;
      return counts;
    },
    { complete: 0, incomplete: 0, blocked: 0 },
  );
}
