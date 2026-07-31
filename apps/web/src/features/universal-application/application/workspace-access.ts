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
  read(projectId: string, workspaceId: string): OperationalWorkspaceSession | null;
  selectEmployee(
    projectId: string,
    workspaceId: string,
    employeeId: string | null,
  ): OperationalWorkspaceSession | null;
  clear(): void;
}
