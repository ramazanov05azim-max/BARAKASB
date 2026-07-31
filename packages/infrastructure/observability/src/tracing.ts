import {
  SpanKind,
  SpanStatusCode,
  trace,
  type Span as OpenTelemetrySpan,
  type Tracer as OpenTelemetryTracer,
} from '@opentelemetry/api';
import { DefaultRedactionPolicy, type RedactionPolicy } from './redaction';
import {
  assertTelemetryName,
  type TelemetryAttributes,
  type TelemetryAttributeValue,
} from './types';

export type TraceSpanKind = 'internal' | 'server' | 'client' | 'producer' | 'consumer';

export type TraceSpanStatus = 'unset' | 'ok' | 'error';

export interface TraceSpan {
  setAttribute(key: string, value: TelemetryAttributeValue): void;
  addEvent(name: string, attributes?: TelemetryAttributes): void;
  setStatus(status: TraceSpanStatus): void;
  recordError(errorType: string): void;
}

export interface Tracer {
  withSpan<Value>(
    name: string,
    options: Readonly<{
      kind?: TraceSpanKind;
      attributes?: TelemetryAttributes;
    }>,
    operation: (span: TraceSpan) => Value,
  ): Value;
}

const spanKindMap: Readonly<Record<TraceSpanKind, SpanKind>> = {
  internal: SpanKind.INTERNAL,
  server: SpanKind.SERVER,
  client: SpanKind.CLIENT,
  producer: SpanKind.PRODUCER,
  consumer: SpanKind.CONSUMER,
};

const spanStatusMap: Readonly<Record<TraceSpanStatus, SpanStatusCode>> = {
  unset: SpanStatusCode.UNSET,
  ok: SpanStatusCode.OK,
  error: SpanStatusCode.ERROR,
};

class OpenTelemetrySpanAdapter implements TraceSpan {
  constructor(
    private readonly span: OpenTelemetrySpan,
    private readonly redactionPolicy: RedactionPolicy,
  ) {}

  setAttribute(key: string, value: TelemetryAttributeValue): void {
    const attributes = this.redactionPolicy.redact({ [key]: value });
    this.span.setAttribute(key, attributes[key]!);
  }

  addEvent(name: string, attributes: TelemetryAttributes = {}): void {
    assertTelemetryName(name, 'Span event name');
    this.span.addEvent(name, this.redactionPolicy.redact(attributes));
  }

  setStatus(status: TraceSpanStatus): void {
    this.span.setStatus({ code: spanStatusMap[status] });
  }

  recordError(errorType: string): void {
    assertTelemetryName(errorType, 'Error type');
    this.span.recordException({ name: errorType, message: errorType });
    this.span.setStatus({ code: SpanStatusCode.ERROR });
  }
}

export class OpenTelemetryTracerAdapter implements Tracer {
  readonly #tracer: OpenTelemetryTracer;

  constructor(
    name: string,
    version?: string,
    private readonly redactionPolicy: RedactionPolicy = new DefaultRedactionPolicy(),
  ) {
    assertTelemetryName(name, 'Tracer name');
    this.#tracer = trace.getTracer(name, version);
  }

  withSpan<Value>(
    name: string,
    options: Readonly<{
      kind?: TraceSpanKind;
      attributes?: TelemetryAttributes;
    }>,
    operation: (span: TraceSpan) => Value,
  ): Value {
    assertTelemetryName(name, 'Span name');
    const kind = spanKindMap[options.kind ?? 'internal'];
    const attributes = this.redactionPolicy.redact(options.attributes ?? {});

    return this.#tracer.startActiveSpan(
      name,
      { kind, attributes },
      (openTelemetrySpan) => {
        const span = new OpenTelemetrySpanAdapter(
          openTelemetrySpan,
          this.redactionPolicy,
        );

        try {
          return operation(span);
        } catch (error) {
          const errorType =
            error instanceof Error && error.name.length > 0
              ? error.name
              : 'UnknownError';
          span.recordError(errorType);
          throw error;
        } finally {
          openTelemetrySpan.end();
        }
      },
    );
  }
}
