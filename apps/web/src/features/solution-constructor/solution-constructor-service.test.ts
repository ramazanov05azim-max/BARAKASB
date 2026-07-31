// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest';
import { localCoffeeManagerRepositories } from '@barakasb/solution-coffee';
import type { CoffeeManagerSetupRecord } from '@/features/manager-coffee-setup/coffee-manager-setup-repository';
import { createLocalOperationalWorkspaceDirectory } from '@/features/universal-application/infrastructure/local-operational-workspace-directory';
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
  manager: 'Руководитель',
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
      businessEnvironmentId: setup.businessEnvironmentId,
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
    const withEmployee = await service.createEmployee(setup.project.id, {
      fullName: 'Анна Петрова',
      email: 'anna@example.test',
      phone: '+79990000000',
      employeeCode: 'EMP-001',
    });
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
  });
});
