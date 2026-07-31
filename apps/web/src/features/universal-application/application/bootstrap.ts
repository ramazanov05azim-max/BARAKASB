export type ApplicationBootstrapState =
  | 'starting'
  | 'requires-environment-code'
  | 'resolving-environment'
  | 'requires-device-authorization'
  | 'requires-employee-authentication'
  | 'loading-runtime'
  | 'ready'
  | 'unavailable'
  | 'error';

export interface ApplicationBootstrapSnapshot {
  state: ApplicationBootstrapState;
  errorCode?: string;
}

export interface ApplicationBootstrapController {
  getSnapshot(): ApplicationBootstrapSnapshot;
  start(): Promise<void>;
}

export class LocalApplicationBootstrapController implements ApplicationBootstrapController {
  #snapshot: ApplicationBootstrapSnapshot = { state: 'starting' };

  getSnapshot(): ApplicationBootstrapSnapshot {
    return this.#snapshot;
  }

  async start(): Promise<void> {
    if (this.#snapshot.state !== 'starting') return;
    this.#snapshot = { state: 'requires-environment-code' };
  }
}
