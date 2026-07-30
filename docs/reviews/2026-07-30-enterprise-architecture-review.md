# Enterprise architecture review — 2026-07-30

## Scope

This review evaluates the Phase 1 foundation against isolation, scalability, security,
evolvability, operability, and enforceability. It reviews architecture only; no business
capability is evaluated or introduced.

## Executive assessment

The initial architecture has sound product boundaries, sensible modular-monolith
economics, and strong project-isolation intent. Its principal weakness was that several
essential guarantees were described but not yet precise or executable. The most serious
risks were authenticated frontend cache bleed, connection-pool leakage of database
scope, lack of a Project placement/routing model, and an incomplete extension artifact
trust chain.

This review closes the design gaps that can be resolved in Phase 1 and records
implementation gates for risks that require executable proof.

## Findings

| ID     | Severity | Finding                                                                                                | Scaling/security impact                                                                              | Resolution                                                                                                                         |
| ------ | -------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| EAR-01 | Critical | RLS did not specify pool-safe scope setup and reset                                                    | A leaked session setting can expose another Project; transaction pooling can break assumptions       | Require restricted roles, `FORCE RLS`, transaction-bound `SET LOCAL`, scope assertion, and pool-leak tests                         |
| EAR-02 | Critical | Next.js authenticated cache behavior was underspecified                                                | A server/render cache key omission can return one Project's data to another                          | Default authenticated/project data to uncached; require explicit actor/project/authz revision cache keys and switch invalidation   |
| EAR-03 | Critical | Sharding was mentioned without authoritative Project placement                                         | Scale-out or regional routing would create split-brain and ad hoc data location logic                | Add Project Placement Core module, control/data-plane split, home region, epoch, and single-writer routing                         |
| EAR-04 | Critical | Signed extension manifests lacked a trust root, artifact binding, revocation, and deployment handshake | A valid-looking manifest could load altered or revoked code; web/server versions could diverge       | Define immutable artifact digest, signature chain, SBOM/provenance, revocation, compatibility lock, and fail-closed handshake      |
| EAR-05 | High     | Nx tags were documentation, not an executable gate                                                     | Architectural erosion would be detected only in review                                               | Add a structural architecture checker and workspace command                                                                        |
| EAR-06 | High     | Transaction ownership was ambiguous across modules                                                     | Cross-module ACID coupling would prevent extraction and make failure behavior opaque                 | Limit transactions to one owning module; use process managers/outbox across write owners                                           |
| EAR-07 | High     | Outbox design omitted retention, fairness, hot partitions, and CDC thresholds                          | A large Project could starve others; outbox tables and polling could become a bottleneck             | Add shard-local partitioning, fair claims, bounded batches, archival, lag SLOs, and CDC migration triggers                         |
| EAR-08 | High     | Solution/Plugin migrations were modeled as a simple install step                                       | Thousands of Project installations could cause fleet-wide lock contention and unsafe partial rollout | Separate structural migrations from per-Project reconciliation; use cohorts, checkpoints, budgets, and pause/rollback controls     |
| EAR-09 | High     | Authorization invalidation and TOCTOU semantics were incomplete                                        | Permission removal could race with writes or remain effective in caches and sockets                  | Add membership/policy revisions, transaction-time checks for sensitive writes, and invalidation acknowledgement targets            |
| EAR-10 | High     | Project deletion conflicted with shared immutable backups                                              | Claims of deletion could be impossible to satisfy promptly or prove                                  | Add data classification, retention ledger, backup expiry, legal holds, deletion evidence, and optional per-Project key destruction |
| EAR-11 | High     | Next.js BFF/session boundary was not explicit                                                          | Duplicate session logic or token forwarding could expand credential exposure                         | Define web BFF as confidential client, cookie ownership, CSRF rules, and on-behalf-of API contract                                 |
| EAR-12 | High     | WebSocket scale and revocation fan-out lacked design                                                   | Membership revocation might not reach every node; slow clients could exhaust memory                  | Add connection registry partitioning, revision events, bounded buffers, backpressure, and disconnect rules                         |
| EAR-13 | High     | Extension lifecycle lacked desired-state reconciliation and dependency ordering                        | Node restarts and partial failure could leave Projects in divergent versions                         | Use desired/effective state, monotonic operation IDs, dependency DAG, reconciliation, and compatibility epochs                     |
| EAR-14 | High     | No formal data classification or residency policy existed                                              | Controls, retention, logs, encryption, and regional placement could be applied inconsistently        | Add classification/lifecycle architecture and residency attributes to placement                                                    |
| EAR-15 | Medium   | Context relationships were implicit                                                                    | Teams could create cyclic synchronous dependencies and duplicate concepts                            | Add a bounded-context map and collaboration patterns                                                                               |
| EAR-16 | Medium   | API idempotency semantics were incomplete                                                              | Concurrent retries could duplicate writes or return inconsistent responses                           | Specify claim state, request hash, response replay, TTL, and conflict behavior                                                     |
| EAR-17 | Medium   | Event evolution/replay governance was incomplete                                                       | Replay after schema or authorization changes could corrupt projections                               | Add schema registry ownership, upcasters at consumers, replay isolation, quotas, and completion evidence                           |
| EAR-18 | Medium   | Object lifecycle did not cover multipart upload and quarantine races                                   | Unscanned content could be served or abandoned uploads could leak cost                               | Define upload session, checksum, quarantine, promotion, expiry, and authorization recheck                                          |
| EAR-19 | Medium   | Capacity and production readiness gates were generic                                                   | Scaling failure would be found in production without budgets or load envelopes                       | Add readiness review, per-component budgets, load profiles, and ownership                                                          |
| EAR-20 | Medium   | Framework layering could become ceremonial                                                             | Excess indirection would slow delivery without improving boundaries                                  | Clarify that Clean Architecture folders are conditional; boundaries and ports are required only around real volatility/I/O         |
| EAR-21 | Medium   | Redis coordination wording could imply correctness-critical locks                                      | Failover/lease expiry can violate mutual exclusion                                                   | Forbid Redis locks as the sole protection of business invariants                                                                   |
| EAR-22 | Medium   | Global control-plane blast radius was not modeled                                                      | A control-plane outage could block all Projects or create inconsistent writes                        | Define cached read-only placement/config snapshots, fail-closed writes, and cell-level failure containment                         |
| EAR-23 | Medium   | Intentionally unresolved technology and policy choices were not tracked                                | Teams could make incompatible local choices without an ADR                                           | Add an owned open-decision register with decision gates                                                                            |
| EAR-24 | Medium   | Dependency/framework compatibility and upgrade policy was implicit                                     | Independent upgrades could break Next/Nest/TypeScript contracts or delay security patches            | Add compatibility-matrix ownership, update classes, evidence, and rollback policy                                                  |

