# ADR 0036: Use a governed analytics plane

- **Status:** Accepted
- **Date:** 2026-07-30
- **Owners:** Platform Architecture, Data Governance

## Context

Operational databases are optimized for isolated project transactions. Cross-project
analytics against live stores would bypass workload isolation, create unpredictable
load, and increase privacy exposure.

## Decision

Analytics consumes minimized, versioned events or approved projections into a separate
governed plane. Interactive analytics never performs cross-project scans on operational
databases. Data products declare owner, purpose, classification, residency, retention,
lineage, access policy, and deletion propagation.

Project-level reporting remains project-scoped. Cross-project or platform reporting is
restricted, pseudonymized or aggregated where possible, privacy-reviewed, audited, and
eventually consistent.

## Why this decision

It protects transactional availability and preserves tenant, residency, and lifecycle
controls while enabling future reporting.

## Alternatives considered

- Query replicas directly: rejected because workload and authorization coupling remain.
- Copy every operational table: rejected because it maximizes sensitive-data exposure
  and schema coupling.
- Build no analytics boundary: rejected because reporting demand would otherwise create
  uncontrolled side channels.

## Consequences

Data freshness is explicit rather than immediate. Schema governance, lineage,
reconciliation, and delete propagation become required platform capabilities.

## Validation

Automated lineage and retention checks verify every dataset. Isolation tests prove
project reports cannot observe another project and operational stores reject analytics
identities.

## Revisit when

A project requires strongly consistent reporting and an isolated, bounded operational
read model can satisfy it safely.
