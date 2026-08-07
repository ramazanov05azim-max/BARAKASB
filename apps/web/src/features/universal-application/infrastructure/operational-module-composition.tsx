import type { OperationalWorkspaceExecutionContext } from '@barakasb/contracts-platform';
import {
  InMemoryOperationalModuleRuntimeRegistry,
  type OperationalModuleRuntimeRegistry,
} from '@barakasb/frontend-extension-host';
import {
  CoffeeBarWorkspaceScreen,
  CoffeeWarehouseWorkspaceScreen,
  CoffeePurchaserWorkspaceScreen,
  CoffeeManagerWorkspaceScreen,
  coffeeBarOperationalModuleManifest,
  coffeePurchaserOperationalModuleManifest,
  coffeeWarehouseOperationalModuleManifest,
  coffeeManagerOperationalModuleManifest,
} from '@barakasb/solution-coffee';
import type { ReactNode } from 'react';

export interface OperationalModulePresentationContext {
  readonly execution: OperationalWorkspaceExecutionContext;
  readonly onLogoutEmployee: () => void;
}

export type OperationalModulePresentationRegistry = OperationalModuleRuntimeRegistry<
  OperationalModulePresentationContext,
  ReactNode
>;

const registry = new InMemoryOperationalModuleRuntimeRegistry<
  OperationalModulePresentationContext,
  ReactNode
>();

registry.register({
  manifest: coffeeBarOperationalModuleManifest,
  render: ({ execution, onLogoutEmployee }) => (
    <CoffeeBarWorkspaceScreen
      context={{
        projectId: execution.projectId,
        businessEnvironmentId: execution.isolationScopeId,
        workspaceId: execution.workspaceId,
        employeeId: execution.employeeId,
      }}
      onLogoutEmployee={onLogoutEmployee}
    />
  ),
});

registry.register({
  manifest: coffeeWarehouseOperationalModuleManifest,
  render: ({ execution, onLogoutEmployee }) => (
    <CoffeeWarehouseWorkspaceScreen
      context={{
        projectId: execution.projectId,
        businessEnvironmentId: execution.isolationScopeId,
        workspaceId: execution.workspaceId,
        employeeId: execution.employeeId,
      }}
      onLogoutEmployee={onLogoutEmployee}
    />
  ),
});

registry.register({
  manifest: coffeePurchaserOperationalModuleManifest,
  render: ({ execution, onLogoutEmployee }) => (
    <CoffeePurchaserWorkspaceScreen
      context={{
        projectId: execution.projectId,
        businessEnvironmentId: execution.isolationScopeId,
        workspaceId: execution.workspaceId,
        employeeId: execution.employeeId,
      }}
      onLogoutEmployee={onLogoutEmployee}
    />
  ),
});

registry.register({
  manifest: coffeeManagerOperationalModuleManifest,
  render: ({ execution, onLogoutEmployee }) => (
    <CoffeeManagerWorkspaceScreen
      context={{
        projectId: execution.projectId,
        businessEnvironmentId: execution.isolationScopeId,
        workspaceId: execution.workspaceId,
        employeeId: execution.employeeId,
      }}
      onLogoutEmployee={onLogoutEmployee}
    />
  ),
});

export const operationalModulePresentationRegistry: OperationalModulePresentationRegistry =
  registry;
