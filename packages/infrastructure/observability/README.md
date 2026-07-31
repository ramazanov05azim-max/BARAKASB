# Observability

Owns vendor-neutral structured logging, metrics, tracing, correlation context,
redaction, and OpenTelemetry adapters. Audit domain policy remains in Core Audit.

## Public API

`@barakasb/infrastructure-observability` exports:

- immutable structured log records and an injectable log sink;
- explicit correlation context;
- default sensitive-attribute redaction;
- bounded metric-attribute validation;
- vendor-neutral counter, histogram, meter, span, and tracer contracts;
- adapters backed by the accepted OpenTelemetry API boundary.

The OpenTelemetry API safely degrades to no-op behavior until a composition root
registers an approved SDK/provider.

## Safety

Project, actor, user, and Business Environment identifiers are rejected as ordinary
metric labels. Business Environment Codes and credential-like attributes are redacted
from logs and trace attributes by default. Diagnostic telemetry never substitutes for
append-only Core Audit.

## Boundary

This package does not select a telemetry backend, exporter, sampling vendor, audit
store, or WORM sink. Backend selection remains governed by the Open Decision Register.
