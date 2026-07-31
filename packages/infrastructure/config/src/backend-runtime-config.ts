import { ConfigReader } from './reader';
import type { SecretReference } from './secret-reference';
import type { ConfigSource } from './source';

export type RuntimeEnvironment = 'development' | 'test' | 'staging' | 'production';

export interface DatabaseRuntimeConfig {
  readonly connection: SecretReference;
  readonly poolMinimum: number;
  readonly poolMaximum: number;
  readonly connectionTimeoutMs: number;
  readonly statementTimeoutMs: number;
}

export interface MigrationRuntimeConfig {
  readonly enabled: boolean;
  readonly lockTimeoutMs: number;
  readonly statementTimeoutMs: number;
  readonly maximumParallelShards: number;
}

export interface WorkerRuntimeConfig {
  readonly concurrency: number;
  readonly pollIntervalMs: number;
  readonly shutdownGraceMs: number;
}

export interface MessagingRuntimeConfig {
  readonly connection: SecretReference;
  readonly publishBatchSize: number;
  readonly maximumAttempts: number;
  readonly initialRetryDelayMs: number;
  readonly maximumRetryDelayMs: number;
}

export interface TelemetryRuntimeConfig {
  readonly serviceName: string;
  readonly environment: RuntimeEnvironment;
  readonly exporterEndpoint?: string;
  readonly exporterHeaders?: SecretReference;
}

export interface BackendRuntimeConfig {
  readonly database: DatabaseRuntimeConfig;
  readonly migrations: MigrationRuntimeConfig;
  readonly worker: WorkerRuntimeConfig;
  readonly messaging: MessagingRuntimeConfig;
  readonly telemetry: TelemetryRuntimeConfig;
}

