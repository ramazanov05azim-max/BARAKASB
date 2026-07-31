import { DefaultRedactionPolicy, type RedactionPolicy } from './redaction';
import {
  SystemTelemetryClock,
  assertTelemetryName,
  type CorrelationContext,
  type TelemetryAttributes,
  type TelemetryClock,
} from './types';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface StructuredLogRecord {
  readonly timestamp: string;
  readonly level: LogLevel;
  readonly event: string;
  readonly attributes: TelemetryAttributes;
  readonly context?: CorrelationContext;
}

export interface LogSink {
  write(record: StructuredLogRecord): void;
}

export interface StructuredLogger {
  log(
    level: LogLevel,
    event: string,
    attributes?: TelemetryAttributes,
    context?: CorrelationContext,
  ): void;
}

export class RedactingStructuredLogger implements StructuredLogger {
  constructor(
    private readonly sink: LogSink,
    private readonly clock: TelemetryClock = new SystemTelemetryClock(),
    private readonly redactionPolicy: RedactionPolicy = new DefaultRedactionPolicy(),
    private readonly baseAttributes: TelemetryAttributes = {},
  ) {}

  log(
    level: LogLevel,
    event: string,
    attributes: TelemetryAttributes = {},
    context?: CorrelationContext,
  ): void {
    assertTelemetryName(event, 'Log event');

    const record: StructuredLogRecord = Object.freeze({
      timestamp: this.clock.now(),
      level,
      event,
      attributes: this.redactionPolicy.redact({
        ...this.baseAttributes,
        ...attributes,
      }),
      ...(context === undefined ? {} : { context: Object.freeze({ ...context }) }),
    });

    this.sink.write(record);
  }
}
