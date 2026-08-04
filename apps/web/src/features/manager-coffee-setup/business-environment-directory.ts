export interface ResolvedBusinessEnvironment {
  readonly businessEnvironmentId: string;
  readonly projectId: string;
  readonly solutionId: string;
  readonly displayName: string;
  readonly status: 'active';
  readonly createdAt: string;
  readonly developmentDemo: boolean;
}

export interface BusinessEnvironmentResolver {
  resolve(code: string): Promise<ResolvedBusinessEnvironment | null>;
}

export interface BusinessEnvironmentDirectoryWriter {
  register(
    code: string,
    environment: ResolvedBusinessEnvironment,
  ): Promise<ResolvedBusinessEnvironment>;
  removeProject(projectId: string): Promise<void>;
}

export interface BusinessEnvironmentDirectoryMaintenance {
  clear(): Promise<void>;
  count(): Promise<number>;
}
