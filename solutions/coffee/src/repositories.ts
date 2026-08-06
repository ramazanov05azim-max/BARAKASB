'use client';

import {
  getBrowserMediaAssetService,
  type MediaAssetService,
} from '@barakasb/frontend-media';
import type {
  CoffeeCapability,
  CoffeeDevelopmentSeed,
  CoffeeOperationalSnapshot,
  CoffeeRole,
  CoffeeRoleId,
  CoffeeSnapshot,
  CoffeeSolutionStructure,
  CollectionEntityMap,
  CollectionKey,
  PermissionRow,
  SetupStep,
  SetupStepStatus,
} from './domain';
import { coffeeSolutionModuleIds, createDefaultCoffeeOperatingHours } from './domain';
import {
  CoffeeRepositoryError,
  type CoffeeManagerRepositories,
  type CoffeeOperationalReadRepository,
  type CollectionRepository,
} from './repository-contracts';
import { coffeeBarOrderStoragePrefix } from './bar-local-repository';
import { createCoffeeCrashTestSeed } from './coffee-crash-test-seed';
import {
  coffeeEmployeeCredentialStoragePrefix,
  localCoffeeEmployeeCredentialRepository,
} from './employee-credential-repository';
import { migrateLegacyMenuImages } from './menu-image-migration';
import { migrateLegacyRecipes } from './recipe-migration';
import { migrateLegacyIngredients } from './ingredient-migration';

const storagePrefix = 'barakasb.mock.coffee.project.v1';

const wait = async (milliseconds = 120): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
};

const now = (): string => new Date().toISOString();

const createId = (prefix: string): string =>
  `${prefix}-${globalThis.crypto?.randomUUID?.().slice(0, 8) ?? Date.now().toString(36)}`;

function browserMediaAssetsAvailable(): boolean {
  return typeof window !== 'undefined' && Boolean(window.indexedDB);
}

const localBrowserMediaAssets: MediaAssetService = {
  uploadImage: (input) => getBrowserMediaAssetService().uploadImage(input),
  importExternalImage: (input) =>
    getBrowserMediaAssetService().importExternalImage(input),
  get: (projectId, assetId) =>
    browserMediaAssetsAvailable()
      ? getBrowserMediaAssetService().get(projectId, assetId)
      : Promise.resolve(null),
  list: (projectId) =>
    browserMediaAssetsAvailable()
      ? getBrowserMediaAssetService().list(projectId)
      : Promise.resolve([]),
  resolveDisplayUrl: (projectId, assetId) =>
    browserMediaAssetsAvailable()
      ? getBrowserMediaAssetService().resolveDisplayUrl(projectId, assetId)
      : Promise.resolve(null),
  remove: (projectId, assetId) =>
    browserMediaAssetsAvailable()
      ? getBrowserMediaAssetService().remove(projectId, assetId)
      : Promise.resolve(),
  removeProject: (projectId) =>
    browserMediaAssetsAvailable()
      ? getBrowserMediaAssetService().removeProject(projectId)
      : Promise.resolve(),
};

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
      ownerName: '',
      registrationIdentifier: '',
      operatingStatus: 'active',
      businessHours: '',
      operatingHours: createDefaultCoffeeOperatingHours(),
      operatingDayStart: '04:00',
      operatingDayEnd: '03:59',
      defaultWarehouseId: '',
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
    floorPlanZones: [],
    tables: [],
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
    openingStockBalances: [],
    suppliers: [],
    employees: [],
    solutionStructure: {
      selectedModuleIds: [],
      workspaces: [],
      generatedAt: null,
      updatedAt: timestamp,
    },
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
    developmentSeedId: null,
  };
}

function storageKey(projectId: string): string {
  return `${storagePrefix}.${encodeURIComponent(projectId)}`;
}

