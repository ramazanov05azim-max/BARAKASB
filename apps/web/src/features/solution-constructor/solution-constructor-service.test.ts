// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';
import { localCoffeeManagerRepositories } from '@barakasb/solution-coffee';
import type { CoffeeManagerSetupRecord } from '@/features/manager-coffee-setup/coffee-manager-setup-repository';
import { createLocalOperationalWorkspaceDirectory } from '@/features/universal-application/infrastructure/local-operational-workspace-directory';
import { createOperationalWorkspaceSessionStore } from '@/features/universal-application/infrastructure/local-operational-workspace-session';
import { verifyPasswordCredential } from '@/features/universal-application/domain/employee-password';
import { localCoffeeEmployeeAuthenticator } from '@/features/universal-application/infrastructure/local-coffee-employee-authenticator';
import {
  createSolutionConstructorService,
  type CoffeeModuleNames,
} from './solution-constructor-service';

const setup: CoffeeManagerSetupRecord = {
  schemaVersion: 2,
  project: {
    id: 'constructor-project',
    name: 'Север',
    categoryId: 'food',
    solutionId: 'coffee',
    role: 'owner',
    status: 'active',
    createdAt: '2026-07-31T10:00:00.000Z',
  },
  installation: {
    id: 'installation-1',
    projectId: 'constructor-project',
    solutionId: 'coffee',
    status: 'installed',
    installedAt: '2026-07-31T10:00:00.000Z',
  },
  establishment: null,
  businessEnvironmentCode: '1234567890123456',
  businessEnvironmentId: 'environment-1',
  configuredAt: '2026-07-31T10:00:00.000Z',
  isDevelopmentDemo: false,
  crashTestSeedVersion: null,
};

const names: CoffeeModuleNames = {
  bar: 'Бар',
  kitchen: 'Кухня',
  warehouse: 'Склад',
  purchasing: 'Закупщик',
  manager: 'Управляющий',
  delivery: 'Доставка',
  production: 'Производство',
  pickup: 'Самовывоз',
};

