'use client';

import {
  localCoffeeManagerRepositories,
  type CoffeeManagerRepositories,
  type CoffeeSolutionModuleId,
} from '@barakasb/solution-coffee';
import {
  localCoffeeManagerSetupRepository,
  type CoffeeManagerSetupRepository,
} from '@/features/manager-coffee-setup/coffee-manager-setup-repository';

export type OwnerWorkspacePreviewErrorCode =
  'project-not-found' | 'access-denied' | 'workspace-not-found' | 'workspace-inactive';

export class OwnerWorkspacePreviewError extends Error {
  constructor(public readonly code: OwnerWorkspacePreviewErrorCode) {
    super(code);
  }
}

export interface OwnerWorkspacePreviewContext {
  readonly projectId: string;
  readonly projectName: string;
  readonly businessEnvironmentId: string;
  readonly workspaceId: string;
  readonly workspaceType: CoffeeSolutionModuleId;
}

export interface OwnerWorkspacePreviewService {
  load(projectId: string, workspaceId: string): Promise<OwnerWorkspacePreviewContext>;
}

interface Dependencies {
  setup: Pick<CoffeeManagerSetupRepository, 'get'>;
  coffee: Pick<CoffeeManagerRepositories, 'loadSnapshot'>;
}

export function createOwnerWorkspacePreviewService({
  setup,
  coffee,
}: Dependencies): OwnerWorkspacePreviewService {
  return {
    async load(projectId, workspaceId) {
      const setupRecord = await setup.get(projectId);
      if (!setupRecord || setupRecord.project.id !== projectId) {
        throw new OwnerWorkspacePreviewError('project-not-found');
      }
      if (
        setupRecord.project.role !== 'owner' ||
        setupRecord.project.status !== 'active' ||
        setupRecord.installation.projectId !== projectId ||
        setupRecord.installation.solutionId !== 'coffee'
      ) {
        throw new OwnerWorkspacePreviewError('access-denied');
      }
      if (!setupRecord.businessEnvironmentId) {
        throw new OwnerWorkspacePreviewError('project-not-found');
      }

      const snapshot = await coffee.loadSnapshot(projectId);
      const workspace = snapshot.solutionStructure.workspaces.find(
        (candidate) => candidate.id === workspaceId,
      );
      if (!workspace) {
        throw new OwnerWorkspacePreviewError('workspace-not-found');
      }
      if (workspace.status !== 'active') {
        throw new OwnerWorkspacePreviewError('workspace-inactive');
      }

      return {
        projectId,
        projectName:
          setupRecord.project.displayName ??
          setupRecord.establishment?.establishmentName ??
          setupRecord.project.name,
        businessEnvironmentId: setupRecord.businessEnvironmentId,
        workspaceId: workspace.id,
        workspaceType: workspace.moduleId,
      };
    },
  };
}

export const localOwnerWorkspacePreviewService = createOwnerWorkspacePreviewService({
  setup: localCoffeeManagerSetupRepository,
  coffee: localCoffeeManagerRepositories,
});
