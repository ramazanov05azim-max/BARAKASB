'use client';

import {
  coffeeCrashTestSeedVersion,
  createCoffeeCrashTestSeed,
  localCoffeeManagerRepositories,
  type CoffeeManagerRepositories,
} from '@barakasb/solution-coffee';
import type {
  BusinessEnvironmentDirectoryWriter,
  ResolvedBusinessEnvironment,
} from './business-environment-directory';
import { localBusinessEnvironmentDirectoryWriter } from './local-business-environment-directory';
import {
  mockRepository,
  type MockRepository,
  type ProjectSummary,
} from '@/lib/mock-repository';

export const coffeeManagerStorageKey = 'barakasb.manager.coffee-installations.v2';
export const legacyCoffeeManagerStorageKey = 'barakasb.manager.coffee-installations.v1';
export const legacyCoffeeDemoRemovalKey = 'barakasb.manager.coffee-demo.removed.v1';
export const coffeeCrashTestProjectId = 'barakasb-coffee-crash-test-v2';
export const coffeeCrashTestProjectName = 'BARAKASB Coffee Crash Test';
export const coffeeCrashTestDisplayName = 'Север Coffee Lab — CRASH TEST';
export const coffeeCrashTestEnvironmentId = 'business-environment-coffee-crash-test-v2';

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
  readonly schemaVersion: 2;
  readonly project: ProjectSummary;
  readonly installation: CoffeeSolutionInstallation;
  readonly establishment: CoffeeEstablishmentInput | null;
  readonly businessEnvironmentCode: string | null;
  readonly businessEnvironmentId: string | null;
  readonly configuredAt: string | null;
  readonly isDevelopmentDemo: boolean;
  readonly crashTestSeedVersion: number | null;
}

export interface CoffeeManagerSetupRepository {
  install(project: ProjectSummary): Promise<CoffeeManagerSetupRecord>;
  get(projectId: string): Promise<CoffeeManagerSetupRecord | null>;
  list(): Promise<CoffeeManagerSetupRecord[]>;
  configure(
    projectId: string,
    input: CoffeeEstablishmentInput,
  ): Promise<CoffeeManagerSetupRecord>;
  installCrashTest(): Promise<CoffeeManagerSetupRecord>;
  deleteCrashTest(): Promise<void>;
}

interface CoffeeManagerSetupDependencies {
  storage: Storage;
  platformProjects: Pick<MockRepository, 'ensureProject' | 'deleteProject'>;
  coffeeRepositories: Pick<
    CoffeeManagerRepositories,
    | 'coffeeProject'
    | 'businessProfile'
    | 'settings'
    | 'developmentSeed'
    | 'solutionConstructor'
  >;
  directory: BusinessEnvironmentDirectoryWriter;
  now?: () => string;
}

export const coffeeCrashTestEstablishment: CoffeeEstablishmentInput = {
  establishmentName: coffeeCrashTestDisplayName,
  legalName: 'ООО «Север Кофе Лаб»',
  ownerName: 'Алексей Романов',
  country: 'RU',
  city: 'Москва',
  address: 'ул. Тверская, д. 12',
  timezone: 'Europe/Moscow',
  currency: 'RUB',
  language: 'ru',
  phone: '+7 495 555-12-12',
  email: 'owner@sever-coffee.test',
};

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

function isRecord(value: unknown): value is CoffeeManagerSetupRecord {
  return (
    typeof value === 'object' &&
    value !== null &&
    'schemaVersion' in value &&
    value.schemaVersion === 2 &&
    'project' in value &&
    typeof value.project === 'object' &&
    value.project !== null
  );
}

export function readCoffeeManagerRecords(storage: Storage): CoffeeManagerSetupRecord[] {
  const raw = storage.getItem(coffeeManagerStorageKey);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isRecord) : [];
  } catch {
    return [];
  }
}

function writeRecords(storage: Storage, records: CoffeeManagerSetupRecord[]): void {
  storage.setItem(coffeeManagerStorageKey, JSON.stringify(records));
}

function replaceRecord(storage: Storage, record: CoffeeManagerSetupRecord): void {
  writeRecords(storage, [
    ...readCoffeeManagerRecords(storage).filter(
      (candidate) => candidate.project.id !== record.project.id,
    ),
    record,
  ]);
}

function crashTestProject(timestamp: string): ProjectSummary {
  return {
    id: coffeeCrashTestProjectId,
    name: coffeeCrashTestProjectName,
    displayName: coffeeCrashTestDisplayName,
    solutionId: 'coffee',
    categoryId: 'food',
    status: 'active',
    role: 'owner',
    createdAt: timestamp,
    isDevelopmentDemo: true,
    developmentLabel: 'crash-test',
  };
}