export function loadBackendRuntimeConfig(source: ConfigSource): BackendRuntimeConfig {
  const reader = new ConfigReader(source);

  const databaseConnection = reader.secretReference(
    'BARAKASB_DATABASE_CONNECTION_SECRET',
  );
  const databasePoolMinimum = reader.integer('BARAKASB_DATABASE_POOL_MINIMUM', {
    defaultValue: 0,
    minimum: 0,
    maximum: 1_000,
  });
  const databasePoolMaximum = reader.integer('BARAKASB_DATABASE_POOL_MAXIMUM', {
    minimum: 1,
    maximum: 1_000,
  });
  const databaseConnectionTimeoutMs = reader.integer(
    'BARAKASB_DATABASE_CONNECTION_TIMEOUT_MS',
    {
      defaultValue: 5_000,
      minimum: 1,
      maximum: 600_000,
    },
  );
  const databaseStatementTimeoutMs = reader.integer(
    'BARAKASB_DATABASE_STATEMENT_TIMEOUT_MS',
    {
      defaultValue: 30_000,
      minimum: 1,
      maximum: 3_600_000,
    },
  );

  const migrationsEnabled = reader.boolean('BARAKASB_MIGRATIONS_ENABLED', false);
  const migrationLockTimeoutMs = reader.integer('BARAKASB_MIGRATIONS_LOCK_TIMEOUT_MS', {
    defaultValue: 10_000,
    minimum: 1,
    maximum: 3_600_000,
  });
  const migrationStatementTimeoutMs = reader.integer(
    'BARAKASB_MIGRATIONS_STATEMENT_TIMEOUT_MS',
    {
      defaultValue: 300_000,
      minimum: 1,
      maximum: 86_400_000,
    },
  );
  const maximumParallelShards = reader.integer(
    'BARAKASB_MIGRATIONS_MAXIMUM_PARALLEL_SHARDS',
    {
      defaultValue: 1,
      minimum: 1,
      maximum: 100,
    },
  );

  const workerConcurrency = reader.integer('BARAKASB_WORKER_CONCURRENCY', {
    defaultValue: 4,
    minimum: 1,
    maximum: 1_000,
  });
  const workerPollIntervalMs = reader.integer('BARAKASB_WORKER_POLL_INTERVAL_MS', {
    defaultValue: 1_000,
    minimum: 10,
    maximum: 600_000,
  });
  const workerShutdownGraceMs = reader.integer('BARAKASB_WORKER_SHUTDOWN_GRACE_MS', {
    defaultValue: 30_000,
    minimum: 1,
    maximum: 3_600_000,
  });

  const messagingConnection = reader.secretReference(
    'BARAKASB_MESSAGING_CONNECTION_SECRET',
  );
  const publishBatchSize = reader.integer('BARAKASB_MESSAGING_PUBLISH_BATCH_SIZE', {
    defaultValue: 100,
    minimum: 1,
    maximum: 10_000,
  });
  const maximumAttempts = reader.integer('BARAKASB_MESSAGING_MAXIMUM_ATTEMPTS', {
    defaultValue: 10,
    minimum: 1,
    maximum: 1_000,
  });
  const initialRetryDelayMs = reader.integer(
    'BARAKASB_MESSAGING_INITIAL_RETRY_DELAY_MS',
    {
      defaultValue: 250,
      minimum: 1,
      maximum: 3_600_000,
    },
  );
  const maximumRetryDelayMs = reader.integer(
    'BARAKASB_MESSAGING_MAXIMUM_RETRY_DELAY_MS',
    {
      defaultValue: 30_000,
      minimum: 1,
      maximum: 86_400_000,
    },
  );

  const serviceName = reader.requiredString('BARAKASB_TELEMETRY_SERVICE_NAME');
  const environment = reader.enumValue('BARAKASB_RUNTIME_ENVIRONMENT', [
    'development',
    'test',
    'staging',
    'production',
  ] as const);
  const exporterEndpoint = reader.optionalString(
    'BARAKASB_TELEMETRY_EXPORTER_ENDPOINT',
  );
  const exporterHeaders =
    source.get('BARAKASB_TELEMETRY_EXPORTER_HEADERS_SECRET') === undefined
      ? undefined
      : reader.secretReference('BARAKASB_TELEMETRY_EXPORTER_HEADERS_SECRET');

  if (databasePoolMinimum !== undefined && databasePoolMaximum !== undefined) {
    reader.invariant(
      databasePoolMinimum <= databasePoolMaximum,
      'BARAKASB_DATABASE_POOL_MAXIMUM',
      'Database pool maximum must be greater than or equal to its minimum.',
    );
  }

  if (initialRetryDelayMs !== undefined && maximumRetryDelayMs !== undefined) {
    reader.invariant(
      initialRetryDelayMs <= maximumRetryDelayMs,
      'BARAKASB_MESSAGING_MAXIMUM_RETRY_DELAY_MS',
      'Maximum retry delay must be greater than or equal to initial delay.',
    );
  }

  reader.finish();

  const telemetry: TelemetryRuntimeConfig = Object.freeze({
    serviceName: serviceName!,
    environment: environment!,
    ...(exporterEndpoint === undefined ? {} : { exporterEndpoint }),
    ...(exporterHeaders === undefined ? {} : { exporterHeaders }),
  });

  return Object.freeze({
    database: Object.freeze({
      connection: databaseConnection!,
      poolMinimum: databasePoolMinimum!,
      poolMaximum: databasePoolMaximum!,
      connectionTimeoutMs: databaseConnectionTimeoutMs!,
      statementTimeoutMs: databaseStatementTimeoutMs!,
    }),
    migrations: Object.freeze({
      enabled: migrationsEnabled!,
      lockTimeoutMs: migrationLockTimeoutMs!,
      statementTimeoutMs: migrationStatementTimeoutMs!,
      maximumParallelShards: maximumParallelShards!,
    }),
    worker: Object.freeze({
      concurrency: workerConcurrency!,
      pollIntervalMs: workerPollIntervalMs!,
      shutdownGraceMs: workerShutdownGraceMs!,
    }),
    messaging: Object.freeze({
      connection: messagingConnection!,
      publishBatchSize: publishBatchSize!,
      maximumAttempts: maximumAttempts!,
      initialRetryDelayMs: initialRetryDelayMs!,
      maximumRetryDelayMs: maximumRetryDelayMs!,
    }),
    telemetry,
  });
}
