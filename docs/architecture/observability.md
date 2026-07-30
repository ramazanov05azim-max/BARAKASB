# Observability

## Signals

BARAKASB uses structured logs, metrics, distributed traces, and audit events.
OpenTelemetry is the vendor-neutral instrumentation boundary.

## Correlation

Every inbound request, WebSocket message, job, and event has:

- trace and span IDs;
- correlation and causation IDs;
- actor ID when known;
- verified Project ID or explicit global scope;
- module, operation, deployment version, and result.

Identifiers are attributes, not free-form message fragments. Sensitive business payloads
are excluded by default.

## Metrics

Core metrics include request rate/error/latency, database pool saturation, query
latency, cache hit ratio, WebSocket connections and delivery gaps, outbox age, queue
depth/lag, job outcomes, object operations, authorization denials, and extension health.

Metric labels must have bounded cardinality. Project IDs belong in traces and logs;
per-project metrics are produced only through controlled aggregation.

Telemetry backends enforce Project-aware access for Confidential attributes. Raw logs
and traces have classification, regional placement, retention, and deletion policy.
Tail-based sampling preserves errors and security-relevant traces; audit events are
never sampled.

Each module publishes a cardinality budget. Unbounded resource IDs, user IDs, URLs,
error messages, Plugin-provided labels, and Project IDs are forbidden as ordinary metric
labels.

## Health

Each Core module, Solution, and Plugin reports structural registration health and
operational dependency health. Optional extension degradation is visible without hiding
Core availability.

## Alerts and runbooks

Every actionable alert links to an owner and runbook. Alerts distinguish symptoms from
causes and include release version, affected component, region, and correlation links.

Release, cell, shard, extension version, and placement epoch are deployment attributes
so regressions and stale routing can be isolated without logging payloads.

## Related decision

- [ADR 0020: OpenTelemetry and separate audit](../adr/0020-opentelemetry-and-separate-audit.md)
