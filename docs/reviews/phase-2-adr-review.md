# Phase 2 ADR review

The Enterprise Architecture Review Board challenged every ADR against a ten-year
lifecycle. “Retain” means the decision remains sound; “strengthened” means current-state
documentation or a later complementary ADR closes a gap. ADR 0002 remains immutable
history and is superseded.

| ADR  | Verdict            | Challenge                                                   | Board resolution                                                                                            |
| ---- | ------------------ | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 0001 | Retain             | Can one repository scale to many teams?                     | Nx ownership and affected graphs are appropriate until independent release ownership is measured.           |
| 0002 | Supersede          | One API/worker mixes trust and scale.                       | ADR 0032 separates planes while retaining modular internals.                                                |
| 0003 | Conditional retain | Can developers or DB owners bypass tenant filters?          | Forced RLS, composite keys, restricted roles, pool tests, and ADR 0035 privileged separation are mandatory. |
| 0004 | Retain             | Does provider neutrality omit operational identity detail?  | Keep neutral contract; require a provider-specific ADR before implementation.                               |
| 0005 | Retain             | Can stale roles authorize sensitive writes?                 | Revisioned capabilities and in-transaction revalidation remain required.                                    |
| 0006 | Strengthened       | Are contracts enough to isolate executable extensions?      | ADR 0033 adds runtime trust isolation; ADR 0034 adds compatibility governance.                              |
| 0007 | Retain             | Is WebSocket being treated as authoritative?                | ADR 0022 explicitly makes REST the recovery source.                                                         |
| 0008 | Conditional retain | Can outbox scale fairly and replay safely?                  | Require bounded batching, per-project fairness, idempotency, lag SLOs, and controlled replay.               |
| 0009 | Retain             | Will a shared cluster become a distributed monolith?        | Module ownership, no cross-owner joins, and shard routing preserve extraction.                              |
| 0010 | Strengthened       | Does “first party” remain safe over product life?           | Trusted execution is ownership/policy based; external code uses ADR 0033.                                   |
| 0011 | Conditional retain | Can failover or moves create split brain?                   | Placement epoch is mandatory on requests, jobs, events, and write transactions.                             |
| 0012 | Retain             | Are module-local transactions too restrictive?              | Durable workflows are the correct long-term replacement for hidden cross-owner ACID.                        |
| 0013 | Retain             | Is signature verification sufficient?                       | Digest, provenance, SBOM, policy, and revocation are jointly required.                                      |
| 0014 | Retain             | Can Next.js/CDN caching leak identity context?              | Authenticated caching remains off by default; exceptions require isolation evidence.                        |
| 0015 | Retain             | Will Clean Architecture create ceremony?                    | Selective DDD and rejection of pass-through abstractions keep cost proportional.                            |
| 0016 | Retain             | Are Redis and objects accidentally authoritative?           | Explicit storage roles and recovery sources remain sound.                                                   |
| 0017 | Retain             | Does the BFF create CSRF/session concentration risk?        | Opaque cookies are preferable; CSRF, rotation, audience, and revocation tests are required.                 |
| 0018 | Strengthened       | Does lifecycle cover downstream analytics and exports?      | ADR 0036 extends lineage and deletion propagation to analytics.                                             |
| 0019 | Retain             | Is upload authorization enough?                             | Quarantine and promotion correctly remove the pre-scan availability window.                                 |
| 0020 | Retain             | Can sampled logs support audit?                             | Separate immutable audit remains mandatory.                                                                 |
| 0021 | Retain             | Do retries and concurrent writes remain safe?               | Scoped idempotency plus optimistic concurrency is appropriate; operations must declare semantics.           |
| 0022 | Retain             | Can reconnect storms or gaps lose state?                    | Bounded notifications, sequence gaps, backpressure, and REST recovery remain correct.                       |
| 0023 | Retain             | Can schema compatibility hide semantic drift?               | Immutable event meaning and consumer upcasters are the correct model.                                       |
| 0024 | Retain             | Can partial install leave mixed state?                      | Desired/effective reconciliation, fencing, checkpoints, and cohorts remain required.                        |
| 0025 | Retain             | Can fleet migrations lock all Projects?                     | Expand/contract plus bounded Project cohorts is appropriate.                                                |
| 0026 | Strengthened       | Are declared quality gates actually enforced?               | The checker is expanded; protected CI remains a P0 implementation gate.                                     |
| 0027 | Retain             | Will central versions block independent extension upgrades? | Platform internals stay lockstep; extension compatibility is separated by ADR 0034.                         |
| 0028 | Retain             | Can config drift or secret leakage reach runtime?           | Typed startup validation and external secret references remain sound.                                       |
| 0029 | Retain             | Can environment rebuilds change bytes?                      | Build-once promotion and provenance are required for reproducibility.                                       |
| 0030 | Retain             | Can restoring one Project overwrite neighbors?              | Restore to isolation, verify, then selectively merge is the safe model.                                     |
| 0031 | Retain             | Does Project lifecycle require distributed transactions?    | Durable idempotent orchestration with compensation is correct.                                              |
| 0032 | Accept             | Does plane separation over-fragment operations?             | Seven roots correspond to real trust/scale boundaries; bounded contexts remain modular, not services.       |
| 0033 | Accept             | Can external code ever safely share a process?              | No general safe assumption exists; isolated execution is required.                                          |
| 0034 | Accept             | Is a twelve-month compatibility floor sustainable?          | It balances customer migration with bounded legacy; exceptions are explicit.                                |
| 0035 | Accept             | Can emergency access work without standing privilege?       | JIT, dual approval, recorded sessions, and rehearsed tooling provide the safer path.                        |
| 0036 | Accept             | Could analytics use replicas instead of a new plane?        | Replicas retain workload and privacy coupling; governed projections are safer.                              |
| 0037 | Accept             | Is an integration gateway premature?                        | The adapter boundary is mandatory; a separate service remains evidence-driven.                              |
| 0038 | Accept             | Is removing `shared` merely naming?                         | No: explicit zones create enforceable dependency direction and ownership.                                   |

## Board conditions

- Superseded ADRs are retained for history and are not referenced as current design.
- Conditional decisions require executable evidence before production.
- Provider selections and any exception to these decisions require a new ADR.
