export interface SolutionApplicationConfig {
  applicationName: string;
  applicationVersion: string;
}

export const solutionApplicationConfig: Readonly<SolutionApplicationConfig> =
  Object.freeze({
    applicationName: 'BARAKASB',
    applicationVersion: process.env.NEXT_PUBLIC_APP_VERSION ?? '0.1.0',
  });
