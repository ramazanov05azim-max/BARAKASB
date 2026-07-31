# Stage 7.2 foundation decision package

- **Date:** 2026-07-31
- **Status:** Approval proposed; no decision in this package is approved
- **Scope:** Provider and cross-plane decisions required before Stage 7.2
- **Production code changes:** None
- **Accepted ADR changes:** None
- **New BARAKASB applications, deployables, or composition roots:** None

## Purpose and governance

This package contains exactly four approval-ready proposals. It does not create ADRs,
change accepted ADRs, or authorize implementation. If an owner accepts a proposal, its
embedded candidate text can be copied into a separately numbered ADR and reviewed
through Architecture Governance.

The proposals preserve these accepted constraints:

- PostgreSQL remains authoritative for platform and business state.
- Every Project-scoped business table uses forced RLS and verified transaction-local
  Project context.
- Modules own their schemas, migrations, repositories, outbox records, and event
  schemas.
- One transaction writes state and outbox records owned by one module.
- Event delivery is at least once and consumers are idempotent.
- OIDC authenticates identity; BARAKASB remains authoritative for Project membership and
  capabilities.
- Solution Installation and Business Environment identity remain owned by
  `core-solutions-runtime`.
- Control, data, realtime, and extension planes retain the seven accepted composition
  roots.
- Coffee remains a Solution consumer and contributes no platform-specific workaround.

## Evidence baseline

The following repository facts apply to all four proposals:

- Stage 7.2 prerequisite readiness is 17%, with PR-01, PR-02, and PR-11 complete.
- `infrastructure-persistence`, `infrastructure-messaging`, `core-identity`,
  `core-solutions-runtime`, `core-project-placement`, and the backend applications
  relevant to Stage 7.2 are still implementation placeholders.
- The root dependency catalog contains no PostgreSQL driver, query builder, migration
  tool, broker client, OIDC client, or NestJS backend runtime.
- The Business Environment lifecycle ledger classifies the full code and its stable
  identifiers as Confidential and prohibits the code in logs, traces, and metrics.
- The Coffee package has a production repository adapter seam but no backend,
  accounting, installation, Business Environment, or Runtime Context implementation.

