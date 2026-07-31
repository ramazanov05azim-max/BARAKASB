'use client';

import {
  localCoffeeManagerRepositories,
  type CoffeeManagerRepositories,
  type CoffeeOperationalWorkspace,
  type CoffeeSolutionModuleId,
  type CoffeeSolutionStructure,
  type Employee,
} from '@barakasb/solution-coffee';
import type {
  OperationalWorkspaceAccessInput,
  OperationalWorkspaceAccessIssuer,
  ResolvedOperationalWorkspace,
} from '@/features/universal-application/application/workspace-access';
import { localOperationalWorkspaceAccessIssuer } from '@/features/universal-application/infrastructure/local-operational-workspace-directory';
import {
  localCoffeeManagerSetupRepository,
  type CoffeeManagerSetupRecord,
  type CoffeeManagerSetupRepository,
} from '@/features/manager-coffee-setup/coffee-manager-setup-repository';

export type CoffeeModuleNames = Readonly<Record<CoffeeSolutionModuleId, string>>;

export interface CreateConstructorEmployeeInput {
  readonly fullName: string;
  readonly email: string;
  readonly phone: string;
  readonly employeeCode: string;
}

export interface SolutionConstructorState {
  readonly setup: CoffeeManagerSetupRecord;
  readonly structure: CoffeeSolutionStructure;
  readonly employees: ReadonlyArray<Employee>;
  readonly accessCodes: ReadonlyArray<ResolvedOperationalWorkspace>;
}

export interface SolutionConstructorService {
  load(projectId: string): Promise<SolutionConstructorState>;
  generate(
    projectId: string,
    selectedModuleIds: ReadonlyArray<CoffeeSolutionModuleId>,
    names: CoffeeModuleNames,
  ): Promise<SolutionConstructorState>;
  createEmployee(
    projectId: string,
    input: CreateConstructorEmployeeInput,
  ): Promise<SolutionConstructorState>;
  assignEmployee(
    projectId: string,
    workspaceId: string,
    employeeId: string,
    assigned: boolean,
    names: CoffeeModuleNames,
  ): Promise<SolutionConstructorState>;
  issueAccessCode(
    projectId: string,
    workspaceId: string,
    names: CoffeeModuleNames,
  ): Promise<SolutionConstructorState>;
}

interface Dependencies {
  setup: Pick<CoffeeManagerSetupRepository, 'get'>;
  coffee: Pick<
    CoffeeManagerRepositories,
    'solutionConstructor' | 'employees' | 'loadSnapshot'
  >;
  access: OperationalWorkspaceAccessIssuer;
  today?: () => string;
}

function requireSetup(
  setup: CoffeeManagerSetupRecord | null,
): CoffeeManagerSetupRecord {
  if (!setup) throw new Error('solution-not-installed');
  if (!setup.businessEnvironmentId || !setup.businessEnvironmentCode) {
    throw new Error('business-environment-not-configured');
  }
  return setup;
}

function toAccessInput(
  setup: CoffeeManagerSetupRecord,
  workspace: CoffeeOperationalWorkspace,
  employees: ReadonlyArray<Employee>,
  names: CoffeeModuleNames,
): OperationalWorkspaceAccessInput {
  if (!setup.businessEnvironmentId) {
    throw new Error('business-environment-not-configured');
  }
  const assigned = new Set(workspace.assignedEmployeeIds);
  return {
    projectId: setup.project.id,
    solutionId: setup.installation.solutionId,
    solutionInstallationId: setup.installation.id,
    businessEnvironmentId: setup.businessEnvironmentId,
    environmentDisplayName:
      setup.project.displayName ??
      setup.establishment?.establishmentName ??
      setup.project.name,
    workspaceId: workspace.id,
    workspaceType: workspace.moduleId,
    workspaceName: names[workspace.moduleId],
    assignedEmployees: employees
      .filter((employee) => assigned.has(employee.id))
      .map((employee) => ({
        employeeId: employee.id,
        displayName: employee.fullName,
      })),
  };
}

export function createSolutionConstructorService({
  setup,
  coffee,
  access,
  today = () => new Date().toISOString().slice(0, 10),
}: Dependencies): SolutionConstructorService {
  async function load(projectId: string): Promise<SolutionConstructorState> {
    const [setupRecord, snapshot, accessCodes] = await Promise.all([
      setup.get(projectId),
      coffee.loadSnapshot(projectId),
      access.listByProject(projectId),
    ]);
    return {
      setup: requireSetup(setupRecord),
      structure: snapshot.solutionStructure,
      employees: snapshot.employees,
      accessCodes,
    };
  }

  async function syncIssuedWorkspaces(
    setupRecord: CoffeeManagerSetupRecord,
    structure: CoffeeSolutionStructure,
    employees: ReadonlyArray<Employee>,
    names: CoffeeModuleNames,
  ): Promise<void> {
    await access.removeUnavailable(
      setupRecord.project.id,
      new Set(structure.workspaces.map((workspace) => workspace.id)),
    );
    await Promise.all(
      structure.workspaces.map((workspace) =>
        access.sync(toAccessInput(setupRecord, workspace, employees, names)),
      ),
    );
  }

  return {
    load,
    async generate(projectId, selectedModuleIds, names) {
      const setupRecord = requireSetup(await setup.get(projectId));
      const structure = await coffee.solutionConstructor.generate(
        projectId,
        selectedModuleIds,
      );
      const employees = await coffee.employees.list(projectId);
      await syncIssuedWorkspaces(setupRecord, structure, employees, names);
      return load(projectId);
    },
    async createEmployee(projectId, input) {
      requireSetup(await setup.get(projectId));
      await coffee.employees.create(projectId, {
        name: input.fullName,
        fullName: input.fullName,
        email: input.email,
        phone: input.phone,
        employeeCode: input.employeeCode,
        assignedLocationIds: [],
        assignedRoleId: null,
        employmentStatus: 'active',
        hireDate: today(),
        notes: '',
        status: 'active',
      });
      return load(projectId);
    },
    async assignEmployee(projectId, workspaceId, employeeId, assigned, names) {
      const setupRecord = requireSetup(await setup.get(projectId));
      const structure = await coffee.solutionConstructor.assignEmployee(
        projectId,
        workspaceId,
        employeeId,
        assigned,
      );
      const employees = await coffee.employees.list(projectId);
      await syncIssuedWorkspaces(setupRecord, structure, employees, names);
      return load(projectId);
    },
    async issueAccessCode(projectId, workspaceId, names) {
      const setupRecord = requireSetup(await setup.get(projectId));
      const snapshot = await coffee.loadSnapshot(projectId);
      const workspace = snapshot.solutionStructure.workspaces.find(
        (candidate) => candidate.id === workspaceId,
      );
      if (!workspace) throw new Error('workspace-not-found');
      await access.issue(
        toAccessInput(setupRecord, workspace, snapshot.employees, names),
      );
      return load(projectId);
    },
  };
}

export const localSolutionConstructorService = createSolutionConstructorService({
  setup: localCoffeeManagerSetupRepository,
  coffee: localCoffeeManagerRepositories,
  access: localOperationalWorkspaceAccessIssuer,
});
