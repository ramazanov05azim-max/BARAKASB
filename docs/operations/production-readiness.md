# Production readiness review

No component or extension enters production until an accountable owner provides evidence
for this review.

## Ownership and contracts

- owner, on-call, repository boundary, public contracts, dependencies;
- capacity envelope and quota model;
- failure modes, degraded behavior, and kill switch;
- compatibility and migration policy.

## Security and isolation

- threat model updated;
- authentication and capability checks verified;
- two-Project negative tests at every storage/transport layer;
- restricted database role and `FORCE RLS` proven;
- data classes, residency, retention, and deletion registered;
- secrets, egress, supply chain, and artifact provenance reviewed.
- workload credentials and composition allowlists proven least-privilege;
- privileged-access, break-glass, and audit evidence reviewed.

## Reliability

- SLOs and error budgets;
- load, soak, burst, and noisy-neighbor results;
- timeouts, retries, backpressure, idempotency, and dead-letter behavior;
- dependency failure and control-plane degradation tests;
- dashboards, alerts, and runbooks.

## Delivery and recovery

- backward-compatible rollout and migration;
- canary/cohort plan and automated pause conditions;
- application rollback and data forward-fix procedure;
- backup restore evidence with achieved RPO/RTO;
- regional/cell failover evidence where applicable.

## Approval

Unmet items are accepted only through a time-bounded risk record with owner, expiry,
compensating controls, and explicit production authority. Security or Project-isolation
controls cannot be waived by a feature flag.

## Related decision

- [ADR 0026: Architecture quality gates](../adr/0026-architecture-quality-gates.md)
- [ADR 0032: Plane-separated modular deployments](../adr/0032-plane-separated-modular-deployments.md)
- [ADR 0035: Privileged production access](../adr/0035-privileged-production-access.md)
