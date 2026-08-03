export interface OperationalWorkspaceEmployee {
  readonly employeeId: string;
  readonly displayName: string;
}

export interface OperationalWorkspaceAccessInput {
  readonly projectId: string;
  readonly solutionId: string;
  readonly solutionInstallationId: string;
  readonly businessEnvironmentId: string;
  readonly environmentDisplayName: string;
  readonly workspaceId: string;
  readonly workspaceType: string;
  readonly workspaceName: string;
  readonly assignedEmployees: ReadonlyArray<OperationalWorkspaceEmployee>;
}

export interface ResolvedOperationalWorkspace extends OperationalWorkspaceAccessInput {
  readonly accessCode: string;
  readonly createdAt: string;
}

export interface OperationalWorkspaceAccessResolver {
  resolve(code: string): Promise<ResolvedOperationalWorkspace | null>;
}

export interface OperationalWorkspaceAccessIssuer {
  issue(input: OperationalWorkspaceAccessInput): Promise<ResolvedOperationalWorkspace>;
  listByProject(projectId: string): Promise<ResolvedOperationalWorkspace[]>;
  sync(
    input: OperationalWorkspaceAccessInput,
  ): Promise<ResolvedOperationalWorkspace | null>;
  rotate(input: OperationalWorkspaceAccessInput): Promise<ResolvedOperationalWorkspace>;
  removeUnavailable(
    projectId: string,
    workspaceIds: ReadonlySet<string>,
  ): Promise<void>;
  removeProject(projectId: string): Promise<void>;
}

export interface OperationalWorkspaceSession {
  readonly workspace: ResolvedOperationalWorkspace;
  readonly currentEmployeeId: string | null;
}

export interface OperationalWorkspaceSessionStore {
  authorize(workspace: ResolvedOperationalWorkspace): void;
  readConnected(): OperationalWorkspaceSession | null;
  read(projectId: string, workspaceId: string): OperationalWorkspaceSession | null;
  authenticateEmployee(
    projectId: string,
    workspaceId: string,
    employeeId: string,
  ): OperationalWorkspaceSession | null;
  logoutEmployee(
    projectId: string,
    workspaceId: string,
  ): OperationalWorkspaceSession | null;
  clear(): void;
}

export interface OperationalEmployeeAuthenticator {
  verify(input: {
    readonly projectId: string;
    readonly workspaceId: string;
    readonly employeeId: string;
    readonly password: string;
  }): Promise<boolean>;
}
