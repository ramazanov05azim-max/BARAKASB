export type CoffeeLocale = 'ru' | 'en';
export type EntityStatus = 'active' | 'inactive' | 'draft';
export type SetupStepStatus = 'complete' | 'incomplete' | 'blocked';
export type CoffeeRoleId =
  | 'owner'
  | 'administrator'
  | 'location-manager'
  | 'cashier'
  | 'barista'
  | 'kitchen'
  | 'inventory'
  | 'finance'
  | 'analyst';

export type CoffeeCapability =
  | 'project.manage'
  | 'locations.read'
  | 'locations.manage'
  | 'menu.read'
  | 'menu.manage'
  | 'recipes.read'
  | 'recipes.manage'
  | 'inventory.read'
  | 'inventory.manage'
  | 'suppliers.read'
  | 'suppliers.manage'
  | 'employees.read'
  | 'employees.manage'
  | 'roles.read'
  | 'roles.assign'
  | 'workstations.read'
  | 'workstations.manage'
  | 'reports.read'
  | 'settings.manage';

export interface CoffeeProject {
  id: string;
  name: string;
  solutionStatus: 'configured' | 'setup-required';
  defaultLocationId: string | null;
  ready: boolean;
  developmentLabel?: 'crash-test';
  updatedAt: string;
}

export interface BusinessProfile {
  businessName: string;
  legalName: string;
  brandName: string;
  description: string;
  logoPlaceholder: string;
  defaultCurrency: string;
  timezone: string;
  country: string;
  language: CoffeeLocale;
  taxMode: string;
  receiptInformation: string;
  contactInformation: string;
  businessAddress: string;
  ownerName?: string;
  registrationIdentifier?: string;
  operatingStatus?: 'active' | 'inactive';
  businessHours?: string;
  defaultWarehouseId?: string;
  updatedAt: string;
}

export interface CoffeeSettings {
  businessDayBoundary: string;
  brandAccent: string;
  locationPolicy: string;
  locale: CoffeeLocale;
  taxMode: string;
  receiptFooter: string;
  enabledModules: string;
  notificationMode: string;
  updatedAt: string;
}

export interface BaseEntity {
  id: string;
  name: string;
  status: EntityStatus;
  updatedAt: string;
}

export interface CoffeeLocation extends BaseEntity {
  code: string;
  locationType: string;
  address: string;
  timezone: string;
  currency: string;
  phone: string;
  email: string;
  openingHours: string;
  isDefault: boolean;
  operationalPurpose?: string;
}

export interface CoffeeRegister extends BaseEntity {
  code: string;
  locationId: string;
  receiptPrinter: string;
  cashDrawer: string;
  paymentMethods: string;
}

export interface CoffeeWorkstation extends BaseEntity {
  workstationType: 'pos' | 'barista' | 'kitchen' | 'inventory' | 'manager';
  locationId: string;
  registerId: string;
  printer: string;
  enabledModules: string;
}

export interface MenuCategory extends BaseEntity {
  description: string;
  displayOrder: number;
  locationAvailability: string;
  imagePlaceholder: string;
}

export interface MenuItem extends BaseEntity {
  categoryId: string;
  description: string;
  sku: string;
  barcode: string;
  sellingPrice: number;
  taxCategory: string;
  locationAvailability: string;
  imagePlaceholder: string;
  recipeId: string;
  modifierGroupIds: string[];
  currency?: string;
  preparationLocationId?: string;
  servingUnitId?: string;
}

export interface ModifierGroup extends BaseEntity {
  selectionType: 'single' | 'multiple';
  required: boolean;
  minimumSelections: number;
  maximumSelections: number;
  options: string;
}

export interface Recipe extends BaseEntity {
  menuItemId: string;
  outputQuantity: number;
  outputUnitId: string;
  preparationInstructions: string;
  ingredientId: string;
  ingredientQuantity: number;
  ingredientUnitId: string;
  wastePercentage: number;
  version?: number;
  effectiveDate?: string;
  preparationLocationId?: string;
  ingredientRows?: RecipeIngredientRow[];
  calculatedCost?: number;
  salePrice?: number;
  grossMargin?: number;
}

export interface RecipeIngredientRow {
  ingredientId: string;
  quantity: number;
  unitId: string;
}

export interface Ingredient extends BaseEntity {
  sku: string;
  category: string;
  baseUnitId: string;
  purchaseUnitId: string;
  conversionRate: number;
  minimumStock: number;
  cost: number;
  supplierReferences: string;
  preferredSupplierId?: string;
  reorderQuantity?: number;
  storageLocationId?: string;
}

export interface UnitOfMeasure extends BaseEntity {
  symbol: string;
  dimension: string;
  conversionTargetId: string;
  conversionRate: number;
}