function crashTestFloorPlan(
  timestamp: string,
): Pick<CoffeeSnapshot, 'floorPlanZones' | 'tables'> {
  const seed = createCoffeeCrashTestSeed(timestamp);
  return {
    floorPlanZones: structuredClone(seed.floorPlanZones),
    tables: structuredClone(seed.tables),
  };
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
    parsed.menuItems = parsed.menuItems.map((item) => ({
      ...item,
      imageAssetId: item.imageAssetId ?? null,
    }));
    parsed.menuCategories = parsed.menuCategories.map((category) => ({
      ...category,
      imageAssetId: category.imageAssetId ?? null,
    }));
    const recipeMigration = migrateLegacyRecipes(
      Array.isArray(parsed.recipes) ? parsed.recipes : [],
      parsed.menuItems,
    );
    parsed.recipes = recipeMigration.recipes;
    const ingredientMigration = migrateLegacyIngredients(
      Array.isArray(parsed.ingredients) ? parsed.ingredients : [],
      Array.isArray(parsed.units) ? parsed.units : [],
    );
    parsed.ingredients = ingredientMigration.ingredients;
    if (recipeMigration.migratedCount > 0 || ingredientMigration.migratedCount > 0) {
      writeSnapshot(projectId, parsed);
    }
    if (!parsed.settings) {
      parsed.settings = initialSnapshot(projectId, parsed.project.name).settings;
      writeSnapshot(projectId, parsed);
    }
    if (!parsed.businessProfile.operatingHours) {
      parsed.businessProfile.operatingHours = createDefaultCoffeeOperatingHours();
      parsed.businessProfile.operatingDayStart =
        parsed.businessProfile.operatingDayStart ?? '04:00';
      parsed.businessProfile.operatingDayEnd =
        parsed.businessProfile.operatingDayEnd ?? '03:59';
      writeSnapshot(projectId, parsed);
    }
    if (!parsed.openingStockBalances) {
      parsed.openingStockBalances = [];
    }
    if (!parsed.tables || !parsed.floorPlanZones) {
      const legacyTables = Array.isArray(parsed.tables) ? parsed.tables : [];
      const defaultLocationId =
        parsed.project.defaultLocationId ?? parsed.locations[0]?.id ?? '';
      const legacyZoneId = `zone-${defaultLocationId || 'main'}`;
      parsed.floorPlanZones =
        parsed.floorPlanZones ??
        (defaultLocationId
          ? [
              {
                id: legacyZoneId,
                locationId: defaultLocationId,
                name: 'Основной зал',
                zoneType: 'MAIN_HALL',
                canvasWidth: 800,
                canvasHeight: 500,
                active: true,
                sortOrder: 1,
                updatedAt: now(),
              },
            ]
          : []);
      parsed.tables = legacyTables.map((table, index) => {
        const legacy = table as unknown as Record<string, unknown>;
        return {
          ...table,
          locationId:
            typeof legacy.locationId === 'string'
              ? legacy.locationId
              : defaultLocationId,
          zoneId: typeof legacy.zoneId === 'string' ? legacy.zoneId : legacyZoneId,
          shape:
            legacy.shape === 'SQUARE' ||
            legacy.shape === 'RECTANGLE' ||
            legacy.shape === 'BAR_SEAT'
              ? legacy.shape
              : 'ROUND',
          positionX:
            typeof legacy.positionX === 'number'
              ? legacy.positionX
              : 40 + (index % 4) * 175,
          positionY:
            typeof legacy.positionY === 'number'
              ? legacy.positionY
              : 40 + Math.floor(index / 4) * 140,
          width: typeof legacy.width === 'number' ? legacy.width : 100,
          height: typeof legacy.height === 'number' ? legacy.height : 100,
          rotation: typeof legacy.rotation === 'number' ? legacy.rotation : 0,
          seatCount:
            typeof legacy.seatCount === 'number'
              ? legacy.seatCount
              : typeof legacy.seats === 'number'
                ? legacy.seats
                : 2,
          sortOrder:
            typeof legacy.sortOrder === 'number' ? legacy.sortOrder : index + 1,
        };
      });
      writeSnapshot(projectId, parsed);
    }
    if (
      (parsed.tables.length === 0 || parsed.floorPlanZones.length === 0) &&
      parsed.project.developmentLabel === 'crash-test'
    ) {
      const floorPlan = crashTestFloorPlan(now());
      parsed.floorPlanZones = floorPlan.floorPlanZones;
      parsed.tables = floorPlan.tables;
      writeSnapshot(projectId, parsed);
    }
    if (parsed.developmentSeedId === undefined) {
      parsed.developmentSeedId = null;
    }
    if (!parsed.solutionStructure) {
      parsed.solutionStructure = initialSnapshot(
        projectId,
        parsed.project.name,
      ).solutionStructure;
      writeSnapshot(projectId, parsed);
    }
    parsed.employees = parsed.employees.map((employee) => {
      const [derivedFirstName = employee.fullName, ...lastNameParts] = employee.fullName
        .trim()
        .split(/\s+/u);
      return {
        ...employee,
        firstName: employee.firstName ?? derivedFirstName,
        lastName: employee.lastName ?? lastNameParts.join(' '),
        position: employee.position ?? '',
      };
    });
    return parsed;
  } catch {
    throw new CoffeeRepositoryError('corrupt-data');
  }
}

