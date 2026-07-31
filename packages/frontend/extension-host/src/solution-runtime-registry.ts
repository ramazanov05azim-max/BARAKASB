import type {
  SolutionKey,
  SolutionRuntimeRegistration,
} from '@barakasb/contracts-platform';

export interface SolutionRuntimeRegistry {
  register(registration: SolutionRuntimeRegistration): void;
  get(solutionKey: SolutionKey): SolutionRuntimeRegistration | undefined;
  has(solutionKey: SolutionKey): boolean;
}

export class DuplicateSolutionRuntimeRegistrationError extends Error {
  constructor(solutionKey: SolutionKey) {
    super(`A Solution runtime is already registered for key "${solutionKey}".`);
    this.name = 'DuplicateSolutionRuntimeRegistrationError';
  }
}

export class InMemorySolutionRuntimeRegistry implements SolutionRuntimeRegistry {
  readonly #registrations = new Map<SolutionKey, SolutionRuntimeRegistration>();

  register(registration: SolutionRuntimeRegistration): void {
    const solutionKey = registration.manifest.identity.solutionKey;

    if (this.#registrations.has(solutionKey)) {
      throw new DuplicateSolutionRuntimeRegistrationError(solutionKey);
    }

    this.#registrations.set(solutionKey, registration);
  }

  get(solutionKey: SolutionKey): SolutionRuntimeRegistration | undefined {
    return this.#registrations.get(solutionKey);
  }

  has(solutionKey: SolutionKey): boolean {
    return this.#registrations.has(solutionKey);
  }
}
