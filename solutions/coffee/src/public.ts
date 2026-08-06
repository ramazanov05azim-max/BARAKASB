export { CoffeeProjectEnvironment } from './coffee-shell';
export { CoffeeDashboardScreen } from './dashboard-screen';
export { CoffeeSetupScreen } from './setup-screen';
export { BusinessProfileScreen } from './business-profile-screen';
export { CoffeeResourceScreen } from './resource-screen';
export { CoffeeRolesScreen, CoffeePermissionsScreen } from './access-screens';
export { ReportsPlaceholderScreen } from './reports-placeholder-screen';
export { CoffeeSettingsScreen } from './settings-screen';
export { CoffeeNotFoundScreen } from './not-found-screen';
export { CoffeeBarWorkspaceScreen } from './bar-workspace-screen';
export { CoffeeFloorPlanScreen } from './floor-plan-screen';
export { coffeeBarOperationalModuleManifest } from './operational-modules/bar/manifest';
export { coffeeWarehouseOperationalModuleManifest } from './operational-modules/warehouse/manifest';
export { CoffeeWarehouseWorkspaceScreen } from './operational-modules/warehouse/screen';
export {
  createCoffeeWarehouseService,
  localCoffeeWarehouseService,
} from './operational-modules/warehouse/service';
export {
  coffeeWarehouseStoragePrefix,
  createLocalCoffeeWarehouseRepository,
  localCoffeeWarehouseRepository,
} from './operational-modules/warehouse/repository';
export { expandCoffeeRecipe } from './recipe-engine/expansion';
export {
  recipeEngineComponentTypes,
  recipeEngineTargetTypes,
} from './recipe-engine/contracts';
export { createCoffeeBarService } from './bar-service';
export {
  CoffeeFloorPlanError,
  createCoffeeFloorPlanService,
} from './floor-plan-service';
export { createLocalCoffeeBarOrderRepository } from './bar-local-repository';
export type {
  CoffeeBarRuntimeContext,
  CoffeeBarState,
  CoffeeBarStore,
  CoffeeBarTableView,
  CoffeeBarZoneView,
  CoffeeOrder,
  CoffeeOrderBatch,
  CoffeeOrderItem,
  CoffeeOrderItemDraftInput,
  CoffeeOrderItemModifier,
  CoffeeOrderItemStatus,
  CoffeeOrderStatus,
  CoffeeOrderType,
  CoffeePaymentMethod,
  CoffeePaymentStatus,
  CoffeePreparationWorkspace,
  CoffeeSeatingInput,
  CoffeeStockConsumptionSnapshot,
  CoffeeTableOperationalStatus,
} from './bar-domain';
export type { CoffeeBarService } from './bar-service';
export type {
  CoffeeWarehouseService,
  WarehouseQuantityInput,
} from './operational-modules/warehouse/service';
export type {
  WarehouseBalance,
  WarehouseBaseUnit,
  WarehouseConsumptionIssue,
  WarehouseInventoryDocument,
  WarehouseInventoryLine,
  WarehouseMovement,
  WarehouseMovementType,
  WarehouseRuntimeContext,
  WarehouseState,
  WarehouseStockResource,
  WarehouseStore,
  WarehouseThresholdProvider,
  WarehouseReversalPort,
} from './operational-modules/warehouse/domain';
export type { CoffeeWarehouseRepository } from './operational-modules/warehouse/repository';
export type {
  ExpandedRecipeRequirement,
  RecipeExpansionResult,
} from './recipe-engine/expansion';
export type {
  RecipeEngine,
  RecipeEngineComponent,
  RecipeEngineComponentType,
  RecipeEngineDefinition,
  RecipeEngineQuantity,
  RecipeEngineRepository,
  RecipeEngineTargetReference,
  RecipeEngineTargetType,
  RecipeEngineValidationIssue,
  RecipeEngineValidationResult,
} from './recipe-engine/contracts';
export type {
  CoffeeFloorPlanErrorCode,
  CoffeeFloorPlanService,
} from './floor-plan-service';
export {
  CoffeeBarOperationError,
  type CoffeeBarOrderRepository,
} from './bar-repository-contracts';
export type {
  CoffeeDevelopmentSeed,
  CoffeeEmployeeCredentialRecord,
  CoffeeEmployeePasswordCredential,
  CoffeeFloorPlan,
  CoffeeFloorPlanZone,
  CoffeeLocale,
  CoffeeOperatingHours,
  CoffeeOperatingHoursEntry,
  CoffeeOperationalSnapshot,
  CoffeeOperationalWorkspace,
  CoffeeTable,
  CoffeeTableShape,
  CoffeeWeekday,
  CoffeeSolutionModuleId,
  CoffeeSolutionStructure,
  Employee,
  Warehouse,
} from './domain';
export { coffeeSolutionModuleIds } from './domain';
export {
  coffeeCrashTestSeedId,
  coffeeCrashTestSeedVersion,
  createCoffeeCrashTestSeed,
} from './coffee-crash-test-seed';
export { CoffeeRepositoryError } from './repository-contracts';
export {
  coffeeEmployeeCredentialStoragePrefix,
  createCoffeeEmployeeCredentialRepository,
  localCoffeeEmployeeCredentialRepository,
} from './employee-credential-repository';
export {
  clearLocalCoffeeDevelopmentStorage,
  createLocalCoffeeManagerRepositories,
  localCoffeeManagerRepositories,
  localCoffeeOperationalReadRepository,
} from './repositories';
export type {
  ActivityRepository,
  BusinessProfileRepository,
  CoffeeDevelopmentSeedRepository,
  CoffeeEmployeeCredentialRepository,
  CoffeeFloorPlanRepository,
  CoffeeManagerRepositories,
  CoffeeOperationalReadRepository,
  CoffeeProjectRepository,
  CoffeeSolutionConstructorRepository,
  CoffeeSettingsRepository,
  CollectionRepository,
  PermissionRepository,
  RoleRepository,
  SetupChecklistRepository,
} from './repository-contracts';