function writeSnapshot(projectId: string, snapshot: CoffeeSnapshot): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(storageKey(projectId), JSON.stringify(snapshot));
}

async function readSnapshotWithMediaMigration(
  projectId: string,
  mediaAssets: MediaAssetService,
): Promise<CoffeeSnapshot> {
  const snapshot = readSnapshot(projectId);
  try {
    const result = await migrateLegacyMenuImages({
      projectId,
      snapshot,
      mediaAssets,
      persist: (migrated) => writeSnapshot(projectId, migrated),
    });
    return result.snapshot;
  } catch {
    return snapshot;
  }
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
      if (
        (key === 'menuItems' || key === 'menuCategories') &&
        (
          updated as
            CollectionEntityMap['menuItems'] | CollectionEntityMap['menuCategories']
        ).imageAssetId
      ) {
        delete (
          updated as (
            CollectionEntityMap['menuItems'] | CollectionEntityMap['menuCategories']
          ) & {
            imagePlaceholder?: unknown;
          }
        ).imagePlaceholder;
      }
      list[index] = updated;
      appendActivity(snapshot, 'activity.updated', updated.name);
      writeSnapshot(projectId, snapshot);
      return structuredClone(updated);
    },
    async remove(projectId, id) {
      await wait(140);
      const snapshot = readSnapshot(projectId);
      const list = snapshot[key] as CollectionEntityMap[K][];
      const index = list.findIndex((item) => item.id === id);
      const current = list[index];
      if (!current) throw new CoffeeRepositoryError('not-found');
      list.splice(index, 1);
      appendActivity(snapshot, 'activity.deleted', current.name);
      writeSnapshot(projectId, snapshot);
    },
  };
}

