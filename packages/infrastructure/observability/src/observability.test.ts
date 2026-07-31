import { describe, expect, it } from 'vitest';
import {
  DefaultRedactionPolicy,
  ForbiddenMetricAttributeError,
  InvalidMetricValueError,
  InvalidTelemetryNameError,
  OpenTelemetryMeterAdapter,
  OpenTelemetryTracerAdapter,
  RedactingStructuredLogger,
  validateMetricAttributes,
  type LogSink,
  type StructuredLogRecord,
  type TelemetryClock,
} from './public';

class FixedClock implements TelemetryClock {
  now(): string {
    return '2026-07-31T12:00:00.000Z';
  }
}

class RecordingLogSink implements LogSink {
  readonly records: StructuredLogRecord[] = [];

  write(record: StructuredLogRecord): void {
    this.records.push(record);
  }
}

describe('redaction', () => {
  it.each(['password', 'access_token', 'connectionString', 'BusinessEnvironmentCode'])(
    'redacts sensitive attribute %s',
    (key) => {
      const attributes = new DefaultRedactionPolicy().redact({
        [key]: 'sensitive',
        result: 'success',
      });

      expect(attributes[key]).toBe('<redacted>');
      expect(attributes.result).toBe('success');
    },
  );
});

describe('structured logging', () => {
  it('writes an immutable, redacted and correlated record', () => {
    const sink = new RecordingLogSink();
    const logger = new RedactingStructuredLogger(
      sink,
      new FixedClock(),
      new DefaultRedactionPolicy(),
      { module: 'solutions-runtime' },
    );

    logger.log(
      'info',
      'business_environment.generation_completed',
      {
        result: 'success',
        businessEnvironmentCode: '0000111122223333',
      },
      {
        correlationId: 'correlation-01',
        projectId: 'project-01',
      },
    );

    expect(sink.records).toHaveLength(1);
    expect(sink.records[0]).toEqual({
      timestamp: '2026-07-31T12:00:00.000Z',
      level: 'info',
      event: 'business_environment.generation_completed',
      attributes: {
        module: 'solutions-runtime',
        result: 'success',
        businessEnvironmentCode: '<redacted>',
      },
      context: {
        correlationId: 'correlation-01',
        projectId: 'project-01',
      },
    });
    expect(Object.isFrozen(sink.records[0])).toBe(true);
    expect(Object.isFrozen(sink.records[0]!.attributes)).toBe(true);
  });

  it.each(['', ' event', 'event '])('rejects invalid event name %j', (event) => {
    const logger = new RedactingStructuredLogger(
      new RecordingLogSink(),
      new FixedClock(),
    );

    expect(() => logger.log('info', event)).toThrow(InvalidTelemetryNameError);
  });
});

describe('metrics', () => {
  it.each(['projectId', 'actor_id', 'business-environment-code', 'correlation.id'])(
    'rejects sensitive or unbounded metric label %s',
    (key) => {
      expect(() => validateMetricAttributes({ [key]: 'value' })).toThrow(
        ForbiddenMetricAttributeError,
      );
    },
  );

  it('accepts bounded operational labels', () => {
    expect(() =>
      validateMetricAttributes({
        operation: 'generate',
        result: 'success',
        retry: false,
      }),
    ).not.toThrow();
  });

  it('uses the OpenTelemetry no-op provider safely before backend wiring', () => {
    const meter = new OpenTelemetryMeterAdapter('barakasb.test');
    const counter = meter.counter('business_environment_created');
    const histogram = meter.histogram('business_environment_generation_ms');

    expect(() => counter.add(1, { result: 'success' })).not.toThrow();
    expect(() => histogram.record(12, { operation: 'generate' })).not.toThrow();
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects invalid metric value %s',
    (value) => {
      const counter = new OpenTelemetryMeterAdapter('barakasb.test').counter(
        'invalid_value',
      );

      expect(() => counter.add(value)).toThrow(InvalidMetricValueError);
    },
  );
});

describe('tracing', () => {
  it('returns the operation result through the no-op OpenTelemetry provider', () => {
    const tracer = new OpenTelemetryTracerAdapter('barakasb.test');

    const result = tracer.withSpan(
      'business_environment.generate',
      {
        kind: 'internal',
        attributes: {
          operation: 'generate',
          businessEnvironmentCode: '0000111122223333',
        },
      },
      (span) => {
        span.addEvent('generation.started');
        span.setAttribute('result', 'success');
        span.setStatus('ok');
        return 'completed';
      },
    );

    expect(result).toBe('completed');
  });

  it('preserves application errors while recording a safe error type', () => {
    const tracer = new OpenTelemetryTracerAdapter('barakasb.test');
    const failure = new TypeError('sensitive internal message');

    expect(() =>
      tracer.withSpan('business_environment.generate', {}, () => {
        throw failure;
      }),
    ).toThrow(failure);
  });
});
