export { CoffeeProjectEnvironment } from './coffee-shell';
export { CoffeeDashboardScreen } from './dashboard-screen';
export { CoffeeSetupScreen } from './setup-screen';
export { BusinessProfileScreen } from './business-profile-screen';
export { CoffeeResourceScreen } from './resource-screen';
export { CoffeeRolesScreen, CoffeePermissionsScreen } from './access-screens';
export {
  InventoryHubScreen,
  MenuHubScreen,
  ReportsPlaceholderScreen,
} from './hub-screens';
export { CoffeeSettingsScreen } from './settings-screen';
export { CoffeeNotFoundScreen } from './not-found-screen';
export { CoffeeBarWorkspaceScreen } from './bar-workspace-screen';
export { CoffeeFloorPlanScreen } from './floor-plan-screen';
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
  CoffeeTableOperationalStatus,
} from './bar-domain';
export type { CoffeeBarService } from './bar-service';
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