export function createCoffeeManagerSetupRepository(
  dependencies: CoffeeManagerSetupDependencies,
): CoffeeManagerSetupRepository {
  const now = dependencies.now ?? (() => new Date().toISOString());

  async function install(project: ProjectSummary): Promise<CoffeeManagerSetupRecord> {
    const existing = readCoffeeManagerRecords(dependencies.storage).find(
      (record) => record.project.id === project.id,
    );
    if (existing) return structuredClone(existing);
    const timestamp = now();
    await dependencies.coffeeRepositories.coffeeProject.initialize(
      project.id,
      project.name,
    );
    const record: CoffeeManagerSetupRecord = {
      schemaVersion: 2,
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
      crashTestSeedVersion: null,
    };
    replaceRecord(dependencies.storage, record);
    return structuredClone(record);
  }

  async function configure(
    projectId: string,
    input: CoffeeEstablishmentInput,
  ): Promise<CoffeeManagerSetupRecord> {
    const records = readCoffeeManagerRecords(dependencies.storage);
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
      current.businessEnvironmentId ??
      (projectId === coffeeCrashTestProjectId
        ? coffeeCrashTestEnvironmentId
        : `business-environment-${projectId}`);
    const profile =
      await dependencies.coffeeRepositories.businessProfile.get(projectId);
    await dependencies.coffeeRepositories.businessProfile.update(projectId, {
      ...profile,
      businessName: input.establishmentName,
      legalName: input.legalName,
      brandName: input.establishmentName,
      description:
        projectId === coffeeCrashTestProjectId
          ? 'DEV DEMO · максимально заполненная среда ручного crash-test'
          : profile.description,
      defaultCurrency: input.currency,
      timezone: input.timezone,
      country: input.country,
      language: input.language,
      contactInformation: [input.ownerName, input.phone, input.email]
        .filter(Boolean)
        .join(' · '),
      businessAddress: [input.city, input.address].filter(Boolean).join(', '),
      ownerName: input.ownerName,
      registrationIdentifier:
        projectId === coffeeCrashTestProjectId ? 'ИНН 7712345678' : '',
      operatingStatus: 'active',
      businessHours: projectId === coffeeCrashTestProjectId ? 'Пн–Вс 07:30–23:00' : '',
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
      const record = readCoffeeManagerRecords(dependencies.storage).find(
        (candidate) => candidate.project.id === projectId,
      );
      return record ? structuredClone(record) : null;
    },
    async list() {
      return structuredClone(readCoffeeManagerRecords(dependencies.storage));
    },
    configure,
    async installCrashTest() {
      const timestamp = '2026-07-31T00:00:00.000Z';
      const project = await dependencies.platformProjects.ensureProject(
        crashTestProject(timestamp),
      );
      const installed = await install(project);
      const configured = installed.businessEnvironmentCode
        ? installed
        : await configure(project.id, coffeeCrashTestEstablishment);
      const seed = createCoffeeCrashTestSeed(timestamp);
      await dependencies.coffeeRepositories.developmentSeed.apply(project.id, seed);
      const structure =
        await dependencies.coffeeRepositories.solutionConstructor.generate(project.id, [
          'bar',
          'manager',
        ]);
      const barWorkspace = structure.workspaces.find(
        (workspace) => workspace.moduleId === 'bar',
      );
      const managerWorkspace = structure.workspaces.find(
        (workspace) => workspace.moduleId === 'manager',
      );
      if (barWorkspace) {
        for (const employeeId of ['crash-employee-barista', 'crash-employee-cashier']) {
          await dependencies.coffeeRepositories.solutionConstructor.assignEmployee(
            project.id,
            barWorkspace.id,
            employeeId,
            true,
          );
        }
      }
      if (managerWorkspace) {
        for (const employeeId of ['crash-employee-owner', 'crash-employee-manager']) {
          await dependencies.coffeeRepositories.solutionConstructor.assignEmployee(
            project.id,
            managerWorkspace.id,
            employeeId,
            true,
          );
        }
      }
      const profile = await dependencies.coffeeRepositories.businessProfile.get(
        project.id,
      );
      await dependencies.coffeeRepositories.businessProfile.update(project.id, {
        ...profile,
        defaultWarehouseId:
          seed.warehouses.find((warehouse) => warehouse.isDefault)?.id ?? '',
      });
      const completed: CoffeeManagerSetupRecord = {
        ...configured,
        crashTestSeedVersion: coffeeCrashTestSeedVersion,
      };
      replaceRecord(dependencies.storage, completed);
      return structuredClone(completed);
    },
    async deleteCrashTest() {
      await dependencies.directory.removeProject(coffeeCrashTestProjectId);
      await dependencies.coffeeRepositories.coffeeProject.remove(
        coffeeCrashTestProjectId,
      );
      await dependencies.platformProjects.deleteProject(coffeeCrashTestProjectId);
      writeRecords(
        dependencies.storage,
        readCoffeeManagerRecords(dependencies.storage).filter(
          (candidate) => candidate.project.id !== coffeeCrashTestProjectId,
        ),
      );
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
  });
}

export const localCoffeeManagerSetupRepository: CoffeeManagerSetupRepository = {
  install: (project) => browserRepository().install(project),
  get: (projectId) => browserRepository().get(projectId),
  list: () => browserRepository().list(),
  configure: (projectId, input) => browserRepository().configure(projectId, input),
  installCrashTest: () => browserRepository().installCrashTest(),
  deleteCrashTest: () => browserRepository().deleteCrashTest(),
};
