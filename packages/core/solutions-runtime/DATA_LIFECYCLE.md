# Solution Runtime data lifecycle ledger

## Scope

This ledger applies ADR 0018 to Solution catalog, installation, and Business Environment
identity data owned by `core-solutions-runtime`. It does not select a database library,
migration tool, message broker, telemetry backend, audit backend, or authoritative
storage plane.

Unknown or newly added fields remain Confidential until this ledger is reviewed by Data
Governance.

## Business Environment field classification

| Field                                                 | Classification | Purpose                                              | Disclosure rule                                                              |
| ----------------------------------------------------- | -------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------- |
| `BusinessEnvironmentId`                               | Confidential   | Stable aggregate identity                            | Authorized platform operations only                                          |
| `BusinessEnvironmentCode`                             | Confidential   | Future code-only environment lookup                  | Full value only to authorized manager/application flows and restricted audit |
| `ProjectId`                                           | Confidential   | Project ownership and routing                        | Verified Project-scoped or privileged control-plane operations only          |
| `SolutionId`                                          | Internal       | Identifies the installed Solution catalog entry      | Authenticated platform use                                                   |
| `SolutionInstallationId`                              | Confidential   | Idempotency and lifecycle ownership                  | Authorized installation operations only                                      |
| `Status`                                              | Internal       | Provisioning, Active, Archived, or Deleted lifecycle | Authenticated platform use                                                   |
| `CreatedAt`, `ActivatedAt`, `ArchivedAt`, `DeletedAt` | Internal       | Lifecycle evidence and ordering                      | Authenticated platform use                                                   |
| `Version`                                             | Internal       | Optimistic concurrency                               | Internal platform use                                                        |

The code is not a password, bearer token, authentication factor, or authorization grant.
That does not make it Public.

## Authoritative and derived copies

| Copy                              | Purpose                                        | Allowed fields                                                    | Lifecycle                                                                      |
| --------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Authoritative module record       | Environment lifecycle and ownership            | Complete aggregate                                                | Retained through lifecycle; deletion is logical                                |
| Permanent issued-code reservation | Enforce global non-reuse                       | Code and minimal issuance identity                                | Retained indefinitely because non-reuse is a permanent invariant               |
| Transactional outbox              | Reliable integration-event publication         | Minimum versioned event payload                                   | Retained until confirmed publication plus the approved outbox retention window |
| Broker event                      | Deliver immutable integration fact             | Minimum consumer-required fields                                  | Governed by the accepted broker retention policy                               |
| Manager read projection           | Show post-installation environment information | Authorized summary and full code when required                    | Removed or minimized with authoritative lifecycle state                        |
| Diagnostic log                    | Operational diagnosis                          | Result, operation, retry, correlation; never full code            | Governed by diagnostic telemetry policy                                        |
| Trace                             | Cross-process diagnosis                        | Correlation and safe lifecycle attributes; never full code        | Governed by trace policy                                                       |
| Metric                            | Aggregated operations                          | Bounded result, operation, status and failure class               | Never contains code, Project ID, installation ID, actor ID, or user ID         |
| Audit record                      | Administrative and security evidence           | Stage 7.2 minimum audit fields, including full code when required | Append-only; governed by Core Audit retention and immutable export policy      |
| Backup                            | Recovery of authoritative state                | Encrypted store copy                                              | Expires through the platform backup catalog and deletion evidence              |

The authoritative storage plane and cross-plane lookup contract remain unresolved under
S72-005. No schema or migration may be created from this ledger until that decision is
accepted.

## Collection and generation

- The platform generates the code using cryptographically secure randomness.
- The code is generated once for one `SolutionInstallationId`.
- User input, employee data, credentials, device secrets, and business payloads are not
  collected by Business Environment generation.
- Collision candidates that fail the authoritative uniqueness constraint are discarded
  and never emitted.

## Access

- Manager access requires authenticated identity, verified Project context, and an
  explicit Solution Installation read capability.
- Stage 7.3 resolution will treat the code as a locator only; it cannot establish actor,
  Project, device, or employee authority.
- Support access follows privileged-production-access policy and is attributable.
- Runtime roles cannot update or delete append-only audit records.

## Logging, tracing, and metrics

- The full code is redacted from structured logs.
- The full code is prohibited in trace attributes and span events.
- The full code and all unbounded identities are prohibited as metric labels.
- Errors contain stable error codes and correlation identifiers, not database errors,
  credentials, or raw infrastructure exceptions.
- Audit is separate from diagnostic telemetry and is never sampled.

## Export

- An authorized manager export may include the full code only when the export purpose
  requires reconnecting the Business Environment.
- General portfolio, analytics, support, and operational exports omit or mask the code.
- Events and exports carry only fields required by their declared consumer and purpose.
- Export does not change the code's Confidential classification.

## Archival and deletion

- `Archive` changes lifecycle state and does not release the code.
- `Delete` changes lifecycle state to `Deleted`; it is not a physical row deletion.
- The issued code is never reused.
- Project deletion removes or minimizes derived copies through the platform deletion
  workflow while preserving the minimum permanent code reservation required to prevent
  reuse.
- A permanent reservation cannot be used to resolve, reactivate, authenticate, or
  authorize a deleted environment.

## Residency and encryption

- Authoritative and derived copies follow the Project residency and approved
  control/data-plane placement decision.
- Data is encrypted in transit and at rest by platform infrastructure.
- The code is not placed in URLs, source control, container images, browser bundles, or
  environment-variable values.
- Project-level envelope encryption or crypto-shredding is not assumed until its open
  decision is accepted.

## Recovery

- PostgreSQL recovery must preserve environment records, issued-code reservations,
  aggregate versions, and publication checkpoints consistently.
- Restore and event replay cannot generate a new code for an existing
  `SolutionInstallationId`.
- Recovery evidence includes uniqueness, idempotency, Project isolation, and outbox
  reconciliation.

## Ownership and review

| Concern                                        | Accountable owner        |
| ---------------------------------------------- | ------------------------ |
| Aggregate and event minimization               | Extension Platform       |
| Classification, retention, export and deletion | Data Governance          |
| Redaction and privileged access                | Security Architecture    |
| PostgreSQL, backup and recovery                | Data Platform            |
| Telemetry and immutable audit export           | Reliability and Security |

Review this ledger before:

- adding or changing a persisted field or event attribute;
- accepting the authoritative code-resolution plane;
- approving the Business Environment migration;
- exposing a new API, export, projection, or support workflow;
- changing archival, deletion, backup, or audit behavior.