export function createLocalCoffeeManagerRepositories(
  mediaAssets: MediaAssetService = localBrowserMediaAssets,
): CoffeeManagerRepositories {
  const menuItems = collectionRepository('menuItems');
  const menuCategories = collectionRepository('menuCategories');
  async function removeUnreferencedAsset(
    projectId: string,
    assetId: NonNullable<CollectionEntityMap['menuItems']['imageAssetId']>,
  ): Promise<void> {
    const [items, categories] = await Promise.all([
      menuItems.list(projectId),
      menuCategories.list(projectId),
    ]);
    if (
      items.some((item) => item.imageAssetId === assetId) ||
      categories.some((category) => category.imageAssetId === assetId)
    ) {
      return;
    }
    await mediaAssets.remove(projectId, assetId);
  }
  const mediaAwareMenuItems: CollectionRepository<CollectionEntityMap['menuItems']> = {
    list: (projectId) => menuItems.list(projectId),
    create: (projectId, input) => menuItems.create(projectId, input),
    async update(projectId, id, input) {
      const previous = (await menuItems.list(projectId)).find((item) => item.id === id);
      const updated = await menuItems.update(projectId, id, input);
      if (previous?.imageAssetId && previous.imageAssetId !== updated.imageAssetId) {
        await removeUnreferencedAsset(projectId, previous.imageAssetId);
      }
      return updated;
    },
    async remove(projectId, id) {
      const previous = (await menuItems.list(projectId)).find((item) => item.id === id);
      await menuItems.remove(projectId, id);
      if (previous?.imageAssetId) {
        await removeUnreferencedAsset(projectId, previous.imageAssetId);
      }
    },
  };
  const mediaAwareMenuCategories: CollectionRepository<
    CollectionEntityMap['menuCategories']
  > = {
    list: (projectId) => menuCategories.list(projectId),
    create: (projectId, input) => menuCategories.create(projectId, input),
    async update(projectId, id, input) {
      const previous = (await menuCategories.list(projectId)).find(
        (category) => category.id === id,
      );
      const updated = await menuCategories.update(projectId, id, input);
      if (previous?.imageAssetId && previous.imageAssetId !== updated.imageAssetId) {
        await removeUnreferencedAsset(projectId, previous.imageAssetId);
      }
      return updated;
    },
    async remove(projectId, id) {
      const previous = (await menuCategories.list(projectId)).find(
        (category) => category.id === id,
      );
      await menuCategories.remove(projectId, id);
      if (previous?.imageAssetId) {
        await removeUnreferencedAsset(projectId, previous.imageAssetId);
      }
    },
  };
  return {
    mediaAssets,
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
      async remove(projectId) {
        await wait(60);
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(storageKey(projectId));
          window.localStorage.removeItem(
            `${coffeeBarOrderStoragePrefix}.${encodeURIComponent(projectId)}`,
          );
          await localCoffeeEmployeeCredentialRepository.removeProject(projectId);
          await mediaAssets.removeProject(projectId);
        }
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
    menuCategories: mediaAwareMenuCategories,
    menuItems: mediaAwareMenuItems,
    modifiers: collectionRepository('modifiers'),
    recipes: collectionRepository('recipes'),
    ingredients: collectionRepository('ingredients'),
    units: collectionRepository('units'),
    warehouses: collectionRepository('warehouses'),
    suppliers: collectionRepository('suppliers'),
    employees: collectionRepository('employees'),
    employeeCredentials: localCoffeeEmployeeCredentialRepository,
    solutionConstructor: {
      async get(projectId) {
        await wait();
        return structuredClone(readSnapshot(projectId).solutionStructure);
      },
      async generate(projectId, selectedModuleIds) {
        await wait(180);
        const snapshot = readSnapshot(projectId);
        const selected = [...new Set(selectedModuleIds)];
        if (
          selected.length === 0 ||
          selected.some((moduleId) => !coffeeSolutionModuleIds.includes(moduleId))
        ) {
          throw new CoffeeRepositoryError('invalid-operation');
        }

        const timestamp = now();
        const existingByModule = new Map(
          snapshot.solutionStructure.workspaces.map((workspace) => [
            workspace.moduleId,
            workspace,
          ]),
        );
        const structure: CoffeeSolutionStructure = {
          selectedModuleIds: selected,
          workspaces: selected.map((moduleId) => {
            const existing = existingByModule.get(moduleId);
            return (
              existing ?? {
                id: `workspace-${moduleId}`,
                moduleId,
                assignedEmployeeIds: [],
                status: 'active',
                createdAt: timestamp,
                updatedAt: timestamp,
              }
            );
          }),
          generatedAt: snapshot.solutionStructure.generatedAt ?? timestamp,
          updatedAt: timestamp,
        };
        snapshot.solutionStructure = structure;
        appendActivity(
          snapshot,
          'activity.solutionStructureGenerated',
          snapshot.project.name,
        );
        writeSnapshot(projectId, snapshot);
        return structuredClone(structure);
      },
      async assignEmployee(projectId, workspaceId, employeeId, assigned) {
        await wait(120);
        const snapshot = readSnapshot(projectId);
        const workspace = snapshot.solutionStructure.workspaces.find(
          (candidate) => candidate.id === workspaceId,
        );
        const employee = snapshot.employees.find(
          (candidate) => candidate.id === employeeId,
        );
        if (!workspace || !employee) {
          throw new CoffeeRepositoryError('not-found');
        }
        const assignments = new Set(workspace.assignedEmployeeIds);
        if (assigned) assignments.add(employeeId);
        else assignments.delete(employeeId);
        workspace.assignedEmployeeIds = [...assignments];
        workspace.updatedAt = now();
        snapshot.solutionStructure.updatedAt = workspace.updatedAt;
        appendActivity(
          snapshot,
          'activity.workspaceAssignmentUpdated',
          employee.fullName,
        );
        writeSnapshot(projectId, snapshot);
        return structuredClone(snapshot.solutionStructure);
      },
    },
    floorPlan: {
      async load(projectId) {
        await wait(80);
        const snapshot = readSnapshot(projectId);
        return structuredClone({
          zones: snapshot.floorPlanZones,
          tables: snapshot.tables,
        });
      },
      async save(projectId, floorPlan) {
        await wait(120);
        const snapshot = readSnapshot(projectId);
        snapshot.floorPlanZones = structuredClone(floorPlan.zones);
        snapshot.tables = structuredClone(floorPlan.tables);
        appendActivity(snapshot, 'activity.floorPlanUpdated', snapshot.project.name);
        writeSnapshot(projectId, snapshot);
        return structuredClone(floorPlan);
      },
    },
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
    developmentSeed: {
      async apply(projectId, seed: CoffeeDevelopmentSeed) {
        await wait(120);
        const snapshot = readSnapshot(projectId);
        if (snapshot.developmentSeedId === seed.id) return;
        snapshot.project.name = seed.projectDisplayName;
        snapshot.project.developmentLabel = 'crash-test';
        snapshot.project.defaultLocationId =
          seed.locations.find((location) => location.isDefault)?.id ??
          seed.locations[0]?.id ??
          null;
        snapshot.project.ready = true;
        snapshot.project.solutionStatus = 'configured';
        snapshot.project.updatedAt = now();
        snapshot.locations = structuredClone(seed.locations);
        snapshot.floorPlanZones = structuredClone(seed.floorPlanZones);
        snapshot.tables = structuredClone(seed.tables);
        snapshot.registers = structuredClone(seed.registers);
        snapshot.workstations = structuredClone(seed.workstations);
        snapshot.warehouses = structuredClone(seed.warehouses);
        snapshot.units = structuredClone(seed.units);
        snapshot.ingredients = structuredClone(seed.ingredients);
        snapshot.menuCategories = structuredClone(seed.menuCategories);
        snapshot.menuItems = structuredClone(seed.menuItems);
        snapshot.modifiers = structuredClone(seed.modifiers);
        snapshot.recipes = structuredClone(seed.recipes);
        snapshot.openingStockBalances = structuredClone(seed.openingStockBalances);
        snapshot.suppliers = structuredClone(seed.suppliers);
        snapshot.employees = structuredClone(seed.employees);
        snapshot.roles = snapshot.roles.map((role) => ({
          ...role,
          assignmentCount:
            seed.employees.filter((employee) => employee.assignedRoleId === role.id)
              .length + (role.id === 'owner' ? 1 : 0),
        }));
        snapshot.setupSteps = snapshot.setupSteps.map((step) => ({
          ...step,
          status: 'complete',
        }));
        snapshot.developmentSeedId = seed.id;
        appendActivity(
          snapshot,
          'activity.developmentSeedApplied',
          snapshot.project.name,
        );
        writeSnapshot(projectId, snapshot);
      },
    },
    async loadSnapshot(projectId) {
      await wait(220);
      return structuredClone(
        await readSnapshotWithMediaMigration(projectId, mediaAssets),
      );
    },
  };
}

