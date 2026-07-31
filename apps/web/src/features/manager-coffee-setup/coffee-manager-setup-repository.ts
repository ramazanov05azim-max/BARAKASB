'use client';

import {
  localCoffeeManagerRepositories,
  type CoffeeDevelopmentSeed,
  type CoffeeManagerRepositories,
} from '@barakasb/solution-coffee';
import { localBusinessEnvironmentDirectoryWriter } from '@/features/universal-application/infrastructure/local-business-environment-directory';
import type {
  BusinessEnvironmentDirectoryWriter,
  ResolvedBusinessEnvironment,
} from '@/features/universal-application/application/business-environment-resolution';
import {
  mockRepository,
  type MockRepository,
  type ProjectSummary,
} from '@/lib/mock-repository';

const storageKey = 'barakasb.manager.coffee-installations.v1';
const demoRemovalKey = 'barakasb.manager.coffee-demo.removed.v1';
const demoProjectId = 'demo-coffee-north-star';
const demoSeedId = 'coffee-development-demo-v1';
const codeSpace = 10_000_000_000_000_000n;
const fnvOffsetBasis = 14_695_981_039_346_656_037n;
const fnvPrime = 1_099_511_628_211n;
const unsigned64Mask = (1n << 64n) - 1n;

export interface CoffeeEstablishmentInput {
  establishmentName: string;
  legalName: string;
  ownerName: string;
  country: string;
  city: string;
  address: string;
  timezone: string;
  currency: string;
  language: 'ru' | 'en';
  phone: string;
  email: string;
}

export interface CoffeeSolutionInstallation {
  readonly id: string;
  readonly projectId: string;
  readonly solutionId: 'coffee';
  readonly status: 'installed';
  readonly installedAt: string;
}

export interface CoffeeManagerSetupRecord {
  readonly schemaVersion: 1;
  readonly project: ProjectSummary;
  readonly installation: CoffeeSolutionInstallation;
  readonly establishment: CoffeeEstablishmentInput | null;
  readonly businessEnvironmentCode: string | null;
  readonly businessEnvironmentId: string | null;
  readonly configuredAt: string | null;
  readonly isDevelopmentDemo: boolean;
}

export interface CoffeeManagerSetupRepository {
  install(project: ProjectSummary): Promise<CoffeeManagerSetupRecord>;
  get(projectId: string): Promise<CoffeeManagerSetupRecord | null>;
  list(): Promise<CoffeeManagerSetupRecord[]>;
  configure(
    projectId: string,
    input: CoffeeEstablishmentInput,
  ): Promise<CoffeeManagerSetupRecord>;
  seedDevelopmentDemo(): Promise<CoffeeManagerSetupRecord | null>;
  removeDevelopmentDemo(): Promise<void>;
}

interface CoffeeManagerSetupDependencies {
  storage: Storage;
  platformProjects: Pick<
    MockRepository,
    'ensureProject' | 'deleteProject' | 'getProject'
  >;
  coffeeRepositories: Pick<
    CoffeeManagerRepositories,
    'coffeeProject' | 'businessProfile' | 'settings' | 'developmentSeed'
  >;
  directory: BusinessEnvironmentDirectoryWriter;
  now?: () => string;
  developmentDemoEnabled?: boolean;
}

function canonicalize(input: CoffeeEstablishmentInput): string {
  return [
    input.establishmentName,
    input.legalName,
    input.ownerName,
    input.country,
    input.city,
    input.address,
    input.timezone,
    input.currency,
    input.language,
    input.phone,
    input.email,
  ]
    .map((value) => value.trim().toLocaleLowerCase('en-US'))
    .join('|');
}

function hashToCode(value: string): string {
  let hash = fnvOffsetBasis;
  for (const character of value) {
    hash ^= BigInt(character.codePointAt(0) ?? 0);
    hash = (hash * fnvPrime) & unsigned64Mask;
  }
  return (hash % codeSpace).toString().padStart(16, '0');
}

export function generateLocalBusinessEnvironmentCode(
  input: CoffeeEstablishmentInput,
  existingCodes: ReadonlySet<string>,
): string {
  const seed = canonicalize(input);
  for (let attempt = 0; attempt < Number.MAX_SAFE_INTEGER; attempt += 1) {
    const candidate = hashToCode(`${seed}|${attempt}`);
    if (!existingCodes.has(candidate)) return candidate;
  }
  throw new Error('local-business-environment-code-space-exhausted');
}

