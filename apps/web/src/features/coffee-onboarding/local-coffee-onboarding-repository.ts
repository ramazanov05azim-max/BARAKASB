'use client';

import {
  localCoffeeRepositories,
  type BusinessProfileRepository,
  type CoffeeProjectRepository,
  type CoffeeSettingsRepository,
} from '@barakasb/solution-coffee';
import {
  mockRepository,
  type MockRepository,
  type ProjectSummary,
} from '@/lib/mock-repository';
import {
  isBusinessEnvironmentCodeComplete,
  normalizeBusinessEnvironmentCode,
} from '@/features/universal-application/domain/business-environment-code';

const storageKey = 'barakasb.local.coffee.environments.v1';
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

export interface LocalCoffeeProjectRecord {
  readonly schemaVersion: 1;
  readonly project: ProjectSummary;
  readonly businessEnvironmentCode: string;
  readonly establishment: CoffeeEstablishmentInput;
  readonly createdAt: string;
}

export interface LocalCoffeeOnboardingRepository {
  list(): Promise<LocalCoffeeProjectRecord[]>;
  hasProjects(): Promise<boolean>;
  create(input: CoffeeEstablishmentInput): Promise<LocalCoffeeProjectRecord>;
  resolve(code: string): Promise<LocalCoffeeProjectRecord | null>;
}

interface LocalCoffeeOnboardingDependencies {
  storage: Storage;
  platformProjects: Pick<MockRepository, 'createProject'>;
  coffeeRepositories: {
    coffeeProject: Pick<CoffeeProjectRepository, 'initialize'>;
    businessProfile: Pick<BusinessProfileRepository, 'get' | 'update'>;
    settings: Pick<CoffeeSettingsRepository, 'get' | 'update'>;
  };
  now?: () => string;
}

function canonicalizeEstablishment(input: CoffeeEstablishmentInput): string {
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
  const seed = canonicalizeEstablishment(input);
  for (let attempt = 0; attempt < Number.MAX_SAFE_INTEGER; attempt += 1) {
    const candidate = hashToCode(`${seed}|${attempt}`);
    if (!existingCodes.has(candidate)) return candidate;
  }
  throw new Error('local-business-environment-code-space-exhausted');
}

function readRecords(storage: Storage): LocalCoffeeProjectRecord[] {
  const value = storage.getItem(storageKey);
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (record): record is LocalCoffeeProjectRecord =>
        typeof record === 'object' &&
        record !== null &&
        'schemaVersion' in record &&
        record.schemaVersion === 1 &&
        'businessEnvironmentCode' in record &&
        typeof record.businessEnvironmentCode === 'string' &&
        isBusinessEnvironmentCodeComplete(record.businessEnvironmentCode) &&
        'project' in record &&
        typeof record.project === 'object' &&
        record.project !== null,
    );
  } catch {
    return [];
  }
}

function writeRecords(storage: Storage, records: LocalCoffeeProjectRecord[]): void {
  storage.setItem(storageKey, JSON.stringify(records));
}

export function createLocalCoffeeOnboardingRepository(
  dependencies: LocalCoffeeOnboardingDependencies,
): LocalCoffeeOnboardingRepository {
  const now = dependencies.now ?? (() => new Date().toISOString());

  return {
    async list() {
      return structuredClone(readRecords(dependencies.storage));
    },
    async hasProjects() {
      return readRecords(dependencies.storage).length > 0;
    },
    async create(input) {
      const existingRecords = readRecords(dependencies.storage);
      const businessEnvironmentCode = generateLocalBusinessEnvironmentCode(
        input,
        new Set(existingRecords.map((record) => record.businessEnvironmentCode)),
      );
      const project = await dependencies.platformProjects.createProject({
        name: input.establishmentName,
        categoryId: 'food',
        solutionId: 'coffee',
      });

      await dependencies.coffeeRepositories.coffeeProject.initialize(
        project.id,
        project.name,
      );
      const profile = await dependencies.coffeeRepositories.businessProfile.get(
        project.id,
      );
      await dependencies.coffeeRepositories.businessProfile.update(project.id, {
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
      const settings = await dependencies.coffeeRepositories.settings.get(project.id);
      await dependencies.coffeeRepositories.settings.update(project.id, {
        ...settings,
        locale: input.language,
      });

      const record: LocalCoffeeProjectRecord = {
        schemaVersion: 1,
        project,
        businessEnvironmentCode,
        establishment: structuredClone(input),
        createdAt: now(),
      };
      writeRecords(dependencies.storage, [...existingRecords, record]);
      return structuredClone(record);
    },
    async resolve(code) {
      const normalizedCode = normalizeBusinessEnvironmentCode(code);
      if (!isBusinessEnvironmentCodeComplete(normalizedCode)) return null;
      const record = readRecords(dependencies.storage).find(
        (candidate) => candidate.businessEnvironmentCode === normalizedCode,
      );
      return record ? structuredClone(record) : null;
    },
  };
}

function browserRepository(): LocalCoffeeOnboardingRepository {
  if (typeof window === 'undefined') {
    throw new Error('local-coffee-onboarding-browser-only');
  }
  return createLocalCoffeeOnboardingRepository({
    storage: window.localStorage,
    platformProjects: mockRepository,
    coffeeRepositories: localCoffeeRepositories,
  });
}

export const localCoffeeOnboardingRepository: LocalCoffeeOnboardingRepository = {
  list: () => browserRepository().list(),
  hasProjects: () => browserRepository().hasProjects(),
  create: (input) => browserRepository().create(input),
  resolve: (code) => browserRepository().resolve(code),
};