export const localCoffeeManagerRepositories = createLocalCoffeeManagerRepositories();

export const localCoffeeOperationalReadRepository: CoffeeOperationalReadRepository = {
  async load(projectId): Promise<CoffeeOperationalSnapshot> {
    await wait(80);
    const snapshot = await readSnapshotWithMediaMigration(
      projectId,
      localBrowserMediaAssets,
    );
    return structuredClone({
      project: snapshot.project,
      businessProfile: snapshot.businessProfile,
      settings: snapshot.settings,
      locations: snapshot.locations,
      floorPlanZones: snapshot.floorPlanZones,
      tables: snapshot.tables,
      warehouses: snapshot.warehouses,
      units: snapshot.units,
      ingredients: snapshot.ingredients,
      menuItems: snapshot.menuItems,
      menuCategories: snapshot.menuCategories,
      modifiers: snapshot.modifiers,
      recipes: snapshot.recipes,
      openingStockBalances: snapshot.openingStockBalances,
      suppliers: snapshot.suppliers,
      employees: snapshot.employees,
      solutionStructure: snapshot.solutionStructure,
    });
  },
};

export function clearLocalCoffeeDevelopmentStorage(storage: Storage): number {
  const keys = Array.from({ length: storage.length }, (_, index) =>
    storage.key(index),
  ).filter((key): key is string => Boolean(key));
  const targets = keys.filter(
    (key) =>
      key.startsWith(`${storagePrefix}.`) ||
      key.startsWith(`${coffeeBarOrderStoragePrefix}.`) ||
      key.startsWith(`${coffeeEmployeeCredentialStoragePrefix}.`),
  );
  for (const key of targets) storage.removeItem(key);
  return targets.length;
}

export function setupStatusCounts(steps: SetupStep[]): Record<SetupStepStatus, number> {
  return steps.reduce<Record<SetupStepStatus, number>>(
    (counts, step) => {
      counts[step.status] += 1;
      return counts;
    },
    { complete: 0, incomplete: 0, blocked: 0 },
  );
}
