# Analytics and reporting

## Boundary

Operational PostgreSQL stores serve isolated transactional workloads. They are not a
cross-project analytics interface. Approved event streams and minimized projections feed
a separate analytics plane with its own identities, quotas, retention, and availability
objectives.

## Governance

Every analytical data product declares:

- accountable owner and documented purpose;
- source contracts and lineage;
- classification, residency, retention, and deletion propagation;
- project, support, and platform-access policy;
- freshness, reconciliation, and quality objectives.

Project reporting remains filtered and authorized by Project. Cross-project analysis is
restricted to approved platform purposes and uses aggregation or pseudonymization when
possible. Small-group disclosure controls are required where aggregation could identify
a Project or person.

## Reliability

Analytics is eventually consistent and must not block project write paths. Consumers are
idempotent, replayable, and able to rebuild projections from governed sources. Backfills
are rate-limited and cannot compete with production transaction capacity.

## Related decisions

- [ADR 0016: Authoritative storage roles](../adr/0016-authoritative-storage-roles.md)
- [ADR 0018: Data classification and lifecycle](../adr/0018-data-classification-lifecycle.md)
- [ADR 0036: Governed analytics plane](../adr/0036-governed-analytics-plane.md)
