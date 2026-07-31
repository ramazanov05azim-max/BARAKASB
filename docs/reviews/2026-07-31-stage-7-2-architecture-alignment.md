# Stage 7.2 architecture alignment review

- **Date:** 2026-07-31
- **Specification:** BARAKASB Stage 7.2 — Business Environment Generation, sections 1–60
- **Review status:** Implementation blocked by unresolved foundation decisions
- **Code changes:** None

## Executive decision

The Business Environment concept can fit the accepted architecture without a new
deployable, browser shell, composition root, runtime owner, or Solution-specific
dependency.

The correct module owner is `packages/core/solutions-runtime`. Generation must be an
idempotent checkpoint in the accepted Solution installation reconciler and must not run
as a synchronous manager-request transaction. The existing `apps/web` topology remains
unchanged, and Stage 7.3 remains out of scope.

Stage 7.2 cannot yet be implemented to its stated Definition of Done. The repository
defines the required backend boundaries but does not implement them. In particular,
there is no Solution Installation lifecycle, PostgreSQL adapter, migration runner,
transaction/unit-of-work implementation, outbox publisher, audit adapter, observability
bootstrap, or backend composition root. The PostgreSQL access library and migration
tool, and the first queue/event broker, are explicitly blocked open decisions.

A domain-only or in-memory implementation would not satisfy the specification's
persistence, concurrency, migration, recovery, installation-integration, or production
quality gates. Selecting missing providers during Stage 7.2 would violate architecture
governance.

## Sources reviewed

The review covered the complete Stage 7.2 specification, the Master Context, all
accepted and superseded ADRs, the architecture overview, frontend and backend
architecture, module catalog, monorepo architecture, roadmap, Universal Application
architecture, architecture governance, Stage 7.1 alignment review, and the Stage 7.1
implementation.

It also inspected the actual contents and dependency metadata of:

- `packages/core/solutions-runtime`;
- `packages/infrastructure/persistence`;
- `packages/infrastructure/messaging`;
- `packages/infrastructure/observability`;
- `apps/control-plane-api`;
- `apps/control-plane-worker`;
- `apps/data-plane-api`;
- `apps/data-plane-worker`;
- `infra/postgres`;
- the root package manifest and lockfile.

## Conflicts and required resolutions

### S72-001 — The specification assumes an implemented installation lifecycle

- **Specification sections:** 1, 3, 4, 5, 21, 22, 23, 41, 45, 48, 49, 55, 60
- **Conflicting evidence:** `packages/core/solutions-runtime` contains only a README and
  Nx metadata; the API and worker composition roots are also placeholders.
- **Architectural authority:** Module Catalog; Solution Engine; ADR 0024; Roadmap phases
  4 and 5.
- **Why it matters:** There is no authoritative installation aggregate, state store,
  operation ID, checkpoint model, reconciler, fencing mechanism, or completion event
  into which generation can be integrated and tested.
- **Resolution:** Implement the accepted Solution Installation desired/effective-state
  lifecycle first. Add Business Environment generation as a checkpoint owned by
  `core-solutions-runtime`, not as an independent workflow or service.
- **Accountable owner:** Extension Platform.
- **Status:** Blocking.

### S72-002 — The proposed synchronous flow conflicts with the accepted reconciler

- **Specification sections:** 5, 21, 22, 37, 55
- **Conflicting decision:** ADR 0024 explicitly rejects synchronous installation and
  requires a durable, idempotent, checkpointed reconciler with capability activation
  last.
- **Why it matters:** A manager request cannot safely hold a transaction across schema
  checks, backfills, health verification, process restarts, and effective activation.
- **Resolution:** Treat the manager action as a desired-state command. The reconciler
  generates or loads the Business Environment after all prerequisites pass and before
  final capability activation. The final module-local transaction persists the
  environment, installation checkpoint/effective state, outbox records, and audit intent
  owned by `core-solutions-runtime`.
- **Accountable owner:** Extension Platform.
- **Status:** Adaptation defined; implementation depends on S72-001.

### S72-003 — PostgreSQL access and migration technology is intentionally undecided

- **Specification sections:** 18, 19, 22, 25–27, 41, 42, 45–47, 49, 50, 57–60
- **Conflicting evidence:** `packages/infrastructure/persistence` and `infra/postgres`
  contain no implementation. `docs/open-decisions.md` states that PostgreSQL access
  library and migration tool selection is blocked until an owner decision.
- **Architectural authority:** Architecture Governance; Open Decision Register; ADR
  0003; ADR 0009; ADR 0016; ADR 0025; ADR 0027.
- **Why it matters:** Choosing a driver, query layer, transaction model, and migration
  mechanism creates repository-wide coupling and determines whether forced RLS,
  transaction-local Project context, concurrency, and migration safety can be proven.
- **Resolution:** Data Platform must accept the PostgreSQL access and migration decision
  through the governance workflow. Then implement the shared technical plumbing in
  `packages/infrastructure/persistence` while keeping Business Environment repositories
  and migrations owned by `core-solutions-runtime`.