## Scalability pressure points

### Database

RLS policy evaluation, connection budgets, large project-skewed indexes, outbox growth,
and per-Project lifecycle operations are the earliest likely pressure points. Scale is
handled by project-leading indexes, bounded connections, shard-local processing,
placement-based routing, and explicit Project move workflows—not transparent cross-shard
queries.

### Extensions

The number of Project installations grows faster than the number of extension packages.
Reconciliation, configuration revisions, migrations, health, and compatibility therefore
operate as a fleet control problem with cohorts and budgets.

### Realtime and caches

Connection count, slow consumers, permission-revision propagation, and high-cardinality
invalidation dominate before raw message throughput. Realtime is lossy notification
delivery with authoritative REST recovery.

### Multi-region

Active-active writes for one Project would introduce conflict resolution into every
domain. The platform therefore uses one home region/writer per Project and supports
regional failover by advancing a fencing epoch.

## Residual risks

Documentation cannot prove:

- that the runtime database role truly cannot bypass RLS;
- that framework caches never omit security context;
- that policy invalidation reaches every transport in time;
- that migration and restore procedures work at production volume;
- that artifact verification is correctly implemented.

These remain release-blocking implementation tests and production-readiness evidence,
not assumptions.

## Result

The findings are incorporated into the architecture documents, ADRs, module catalog,
roadmap, Definition of Done, and structural workspace validation.