describe('Solution Constructor service', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    await localCoffeeManagerRepositories.coffeeProject.initialize(
      setup.project.id,
      setup.project.name,
    );
  });

  it('generates only selected workspaces and issues a code manually', async () => {
    const access = createLocalOperationalWorkspaceDirectory(window.localStorage);
    const service = createSolutionConstructorService({
      setup: { get: async () => setup },
      coffee: localCoffeeManagerRepositories,
      access: access.issuer,
      deviceSession: createOperationalWorkspaceSessionStore(window.localStorage),
    });

    const generated = await service.generate(
      setup.project.id,
      ['bar', 'manager'],
      names,
    );
    expect(generated.structure.workspaces.map((item) => item.moduleId)).toEqual([
      'bar',
      'manager',
    ]);
    expect(generated.accessCodes).toEqual([]);

    const bar = generated.structure.workspaces.find(
      (workspace) => workspace.moduleId === 'bar',
    );
    expect(bar).toBeDefined();
    const withCode = await service.issueAccessCode(
      setup.project.id,
      bar?.id ?? '',
      names,
    );
    expect(withCode.accessCodes).toHaveLength(1);
    expect(withCode.accessCodes[0]).toMatchObject({
      projectId: setup.project.id,
      solutionInstallationId: setup.installation.id,
      isolationScopeId: setup.businessEnvironmentId,
      workspaceId: bar?.id,
      workspaceName: 'Бар',
    });
  });

  it('keeps the code immutable when employee assignments change', async () => {
    const access = createLocalOperationalWorkspaceDirectory(window.localStorage);
    const service = createSolutionConstructorService({
      setup: { get: async () => setup },
      coffee: localCoffeeManagerRepositories,
      access: access.issuer,
      deviceSession: createOperationalWorkspaceSessionStore(window.localStorage),
      today: () => '2026-07-31',
    });
    const generated = await service.generate(setup.project.id, ['kitchen'], names);
    const workspace = generated.structure.workspaces[0];
    expect(workspace).toBeDefined();
    const issued = await service.issueAccessCode(
      setup.project.id,
      workspace?.id ?? '',
      names,
    );
    const code = issued.accessCodes[0]?.accessCode;
    const withEmployee = await service.createEmployee(
      setup.project.id,
      {
        firstName: 'Анна',
        lastName: 'Петрова',
        position: 'Кассир',
        phone: '+79990000000',
        notes: '',
        password: 'Coffee2026',
      },
      names,
    );
    const employee = withEmployee.employees[0];
    expect(employee).toBeDefined();
    const assigned = await service.assignEmployee(
      setup.project.id,
      workspace?.id ?? '',
      employee?.id ?? '',
      true,
      names,
    );

    expect(assigned.accessCodes[0]?.accessCode).toBe(code);
    expect(assigned.accessCodes[0]?.assignedEmployees).toEqual([
      { employeeId: employee?.id, displayName: 'Анна Петрова' },
    ]);
    const credential = await localCoffeeManagerRepositories.employeeCredentials.get(
      setup.project.id,
      employee?.id ?? '',
    );
    expect(credential).not.toBeNull();
    expect(credential).not.toHaveProperty('password');
    await expect(verifyPasswordCredential('Coffee2026', credential!)).resolves.toBe(
      true,
    );
    await expect(
      localCoffeeEmployeeAuthenticator.verify({
        projectId: setup.project.id,
        workspaceId: workspace?.id ?? '',
        employeeId: employee?.id ?? '',
        password: 'Coffee2026',
      }),
    ).resolves.toBe(true);
  });

  it('updates, deactivates, resets and deletes an employee across assigned workspaces', async () => {
    const access = createLocalOperationalWorkspaceDirectory(window.localStorage);
    const service = createSolutionConstructorService({
      setup: { get: async () => setup },
      coffee: localCoffeeManagerRepositories,
      access: access.issuer,
      deviceSession: createOperationalWorkspaceSessionStore(window.localStorage),
      today: () => '2026-08-04',
    });
    const generated = await service.generate(setup.project.id, ['bar'], names);
    const workspace = generated.structure.workspaces[0]!;
    await service.issueAccessCode(setup.project.id, workspace.id, names);
    const created = await service.createEmployee(
      setup.project.id,
      {
        firstName: 'Иван',
        lastName: 'Беляев',
        position: 'Бариста',
        phone: '',
        notes: 'Утро',
        password: 'Coffee2026',
      },
      names,
    );
    const employee = created.employees[0]!;
    await service.assignEmployee(
      setup.project.id,
      workspace.id,
      employee.id,
      true,
      names,
    );

    const updated = await service.updateEmployee(
      setup.project.id,
      employee.id,
      {
        firstName: 'Иван',
        lastName: 'Беляев',
        position: 'Старший бариста',
        phone: '+79990000000',
        notes: 'Утро',
      },
      names,
    );
    expect(updated.employees[0]).toMatchObject({
      fullName: 'Иван Беляев',
      position: 'Старший бариста',
    });

    const inactive = await service.setEmployeeActive(
      setup.project.id,
      employee.id,
      false,
      names,
    );
    expect(inactive.employees[0]?.employmentStatus).toBe('inactive');
    expect(inactive.accessCodes[0]?.assignedEmployees).toEqual([]);
    await expect(
      localCoffeeEmployeeAuthenticator.verify({
        projectId: setup.project.id,
        workspaceId: workspace.id,
        employeeId: employee.id,
        password: 'Coffee2026',
      }),
    ).resolves.toBe(false);

    await service.setEmployeeActive(setup.project.id, employee.id, true, names);
    await service.resetEmployeePassword(setup.project.id, {
      employeeId: employee.id,
      password: 'NewCoffee2026',
    });
    await expect(
      localCoffeeEmployeeAuthenticator.verify({
        projectId: setup.project.id,
        workspaceId: workspace.id,
        employeeId: employee.id,
        password: 'Coffee2026',
      }),
    ).resolves.toBe(false);
    await expect(
      localCoffeeEmployeeAuthenticator.verify({
        projectId: setup.project.id,
        workspaceId: workspace.id,
        employeeId: employee.id,
        password: 'NewCoffee2026',
      }),
    ).resolves.toBe(true);

    const deleted = await service.deleteEmployee(setup.project.id, employee.id, names);
    expect(deleted.employees).toEqual([]);
    expect(deleted.structure.workspaces[0]?.assignedEmployeeIds).toEqual([]);
    await expect(
      localCoffeeManagerRepositories.employeeCredentials.get(
        setup.project.id,
        employee.id,
      ),
    ).resolves.toBeNull();
  }, 15_000);

  it('rotates a workspace code only after an explicit owner action', async () => {
    const access = createLocalOperationalWorkspaceDirectory(window.localStorage);
    const deviceSession = createOperationalWorkspaceSessionStore(window.localStorage);
    const service = createSolutionConstructorService({
      setup: { get: async () => setup },
      coffee: localCoffeeManagerRepositories,
      access: access.issuer,
      deviceSession,
    });
    const generated = await service.generate(setup.project.id, ['bar'], names);
    const workspace = generated.structure.workspaces[0]!;
    const issued = await service.issueAccessCode(setup.project.id, workspace.id, names);
    const originalCode = issued.accessCodes[0]!.accessCode;
    deviceSession.authorize(issued.accessCodes[0]!);

    const rotated = await service.rotateAccessCode(
      setup.project.id,
      workspace.id,
      names,
    );
    const nextCode = rotated.accessCodes[0]!.accessCode;

    expect(nextCode).not.toBe(originalCode);
    await expect(access.resolver.resolve(originalCode)).resolves.toBeNull();
    await expect(access.resolver.resolve(nextCode)).resolves.toMatchObject({
      workspaceId: workspace.id,
    });
    expect(deviceSession.readConnected()).toBeNull();
  });

  it('lets Manager Platform disconnect the currently bound device', async () => {
    const access = createLocalOperationalWorkspaceDirectory(window.localStorage);
    const deviceSession = createOperationalWorkspaceSessionStore(window.localStorage);
    const service = createSolutionConstructorService({
      setup: { get: async () => setup },
      coffee: localCoffeeManagerRepositories,
      access: access.issuer,
      deviceSession,
    });
    const generated = await service.generate(setup.project.id, ['bar'], names);
    const workspace = generated.structure.workspaces[0]!;
    const issued = await service.issueAccessCode(setup.project.id, workspace.id, names);
    deviceSession.authorize(issued.accessCodes[0]!);

    const connected = await service.load(setup.project.id);
    expect(connected.connectedWorkspaceId).toBe(workspace.id);

    const disconnected = await service.disconnectDevice(setup.project.id, workspace.id);
    expect(disconnected.connectedWorkspaceId).toBeNull();
    expect(deviceSession.readConnected()).toBeNull();
  });
});
