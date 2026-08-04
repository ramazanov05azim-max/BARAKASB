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
  OperationalWorkspaceSessionStore,
  ResolvedOperationalWorkspace,
} from '@/features/universal-application/application/workspace-access';
import { localOperationalWorkspaceAccessIssuer } from '@/features/universal-application/infrastructure/local-operational-workspace-directory';
import { localOperationalWorkspaceSession } from '@/features/universal-application/infrastructure/local-operational-workspace-session';
import { createPasswordCredential } from '@/features/universal-application/domain/employee-password';
import {
  localCoffeeManagerSetupRepository,
  type CoffeeManagerSetupRecord,
  type CoffeeManagerSetupRepository,
} from '@/features/manager-coffee-setup/coffee-manager-setup-repository';

export type CoffeeModuleNames = Readonly<Record<CoffeeSolutionModuleId, string>>;

export interface CreateConstructorEmployeeInput {
  readonly firstName: string;
  readonly lastName: string;
  readonly position: string;
  readonly phone: string;
  readonly notes: string;
  readonly password: string;
}

export type UpdateConstructorEmployeeInput = Omit<
  CreateConstructorEmployeeInput,
  'password'
>;

export interface ResetConstructorEmployeePasswordInput {
  readonly employeeId: string;
  readonly password: string;
}

export interface SolutionConstructorState {
  readonly setup: CoffeeManagerSetupRecord;
  readonly structure: CoffeeSolutionStructure;
  readonly employees: ReadonlyArray<Employee>;
  readonly accessCodes: ReadonlyArray<ResolvedOperationalWorkspace>;
  readonly connectedWorkspaceId: string | null;
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
    names: CoffeeModuleNames,
  ): Promise<SolutionConstructorState>;
  updateEmployee(
    projectId: string,
    employeeId: string,
    input: UpdateConstructorEmployeeInput,
    names: CoffeeModuleNames,
  ): Promise<SolutionConstructorState>;
  setEmployeeActive(
    projectId: string,
    employeeId: string,
    active: boolean,
    names: CoffeeModuleNames,
  ): Promise<SolutionConstructorState>;
  deleteEmployee(
    projectId: string,
    employeeId: string,
    names: CoffeeModuleNames,
  ): Promise<SolutionConstructorState>;
  resetEmployeePassword(
    projectId: string,
    input: ResetConstructorEmployeePasswordInput,
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
  rotateAccessCode(
    projectId: string,
    workspaceId: string,
    names: CoffeeModuleNames,
  ): Promise<SolutionConstructorState>;
  disconnectDevice(
    projectId: string,
    workspaceId: string,
  ): Promise<SolutionConstructorState>;
}