- **Accountable owner:** Data Platform; until assigned, Repository Owner.
- **Status:** Blocking; requires an accepted decision before persistence implementation.

### S72-004 — Transactional outbox and event publication do not exist

- **Specification sections:** 21, 22, 28–30, 37, 41, 45, 47, 49, 50, 55, 58–60
- **Conflicting evidence:** `packages/infrastructure/messaging` is documentation-only,
  and the data-plane worker has no source implementation. The queue/event broker is a
  blocked open decision.
- **Architectural authority:** ADR 0008; ADR 0012; ADR 0023; Events and Jobs; Open
  Decision Register.
- **Why it matters:** Publishing directly after commit can lose an event, while
  publishing before commit can advertise state that rolls back. A mock publisher cannot
  prove restart, replay, cluster, and at-least-once behavior.
- **Resolution:** Accept the first asynchronous integration/broker decision. Implement
  module-owned outbox records committed with Business Environment state, then publish
  them through the existing `infrastructure/messaging` boundary and data-plane worker.
- **Accountable owner:** Platform Reliability and API and Runtime Platform.
- **Status:** Blocking for operational completion.

### S72-005 — The authoritative storage plane for code-only resolution is unspecified

- **Specification sections:** 2, 4, 25–27, 31, 38, 41, 53, 54
- **Conflicting or incomplete architecture:** ADR 0032 separates global control-plane
  workflows from cell-local Project data. Data Architecture requires Project placement
  before a data-plane connection is selected. Stage 7.3, however, must resolve from only
  `BusinessEnvironmentCode`, before `ProjectId` and placement are known.
- **Why it matters:** A code stored only in a Project shard would require cross-shard
  scanning. A global lookup changes credential, privacy, availability, and replication
  boundaries. Choosing the wrong plane now would force the schema redesign forbidden by
  section 53.
- **Resolution:** Extension Platform, Data Platform, and Platform Architecture must
  explicitly approve one authoritative lookup model. The recommended model is a minimal,
  globally addressable control-plane directory owned by `core-solutions-runtime`,
  containing only environment identity and Project/Solution routing identifiers;
  operational Solution data remains cell-local. Stage 7.3 must use that mapping to
  resolve verified Project placement before any data-plane access.
- **Accountable owner:** Platform Architecture, Extension Platform, and Data Platform.
- **Status:** Blocking; an ADR check is required because this may establish a new
  cross-plane data contract.

### S72-006 — Required Project isolation cannot be validated

- **Specification sections:** 3, 25–27, 33, 38, 42, 45, 49, 57–60
- **Conflicting evidence:** Project-scoped persistence, forced RLS, restricted runtime
  roles, transaction-local Project context, and placement-aware connection resolution
  are not implemented.
- **Architectural authority:** ADR 0003; ADR 0019; Data Architecture; Database
  Migrations; Roadmap phase 5 and Foundation Acceptance Gate.
- **Why it matters:** Application filtering and unit tests cannot prove that one Project
  cannot read or mutate another Project's environment, especially through pooled
  connections or retries.
- **Resolution:** Complete the Project persistence/RLS foundation and its two-Project,
  connection-pool leakage, restricted-role, migration, and placement tests before the
  Business Environment repository is considered production-ready.
- **Accountable owner:** Data Platform and Security Architecture.
- **Status:** Blocking for database and integration acceptance.

### S72-007 — Cross-module foreign keys would violate data ownership

- **Specification sections:** 25, 26, 33, 57
- **Conflicting decision:** ADR 0009 and Dependency Rules avoid foreign keys and direct
  SQL across module-owned tables.
- **Why it matters:** A foreign key from the Solution Runtime schema to the Projects
  module would couple migrations, retention, restore, and future extraction.
- **Resolution:** Foreign keys may reference Solution and Installation records only when
  those records are owned in the same `core-solutions-runtime` schema. `ProjectId`
  remains a required scoped identifier validated through a public contract and RLS; it
  must not introduce a cross-module database dependency.
- **Accountable owner:** Platform Architecture and Data Platform.
- **Status:** Adaptation defined.

### S72-008 — Generation timing is internally contradictory

- **Specification sections:** 1, 3, 5, 21, 33, 37, 52, 55
- **Conflict:** Sections 5 and 21 generate before installation completion, section 33
  requires an already completed installation, and section 37 traces installation
  completion before generation. Section 52 says the manager never activates the
  environment.
- **Why it matters:** Different interpretations produce different transaction,
  idempotency, failure, event, and visibility semantics.
- **Resolution:** Use the ADR 0024 interpretation: generation is an idempotent
  penultimate reconciler checkpoint after eligibility and health prerequisites. The
  environment starts as `Provisioning`; the reconciler transitions it to `Active` only
  in the final capability-activation transaction that marks the installation effective.
  Manager responses expose it only after that commit.
- **Accountable owner:** Extension Platform.
- **Status:** Adaptation defined; the Stage 7.2 text should be corrected before coding.

### S72-009 — Deletion conflicts with permanent code non-reuse

- **Specification sections:** 3, 8, 14, 17, 20, 24–26, 28, 45, 47, 50
- **Conflict:** The code must never be reused, but physical deletion would remove the
  unique constraint's memory and allow future regeneration of the same value.
