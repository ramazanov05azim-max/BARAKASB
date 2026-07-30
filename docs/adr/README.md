# Architecture Decision Records

ADRs capture durable decisions whose rationale would otherwise be lost.

The [Architecture decision map](../architecture/decision-map.md) is the canonical
traceability view from each decision to its rationale and current design documents.
Architecture documents describe the current state; accepted ADRs explain how and why
that state was selected.

## Status lifecycle

`Proposed -> Accepted -> Superseded` or `Rejected`

Accepted ADRs are immutable except for typo/link fixes. A changed decision gets a new
ADR that links to and supersedes the old one.

An accepted ADR is normative until superseded. A point-in-time architecture review may
identify a problem, but it changes the platform only after an ADR and the current
architecture documents are updated.

## When an ADR is required

- cross-cutting architecture or trust-boundary changes;
- module ownership or dependency direction;
- persistence, tenancy, authentication, or authorization strategy;
- public API, event, Solution, or Plugin compatibility policy;
- new infrastructure or deployment topology;
- deliberate exception to an established rule.

Copy [the template](template.md), assign the next four-digit number, and use a short
kebab-case name.

Every ADR identifies context, decision drivers, the decision, why it was selected,
alternatives, consequences, validation, and revisit triggers. Older accepted ADRs may
express rationale through Context plus Alternatives; the decision map summarizes the
same rationale consistently.

## Decision index

| ADR                                                 | Decision                                              | Status     |
| --------------------------------------------------- | ----------------------------------------------------- | ---------- |
| [0001](0001-pnpm-nx-monorepo.md)                    | pnpm and Nx monorepo                                  | Accepted   |
| [0002](0002-modular-monolith.md)                    | Modular monolith backend                              | Superseded |
| [0003](0003-project-isolation.md)                   | Project isolation with PostgreSQL RLS                 | Accepted   |
| [0004](0004-oidc-authentication.md)                 | Provider-neutral OIDC authentication                  | Accepted   |
| [0005](0005-capability-authorization.md)            | Capability authorization with project RBAC and policy | Accepted   |
| [0006](0006-solution-plugin-contracts.md)           | Contract-based Solution and Plugin engines            | Accepted   |
| [0007](0007-rest-websocket-contracts.md)            | REST primary API and scoped WebSocket delivery        | Accepted   |
| [0008](0008-transactional-outbox.md)                | Transactional outbox and idempotent consumers         | Accepted   |
| [0009](0009-shared-database-module-ownership.md)    | Shared PostgreSQL cluster with module data ownership  | Accepted   |
| [0010](0010-first-party-extensions-only.md)         | First-party extension execution initially             | Accepted   |
| [0011](0011-project-placement-single-writer.md)     | Project placement with one writable home region       | Accepted   |
| [0012](0012-module-local-transactions.md)           | Module-local write transactions                       | Accepted   |
| [0013](0013-extension-artifact-trust.md)            | Digest-bound extension artifact trust                 | Accepted   |
| [0014](0014-authenticated-cache-isolation.md)       | Authenticated frontend cache isolation                | Accepted   |
| [0015](0015-clean-architecture-selective-ddd.md)    | Clean Architecture with selective DDD                 | Accepted   |
| [0016](0016-authoritative-storage-roles.md)         | Explicit authoritative roles for storage systems      | Accepted   |
| [0017](0017-confidential-web-bff.md)                | Confidential web BFF and opaque browser sessions      | Accepted   |
| [0018](0018-data-classification-lifecycle.md)       | Classified data lifecycle and residency               | Accepted   |
| [0019](0019-quarantined-object-ingestion.md)        | Quarantined object-ingestion lifecycle                | Accepted   |
| [0020](0020-opentelemetry-and-separate-audit.md)    | OpenTelemetry with a separate immutable audit trail   | Accepted   |
| [0021](0021-api-idempotency-concurrency.md)         | API idempotency and optimistic concurrency            | Accepted   |
| [0022](0022-websocket-notification-semantics.md)    | WebSocket notifications with REST recovery            | Accepted   |
| [0023](0023-event-evolution-and-replay.md)          | Consumer-owned event evolution and controlled replay  | Accepted   |
| [0024](0024-extension-desired-state.md)             | Desired-state extension reconciliation                | Accepted   |
| [0025](0025-expand-contract-fleet-migrations.md)    | Expand/contract and cohort-based fleet migrations     | Accepted   |
| [0026](0026-architecture-quality-gates.md)          | Executable architecture and isolation quality gates   | Accepted   |
| [0027](0027-central-runtime-version-policy.md)      | Central runtime compatibility and dependency policy   | Accepted   |
| [0028](0028-validated-config-external-secrets.md)   | Validated runtime configuration and external secrets  | Accepted   |
| [0029](0029-build-once-promote-artifacts.md)        | Build once and promote immutable artifacts            | Accepted   |
| [0030](0030-pitr-isolated-project-recovery.md)      | PITR and isolated selective Project recovery          | Accepted   |
| [0031](0031-durable-project-lifecycle.md)           | Durable Project lifecycle orchestration               | Accepted   |
| [0032](0032-plane-separated-modular-deployments.md) | Plane-separated modular deployments                   | Accepted   |
| [0033](0033-extension-execution-isolation.md)       | Isolated non-platform extension execution             | Accepted   |
| [0034](0034-contract-compatibility-versioning.md)   | Contract compatibility and versioning                 | Accepted   |
| [0035](0035-privileged-production-access.md)        | Just-in-time privileged production access             | Accepted   |
| [0036](0036-governed-analytics-plane.md)            | Governed analytics plane                              | Accepted   |
| [0037](0037-integration-boundaries.md)              | Isolated external integration boundaries              | Accepted   |
| [0038](0038-explicit-package-taxonomy.md)           | Explicit contract and infrastructure package zones    | Accepted   |
