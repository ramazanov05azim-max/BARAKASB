'use client';

import { localCoffeeManagerRepositories } from '@barakasb/solution-coffee';
import type { OperationalEmployeeAuthenticator } from '../application/workspace-access';
import { verifyPasswordCredential } from '../domain/employee-password';

export const localCoffeeEmployeeAuthenticator: OperationalEmployeeAuthenticator = {
  async verify({ projectId, workspaceId, employeeId, password }) {
    const [snapshot, credential] = await Promise.all([
      localCoffeeManagerRepositories.loadSnapshot(projectId),
      localCoffeeManagerRepositories.employeeCredentials.get(projectId, employeeId),
    ]);
    const employee = snapshot.employees.find(
      (candidate) =>
        candidate.id === employeeId &&
        candidate.status === 'active' &&
        candidate.employmentStatus === 'active',
    );
    const workspace = snapshot.solutionStructure.workspaces.find(
      (candidate) =>
        candidate.id === workspaceId &&
        candidate.status === 'active' &&
        candidate.assignedEmployeeIds.includes(employeeId),
    );
    if (!employee || !workspace || !credential) return false;
    return verifyPasswordCredential(password, credential);
  },
};
