import {
  metrics,
  type Counter as OpenTelemetryCounter,
  type Histogram as OpenTelemetryHistogram,
  type Meter as OpenTelemetryMeter,
} from '@opentelemetry/api';
import { assertTelemetryName, type TelemetryAttributes } from './types';

export interface Counter {
  add(value: number, attributes?: TelemetryAttributes): void;
}

export interface Histogram {
  record(value: number, attributes?: TelemetryAttributes): void;
}

export interface Meter {
  counter(
    name: string,
    options?: Readonly<{ description?: string; unit?: string }>,
  ): Counter;
  histogram(
    name: string,
    options?: Readonly<{ description?: string; unit?: string }>,
  ): Histogram;
}

export class InvalidMetricValueError extends Error {
  readonly code = 'observability.invalid_metric_value';

  constructor(readonly value: number) {
    super('Metric value must be finite.');
    this.name = 'InvalidMetricValueError';
  }
}

export class ForbiddenMetricAttributeError extends Error {
  readonly code = 'observability.forbidden_metric_attribute';

  constructor(readonly key: string) {
    super(`Metric attribute "${key}" has unbounded or sensitive cardinality.`);
    this.name = 'ForbiddenMetricAttributeError';
  }
}

const forbiddenMetricAttributeFragments = [
  'actorid',
  'businessenvironmentcode',
  'correlationid',
  'eventid',
  'projectid',
  'sessionid',
  'userid',
] as const;

function normalizedKey(key: string): string {
  return key.replaceAll(/[^a-z0-9]/giu, '').toLowerCase();
}

export function validateMetricAttributes(attributes: TelemetryAttributes): void {
  for (const key of Object.keys(attributes)) {
    const normalized = normalizedKey(key);
    if (
      forbiddenMetricAttributeFragments.some((fragment) =>
        normalized.includes(fragment),
      )
    ) {
      throw new ForbiddenMetricAttributeError(key);
    }
  }
}

function assertMetricValue(value: number): void {
  if (!Number.isFinite(value)) {
    throw new InvalidMetricValueError(value);
  }
}

class OpenTelemetryCounterAdapter implements Counter {
  constructor(private readonly counter: OpenTelemetryCounter) {}

  add(value: number, attributes: TelemetryAttributes = {}): void {
    assertMetricValue(value);
    validateMetricAttributes(attributes);
    this.counter.add(value, attributes);
  }
}

class OpenTelemetryHistogramAdapter implements Histogram {
  constructor(private readonly histogram: OpenTelemetryHistogram) {}

  record(value: number, attributes: TelemetryAttributes = {}): void {
    assertMetricValue(value);
    validateMetricAttributes(attributes);
    this.histogram.record(value, attributes);
  }
}

export class OpenTelemetryMeterAdapter implements Meter {
  readonly #meter: OpenTelemetryMeter;

  constructor(name: string, version?: string) {
    assertTelemetryName(name, 'Meter name');
    this.#meter = metrics.getMeter(name, version);
  }

  counter(
    name: string,
    options: Readonly<{ description?: string; unit?: string }> = {},
  ): Counter {
    assertTelemetryName(name, 'Counter name');
    return new OpenTelemetryCounterAdapter(this.#meter.createCounter(name, options));
  }

  histogram(
    name: string,
    options: Readonly<{ description?: string; unit?: string }> = {},
  ): Histogram {
    assertTelemetryName(name, 'Histogram name');
    return new OpenTelemetryHistogramAdapter(
      this.#meter.createHistogram(name, options),
    );
  }
}
