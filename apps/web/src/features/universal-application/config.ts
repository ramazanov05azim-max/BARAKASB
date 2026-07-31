export interface SolutionApplicationConfig {
  applicationName: string;
  applicationVersion: string;
  environmentResolutionBaseUrl?: string;
}

const environmentResolutionBaseUrl =
  process.env.NEXT_PUBLIC_ENVIRONMENT_RESOLUTION_BASE_URL;

export const solutionApplicationConfig: Readonly<SolutionApplicationConfig> =
  Object.freeze({
    applicationName: 'BARAKASB',
    applicationVersion: process.env.NEXT_PUBLIC_APP_VERSION ?? '0.1.0',
    ...(environmentResolutionBaseUrl ? { environmentResolutionBaseUrl } : {}),
  });
