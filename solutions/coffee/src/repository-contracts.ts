import type {
  BusinessProfile,
  CoffeeCapability,
  CoffeeDevelopmentSeed,
  CoffeeOperationalSnapshot,
  CoffeeProject,
  CoffeeSolutionModuleId,
  CoffeeSolutionStructure,
  CoffeeRole,
  CoffeeRoleId,
  CoffeeSettings,
  CoffeeSnapshot,
  CollectionEntityMap,
  ConfigurationActivity,
  PermissionRow,
  SetupStep,
} from './domain';

export interface CoffeeProjectRepository {
  initialize(projectId: string, projectName: string): Promise<CoffeeProject>;
  get(projectId: string): Promise<CoffeeProject>;
  setDefaultLocation(projectId: string, locationId: string): Promise<CoffeeProject>;
  markReady(projectId: string): Promise<CoffeeProject>;
  remove(projectId: string): Promise<void>;
}

export interface BusinessProfileRepository {
  get(projectId: string): Promise<BusinessProfile>;
  update(projectId: string, profile: BusinessProfile): Promise<BusinessProfile>;
}

export interface CoffeeSettingsRepository {
  get(projectId: string): Promise<CoffeeSettings>;
  update(projectId: string, settings: CoffeeSettings): Promise<CoffeeSettings>;
}

export interface CollectionRepository<T extends { id: string }> {
  list(projectId: string): Promise<T[]>;
  create(projectId: string, input: Omit<T, 'id' | 'updatedAt'>): Promise<T>;
  update(projectId: string, id: string, input: Partial<Omit<T, 'id'>>): Promise<T>;
}

export interface RoleRepository {
  list(projectId: string): Promise<CoffeeRole[]>;
  assign(
    projectId: string,
    employeeId: string,
    roleId: CoffeeRoleId | null,
  ): Promise<void>;
}

export interface CoffeeSolutionConstructorRepository {
  get(projectId: string): Promise<CoffeeSolutionStructure>;
  generate(
    projectId: string,
    selectedModuleIds: ReadonlyArray<CoffeeSolutionModuleId>,
  ): Promise<CoffeeSolutionStructure>;
  assignEmployee(
    projectId: string,
    workspaceId: string,
    employeeId: string,
    assigned: boolean,
  ): Promise<CoffeeSolutionStructure>;
}

export interface PermissionRepository {
  list(projectId: string): Promise<PermissionRow[]>;
  capabilitiesForRole(
    projectId: string,
    roleId: CoffeeRoleId,
  ): Promise<CoffeeCapability[]>;
  setPreviewRole(projectId: string, roleId: CoffeeRoleId): Promise<void>;
}

export interface SetupChecklistRepository {
  list(projectId: string): Promise<SetupStep[]>;
  complete(projectId: string, stepId: SetupStep['id']): Promise<SetupStep[]>;
}

export interface ActivityRepository {
  list(projectId: string): Promise<ConfigurationActivity[]>;
}

export interface CoffeeDevelopmentSeedRepository {
  apply(projectId: string, seed: CoffeeDevelopmentSeed): Promise<void>;
}

export interface CoffeeManagerRepositories {
  coffeeProject: CoffeeProjectRepository;
  businessProfile: BusinessProfileRepository;
  settings: CoffeeSettingsRepository;
  locations: CollectionRepository<CollectionEntityMap['locations']>;
  registers: CollectionRepository<CollectionEntityMap['registers']>;
  workstations: CollectionRepository<CollectionEntityMap['workstations']>;
  menuCategories: CollectionRepository<CollectionEntityMap['menuCategories']>;
  menuItems: CollectionRepository<CollectionEntityMap['menuItems']>;
  modifiers: CollectionRepository<CollectionEntityMap['modifiers']>;
  recipes: CollectionRepository<CollectionEntityMap['recipes']>;
  ingredients: CollectionRepository<CollectionEntityMap['ingredients']>;
  units: CollectionRepository<CollectionEntityMap['units']>;
  warehouses: CollectionRepository<CollectionEntityMap['warehouses']>;
  suppliers: CollectionRepository<CollectionEntityMap['suppliers']>;
  employees: CollectionRepository<CollectionEntityMap['employees']>;
  solutionConstructor: CoffeeSolutionConstructorRepository;
  roles: RoleRepository;
  permissions: PermissionRepository;
  setupChecklist: SetupChecklistRepository;
  activity: ActivityRepository;
  developmentSeed: CoffeeDevelopmentSeedRepository;
  loadSnapshot(projectId: string): Promise<CoffeeSnapshot>;
}

export interface CoffeeOperationalReadRepository {
  load(projectId: string): Promise<CoffeeOperationalSnapshot>;
}

export class CoffeeRepositoryError extends Error {
  constructor(
    public readonly code: 'corrupt-data' | 'not-found' | 'invalid-operation',
  ) {
    super(code);
    this.name = 'CoffeeRepositoryError';
  }
}
