# Definition of Done

A change is done only when applicable items are satisfied.

## Design

- Owning module and public boundary are clear.
- Dependency direction and Project isolation are preserved.
- ADR exists for durable cross-cutting decisions.
- Failure modes, idempotency, compatibility, and rollback are designed.
- Data classification, retention, residency, and placement impact are declared.
- Capacity budget and noisy-neighbor behavior are defined.

## Implementation

- Strict TypeScript passes without suppressed errors.
- Input is runtime-validated at trust boundaries.
- Authorization is server-side and deny-by-default.
- Persistence, cache, events, jobs, objects, and realtime are project-scoped.
- Database and job writes validate placement epoch.
- Authenticated frontend caching is absent or explicitly actor/Project/revision scoped.
- Observability is structured and sensitive data is redacted.

## Verification

- Unit, integration, contract, and isolation tests are added as appropriate.
- A two-Project negative test exists for project-scoped behavior.
- Security-context invalidation and pooled-resource reuse are tested where applicable.
- Migrations are rolling-compatible and tested.
- Format, lint, typecheck, tests, build, dependency scan, and architecture checks pass.

## Delivery

- API/event/manifest docs are updated.
- Operational impact, dashboards, alerts, and runbooks are updated.
- Release and rollback notes are clear.
- No secrets, temporary debug code, demo data, or unrelated changes remain.

## Related decision

- [ADR 0026: Architecture quality gates](../adr/0026-architecture-quality-gates.md)