export interface Warehouse extends BaseEntity {
  code: string;
  locationId: string;
  warehouseType: string;
  addressOrZone: string;
  responsibleEmployeeId: string;
  isDefault?: boolean;
  operationalPurpose?: string;
}

export interface OpeningStockBalance {
  id: string;
  warehouseId: string;
  ingredientId: string;
  quantity: number;
  unitId: string;
  unitCost: number;
  source: 'development-demo';
  recordedAt: string;
}

export interface Supplier extends BaseEntity {
  supplierCode?: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  taxIdentifier: string;
  paymentTerms: string;
  deliverySchedule: string;
  suppliedIngredients: string;
}

export interface Employee extends BaseEntity {
  fullName: string;
  email: string;
  phone: string;
  employeeCode: string;
  assignedLocationIds: string[];
  assignedRoleId: CoffeeRoleId | null;
  employmentStatus: 'invited' | 'active' | 'inactive';
  hireDate: string;
  notes: string;
}

export interface CoffeeRole {
  id: CoffeeRoleId;
  nameKey: string;
  descriptionKey: string;
  capabilities: CoffeeCapability[];
  assignmentCount: number;
}

export interface PermissionRow {
  moduleKey: string;
  capabilityKey: string;
  grants: Partial<Record<CoffeeRoleId, 'allowed' | 'limited'>>;
}

export interface SetupStep {
  id:
    | 'business-profile'
    | 'location'
    | 'register'
    | 'workstation'
    | 'menu-category'
    | 'menu-item'
    | 'ingredient'
    | 'recipe'
    | 'warehouse'
    | 'supplier'
    | 'employee'
    | 'role'
    | 'review'
    | 'ready';
  labelKey: string;
  hrefSuffix: string;
  status: SetupStepStatus;
}

export interface ConfigurationActivity {
  id: string;
  actionKey: string;
  target: string;
  occurredAt: string;
}

export interface CoffeeSnapshot {
  project: CoffeeProject;
  businessProfile: BusinessProfile;
  settings: CoffeeSettings;
  locations: CoffeeLocation[];
  registers: CoffeeRegister[];
  workstations: CoffeeWorkstation[];
  menuCategories: MenuCategory[];
  menuItems: MenuItem[];
  modifiers: ModifierGroup[];
  recipes: Recipe[];
  ingredients: Ingredient[];
  units: UnitOfMeasure[];
  warehouses: Warehouse[];
  openingStockBalances: OpeningStockBalance[];
  suppliers: Supplier[];
  employees: Employee[];
  roles: CoffeeRole[];
  permissions: PermissionRow[];
  setupSteps: SetupStep[];
  activities: ConfigurationActivity[];
  currentRoleId: CoffeeRoleId;
  developmentSeedId: string | null;
}

export interface CoffeeDevelopmentSeed {
  id: string;
  projectDisplayName: string;
  locations: CoffeeLocation[];
  registers: CoffeeRegister[];
  workstations: CoffeeWorkstation[];
  warehouses: Warehouse[];
  units: UnitOfMeasure[];
  ingredients: Ingredient[];
  menuCategories: MenuCategory[];
  menuItems: MenuItem[];
  modifiers: ModifierGroup[];
  recipes: Recipe[];
  openingStockBalances: OpeningStockBalance[];
  suppliers: Supplier[];
  employees: Employee[];
}

export interface CoffeeOperationalSnapshot {
  project: CoffeeProject;
  businessProfile: BusinessProfile;
  settings: CoffeeSettings;
  locations: ReadonlyArray<CoffeeLocation>;
  warehouses: ReadonlyArray<Warehouse>;
  units: ReadonlyArray<UnitOfMeasure>;
  ingredients: ReadonlyArray<Ingredient>;
  menuItems: ReadonlyArray<MenuItem>;
  modifiers: ReadonlyArray<ModifierGroup>;
  recipes: ReadonlyArray<Recipe>;
  openingStockBalances: ReadonlyArray<OpeningStockBalance>;
  suppliers: ReadonlyArray<Supplier>;
  employees: ReadonlyArray<Employee>;
}

export type CollectionKey =
  | 'locations'
  | 'registers'
  | 'workstations'
  | 'menuCategories'
  | 'menuItems'
  | 'modifiers'
  | 'recipes'
  | 'ingredients'
  | 'units'
  | 'warehouses'
  | 'suppliers'
  | 'employees';

export interface CollectionEntityMap {
  locations: CoffeeLocation;
  registers: CoffeeRegister;
  workstations: CoffeeWorkstation;
  menuCategories: MenuCategory;
  menuItems: MenuItem;
  modifiers: ModifierGroup;
  recipes: Recipe;
  ingredients: Ingredient;
  units: UnitOfMeasure;
  warehouses: Warehouse;
  suppliers: Supplier;
  employees: Employee;
}

export type CollectionEntity = CollectionEntityMap[CollectionKey];

export interface FormValues {
  [field: string]: string;
}