interface Dependencies {
  setup: Pick<CoffeeManagerSetupRepository, 'get'>;
  coffee: Pick<
    CoffeeManagerRepositories,
    'solutionConstructor' | 'employees' | 'employeeCredentials' | 'loadSnapshot'
  >;
  access: OperationalWorkspaceAccessIssuer;
  deviceSession: OperationalWorkspaceSessionStore;
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
    isolationScopeId: setup.businessEnvironmentId,
    workspaceId: workspace.id,
    workspaceType: workspace.moduleId,
    workspaceName: names[workspace.moduleId],
    assignedEmployees: employees
      .filter(
        (employee) =>
          assigned.has(employee.id) &&
          employee.status === 'active' &&
          employee.employmentStatus === 'active',
      )
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
  deviceSession,
  today = () => new Date().toISOString().slice(0, 10),
}: Dependencies): SolutionConstructorService {
  async function load(projectId: string): Promise<SolutionConstructorState> {
    const [setupRecord, snapshot, accessCodes] = await Promise.all([
      setup.get(projectId),
      coffee.loadSnapshot(projectId),
      access.listByProject(projectId),
    ]);
    const connected = deviceSession.readConnected();
    return {
      setup: requireSetup(setupRecord),
      structure: snapshot.solutionStructure,
      employees: snapshot.employees,
      accessCodes,
      connectedWorkspaceId:
        connected?.workspace.projectId === projectId
          ? connected.workspace.workspaceId
          : null,
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
    const connected = deviceSession.readConnected();
    if (
      connected?.workspace.projectId === setupRecord.project.id &&
      !structure.workspaces.some(
        (workspace) => workspace.id === connected.workspace.workspaceId,
      )
    ) {
      deviceSession.disconnect(setupRecord.project.id, connected.workspace.workspaceId);
    }
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
    async createEmployee(projectId, input, names) {
      const setupRecord = requireSetup(await setup.get(projectId));
      const credential = await createPasswordCredential(input.password);
      const employees = await coffee.employees.list(projectId);
      const occupiedCodes = new Set(employees.map((employee) => employee.employeeCode));
      let sequence = employees.length + 1;
      while (occupiedCodes.has(`EMP-${String(sequence).padStart(3, '0')}`)) {
        sequence += 1;
      }
      const employee = await coffee.employees.create(projectId, {
        name: `${input.firstName} ${input.lastName}`.trim(),
        firstName: input.firstName,
        lastName: input.lastName,
        position: input.position,
        fullName: `${input.firstName} ${input.lastName}`.trim(),
        email: '',
        phone: input.phone,
        employeeCode: `EMP-${String(sequence).padStart(3, '0')}`,
        assignedLocationIds: [],
        assignedRoleId: null,
        employmentStatus: 'active',
        hireDate: today(),
        notes: input.notes,
        status: 'active',
      });
      try {
        await coffee.employeeCredentials.set(projectId, employee.id, credential);
      } catch (error) {
        await coffee.employees.remove(projectId, employee.id);
        throw error;
      }
      await syncIssuedWorkspaces(
        setupRecord,
        (await coffee.loadSnapshot(projectId)).solutionStructure,
        await coffee.employees.list(projectId),
        names,
      );
      return load(projectId);
    },
    async updateEmployee(projectId, employeeId, input, names) {
      const setupRecord = requireSetup(await setup.get(projectId));
      await coffee.employees.update(projectId, employeeId, {
        name: `${input.firstName} ${input.lastName}`.trim(),
        firstName: input.firstName,
        lastName: input.lastName,
        position: input.position,
        fullName: `${input.firstName} ${input.lastName}`.trim(),
        phone: input.phone,
        notes: input.notes,
      });
      const snapshot = await coffee.loadSnapshot(projectId);
      await syncIssuedWorkspaces(
        setupRecord,
        snapshot.solutionStructure,
        snapshot.employees,
        names,
      );
      return load(projectId);
    },
    async setEmployeeActive(projectId, employeeId, active, names) {
      const setupRecord = requireSetup(await setup.get(projectId));
      await coffee.employees.update(projectId, employeeId, {
        status: active ? 'active' : 'inactive',
        employmentStatus: active ? 'active' : 'inactive',
      });
      const snapshot = await coffee.loadSnapshot(projectId);
      await syncIssuedWorkspaces(
        setupRecord,
        snapshot.solutionStructure,
        snapshot.employees,
        names,
      );
      return load(projectId);
    },
    async deleteEmployee(projectId, employeeId, names) {
      const setupRecord = requireSetup(await setup.get(projectId));
      const snapshot = await coffee.loadSnapshot(projectId);
      for (const workspace of snapshot.solutionStructure.workspaces) {
        if (workspace.assignedEmployeeIds.includes(employeeId)) {
          await coffee.solutionConstructor.assignEmployee(
            projectId,
            workspace.id,
            employeeId,
            false,
          );
        }
      }
      await Promise.all([
        coffee.employeeCredentials.remove(projectId, employeeId),
        coffee.employees.remove(projectId, employeeId),
      ]);
      const updated = await coffee.loadSnapshot(projectId);
      await syncIssuedWorkspaces(
        setupRecord,
        updated.solutionStructure,
        updated.employees,
        names,
      );
      return load(projectId);
    },
    async resetEmployeePassword(projectId, input) {
      requireSetup(await setup.get(projectId));
      const employee = (await coffee.employees.list(projectId)).find(
        (candidate) => candidate.id === input.employeeId,
      );
      if (!employee) throw new Error('employee-not-found');
      await coffee.employeeCredentials.set(
        projectId,
        input.employeeId,
        await createPasswordCredential(input.password),
      );
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
    async rotateAccessCode(projectId, workspaceId, names) {
      const setupRecord = requireSetup(await setup.get(projectId));
      const snapshot = await coffee.loadSnapshot(projectId);
      const workspace = snapshot.solutionStructure.workspaces.find(
        (candidate) => candidate.id === workspaceId,
      );
      if (!workspace) throw new Error('workspace-not-found');
      await access.rotate(
        toAccessInput(setupRecord, workspace, snapshot.employees, names),
      );
      deviceSession.disconnect(projectId, workspaceId);
      return load(projectId);
    },
    async disconnectDevice(projectId, workspaceId) {
      requireSetup(await setup.get(projectId));
      deviceSession.disconnect(projectId, workspaceId);
      return load(projectId);
    },
  };
}

export const localSolutionConstructorService = createSolutionConstructorService({
  setup: localCoffeeManagerSetupRepository,
  coffee: localCoffeeManagerRepositories,
  access: localOperationalWorkspaceAccessIssuer,
  deviceSession: localOperationalWorkspaceSession,
});
