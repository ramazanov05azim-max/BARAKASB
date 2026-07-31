export type TelemetryAttributeValue = string | number | boolean;

export type TelemetryAttributes = Readonly<Record<string, TelemetryAttributeValue>>;

export interface CorrelationContext {
  readonly traceId?: string;
  readonly spanId?: string;
  readonly correlationId: string;
  readonly causationId?: string;
  readonly actorId?: string;
  readonly projectId?: string;
  readonly globalScope?: true;
}

export interface TelemetryClock {
  now(): string;
}

export class SystemTelemetryClock implements TelemetryClock {
  now(): string {
    return new Date().toISOString();
  }
}

export class InvalidTelemetryNameError extends Error {
  readonly code = 'observability.invalid_name';

  constructor(readonly nameType: string) {
    super(`${nameType} must be non-empty and contain no surrounding whitespace.`);
    this.name = 'InvalidTelemetryNameError';
  }
}

export function assertTelemetryName(value: string, nameType: string): void {
  if (value.length === 0 || value.trim() !== value) {
    throw new InvalidTelemetryNameError(nameType);
  }
}
