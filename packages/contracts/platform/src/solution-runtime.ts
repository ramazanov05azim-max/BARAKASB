export type SolutionKey = string;

export interface SolutionRuntimeIdentity {
  solutionKey: SolutionKey;
  runtimeVersion: string;
}

export interface SolutionRuntimeManifest {
  identity: SolutionRuntimeIdentity;
  displayName: string;
  entryRoute: string;
  capabilities: readonly string[];
}

export interface SolutionRuntimeRegistration {
  manifest: SolutionRuntimeManifest;
}
