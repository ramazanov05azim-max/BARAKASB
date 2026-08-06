import type { MediaAssetId } from './media-asset';
import type { OperationalWorkspaceExecutionContext } from './operational-workspace';

export const operationalPlatformServiceKeys = [
  'employee-session',
  'authorization',
  'media',
  'notifications',
  'printing',
  'audit',
  'synchronization',
] as const;

export type OperationalPlatformServiceKey =
  (typeof operationalPlatformServiceKeys)[number];

export interface OperationalModuleIdentity {
  readonly solutionKey: string;
  readonly moduleKey: string;
  readonly contractVersion: string;
}

export interface OperationalModuleRouteDescriptor {
  readonly routeKey: string;
  readonly screenKey: string;
  readonly titleKey: string;
  readonly requiredCapabilities: readonly string[];
}

export interface OperationalModuleNavigationItem {
  readonly itemKey: string;
  readonly labelKey: string;
  readonly routeKey: string;
  readonly order: number;
  readonly requiredCapabilities: readonly string[];
}

/**
 * Transport-neutral declaration consumed by the existing browser extension host.
 * It intentionally contains no React component, repository implementation or provider SDK.
 */
export interface OperationalModuleManifest {
  readonly identity: OperationalModuleIdentity;
  readonly workspaceType: string;
  readonly initialRouteKey: string;
  readonly routes: readonly OperationalModuleRouteDescriptor[];
  readonly navigation: readonly OperationalModuleNavigationItem[];
  readonly declaredCapabilities: readonly string[];
  readonly requiredPlatformServices: readonly OperationalPlatformServiceKey[];
  readonly stateSchemaVersion: number;
  readonly serviceContractVersion: string;
  readonly repositoryContractVersion: string;
}

export interface OperationalEmployeeSessionReader {
  current(): OperationalWorkspaceExecutionContext;
}

export interface OperationalAuthorizationPort {
  authorize(input: {
    readonly context: OperationalWorkspaceExecutionContext;
    readonly capability: string;
    readonly resourceId?: string;
  }): Promise<'allow' | 'deny'>;
}

export interface OperationalMediaPort {
  get(assetId: MediaAssetId): Promise<{
    readonly assetId: MediaAssetId;
    readonly url: string;
  } | null>;
}

export interface OperationalNotificationPort {
  publish(input: {
    readonly context: OperationalWorkspaceExecutionContext;
    readonly notificationType: string;
    readonly deduplicationKey: string;
    readonly payload: Readonly<Record<string, unknown>>;
  }): Promise<void>;
}

export interface OperationalPrintingPort {
  enqueue(input: {
    readonly context: OperationalWorkspaceExecutionContext;
    readonly documentType: string;
    readonly documentReference: string;
    readonly idempotencyKey: string;
  }): Promise<{ readonly printJobId: string }>;
}

export interface OperationalAuditPort {
  record(input: {
    readonly context: OperationalWorkspaceExecutionContext;
    readonly action: string;
    readonly subjectId?: string;
    readonly occurredAt: string;
    readonly metadata: Readonly<Record<string, string | number | boolean | null>>;
  }): Promise<void>;
}

export interface OperationalSynchronizationPort {
  synchronize(input: {
    readonly context: OperationalWorkspaceExecutionContext;
    readonly cursor: string | null;
    readonly idempotencyKey: string;
  }): Promise<{ readonly nextCursor: string | null }>;
}
