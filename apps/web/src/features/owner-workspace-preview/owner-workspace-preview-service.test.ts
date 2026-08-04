import { describe, expect, it, vi } from 'vitest';
import type {
  CoffeeManagerRepositories,
  CoffeeOperationalWorkspace,
} from '@barakasb/solution-coffee';
import type { CoffeeManagerSetupRecord } from '@/features/manager-coffee-setup/coffee-manager-setup-repository';
import {
  createOwnerWorkspacePreviewService,
  OwnerWorkspacePreviewError,
} from './owner-workspace-preview-service';

type Snapshot = Awaited<ReturnType<CoffeeManagerRepositories['loadSnapshot']>>;

const setup: CoffeeManagerSetupRecord = {
  schemaVersion: 2,
  project: {
    id: 'coffee-1',
    name: 'Север',
    solutionId: 'coffee',
    categoryId: 'food',
    status: 'active',
    role: 'owner',
    createdAt: '2026-08-04T10:00:00.000Z',
  },
  installation: {
    id: 'installation-1',
    projectId: 'coffee-1',
    solutionId: 'coffee',
    status: 'installed',
    installedAt: '2026-08-04T10:00:00.000Z',
  },
  establishment: null,
  businessEnvironmentCode: '1234567890123456',
  businessEnvironmentId: 'environment-1',
  configuredAt: '2026-08-04T10:00:00.000Z',
  isDevelopmentDemo: false,
  crashTestSeedVersion: null,
};

function snapshot(workspaces: ReadonlyArray<CoffeeOperationalWorkspace>): Snapshot {
  return {
    solutionStructure: {
      selectedModuleIds: workspaces.map((workspace) => workspace.moduleId),
      workspaces: [...workspaces],
      generatedAt: '2026-08-04T10:00:00.000Z',
      updatedAt: '2026-08-04T10:00:00.000Z',
    },
  } as Snapshot;
}

const bar: CoffeeOperationalWorkspace = {
  id: 'workspace-bar',
  moduleId: 'bar',
  assignedEmployeeIds: [],
  status: 'active',
  createdAt: '2026-08-04T10:00:00.000Z',
  updatedAt: '2026-08-04T10:00:00.000Z',
};

describe('OwnerWorkspacePreviewService', () => {
  it.each([
    ['workspace-bar', 'bar'],
    ['workspace-kitchen', 'kitchen'],
  ] as const)('opens %s directly as owner preview', async (workspaceId, moduleId) => {
    const workspaces = [
      bar,
      { ...bar, id: 'workspace-kitchen', moduleId: 'kitchen' as const },
    ];
    const service = createOwnerWorkspacePreviewService({
      setup: { get: vi.fn(async () => setup) },
      coffee: { loadSnapshot: vi.fn(async () => snapshot(workspaces)) },
    });

    await expect(service.load('coffee-1', workspaceId)).resolves.toEqual(
      expect.objectContaining({
        projectId: 'coffee-1',
        workspaceId,
        workspaceType: moduleId,
      }),
    );
  });

  it('rejects a workspace from another project', async () => {
    const service = createOwnerWorkspacePreviewService({
      setup: { get: vi.fn(async () => setup) },
      coffee: { loadSnapshot: vi.fn(async () => snapshot([bar])) },
    });

    await expect(service.load('coffee-1', 'workspace-other-project')).rejects.toEqual(
      new OwnerWorkspacePreviewError('workspace-not-found'),
    );
  });

  it('rejects an inactive workspace', async () => {
    const inactive = {
      ...bar,
      status: 'inactive',
    } as unknown as CoffeeOperationalWorkspace;
    const service = createOwnerWorkspacePreviewService({
      setup: { get: vi.fn(async () => setup) },
      coffee: { loadSnapshot: vi.fn(async () => snapshot([inactive])) },
    });

    await expect(service.load('coffee-1', bar.id)).rejects.toEqual(
      new OwnerWorkspacePreviewError('workspace-inactive'),
    );
  });

  it('rejects access when Project ownership is absent', async () => {
    const service = createOwnerWorkspacePreviewService({
      setup: {
        get: vi.fn(async () => ({
          ...setup,
          project: { ...setup.project, status: 'provisioning' as const },
        })),
      },
      coffee: { loadSnapshot: vi.fn(async () => snapshot([bar])) },
    });

    await expect(service.load('coffee-1', bar.id)).rejects.toEqual(
      new OwnerWorkspacePreviewError('access-denied'),
    );
  });
});