function readRecords(storage: Storage): CoffeeManagerSetupRecord[] {
  const raw = storage.getItem(storageKey);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter(
          (record): record is CoffeeManagerSetupRecord =>
            typeof record === 'object' &&
            record !== null &&
            'schemaVersion' in record &&
            record.schemaVersion === 1 &&
            'project' in record &&
            typeof record.project === 'object' &&
            record.project !== null,
        )
      : [];
  } catch {
    return [];
  }
}

function writeRecords(storage: Storage, records: CoffeeManagerSetupRecord[]): void {
  storage.setItem(storageKey, JSON.stringify(records));
}

function replaceRecord(storage: Storage, record: CoffeeManagerSetupRecord): void {
  writeRecords(storage, [
    ...readRecords(storage).filter(
      (candidate) => candidate.project.id !== record.project.id,
    ),
    record,
  ]);
}

function demoProject(timestamp: string): ProjectSummary {
  return {
    id: demoProjectId,
    name: 'North Star Coffee',
    solutionId: 'coffee',
    categoryId: 'food',
    status: 'active',
    role: 'owner',
    createdAt: timestamp,
    isDevelopmentDemo: true,
  };
}

const demoEstablishment: CoffeeEstablishmentInput = {
  establishmentName: 'North Star Coffee',
  legalName: 'North Star Coffee LLC',
  ownerName: 'Alex Morgan',
  country: 'RU',
  city: 'Moscow',
  address: '12 Tverskaya Street',
  timezone: 'Europe/Moscow',
  currency: 'RUB',
  language: 'ru',
  phone: '+7 999 123-45-67',
  email: 'owner@north-star.test',
};

function developmentSeed(timestamp: string): CoffeeDevelopmentSeed {
  return {
    id: demoSeedId,
    warehouses: [
      {
        id: 'demo-warehouse-main',
        name: 'Main storage',
        code: 'MAIN',
        locationId: '',
        warehouseType: 'main',
        addressOrZone: 'Back of house',
        responsibleEmployeeId: '',
        status: 'active',
        updatedAt: timestamp,
      },
    ],
    ingredients: [
      {
        id: 'demo-ingredient-beans',
        name: 'Espresso beans',
        sku: 'ING-BEANS',
        category: 'Coffee',
        baseUnitId: 'unit-g',
        purchaseUnitId: 'unit-kg',
        conversionRate: 1000,
        minimumStock: 5000,
        cost: 1.8,
        supplierReferences: 'Demo Roastery',
        status: 'active',
        updatedAt: timestamp,
      },
      {
        id: 'demo-ingredient-milk',
        name: 'Whole milk',
        sku: 'ING-MILK',
        category: 'Dairy',
        baseUnitId: 'unit-ml',
        purchaseUnitId: 'unit-l',
        conversionRate: 1000,
        minimumStock: 10000,
        cost: 0.11,
        supplierReferences: 'Demo Dairy',
        status: 'active',
        updatedAt: timestamp,
      },
      {
        id: 'demo-ingredient-water',
        name: 'Filtered water',
        sku: 'ING-WATER',
        category: 'Utility',
        baseUnitId: 'unit-ml',
        purchaseUnitId: 'unit-l',
        conversionRate: 1000,
        minimumStock: 20000,
        cost: 0.01,
        supplierReferences: '',
        status: 'active',
        updatedAt: timestamp,
      },
      {
        id: 'demo-ingredient-cup',
        name: 'Takeaway cup 300 ml',
        sku: 'ING-CUP-300',
        category: 'Packaging',
        baseUnitId: 'unit-pc',
        purchaseUnitId: 'unit-pc',
        conversionRate: 1,
        minimumStock: 100,
        cost: 8,
        supplierReferences: 'Demo Packaging',
        status: 'active',
        updatedAt: timestamp,
      },
    ],
    menuCategories: [
      {
        id: 'demo-category-coffee',
        name: 'Coffee',
        description: 'Espresso-based drinks',
        displayOrder: 1,
        locationAvailability: 'all',
        imagePlaceholder: '',
        status: 'active',
        updatedAt: timestamp,
      },
    ],
    menuItems: [
      {
        id: 'demo-item-espresso',
        name: 'Espresso',
        categoryId: 'demo-category-coffee',
        description: 'Double espresso',
        sku: 'DRINK-ESP',
        barcode: '',
        sellingPrice: 190,
        taxCategory: 'standard',
        locationAvailability: 'all',
        imagePlaceholder: '',
        recipeId: 'demo-recipe-espresso',
        modifierGroupIds: [],
        status: 'active',
        updatedAt: timestamp,
      },
      {
        id: 'demo-item-cappuccino',
        name: 'Cappuccino',
        categoryId: 'demo-category-coffee',
        description: 'Espresso with steamed milk',
        sku: 'DRINK-CAP',
        barcode: '',
        sellingPrice: 290,
        taxCategory: 'standard',
        locationAvailability: 'all',
        imagePlaceholder: '',
        recipeId: 'demo-recipe-cappuccino',
        modifierGroupIds: [],
        status: 'active',
        updatedAt: timestamp,
      },
      {
        id: 'demo-item-americano',
        name: 'Americano',
        categoryId: 'demo-category-coffee',
        description: 'Espresso with hot water',
        sku: 'DRINK-AMR',
        barcode: '',
        sellingPrice: 230,
        taxCategory: 'standard',
        locationAvailability: 'all',
        imagePlaceholder: '',
        recipeId: 'demo-recipe-americano',
        modifierGroupIds: [],
        status: 'active',
        updatedAt: timestamp,
      },
    ],
    recipes: [
      {
        id: 'demo-recipe-espresso',
        name: 'Espresso technology card',
        menuItemId: 'demo-item-espresso',
        outputQuantity: 1,
        outputUnitId: 'unit-pc',
        preparationInstructions: 'Grind, dose and extract.',
        ingredientId: 'demo-ingredient-beans',
        ingredientQuantity: 18,
        ingredientUnitId: 'unit-g',
        wastePercentage: 3,
        status: 'active',
        updatedAt: timestamp,
      },
      {
        id: 'demo-recipe-cappuccino',
        name: 'Cappuccino technology card',
        menuItemId: 'demo-item-cappuccino',
        outputQuantity: 1,
        outputUnitId: 'unit-pc',
        preparationInstructions: 'Extract espresso and steam milk.',
        ingredientId: 'demo-ingredient-milk',
        ingredientQuantity: 180,
        ingredientUnitId: 'unit-ml',
        wastePercentage: 5,
        status: 'active',
        updatedAt: timestamp,
      },
      {
        id: 'demo-recipe-americano',
        name: 'Americano technology card',
        menuItemId: 'demo-item-americano',
        outputQuantity: 1,
        outputUnitId: 'unit-pc',
        preparationInstructions: 'Extract espresso and add hot water.',
        ingredientId: 'demo-ingredient-water',
        ingredientQuantity: 180,
        ingredientUnitId: 'unit-ml',
        wastePercentage: 2,
        status: 'active',
        updatedAt: timestamp,
      },
    ],
    openingStockBalances: [
      ['demo-ingredient-beans', 12000, 'unit-g', 1.8],
      ['demo-ingredient-milk', 24000, 'unit-ml', 0.11],
      ['demo-ingredient-water', 50000, 'unit-ml', 0.01],
      ['demo-ingredient-cup', 300, 'unit-pc', 8],
    ].map(([ingredientId, quantity, unitId, unitCost], index) => ({
      id: `demo-opening-${index + 1}`,
      warehouseId: 'demo-warehouse-main',
      ingredientId: ingredientId as string,
      quantity: quantity as number,
      unitId: unitId as string,
      unitCost: unitCost as number,
      source: 'development-demo' as const,
      recordedAt: timestamp,
    })),
  };
}