Technology capabilities were checked against the official
[node-postgres transaction and pooling documentation](https://node-postgres.com/features/transactions),
[Kysely API documentation](https://kysely-org.github.io/kysely-apidoc/),
[PostgreSQL row-security documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html),
[NATS JetStream consumer documentation](https://docs.nats.io/nats-concepts/jetstream/consumers),
and the
[Keycloak server administration guide](https://www.keycloak.org/docs/latest/server_admin/).
Keycloak SCIM is currently a preview capability and is therefore excluded from the
initial production dependency.

## Decision interaction and order

```text
S72-FD-01 PostgreSQL and migrations
  -> enables authoritative state, RLS, transactions, migration and outbox storage

S72-FD-02 JetStream delivery
  -> enables durable cross-process delivery from committed outbox records

S72-FD-03 Keycloak OIDC
  -> enables trusted ActorContext and manager authorization

S72-FD-04 Code-resolution directory
  -> fixes Stage 7.2 schema ownership and the Stage 7.3 lookup path

All four accepted
  -> implement remaining PR-03 through PR-18 in dependency order
  -> re-run Stage 7.2 entry gate
```

S72-FD-01 is implemented first. S72-FD-02 and S72-FD-03 can then proceed in parallel.
S72-FD-04 schema implementation depends on S72-FD-01, but its approval should occur
before any Business Environment migration is authored.

---

# S72-FD-01 — PostgreSQL persistence and migration stack

## Current repository state

- PostgreSQL is already accepted as the authoritative database by ADR 0016.
- Forced RLS, transaction-local verified Project context, module ownership, module-local
  transactions, and expand/contract migrations are already accepted.
- `infrastructure-persistence` and `infra/postgres` contain documentation only.
- No driver, pool, transaction manager, query layer, migration executor, database roles,
  migration journal, or PostgreSQL test service is implemented.
- The PostgreSQL access library and migration tool remain explicitly open in
  `docs/open-decisions.md`.

## Stage 7.2 prerequisites blocked

Directly blocked:

- PR-03 Project lifecycle;
- PR-04 Project placement;
- PR-05 Verified tenancy;
- PR-06 Authorization persistence;
- PR-07 PostgreSQL access;
- PR-08 Migration execution;
- PR-09 Outbox storage;
- PR-12 Audit persistence;
- PR-13 Backend API composition;
- PR-14 Backend worker composition;
- PR-15 Solution Installation lifecycle;
- PR-17 Manager read path;
- PR-18 Backend verification harness.

PR-10 Messaging delivery is transitively blocked because it requires PR-09 outbox
storage.

## Available options

| Option                                                 | Assessment                                                                                                                                                               |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pg` + Kysely + governed Kysely migration runner       | Strong SQL visibility, typed queries, explicit transactions, PostgreSQL-specific RLS/DDL access, no domain decorators                                                    |
| `pg` + handwritten SQL + fully custom migration engine | Maximum control but duplicates query typing, migration locking, discovery, and execution infrastructure                                                                  |
| Prisma ORM and Prisma Migrate                          | Productive schema tooling, but generated client/schema ownership and implicit ORM conventions conflict with module-owned adapters and explicit RLS transaction control   |
| TypeORM                                                | Familiar NestJS integration, but decorator/entity coupling and runtime metadata would leak persistence concerns toward domain models                                     |
| Drizzle ORM and Drizzle Kit                            | Typed SQL-oriented option, but choosing its schema/migration model would add a second source of schema truth without a demonstrated advantage over the recommended stack |

## Recommended option

Adopt:

1. `pg` (`node-postgres`) as the only PostgreSQL wire driver and pool.
2. Kysely as the typed SQL/query and transaction API inside persistence adapters.
3. Kysely migration primitives behind a BARAKASB-owned migration registry, executor,
   lock, and checksum journal.
4. SQL-first PostgreSQL migrations for RLS, roles, constraints, indexes, triggers, and
   other database-specific behavior.
5. Centrally pinned versions in the root pnpm catalog and compatibility matrix.

The BARAKASB wrapper is not a second ORM or generic repository. It adds only the
accepted platform requirements missing from a general-purpose migration tool:
module-stream ownership, immutable checksums, cell/shard execution records,
expand/contract phase, deployment compatibility, bounded backfill references, and
operator evidence.

## Rejected alternatives

- **Raw `pg` plus a fully custom stack:** rejected because BARAKASB would own avoidable
  query typing and migration mechanics while gaining no additional RLS control.
- **Prisma:** rejected for this foundation because schema/client generation would make
  module ownership, raw PostgreSQL policies, and transaction-scoped context less
  explicit.
- **TypeORM:** rejected because persistence decorators and entity identity are too easy
  to couple to domain models.
- **Drizzle:** rejected as the initial standard because the repository has no existing
  Drizzle investment and its schema tool would not remove the need for a governed
  module/cell migration coordinator.
- **Database-per-Project or schema-per-Project:** already rejected by ADR 0003.
- **ORM migrations as the only schema truth:** rejected because forced RLS, roles,
  grants, online DDL, and operational verification require explicit PostgreSQL SQL.

## Architectural consequences

Positive:

- Type-safe application queries without hiding SQL or PostgreSQL behavior.
- RLS scope and module-local transactions remain explicit and testable.
- Domain/application contracts remain independent of Kysely and `pg`.
- Module-owned SQL remains extraction-friendly and operationally reviewable.

Costs and risks:

- Database row types must be maintained or generated per module and reviewed for drift.
- The platform must implement migration journaling and module-stream coordination.
- Engineers must understand PostgreSQL transactions, RLS, indexes, and query plans.
- Kysely and `pg` upgrades require the central compatibility evidence required by
  ADR 0027.

## Affected Nx projects

Primary:

- `infrastructure-persistence`;
- `infrastructure-config`;
- `toolchain-testing`;
- `core-projects`;
- `core-project-placement`;
- `core-tenancy`;
- `core-access-control`;
- `core-audit`;
- `core-solutions-runtime`;
- `app-control-plane-api`;
- `app-control-plane-worker`;
- `app-data-plane-api`;
- `app-data-plane-worker`.

Infrastructure outside Nx:

- `infra/postgres`.

Coffee is not an affected persistence owner. Future Coffee backend adapters consume the
same platform plumbing while Coffee continues to own its tables and migrations.

## Public contracts

`infrastructure-persistence` may expose provider-neutral technical contracts for:

- `DatabaseConnectionProvider`;
- `TransactionManager` and transaction-scoped `UnitOfWork`;
- `ProjectScopeApplier` and Project-scope assertion;
- stable `DatabaseError` mapping;
- `MigrationDefinition`, `ModuleMigrationStream`, `MigrationRegistry`,
  `MigrationExecutor`, and `MigrationJournal`;
- outbox/inbox storage primitives used by module-owned adapters.

Core modules continue to own their repository and application ports. `pg`, Kysely,
database row types, SQL fragments, pool clients, and migration provider types never
appear in Core domain/application public contracts, `contracts-platform`, REST schemas,
events, or Coffee contracts.

## Dependency direction

```text
Core domain/application
  <- module-owned persistence ports
  <- module infrastructure adapters using infrastructure-persistence
  <- existing app composition roots

pg / Kysely
  -> infrastructure-persistence and module infrastructure adapters only
```

Applications compose Core modules and Infrastructure adapters. Core domain code never
imports `infrastructure-persistence`, `pg`, or Kysely. A module migration stream remains
owned by that module and is registered by the composition root; it cannot modify another
module's objects.

## Deployment impact

- No new BARAKASB application, deployable, or composition root.
- Existing control-plane and cell PostgreSQL deployments receive restricted runtime,
  migration, owner, backup, and read-only operational roles.
- Existing API/worker composition roots each receive bounded pools appropriate to their
  credential and cell scope.
- Pool budgets are global deployment settings, not independently chosen per module.
- Migrations run as a controlled release operation, not automatically from every API
  replica at startup.

## Operational impact

- Monitor pool saturation, checkout time, transaction duration, statement timeout, lock
  wait, deadlock, migration duration, checksum drift, replication lag, and oldest-outbox
  age.
- Set statement, lock, idle-transaction, and connection acquisition timeouts.
- Use graceful pool drain during shutdown.
- Maintain separate runbooks for migration failure, pool exhaustion, stale Project
  scope, RLS denial, and cell recovery.
- PostgreSQL PITR, backup catalog, and selective recovery remain governed by ADR 0030.

## Migration strategy

1. Pin `pg` and Kysely centrally.
2. Implement the pool, transaction, error, and configuration adapters.
3. Provision distinct owner, migrator, restricted runtime, and operational read roles.
4. Implement the migration registry and immutable checksum journal.
5. Create one pilot module migration proving schema ownership and journal behavior.
6. Add Project context functions/settings, `ENABLE ROW LEVEL SECURITY`, and
   `FORCE ROW LEVEL SECURITY`.
7. Prove empty database, existing database, replay, mixed-version, and forward-fix
   behavior.
8. Implement module streams in dependency order.
9. Run canary cell/shard migrations before wider cohorts.
10. Contract obsolete schema only in a later compatible release.

## Testing strategy

- Unit tests for configuration, transaction state, error mapping, and migration
  discovery.
- Repository contract tests against real PostgreSQL.
- Two-Project positive/negative tests using the restricted runtime role.
- Connection-pool leakage tests after commit, rollback, timeout, cancellation, and
  thrown exceptions.
- Forced-RLS and owner/bypass-role negative tests.
- Concurrent transaction, unique collision, optimistic concurrency, and deadlock retry
  tests.
- Migration tests for empty/existing databases, checksum mismatch, replay, lock
  contention, partial failure, mixed application versions, and forward fix.
- Architecture tests proving provider types do not escape adapter boundaries.
- Production build and graceful shutdown tests for every composed backend process.

## Security considerations

- Runtime roles must not own tables, have `BYPASSRLS`, create policies, or run
  migrations.
- All Project-scoped tables require non-null `project_id`, composite constraints,
  enabled and forced RLS, and `WITH CHECK` policies.
- Project scope is applied and asserted on the same checked-out connection and inside
  the same transaction.
- SQL is parameterized; identifiers and DDL come only from reviewed migration code.
- Credentials remain external secret references and are rotated independently.
- TLS is required outside isolated local test networks.
- Database errors, SQL text containing sensitive values, and connection strings are
  redacted from telemetry.

## Implementation sequence

1. `infrastructure-persistence` public technical boundary and Nx quality targets.
2. PostgreSQL local/test roles and service.
3. Pool and transaction adapter.
4. Project-scope/RLS adapter.
5. Migration registry, journal, and executor.
6. PR-07 and PR-08 conformance suites.
7. PR-03 through PR-06 module adapters.
8. PR-09 outbox/inbox storage.
9. PR-12 audit store.
10. Backend composition and downstream Stage 7.2 prerequisites.

## Rollback strategy

- Before production data: remove the adapter wiring and dependency versions normally.
- After compatible expand migrations: roll back application artifacts while retaining
  additive schema.
- Never assume destructive down migrations in production.
- On migration failure: stop the cohort, preserve journal evidence, restore only through
  an approved recovery procedure, or deploy a forward fix.
- Do not drop issued Business Environment codes, outbox records, audit evidence, or
  migration history during rollback.

## Estimated work after approval

- Persistence and migration foundation: 5–8 engineer-weeks.
- Real PostgreSQL conformance harness and role/RLS fixtures: 2–3 engineer-weeks,
  partially parallel.
- PR-03 through PR-09 and PR-12 remain separate module work and are not included in the
  foundation estimate.

## Exact candidate text for a future ADR

```markdown
# ADR NNNN: Use node-postgres and Kysely with governed module migrations

- **Status:** Proposed
- **Date:** 2026-07-31
- **Owners:** Data Platform, Platform Architecture, Security Architecture

## Context

BARAKASB has accepted PostgreSQL as authoritative storage, forced RLS for Project data,
module-owned schemas and migrations, module-local transactions, and expand/contract
fleet migrations. Implementation is blocked until one PostgreSQL access and migration
stack is selected. Provider types must not enter domain or public contracts.

## Decision

Use `pg` as the PostgreSQL wire driver and pool. Use Kysely as the typed SQL and
transaction API inside persistence adapters. Use Kysely migration primitives behind a
BARAKASB-owned registry, executor, lock, and immutable checksum journal that records
module, version, phase, checksum, cell/shard, deployment, duration, and result.

Each module owns one ordered SQL-first migration stream and may change only its database
objects. Composition roots register streams; APIs do not race migrations at startup.
Structural migrations run once per cell/shard using expand/contract. Project backfills
are separate durable, bounded, checkpointed jobs.

Restricted runtime roles do not own tables or bypass RLS. Project scope is applied and
asserted transaction-locally on the same checked-out connection. `pg`, Kysely, database
row types, and SQL provider types remain inside infrastructure adapters.

Versions are pinned in the root compatibility policy.

## Alternatives considered

- Raw `pg` plus a fully custom query and migration stack: rejected because it creates
  avoidable platform tooling.
- Prisma: rejected because generated schema/client conventions reduce explicit module,
  SQL, RLS, and transaction control.
- TypeORM: rejected because decorator entities risk persistence coupling in domain
  models.
- Drizzle: rejected because its schema tooling does not remove the need for the governed
  module/cell coordinator and the repository has no existing investment.

## Consequences

Queries are typed while PostgreSQL behavior remains explicit. The platform must own
migration-stream coordination, checksum evidence, roles, RLS verification, and upgrade
compatibility. Engineers must review SQL and query plans. No new deployable or
composition root is introduced.

## Validation

CI runs real PostgreSQL repository, transaction, forced-RLS, two-Project, pool-leakage,
migration replay/checksum, mixed-version, concurrency, recovery, architecture, and
production-build tests with restricted roles.

## Rollback

Application rollback is allowed only across compatible expanded schema. Production
schema changes are forward-fixed or restored through tested recovery; destructive down
migrations are not assumed safe.
```

---

# S72-FD-02 — Event broker and transactional outbox

## Current repository state

- ADR 0008 already requires a PostgreSQL transactional outbox and idempotent consumers.
- ADR 0023 already requires immutable versioned events and controlled replay.
- `infrastructure-messaging` and the relevant backend workers are placeholders.
- There is no broker client, stream topology, publisher, consumer, inbox, retry,
  dead-letter, or replay implementation.
- PR-09 outbox storage also depends on S72-FD-01.

## Stage 7.2 prerequisites blocked

Directly blocked:

- PR-10 Messaging delivery;
- PR-14 Backend worker composition;
- PR-15 Solution Installation lifecycle;
- PR-18 Backend verification harness.

PR-13 and PR-17 depend on the composed lifecycle and are transitively affected.

## Available options

| Option                             | Assessment                                                                                                                              |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| NATS JetStream                     | Durable streams, acknowledged publication, durable pull consumers, replay, subject-based isolation, modest application complexity       |
| RabbitMQ quorum queues and streams | Mature work queues and routing; replay and long-lived event-stream operation require more topology choices                              |
| Apache Kafka                       | Strong retained log and ecosystem; operational and partitioning cost is disproportionate for the first asynchronous integration         |
| Redis Streams                      | Convenient where Redis already exists, but risks confusing an ephemeral cache/coordination system with the durable event transport role |
| PostgreSQL polling with no broker  | Valid outbox capture mechanism but does not provide the accepted cross-process broker boundary                                          |

## Recommended option

Adopt NATS JetStream as the first event broker:

- PostgreSQL outbox polling remains the baseline source of committed messages.
- Existing control-plane and data-plane workers publish from outboxes owned in their
  respective plane.
- Use JetStream acknowledged publication and durable pull consumers.
- Promise at-least-once delivery only; inbox/idempotency remains authoritative for
  duplicate safety.
- Use file-backed replicated streams with explicit retention, size, age, and message
  limits.
- Use bounded batches, explicit acknowledgements, `MaxAckPending`, delivery attempts,
  backoff, and operator-visible terminal failure handling.
- Use the stable BARAKASB `event_id` as the broker message ID for deduplication
  optimization, never as a replacement for consumer idempotency.
- Keep Project identifiers in the classified event envelope, not in broker subjects or
  metric labels.

## Rejected alternatives

- **RabbitMQ:** not rejected globally, but not selected first because BARAKASB needs
  stream retention, replay, and multiple independently durable consumers in addition to
  job queues.
- **Kafka:** rejected initially because its partition, cluster, and operational model is
  unnecessary before measured throughput or retention demands justify it.
- **Redis Streams:** rejected because ADR 0016 assigns Redis an ephemeral role and
  broker loss must not blur cache and event operations.
- **PostgreSQL-only delivery:** rejected as the final integration boundary; polling is
  retained only between outbox storage and the broker publisher.
- **Direct publication from use cases:** already rejected by ADR 0008.
- **Exactly-once business claims:** rejected because broker deduplication windows and
  acknowledgement protocols do not replace database transactions and idempotent
  consumers.

## Architectural consequences

Positive:

- Durable, replayable, horizontally consumable transport without changing event
  ownership.
- Pull consumers give workers bounded flow control.
- NATS subjects and accounts can isolate planes and environments.

Costs and risks:

- The platform operates or purchases a replicated JetStream service.
- Stream, consumer, retention, and permission configuration become versioned operational
  assets.
- At-least-once handling, poison messages, replay, and lag require runbooks and tooling.
- Broker recovery is not sufficient for business recovery; PostgreSQL remains
  authoritative.

## Affected Nx projects

- `infrastructure-messaging`;
- `infrastructure-persistence`;
- `infrastructure-config`;
- `core-solutions-runtime`;
- `core-projects`;
- `core-audit`;
- `app-control-plane-worker`;
- `app-data-plane-worker`;
- `app-control-plane-api` and `app-data-plane-api` for health only;
- `toolchain-testing`.

No Coffee project imports the NATS client.

## Public contracts

Provider-neutral contracts include:

- versioned `IntegrationEventEnvelope`;
- `EventPublisher`;
- `EventConsumer`/handler registration;
- `DeliveryContext` with event ID, attempt, correlation, and trace context;
- acknowledgement outcome (`processed`, `retry`, `dead-letter`);
- `ReplayRequest`, bounded replay scope, and replay evidence;
- outbox claim/publication and inbox deduplication contracts.

The producing module owns each event name, schema, classification, version, and
compatibility policy. `nats` client types, subjects, stream names, sequence numbers,
acknowledgement objects, and connection types remain inside `infrastructure-messaging`.

## Dependency direction

```text
Producer module
  -> module-owned event schema and outbox intent

Existing worker composition root
  -> infrastructure-persistence outbox adapter
  -> infrastructure-messaging NATS adapter

Consumer module application port
  <- infrastructure-messaging delivery adapter
```

Core and Solution domain code never imports NATS. `contracts-platform` receives an event
schema only when it is genuinely cross-runtime and transport-neutral.

## Deployment impact

- JetStream is an external infrastructure dependency explicitly anticipated by ADR 0016;
  it is not a BARAKASB application or composition root.
- No new Nx project, API, worker, or browser process is introduced.
- Control-plane workers use control-plane accounts/streams and credentials.
- Data-plane workers use cell/region-scoped accounts/streams and credentials.
- Cross-plane events use explicitly allowlisted subjects and least-privilege publisher
  and consumer credentials.

## Operational impact

- Operate at least three replicas for production streams, subject to the future
  orchestrator decision and failure-domain design.
- Monitor publish acknowledgement latency/failure, stream storage, consumer lag,
  redelivery count, terminal deliveries, oldest outbox age, inbox conflict, and replay
  progress.
- Define retention by event class; JetStream is not indefinite audit storage.
- Back pressure must stop or slow outbox claiming before memory or broker limits are
  exhausted.
- Terminal failures remain visible in the stream and an operator-owned dead-letter
  ledger/workflow; they are never silently acknowledged.

## Migration strategy

1. Complete S72-FD-01 and PR-09 outbox storage.
2. Pin the official NATS JavaScript client centrally.
3. Define event envelope and subject/stream naming policy.
4. Provision non-production JetStream accounts, streams, consumers, and credentials.
5. Implement publisher with acknowledged publish and publication checkpoint.
6. Run shadow publication with no business consumers.
7. Add one idempotent internal consumer and inbox.
8. Exercise restart, duplicate, poison, broker outage, retention, and replay behavior.
9. Enable canary consumers and bounded cohorts.
10. Promote production topology only after lag and recovery gates pass.

## Testing strategy

- Contract tests for envelopes, schema versions, classification, and upcasters.
- Outbox atomicity and claim-fencing tests against PostgreSQL.
- Publisher crash tests before publish, after publish/before checkpoint, and after
  checkpoint.
- Broker disconnect, lost acknowledgement, duplicate publish, and multi-worker tests.
- Durable pull-consumer restart, redelivery, backoff, terminal-failure, and inbox tests.
- Per-Project fairness and noisy-Project starvation tests.
- Replay namespace, range, rate, cancellation, and live-side-effect isolation tests.
- Least-privilege NATS account/subject permission tests.
- Architecture tests proving the NATS SDK remains in Infrastructure.

## Security considerations

- Use TLS and workload-specific credentials; no shared administrator credential in
  application processes.
- Separate environments and planes with NATS accounts and allowlisted subjects.
- Minimize and classify event payloads; credentials, tokens, employee secrets, and full
  Business Environment Codes are prohibited.
- Do not place Confidential identifiers in subject names, consumer names, metric labels,
  or ordinary logs.
- Enforce message size limits and schema validation before expensive processing.
- Replay requires privileged, purpose-bound, audited authorization.

## Implementation sequence

1. Event envelope and messaging ports.
2. NATS connection/configuration and health adapter.
3. JetStream topology definitions as versioned infrastructure configuration.
4. Outbox publisher in the existing plane worker.
5. Inbox/idempotent consumer adapter.
6. Retry and terminal-failure workflow.
7. Replay control and evidence.
8. PR-10 and PR-18 conformance suites.
9. Integration into PR-14 and PR-15.

## Rollback strategy

- Stop or roll back consumers first; unacknowledged events remain available.
- Stop publishers if broker behavior is unsafe; committed outbox records remain
  authoritative and unpublished.
- Roll back worker artifacts without deleting outbox rows, inbox rows, streams,
  consumers, or event schemas.
- Resume with the same event IDs after correction.
- If JetStream is unavailable, writes may continue only within bounded outbox capacity
  and declared degradation limits; no direct-publication bypass is allowed.

## Estimated work after approval

- Broker adapter, topology, outbox publisher, inbox, retry, and health: 4–6
  engineer-weeks after PR-09.
- Failure/replay/concurrency harness and operational runbooks: 2–3 engineer-weeks,
  partially parallel.

## Exact candidate text for a future ADR

```markdown
# ADR NNNN: Use NATS JetStream behind the transactional outbox

- **Status:** Proposed
- **Date:** 2026-07-31
- **Owners:** Platform Reliability, API and Runtime Platform, Platform Architecture

## Context

BARAKASB requires asynchronous cross-process delivery, durable workers, retries,
dead-letter handling, replay, and horizontal consumption. PostgreSQL remains
authoritative and ADR 0008 requires state and outbox records to commit atomically.
Selecting a broker must not introduce direct publication or exactly-once business
assumptions.

## Decision

Use NATS JetStream as the first broker. Existing control-plane and data-plane workers
poll their plane-local PostgreSQL outbox and publish with JetStream acknowledgements.
Use replicated file-backed streams, durable pull consumers, explicit acknowledgements,
bounded delivery attempts/backoff, operator-visible terminal failures, and explicit
retention limits.

Delivery semantics are at least once. Consumers are idempotent and use inbox records
when side effects cannot be repeated. `event_id` may enable broker deduplication but
does not replace idempotency. Producers own immutable versioned event schemas; consumers
own upcasters and controlled replay.

NATS SDK types, subjects, streams, and acknowledgements remain inside
`infrastructure-messaging`. No new BARAKASB application or composition root is created.

## Alternatives considered

- RabbitMQ: not selected first because retained replayable streams and independently
  durable consumers are primary requirements.
- Apache Kafka: rejected initially due to disproportionate partition and operational
  cost.
- Redis Streams: rejected because Redis is an ephemeral platform dependency.
- PostgreSQL-only or direct publication: rejected because they do not satisfy the
  accepted broker boundary and crash-safe delivery path.

## Consequences

BARAKASB operates a JetStream infrastructure dependency and versioned stream topology.
Duplicates, lag, poison messages, retention, replay, and broker outage are normal
operational concerns. PostgreSQL outbox state remains the recovery source.

## Validation

CI and failure tests prove atomic outbox writes, multi-worker claims, acknowledged
publication, crash/restart at every checkpoint, duplicate delivery, inbox behavior,
backoff, terminal failure, replay isolation, Project fairness, least-privilege subjects,
and production worker builds.

## Rollback

Consumers and publishers can roll back independently while retaining streams, outbox,
inbox, and schema history. Broker outage never enables direct publication; workers
resume from authoritative outbox checkpoints.
```

---

# S72-FD-03 — OIDC identity integration

## Current repository state

- ADR 0004 already selects provider-neutral OIDC with Authorization Code and PKCE.
- ADR 0017 already requires `apps/web` to act as a confidential BFF with opaque secure
  BARAKASB sessions.
- `core-identity`, backend composition roots, and production BFF authentication are
  placeholders or mock-only.
- No provider is selected and no real `ActorContext`, external identity link, session
  store, token validation, logout, recovery, federation, or step-up flow exists.

## Stage 7.2 prerequisites blocked

Directly blocked:

- PR-06 Authorization, for trusted human `ActorContext`;
- PR-13 Backend API composition;
- PR-17 Manager read path.

PR-15 is affected where manager commands initiate desired installation state. PR-18 must
test the real authentication boundary.

## Available options

| Option                                       | Assessment                                                                                                                |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Keycloak behind the provider-neutral adapter | Standards-based OIDC/SAML brokering, passkeys/WebAuthn, step-up flows, export and deployment control; adds IdP operations |
| Auth0 or Okta managed identity               | Strong managed enterprise features and lower operations; higher vendor and pricing coupling                               |
| ZITADEL                                      | Standards-oriented and portable; smaller operational ecosystem for the current team                                       |
| First-party passwords and MFA                | Full control but explicitly rejected by ADR 0004 without another security decision                                        |
| Social providers directly in BARAKASB        | Does not provide one enterprise federation, recovery, policy, and audit boundary                                          |

## Recommended option

Select Keycloak as the initial OIDC provider behind the existing provider-neutral
adapter:

- Use one BARAKASB production realm per environment/security boundary, not one realm per
  Project.
- `apps/web` is a confidential OIDC client using Authorization Code with PKCE.
- The browser receives only an opaque, Secure, HttpOnly, host-scoped BARAKASB session
  cookie.
- `core-identity` links immutable `(issuer, subject)` identities to BARAKASB Actor IDs
  and owns BARAKASB session/revocation state.
- Email remains contact/recovery metadata and is never an identity-link key.
- Keycloak roles, groups, organizations, and token claims are not authoritative for
  BARAKASB Projects, memberships, or capabilities.
- Enterprise OIDC/SAML federation uses Keycloak identity brokering.
- Passkeys/WebAuthn and step-up authentication are enabled under Security Architecture
  policy.
- Keycloak SCIM remains outside the initial production dependency while the upstream
  feature is preview; SCIM is introduced later through a tested provisioning adapter
  after a separate readiness review.

## Rejected alternatives

- **Auth0/Okta:** not rejected globally, but not selected initially because BARAKASB
  prioritizes data/control portability and provider-operable federation over managed
  convenience and commercial feature coupling.
- **ZITADEL:** not selected because it offers no decisive repository-specific advantage
  over Keycloak for the first integration.
- **First-party credentials:** already rejected by ADR 0004.
- **Provider tokens in browser storage:** already rejected by ADR 0004 and ADR 0017.
- **Keycloak organization/role claims as authorization:** rejected because ADR 0005
  requires current server-side BARAKASB Project policy.
- **Preview SCIM as a production dependency:** rejected until upstream stability,
  compatibility, and provisioning semantics pass review.

## Architectural consequences

Positive:

- Provider-neutral application contracts with a concrete, testable first adapter.
- Standards-based enterprise federation and passkey support.
- BARAKASB retains authoritative Project authorization and revocable application
  sessions.

Costs and risks:

- Keycloak becomes a security-critical external dependency requiring upgrades, backups,
  keys, availability, monitoring, and incident response.
- Authentication availability depends on the IdP for new sessions and step-up flows.
- Account linking, identity brokering, realm migration, and recovery need strict policy.
- SCIM is deferred and cannot be promised by Stage 7.2.

## Affected Nx projects

- `core-identity`;
- `core-access-control`;
- `infrastructure-config`;
- `infrastructure-observability`;
- `core-audit`;
- `app-web`;
- `frontend-auth`;
- `app-control-plane-api`;
- `app-data-plane-api`;
- `app-realtime-gateway` for later connection authentication;
- `toolchain-testing`.

Coffee consumes verified platform identity/capabilities only and does not import
Keycloak SDKs or claims.

## Public contracts

`core-identity` owns provider-neutral contracts for:

- `ExternalIdentity` using issuer and subject;
- `IdentityProviderPort` for authorization callback, token exchange, logout, and
  provider-session revocation;
- `SessionRepository` and opaque `SessionId`;
- `ActorContext` and authentication strength/time;
- identity link/unlink and reauthentication use cases;
- session create, rotate, revoke, and list queries;
- stable authentication error/result contracts;
- security and administrative audit intents.

Provider token DTOs, Keycloak realm/client types, role/group claims, admin API objects,
and SDK errors do not cross the adapter. Project permissions remain in
`core-access-control`.

## Dependency direction

```text
apps/web BFF / backend presentation
  -> core-identity application use cases
  <- Keycloak adapter in the infrastructure edge of existing composition roots

core-access-control
  <- verified ActorId / ActorContext
  -> BARAKASB membership and capability policy
```

Identity never imports Coffee. Access Control does not trust Keycloak roles as Project
permissions. Browser code never receives provider refresh credentials.

## Deployment impact

- Keycloak is the external IdP dependency already required by ADR 0004; it is not a new
  BARAKASB Nx application or composition root.
- No new BARAKASB deployable is introduced.
- Production may use a managed Keycloak-compatible service or a separately operated
  Keycloak cluster under the future orchestrator/IaC decision; either exposes the same
  OIDC contract.
- Existing `apps/web`, control-plane API, data-plane API, and realtime gateway receive
  distinct clients/audiences and least-privilege credentials.
- Signing keys, client secrets, and admin credentials remain external secrets.

## Operational impact

- Monitor discovery/JWKS availability, login success/failure, callback errors, key
  rotation, token validation failures, refresh reuse, session revocation lag, federation
  failures, and step-up completion.
- Back up realm configuration, signing keys according to policy, identity links, and
  session/revocation state.
- Maintain tested realm export/import and version upgrade procedures.
- Define degraded behavior: existing valid BARAKASB sessions may continue within their
  bounded lifetime; new login, recovery, federation, and step-up fail closed during IdP
  outage.
- Keycloak audit signals feed the separate BARAKASB audit model through a classified
  adapter; logs are not audit.

## Migration strategy

1. Pin a supported Keycloak major/minor compatibility range centrally.
2. Define realm, client, redirect, audience, claim, key, and authentication-flow policy
   as versioned configuration.
3. Implement provider-neutral identity/session contracts.
4. Implement the Keycloak adapter and non-production realm.
5. Implement the BFF Authorization Code + PKCE flow and opaque session cookie.
6. Implement issuer/subject identity links and session rotation/revocation.
7. Wire backend token/internal assertion validation and ActorContext creation.
8. Wire capability authorization and audit.
9. Enable passkey, MFA, recovery, and step-up policies through canary accounts.
10. Add enterprise brokering after the base flow is stable.
11. Defer SCIM until the feature is non-preview and separately approved.

No mock account is automatically linked by email. Prototype accounts are not migrated to
production authority without a verified enrollment/linking workflow.

## Testing strategy

- OIDC discovery, state, nonce, PKCE, callback, issuer, audience, signature, expiry,
  authorized-party, and clock-skew tests.
- CSRF, cookie scope, SameSite, fixation, logout, revocation, refresh rotation, and
  reuse detection tests.
- Key rotation and stale-JWKS recovery tests.
- Email collision and explicit identity-link/relink tests.
- Step-up freshness and authentication-strength tests.
- Provider outage and timeout behavior for existing/new sessions.
- Enterprise broker claim minimization and account-linking tests.
- Negative tests proving Keycloak roles/organizations cannot grant Project access.
- Two-Project authorization tests after real authentication.
- Security review, dependency scan, production build, and browser flow E2E tests.

## Security considerations

- Authorization Code with PKCE, exact redirect URI allowlists, state, nonce, and secure
  cookies are mandatory.
- Provider refresh credentials stay server-side and encrypted; browser storage contains
  none.
- Use short-lived audience-bound credentials between BFF and APIs.
- Reject issuer/audience/algorithm confusion and unrecognized key material.
- Rate-limit login, callback, recovery, linking, and invitation endpoints without
  account enumeration.
- Require recent step-up for ownership transfer, code export, destructive Project
  actions, and sensitive security changes.
- Treat identity and session records according to their lifecycle classification.
- Administrative Keycloak APIs are not reachable with application runtime credentials.

## Implementation sequence

1. `core-identity` domain/application/session contracts.
2. Keycloak realm/client configuration baseline.
3. Provider adapter and OIDC conformance fixtures.
4. `apps/web` BFF login/callback/logout/session endpoints.
5. Control-plane API ActorContext validation.
6. Access Control and manager capability enforcement.
7. Session rotation/revocation and audit.
8. Passkey/MFA/step-up flows.
9. Data-plane and realtime audiences.
10. Federation; later SCIM after its separate gate.

## Rollback strategy

- Keep provider-neutral contracts and disable the Keycloak adapter through validated
  configuration only when no production client depends on it.
- During a faulty release, roll back BFF/API artifacts while retaining identity links,
  sessions, audit records, realm configuration, and signing keys.
- Maintain the previous Keycloak version and realm export within the supported upgrade
  window; do not downgrade across incompatible realm/database migrations.
- Emergency provider migration uses dual issuer validation for a bounded transition,
  explicit account relinking where needed, and no email-only merge.
- Revocation and compromised-key response take precedence over session continuity.

## Estimated work after approval

- Identity/session contracts, Keycloak adapter, BFF flow, backend ActorContext, and
  security tests: 5–8 engineer-weeks.
- Production Keycloak HA/IaC, federation, and operational readiness: 3–5
  infrastructure/security engineer-weeks, dependent on the orchestrator decision.
- SCIM is excluded.

## Exact candidate text for a future ADR

```markdown
# ADR NNNN: Use Keycloak as the initial OIDC provider

- **Status:** Proposed
- **Date:** 2026-07-31
- **Owners:** Security Architecture, Identity Platform, Platform Architecture

## Context

BARAKASB has accepted provider-neutral OIDC, a confidential web BFF, opaque application
sessions, and server-side Project capability authorization. Real identity implementation
is blocked until the first provider and federation roadmap are selected.

## Decision

Use Keycloak as the initial OIDC provider behind a provider-neutral `core-identity`
adapter. `apps/web` is a confidential client using Authorization Code with PKCE and
gives the browser only an opaque Secure HttpOnly BARAKASB session cookie.

BARAKASB links external identities by immutable issuer and subject, owns application
session/revocation state, and remains authoritative for Project membership and
capabilities. Email is not an identity key. Keycloak roles, groups, organizations, and
claims never grant BARAKASB Project access.

Use Keycloak identity brokering for enterprise OIDC/SAML federation and Keycloak
WebAuthn/passkey capabilities under Security Architecture policy. SCIM is not an initial
production dependency while the upstream feature is preview; it requires a later
readiness decision.

Keycloak SDK and provider DTOs remain inside adapters. No new BARAKASB application or
composition root is introduced.

## Alternatives considered

- Auth0/Okta: not selected initially because managed convenience adds commercial and
  portability coupling.
- ZITADEL: not selected because it offers no decisive initial advantage for the current
  repository.
- First-party credentials: rejected by the accepted provider-neutral OIDC decision.
- Provider tokens in browser storage: rejected because it expands credential exposure.
- Provider organization/role claims as Project authorization: rejected because current
  BARAKASB policy is authoritative.

## Consequences

Keycloak becomes a security-critical external dependency requiring availability,
upgrade, backup, key, audit, and incident procedures. Provider outage affects new
authentication and step-up. Existing valid BARAKASB sessions may continue only within
their bounded policy lifetime.

## Validation

Security and CI tests cover OIDC discovery, PKCE, state, nonce, issuer, audience,
signature, key rotation, CSRF, cookie scope, session rotation/reuse, revocation,
identity linking, provider outage, step-up, role-claim rejection, two-Project
authorization, and production builds.

## Rollback

Roll back application adapters within a supported provider compatibility window while
retaining identity links, sessions, audit evidence, realm data, and keys. Provider
migration uses bounded dual-issuer validation and explicit relinking; email-only account
merges are forbidden.
```

---

# S72-FD-04 — Authoritative Business Environment Code resolution plane

## Current repository state

- The control plane already owns Solution catalog, desired installation state, Project
  directory, and placement.
- The data plane already owns Project operational execution inside the effective cell.
- `core-solutions-runtime` owns Solution Installation lifecycle and the Business
  Environment concept.
- No Business Environment schema, code directory, resolution contract, placement
  integration, or manager projection exists.
- Stage 7.3 must begin from only `BusinessEnvironmentCode`; a cell-local-only record
  cannot be located without scanning cells.
- The lifecycle ledger requires permanent non-reuse, logical deletion, Confidential
  handling, and consistent recovery.

## Stage 7.2 prerequisites blocked

Directly blocked:

- PR-16 Code-resolution directory model;
- PR-17 Manager read path;
- the final schema/ownership portion of Stage 7.2.

PR-15 Solution Installation lifecycle is blocked where Business Environment identity
becomes the penultimate checkpoint before effective activation. PR-18 must verify the
cross-plane path.

## Available options

| Option                                                                          | Assessment                                                                                     |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Minimal authoritative control-plane directory owned by `core-solutions-runtime` | Resolves the code before Project placement is known and reuses existing control-plane topology |
| Cell-local Business Environment only                                            | Preserves local ownership but requires global shard scanning or an undeclared routing index    |
| New globally distributed KV/directory service                                   | Fast lookup but creates another authoritative store, credential boundary, and deployable       |
| Encode Project/cell/region into the code                                        | Avoids a lookup but leaks routing, couples codes to placement, and cannot safely survive moves |
| Replicated directory with multi-writer authority                                | Adds cross-region conflict and consistency semantics not accepted by current architecture      |

## Recommended option

Create a minimal authoritative control-plane directory:

- Owner: `core-solutions-runtime`.
- Store: the existing control-plane PostgreSQL deployment using S72-FD-01.
- Contents: normalized globally unique code, `BusinessEnvironmentId`, `ProjectId`,
  `SolutionId`, `SolutionInstallationId`, lifecycle status, version, creation/activation
  timestamps, and permanent issued-code reservation state.
- Same-owner foreign keys may reference Solution Runtime installation/catalog records.
  `ProjectId` has no cross-module foreign key.
- The directory does not contain Coffee or other Solution operational data.
- The final Solution Runtime transaction persists the environment/directory record,
  installation checkpoint/effective state, module-owned outbox records, and audit intent
  atomically. The audit intent is a `core-solutions-runtime`-owned record for later
  delivery; the transaction does not write the `core-audit` store.
- Deletion is logical and the code reservation remains permanently non-reusable.
- Resolution returns Project and environment identity only. It then calls the public
  `core-project-placement` resolver for current effective cell and placement epoch.
- Placement is not duplicated as authoritative data in the directory.
- Stage 7.2 exposes only an authenticated, capability-authorized manager query after
  effective activation. Stage 7.3 may add a rate-limited locator flow through existing
  `apps/web`/control-plane API after a separate transport threat review.
- The code is a locator, never authentication or authorization.

## Rejected alternatives

- **Cell-local only:** rejected because code-only lookup cannot choose a cell without
  fan-out.
- **New directory service/KV:** rejected because PostgreSQL and existing control-plane
  composition satisfy the requirement without another authority or deployable.
- **Encoded placement:** rejected because Project moves would invalidate or misroute a
  permanent code and expose infrastructure topology.
- **Directory-owned placement:** rejected because `core-project-placement` is already
  authoritative and duplicate authority would create stale routing.
- **Coffee-owned mapping:** rejected because Business Environment identity must support
  every Solution without Solution-specific platform contracts.
- **Code as credential:** rejected because possession cannot establish Actor, Project,
  device, employee, or capability authority.

## Architectural consequences

Positive:

- Constant-time global code lookup without cell scanning.
- Stage 7.3 can resolve Project identity before selecting the effective data plane.
- Project operational data remains cell-local and Solution-owned.
- No new application, datastore technology, or composition root.

Costs and risks:

- Control-plane lookup availability becomes part of Universal Application connection
  availability.
- The directory contains Confidential stable routing identifiers and requires strict
  access, rate limits, backup, and audit.
- The final activation transaction couples Business Environment identity to Solution
  Runtime installation state, intentionally within one owner.
- Cross-plane calls require explicit failure, timeout, stale-placement, and retry
  semantics.

## Affected Nx projects

- `core-solutions-runtime`;
- `core-project-placement`;
- `infrastructure-persistence`;
- `infrastructure-messaging`;
- `core-audit`;
- `infrastructure-observability`;
- `app-control-plane-api`;
- `app-control-plane-worker`;
- `app-data-plane-api` for later routed execution;
- `contracts-platform` only if Stage 7.3 approves a genuinely cross-runtime minimal
  Runtime Context schema;
- `toolchain-testing`;
- `app-web` only in Stage 7.3, not in Stage 7.2.

Coffee is a consumer of the future resolved Runtime Context and owns no directory code.

## Public contracts

Owned by `core-solutions-runtime`:

- `BusinessEnvironmentDirectory` application port;
- idempotent create/load-by-`SolutionInstallationId`;
- `ResolveBusinessEnvironmentCodeQuery`;
- `GetBusinessEnvironmentForManagerQuery`;
- lifecycle transition and permanent reservation contracts;
- versioned environment-created/activated/archived/deleted integration events.

Owned by `core-project-placement`:

- `ResolveEffectiveProjectPlacementQuery`;
- placement epoch and effective-cell result.

The resolution result contains only the minimum environment/Project/Solution routing
identity and lifecycle/version information. The aggregate, repository, database rows,
generator, installation orchestration, and Project placement records do not move to
`contracts-platform`.

## Dependency direction

```text
Existing control-plane API/worker
  -> core-solutions-runtime resolution/application contracts
  -> core-project-placement public query
  -> composed persistence adapters

Stage 7.3 apps/web BFF
  -> existing control-plane API locator contract
  -> verified placement
  -> existing data-plane API

Coffee and future Solutions
  <- verified minimal Runtime Context
```

`core-project-placement` never imports Solution Runtime. Solution Runtime calls its
public query from application orchestration. No plane imports Coffee.

## Deployment impact

- Uses the existing control-plane PostgreSQL, control-plane API, and control-plane
  worker.
- Uses existing data-plane APIs only after placement resolution.
- Adds no application, deployable, composition root, database technology, or browser
  shell.
- Control-plane runtime credentials can access only the Solution Runtime directory and
  required public placement query; data-plane credentials cannot scan the directory.
- Optional caches are derived, bounded, and fail closed; they are never authoritative.

## Operational impact

- Monitor resolution latency/availability, uniform not-found rate, abuse/rate-limit
  outcomes, activation-to-visibility lag, uniqueness collisions, stale lifecycle
  results, placement lookup failures, and directory/installation reconciliation.
- Never use the full code, Project ID, or environment ID as a metric label.
- Backups and restores must preserve environment, installation, reservation, outbox,
  audit intent, and migration journal consistency.
- Control-plane incident procedures must distinguish locator unavailability from
  data-plane unavailability.
- Placement moves require no code rewrite; the next resolution obtains the current
  placement epoch.

## Migration strategy

There is no production Business Environment data to migrate.

1. Complete S72-FD-01.
2. Add the Solution Runtime control-plane schema through expand migration.
3. Add same-owner installation references, globally unique normalized code constraint,
   unique `SolutionInstallationId`, lifecycle/version constraints, and permanent
   reservation semantics.
4. Add restricted roles and manager/read resolution indexes.
5. Implement the repository and resolution ports.
6. Integrate the penultimate reconciler checkpoint.
7. Shadow-check directory/installation consistency before visibility.
8. Enable manager reads after effective activation.
9. Enable Stage 7.3 locator transport only in its own reviewed rollout.

After the first code is issued, the directory and reservation cannot be removed by a
normal rollback. Changes are forward-compatible and forward-fixed.

## Testing strategy

- Property and collision tests for normalized code generation.
- Concurrent repeated generation with one row/code per `SolutionInstallationId`.
- Database uniqueness as the authoritative collision arbiter.
- Transaction failure at every environment/installation/outbox/audit checkpoint.
- Restart, retry, multi-instance, fencing, and replay tests.
- Logical delete, permanent non-reuse, archive, restore, and backup recovery tests.
- Confidential redaction tests across logs, traces, metrics, events, errors, and manager
  output.
- Resolution tests for active, provisioning, archived, deleted, unknown, malformed, and
  rate-limited codes using uniform safe errors.
- Placement move/failover tests proving the permanent code resolves the new effective
  cell and stale epochs cannot write.
- Negative tests proving possession of a code grants no Project capability.
- Architecture tests proving no Coffee dependency and no cross-module SQL/foreign key.

## Security considerations

- Treat the full code as Confidential according to the existing lifecycle ledger.
- Use cryptographically secure generation and sufficient entropy; database uniqueness
  remains authoritative.
- Normalize once under a versioned code-format contract before storage and lookup.
- Encrypt PostgreSQL storage and backups at rest and TLS in transit.
- Restrict full-code reads to authorized manager/application flows and restricted audit.
- Redact the code from logs and errors; prohibit it in traces, metrics, URLs,
  environment variables, and browser bundles.
- Apply input length/format limits, uniform not-found behavior, rate limits, anomaly
  detection, and enumeration protection.
- Revalidate identity, Project authority, installation lifecycle, and placement before
  operational access.

## Implementation sequence

1. Accept S72-FD-01 and create the control-plane persistence foundation.
2. Implement PR-15 Solution Installation lifecycle up to the pre-activation checkpoint.
3. Implement directory schema, code value object/generator, repository, and reservation.
4. Implement atomic environment/checkpoint/outbox/audit-intent transaction.
5. Implement resolution query and placement orchestration.
6. Implement manager read projection through the existing control-plane API.
7. Implement events through S72-FD-02.
8. Pass PR-18 concurrency, recovery, isolation, placement, and architecture suites.
9. Re-run the Stage 7.2 gate.
10. Stage 7.3 later adds the reviewed locator transport and Runtime Context consumer.

## Rollback strategy

- Before any production code issuance: disable the feature and retain or later contract
  additive schema.
- After issuance: never drop directory/reservation rows or regenerate codes.
- Roll back application artifacts only while they can read the expanded schema.
- Disable manager/locator exposure independently from authoritative persistence.
- On corrupt deployment, stop generation, preserve issued rows and outbox/audit
  evidence, reconcile by `SolutionInstallationId`, and forward-fix.
- Restore directory, installation, reservation, outbox, and audit checkpoints to a
  consistent recovery point; never restore one independently.

## Estimated work after approval

- Directory domain/application, schema, repository, placement orchestration, manager
  query, and tests: 4–6 engineer-weeks after S72-FD-01 and PR-15 foundations.
- Stage 7.3 transport and Universal Application integration are excluded.

## Exact candidate text for a future ADR

```markdown
# ADR NNNN: Resolve Business Environment Codes through a control-plane directory

- **Status:** Proposed
- **Date:** 2026-07-31
- **Owners:** Platform Architecture, Extension Platform, Data Platform, Security
  Architecture

## Context

Stage 7.3 must begin with only a Business Environment Code, before Project identity and
placement are known. Cell-local-only storage would require shard scanning. Encoding
placement in a permanent code would break Project moves. A new directory service would
add an unnecessary authoritative store and deployable.

## Decision

`core-solutions-runtime` owns a minimal authoritative Business Environment directory in
the existing control-plane PostgreSQL deployment. It stores globally unique normalized
code, environment identity, Project ID, Solution ID, Solution Installation ID,
lifecycle/version, timestamps, and permanent non-reuse reservation state. It contains no
Solution operational data.

The final Solution Runtime transaction persists the environment/directory record,
installation checkpoint/effective state, module-owned outbox records, and audit intent.
The audit intent remains owned by Solution Runtime until it is delivered to Core Audit;
the transaction does not write another module's store. Deletion is logical and issued
codes remain permanently reserved. Same-owner foreign keys may reference Solution
Runtime records; Project ID has no cross-module foreign key.

Code resolution returns minimum environment and Project routing identity, then calls the
public Project Placement query for the current effective cell and placement epoch. The
directory does not become authoritative for placement. The code is a Confidential
locator and never authentication or authorization.

Stage 7.2 exposes only an authenticated capability-authorized manager query after
effective activation. A Stage 7.3 locator transport requires its own threat and contract
review through existing `apps/web` and control-plane/data-plane composition roots.

## Alternatives considered

- Cell-local-only storage: rejected because code-only resolution cannot select a cell.
- A new distributed KV/directory service: rejected because it adds authority,
  credentials, and a deployable without need.
- Encode Project/cell/region in the code: rejected because it leaks and couples
  placement.
- Duplicate placement in the directory: rejected because Project Placement is already
  authoritative.
- Coffee-owned resolution: rejected because Business Environment identity is
  Solution-neutral.

## Consequences

Control-plane lookup availability becomes part of connection availability. The directory
contains Confidential stable routing identities and requires strict access, rate limits,
audit, backup, recovery, and redaction. Operational Solution data remains cell-local. No
new application, deployable, composition root, or storage technology is introduced.

## Validation

Tests prove concurrent idempotent generation, global uniqueness, permanent non-reuse,
logical deletion, transaction rollback, restart/replay, placement move/failover, uniform
safe lookup errors, code redaction, authorization independence, recovery consistency,
and no Coffee or cross-module database dependency.

## Rollback

Before issuance, exposure may be disabled and additive schema retained. After the first
code is issued, directory and reservation rows are permanent; application rollback must
remain schema-compatible and defects are reconciled or forward-fixed without
regeneration.
```

## Concise approval table

| Decision identifier | Recommended choice                                                                   | Prerequisites unlocked                                                 | Owner approval required                                                         | Implementation order |
| ------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------- | -------------------- |
| S72-FD-01           | `pg` + Kysely + governed Kysely migration runner                                     | PR-03–PR-09, PR-12–PR-15, PR-17, PR-18; PR-10 transitively             | Data Platform, Platform Architecture, Security Architecture                     | 1                    |
| S72-FD-02           | NATS JetStream behind PostgreSQL transactional outbox                                | PR-10, PR-14, PR-15, PR-18                                             | Platform Reliability, API and Runtime Platform, Platform Architecture           | 2A                   |
| S72-FD-03           | Keycloak behind provider-neutral OIDC/BFF adapter                                    | PR-06, PR-13, PR-17; PR-15 and PR-18 identity paths                    | Security Architecture, Identity Platform, Platform Architecture                 | 2B                   |
| S72-FD-04           | Minimal authoritative `core-solutions-runtime` directory in control-plane PostgreSQL | PR-16, PR-17, final Stage 7.2 schema; PR-15 and PR-18 resolution paths | Platform Architecture, Extension Platform, Data Platform, Security Architecture | 3                    |
