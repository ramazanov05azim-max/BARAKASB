# ADR 0020: Use OpenTelemetry and a separate immutable audit trail

- **Status:** Accepted
- **Date:** 2026-07-30
- **Owners:** Reliability and Security

## Context

Diagnostic telemetry and security audit records have different volume, retention,
access, integrity, and sampling requirements. Binding instrumentation to one vendor
raises migration cost.

## Decision drivers

- vendor-neutral instrumentation;
- end-to-end correlation across requests, jobs, and events;
- tamper-evident security records;
- bounded metric cardinality and cost.

## Decision

Use OpenTelemetry as the logging, metrics, and tracing instrumentation boundary.
Diagnostic signals may be sampled and redacted under policy.

Security and administrative audit records use a separate append-only model, restricted
writers, no update/delete permission for runtime roles, and export to a separately
administered immutable/WORM-capable sink with integrity checkpoints. Audit is never
sampled.

## Why this option

OpenTelemetry preserves backend choice and trace context. Separating audit prevents
diagnostic retention or sampling decisions from weakening security evidence.

## Alternatives considered

- Vendor SDKs throughout application code: rejected because they couple every module to
  one backend.
- Treat logs as audit: rejected because logs are sampled, mutable, noisy, and
  differently authorized.
- Project ID as a metric label everywhere: rejected due to unbounded cardinality.

## Consequences

Telemetry backends require classification, residency, and Project-aware access.
Cardinality budgets and correlation context are part of module contracts.

## Validation

Tests propagate trace/correlation context across transports, detect audit gaps, verify
runtime audit immutability, and enforce metric-label budgets.