export function createCoffeeManagerSetupRepository(
  dependencies: CoffeeManagerSetupDependencies,
): CoffeeManagerSetupRepository {
  const now = dependencies.now ?? (() => new Date().toISOString());

  async function install(project: ProjectSummary): Promise<CoffeeManagerSetupRecord> {
    const existing = readRecords(dependencies.storage).find(
      (record) => record.project.id === project.id,
    );
    if (existing) return structuredClone(existing);
    const timestamp = now();
    await dependencies.coffeeRepositories.coffeeProject.initialize(
      project.id,
      project.name,
    );
    const record: CoffeeManagerSetupRecord = {
      schemaVersion: 1,
      project: structuredClone(project),
      installation: {
        id: `coffee-installation-${project.id}`,
        projectId: project.id,
        solutionId: 'coffee',
        status: 'installed',
        installedAt: timestamp,
      },
      establishment: null,
      businessEnvironmentCode: null,
      businessEnvironmentId: null,
      configuredAt: null,
      isDevelopmentDemo: project.isDevelopmentDemo === true,
    };
    replaceRecord(dependencies.storage, record);
    return structuredClone(record);
  }

  async function configure(
    projectId: string,
    input: CoffeeEstablishmentInput,
  ): Promise<CoffeeManagerSetupRecord> {
    const records = readRecords(dependencies.storage);
    const current = records.find((record) => record.project.id === projectId);
    if (!current) throw new Error('coffee-solution-not-installed');
    const code =
      current.businessEnvironmentCode ??
      generateLocalBusinessEnvironmentCode(
        input,
        new Set(
          records.flatMap((record) =>
            record.businessEnvironmentCode ? [record.businessEnvironmentCode] : [],
          ),
        ),
      );
    const timestamp = current.configuredAt ?? now();
    const businessEnvironmentId =
      current.businessEnvironmentId ?? `business-environment-${projectId}`;
    const profile =
      await dependencies.coffeeRepositories.businessProfile.get(projectId);
    await dependencies.coffeeRepositories.businessProfile.update(projectId, {
      ...profile,
      businessName: input.establishmentName,
      legalName: input.legalName,
      brandName: input.establishmentName,
      defaultCurrency: input.currency,
      timezone: input.timezone,
      country: input.country,
      language: input.language,
      contactInformation: [input.ownerName, input.phone, input.email]
        .filter(Boolean)
        .join(' · '),
      businessAddress: [input.city, input.address].filter(Boolean).join(', '),
    });
    const settings = await dependencies.coffeeRepositories.settings.get(projectId);
    await dependencies.coffeeRepositories.settings.update(projectId, {
      ...settings,
      locale: input.language,
    });
    const environment: ResolvedBusinessEnvironment = {
      businessEnvironmentId,
      projectId,
      solutionId: 'coffee',
      displayName: input.establishmentName,
      status: 'active',
      createdAt: timestamp,
      developmentDemo: current.isDevelopmentDemo,
    };
    await dependencies.directory.register(code, environment);
    const configured: CoffeeManagerSetupRecord = {
      ...current,
      establishment: structuredClone(input),
      businessEnvironmentCode: code,
      businessEnvironmentId,
      configuredAt: timestamp,
    };
    replaceRecord(dependencies.storage, configured);
    return structuredClone(configured);
  }

  return {
    install,
    async get(projectId) {
      const record = readRecords(dependencies.storage).find(
        (candidate) => candidate.project.id === projectId,
      );
      if (record) return structuredClone(record);
      const project = await dependencies.platformProjects.getProject(projectId);
      return project?.solutionId === 'coffee' ? install(project) : null;
    },
    async list() {
      return structuredClone(readRecords(dependencies.storage));
    },
    configure,
    async seedDevelopmentDemo() {
      if (
        !dependencies.developmentDemoEnabled ||
        dependencies.storage.getItem(demoRemovalKey) === 'true'
      ) {
        return null;
      }
      const timestamp = '2026-07-31T00:00:00.000Z';
      const project = await dependencies.platformProjects.ensureProject(
        demoProject(timestamp),
      );
      const existing = await install(project);
      const configured = existing.businessEnvironmentCode
        ? existing
        : await configure(project.id, demoEstablishment);
      await dependencies.coffeeRepositories.developmentSeed.apply(
        project.id,
        developmentSeed(timestamp),
      );
      return configured;
    },
    async removeDevelopmentDemo() {
      const record = readRecords(dependencies.storage).find(
        (candidate) => candidate.project.id === demoProjectId,
      );
      if (record?.businessEnvironmentId) {
        await dependencies.directory.removeProject(demoProjectId);
      }
      await dependencies.coffeeRepositories.coffeeProject.remove(demoProjectId);
      await dependencies.platformProjects.deleteProject(demoProjectId);
      writeRecords(
        dependencies.storage,
        readRecords(dependencies.storage).filter(
          (candidate) => candidate.project.id !== demoProjectId,
        ),
      );
      dependencies.storage.setItem(demoRemovalKey, 'true');
    },
  };
}

function browserRepository(): CoffeeManagerSetupRepository {
  if (typeof window === 'undefined') {
    throw new Error('coffee-manager-setup-browser-only');
  }
  return createCoffeeManagerSetupRepository({
    storage: window.localStorage,
    platformProjects: mockRepository,
    coffeeRepositories: localCoffeeManagerRepositories,
    directory: localBusinessEnvironmentDirectoryWriter,
    developmentDemoEnabled:
      process.env.NEXT_PUBLIC_ENABLE_COFFEE_DEMO === 'true' ||
      (process.env.NODE_ENV === 'development' &&
        process.env.NEXT_PUBLIC_ENABLE_COFFEE_DEMO !== 'false'),
  });
}

export const localCoffeeManagerSetupRepository: CoffeeManagerSetupRepository = {
  install: (project) => browserRepository().install(project),
  get: (projectId) => browserRepository().get(projectId),
  list: () => browserRepository().list(),
  configure: (projectId, input) => browserRepository().configure(projectId, input),
  seedDevelopmentDemo: () => browserRepository().seedDevelopmentDemo(),
  removeDevelopmentDemo: () => browserRepository().removeDevelopmentDemo(),
};