- **Architectural authority:** Data Architecture permits lifecycle retention where
  product, audit, or recovery invariants require it; ADR 0018 requires lifecycle and
  deletion policy.
- **Why it matters:** Application-only checks cannot prevent reuse after deletion,
  backup restoration, concurrent generation, or a process restart.
- **Resolution:** `DeleteBusinessEnvironmentUseCase` must be a lifecycle transition to
  `Deleted`, not physical row deletion. Retain the row or a permanent module-owned code
  reservation tombstone so the database uniqueness guarantee remains authoritative.
- **Accountable owner:** Extension Platform and Data Governance.
- **Status:** Adaptation defined.

### S72-010 — Data classification and audit retention are incomplete

- **Specification sections:** 3, 29, 35, 38, 44, 50, 51
- **Conflicting or incomplete decision:** The specification calls the code “not a
  secret” but restricts production logging and requires the full code in immutable
  audit. ADR 0018 defaults unknown persisted and event fields to Confidential until
  classified and requires a lifecycle ledger.
- **Why it matters:** “Not authentication” does not mean “public.” The code exposes a
  stable Project/Solution locator and will later become an enumeration and abuse target.
- **Resolution:** Until Data Governance classifies it, treat the full code as
  Confidential: redact it from logs and metrics, prohibit it in trace attributes, and
  restrict audit access. Document retention, export, deletion/tombstone, event, backup,
  and support-access behavior before migration approval.
- **Accountable owner:** Data Governance and Security Architecture.
- **Status:** Blocking for migration and production observability approval.

### S72-011 — Manager exposure has no implementable backend convention

- **Specification sections:** 31, 32, 41, 45, 47, 52, 60
- **Conflicting evidence:** `apps/control-plane-api` is a future composition root with
  no controllers, authentication, authorization, error mapping, or persistence wiring.
- **Architectural authority:** Backend Architecture; Module Catalog; ADR 0032; Roadmap
  phases 4 and 5.
- **Why it matters:** Adding an isolated endpoint now would invent transport,
  authorization, and composition conventions that the specification requires it to
  reuse.
- **Resolution:** First establish the accepted control-plane API foundation. Then expose
  a read-only manager projection through a capability-authorized
  `core-solutions-runtime` query contract. Do not expose generation or regeneration
  commands and do not add a Universal Application endpoint in Stage 7.2.
- **Accountable owner:** API and Runtime Platform, Extension Platform, and Security
  Architecture.
- **Status:** Blocking for the Manager Experience requirement.

### S72-012 — The required quality gates have no executable backend harness

- **Specification sections:** 42, 45–47, 49, 50, 56–60
- **Conflicting evidence:** The relevant Nx projects have no build, lint, typecheck, or
  test targets; there is no database test environment, migration runner, restricted
  runtime role, property-test dependency, or concurrency harness.
- **Architectural authority:** ADR 0026; Testing Strategy; Database Migrations; Roadmap
  phases 4 and 5.
- **Why it matters:** Passing the current repository checks would not test any Stage 7.2
  backend behavior and could create false production-readiness evidence.
- **Resolution:** Establish backend targets and production-like PostgreSQL integration
  tests first. The Stage 7.2 gate must include repository contract tests against the
  real adapter, migration replay/rollback evidence, forced-RLS isolation, collision
  concurrency, transaction rollback, outbox recovery, restart replay, and architecture
  dependency tests.
- **Accountable owner:** Platform Engineering, Data Platform, and Extension Platform.
- **Status:** Blocking for Definition of Done.

## Preserved implementation shape

Once the blocking decisions and foundations are complete, Stage 7.2 can proceed without
changing the accepted topology:

```text
Manager command
  -> control-plane desired installation state
  -> durable installation reconciler
  -> core-solutions-runtime application use case
  -> BusinessEnvironment aggregate and code value object
  -> module-owned repository + migration
  -> module-local transaction: environment + installation checkpoint + outbox + audit intent
  -> data-plane outbox publisher
  -> manager-facing read projection after effective activation
```

The implementation belongs under `packages/core/solutions-runtime` using inward
dependencies:

```text
presentation / worker adapter -> application -> domain
database / messaging adapters -> application ports
```

`contracts/platform` should receive only genuinely cross-runtime, transport-neutral
contracts needed by Stage 7.3. It must not own the aggregate, repository, database
record, generator, or installation orchestration.

## Required decisions before implementation resumes

1. Accept the PostgreSQL access library and migration tool decision.
2. Accept the first asynchronous integration and queue/event broker decision, or define
   an already accepted concrete outbox delivery adapter.
3. Approve the authoritative plane and contract for
   `BusinessEnvironmentCode -> ProjectId -> placement` resolution.
4. Approve the Business Environment Code data classification and lifecycle ledger.
5. Implement the Solution Installation reconciler and Project-scoped persistence/RLS
   foundation required by the existing roadmap.
6. Establish executable backend and PostgreSQL quality gates.

No Stage 7.2 application code, migration, dependency, deployable, browser route, or ADR
was created during this review.
