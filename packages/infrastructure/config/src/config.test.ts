import { describe, expect, it } from 'vitest';
import {
  ConfigurationValidationError,
  InvalidSecretReferenceError,
  RecordConfigSource,
  loadBackendRuntimeConfig,
  secretReference,
} from './public';

const validValues = {
  BARAKASB_DATABASE_CONNECTION_SECRET: 'secret://database/runtime',
  BARAKASB_DATABASE_POOL_MAXIMUM: '20',
  BARAKASB_MESSAGING_CONNECTION_SECRET: 'secret://messaging/runtime',
  BARAKASB_TELEMETRY_SERVICE_NAME: 'control-plane-worker',
  BARAKASB_RUNTIME_ENVIRONMENT: 'test',
} as const;

describe('secret references', () => {
  it('accepts an opaque external secret reference', () => {
    expect(secretReference('secret://database/runtime')).toBe(
      'secret://database/runtime',
    );
  });

  it.each([
    '',
    'postgres://user:password@host/database',
    'secret://',
    'secret://database/runtime value',
  ])('rejects raw or malformed secret value %j', (value) => {
    expect(() => secretReference(value)).toThrow(InvalidSecretReferenceError);
  });
});

describe('backend runtime configuration', () => {
  it('loads a deeply immutable provider-neutral configuration', () => {
    const config = loadBackendRuntimeConfig(new RecordConfigSource(validValues));

    expect(config.database).toEqual({
      connection: 'secret://database/runtime',
      poolMinimum: 0,
      poolMaximum: 20,
      connectionTimeoutMs: 5_000,
      statementTimeoutMs: 30_000,
    });
    expect(config.migrations.enabled).toBe(false);
    expect(config.messaging.publishBatchSize).toBe(100);
    expect(config.telemetry).toEqual({
      serviceName: 'control-plane-worker',
      environment: 'test',
    });
    expect(Object.isFrozen(config)).toBe(true);
    expect(Object.isFrozen(config.database)).toBe(true);
  });

  it('supports valid explicit values and optional telemetry settings', () => {
    const config = loadBackendRuntimeConfig(
      new RecordConfigSource({
        ...validValues,
        BARAKASB_DATABASE_POOL_MINIMUM: '5',
        BARAKASB_MIGRATIONS_ENABLED: 'true',
        BARAKASB_WORKER_CONCURRENCY: '32',
        BARAKASB_MESSAGING_INITIAL_RETRY_DELAY_MS: '100',
        BARAKASB_MESSAGING_MAXIMUM_RETRY_DELAY_MS: '500',
        BARAKASB_TELEMETRY_EXPORTER_ENDPOINT: 'http://collector:4318',
        BARAKASB_TELEMETRY_EXPORTER_HEADERS_SECRET: 'secret://telemetry/headers',
      }),
    );

    expect(config.database.poolMinimum).toBe(5);
    expect(config.migrations.enabled).toBe(true);
    expect(config.worker.concurrency).toBe(32);
    expect(config.telemetry.exporterHeaders).toBe('secret://telemetry/headers');
  });

  it('collects failures without exposing configured values', () => {
    const rawSecret = 'postgres://admin:do-not-log@database/main';

    try {
      loadBackendRuntimeConfig(
        new RecordConfigSource({
          BARAKASB_DATABASE_CONNECTION_SECRET: rawSecret,
          BARAKASB_DATABASE_POOL_MAXIMUM: 'not-an-integer',
          BARAKASB_MESSAGING_CONNECTION_SECRET: 'amqp://guest:guest@broker',
          BARAKASB_TELEMETRY_SERVICE_NAME: '',
          BARAKASB_RUNTIME_ENVIRONMENT: 'unknown',
        }),
      );
      throw new Error('Expected configuration validation to fail.');
    } catch (error) {
      expect(error).toBeInstanceOf(ConfigurationValidationError);
      const validationError = error as ConfigurationValidationError;

      expect(validationError.issues.map((issue) => issue.key)).toEqual(
        expect.arrayContaining([
          'BARAKASB_DATABASE_CONNECTION_SECRET',
          'BARAKASB_DATABASE_POOL_MAXIMUM',
          'BARAKASB_MESSAGING_CONNECTION_SECRET',
          'BARAKASB_TELEMETRY_SERVICE_NAME',
          'BARAKASB_RUNTIME_ENVIRONMENT',
        ]),
      );
      expect(JSON.stringify(validationError)).not.toContain(rawSecret);
      expect(validationError.message).not.toContain(rawSecret);
    }
  });

  it('enforces cross-field pool and retry invariants', () => {
    expect(() =>
      loadBackendRuntimeConfig(
        new RecordConfigSource({
          ...validValues,
          BARAKASB_DATABASE_POOL_MINIMUM: '21',
          BARAKASB_DATABASE_POOL_MAXIMUM: '20',
          BARAKASB_MESSAGING_INITIAL_RETRY_DELAY_MS: '501',
          BARAKASB_MESSAGING_MAXIMUM_RETRY_DELAY_MS: '500',
        }),
      ),
    ).toThrow(ConfigurationValidationError);
  });

  it.each([
    ['BARAKASB_DATABASE_POOL_MAXIMUM', '0'],
    ['BARAKASB_WORKER_CONCURRENCY', '-1'],
    ['BARAKASB_MESSAGING_PUBLISH_BATCH_SIZE', '1.5'],
    ['BARAKASB_MIGRATIONS_ENABLED', 'yes'],
  ])('rejects invalid %s value', (key, value) => {
    expect(() =>
      loadBackendRuntimeConfig(
        new RecordConfigSource({ ...validValues, [key]: value }),
      ),
    ).toThrow(ConfigurationValidationError);
  });

  it('does not observe later mutations of the source record', () => {
    const values: Record<string, string | undefined> = { ...validValues };
    const source = new RecordConfigSource(values);
    values.BARAKASB_DATABASE_POOL_MAXIMUM = '999';

    expect(loadBackendRuntimeConfig(source).database.poolMaximum).toBe(20);
  });
});
