# BARAKASB Architecture Validation Report

- **Review date:** 2026-07-30
- **Review authority:** Enterprise Architecture Review Board
- **Scope:** repository structure, all ADRs and documentation, Core/Solution/Plugin
  boundaries, security, data, API, deployment, operations, testing, and evolution
- **Decision:** **Conditionally approved as an implementation foundation**

The target architecture is suitable for a ten-year product lifecycle provided the P0
implementation gates in this report are completed before production. This is not an
approval to deploy the current repository: it intentionally contains architecture and
documentation, not a running product.

## Executive scorecard

| Dimension                   |      Score | Board assessment                                                                                                               |
| --------------------------- | ---------: | ------------------------------------------------------------------------------------------------------------------------------ |
| Architecture Maturity Score | **93/100** | Decisions, ownership, boundaries, and evolution paths are explicit and traceable                                               |
| Production Readiness        | **72/100** | Design is production-oriented; executable security, recovery, capacity, and operational evidence does not exist yet            |
| Scalability Score           | **91/100** | Cells, placement fencing, plane separation, quotas, and fleet migration address growth without premature service fragmentation |
| Security Score              | **93/100** | Defense in depth covers identity, capabilities, RLS, supply chain, privileged access, objects, audit, and extension isolation  |
| Maintainability Score       | **94/100** | Explicit package taxonomy, module ownership, ADR governance, and quality gates control architectural drift                     |
| Extensibility Score         | **92/100** | Versioned manifests, desired state, compatibility locks, trust tiers, and isolated execution provide a durable extension model |

Scores describe the documented target state. Production readiness cannot exceed the
available implementation evidence.

## Scope and method

The board reviewed every ADR and Markdown document, all project metadata, workspace
configuration, dependency-zone definitions, and the reserved Solution and Plugin areas.
Automated checks validate file links, ADR index/map coverage, required ADR sections,
architecture-document traceability, project identity/tags, reserved-zone rules, and the
absence of business implementation.

Priority meanings: **P0** blocks production or the first feature implementation, **P1**
must be resolved before the affected capability ships, and **P2** is planned hardening.
Cost is an implementation estimate: **XS** up to 2 days, **S** 3–5 days, **M** 1–3
weeks, **L** 1–2 months, **XL** more than 2 months or multiple teams.

## Findings and required treatment

| ID   | Problem                                                                                  | Why it matters                                               | Future impact                                           | Recommended solution                                                                                            | Priority | Estimated implementation cost | Architecture status                                    |
| ---- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | -------- | ----------------------------- | ------------------------------------------------------ |
| F-01 | One API/worker topology mixed global, tenant, realtime, and extension trust              | Credentials, failure modes, and scaling signals differ       | Large incidents and over-privileged workloads           | Separate control, data, realtime, and extension planes while keeping modules inside each plane                  | P0       | L, 1–2 months                 | Resolved by ADR 0032 and repository refactor           |
| F-02 | Generic `shared` packages had ambiguous dependency direction                             | Shared zones become dumping grounds                          | Hidden coupling and costly extraction                   | Split side-effect-free Contracts from technical Infrastructure adapters                                         | P0       | S, 3–5 days                   | Resolved by ADR 0038 and repository refactor           |
| F-03 | Package isolation was presented as sufficient for external extensions                    | In-process code inherits host memory and credentials         | One malicious Plugin could compromise a cell            | Use trust tiers and out-of-process runner with scoped tokens and hard quotas                                    | P0       | XL, multi-team                | Architecture resolved by ADR 0033; implementation gate |
| F-04 | Plugin-to-Solution targeting was not machine-enforced                                    | A Plugin could drift into Core or another Solution           | Product graph becomes cyclic and unextractable          | Require one target Solution in manifest/metadata and validate name, scope, and dependency graph                 | P0       | S, 3–5 days                   | Checker strengthened                                   |
| F-05 | API, event, extension, and fleet support windows were incomplete                         | Non-atomic upgrades need predictable compatibility           | Permanent legacy or breaking customer upgrades          | Maintain a compatibility registry, explicit majors, SemVer ranges, exact digest locks, and sunset policy        | P0       | M, 1–3 weeks                  | Resolved by ADR 0034                                   |
| F-06 | Privileged human, migration, runtime, and recovery access was underspecified             | RLS can be bypassed by database owners and operators         | Cross-project disclosure and unaudited changes          | Use separate identities, JIT grants, dual approval, recorded sessions, and no laptop-to-production DB path      | P0       | L, 1–2 months                 | Resolved by ADR 0035; implementation gate              |
| F-07 | Cross-project analytics had no explicit boundary                                         | Reporting can bypass isolation and overload OLTP             | Privacy leakage and unpredictable shard load            | Build a governed, eventually consistent analytics plane from minimized events/projections                       | P1       | XL, multi-team when needed    | Resolved by ADR 0036                                   |
| F-08 | Webhook and provider integration rules were scattered                                    | External inputs combine replay, SSRF, secret, and retry risk | Domain coupling and security incidents grow by provider | Use provider-neutral ports and controlled inbound/outbound adapters with delivery ledgers and egress policy     | P1       | L, 1–2 months                 | Resolved by ADR 0037                                   |
| F-09 | Application-level project filters could be mistaken for isolation                        | One omitted predicate exposes another Project                | Catastrophic tenant breach                              | Force RLS, composite project constraints, restricted roles, scoped transactions, and two-Project negative tests | P0       | L, 1–2 months                 | ADR 0003 retained; executable proof required           |
| F-10 | Connection-pool reuse can retain tenant session state                                    | Incorrect reset leaks project context between requests       | Intermittent cross-tenant access                        | Use transaction-local scope, reset tests, pool hooks, and fail-closed repository APIs                           | P0       | M, 1–3 weeks                  | Documented; implementation gate                        |
| F-11 | A global control plane can become a shared blast radius                                  | Placement and policy are prerequisites for safe writes       | Global outage despite healthy data cells                | Isolate control queues, use signed expiring snapshots, reserve capacity, and fail uncertain writes closed       | P0       | L, 1–2 months                 | Architecture resolved; resilience tests required       |
| F-12 | Project movement/failover can create split brain                                         | Old workers and routes may continue writing                  | Silent divergent business data                          | Carry and validate a monotonic placement epoch on requests, jobs, events, and writes                            | P0       | L, 1–2 months                 | ADR 0011 retained; drills required                     |
| F-13 | Horizontal application scaling can exhaust database connections                          | Replica autoscaling is not database scaling                  | Cascading shard outages                                 | Budget connections by cell/workload, pool externally, cap autoscaling, and test skewed load                     | P0       | M, 1–3 weeks                  | Documented; capacity evidence required                 |
| F-14 | Outbox/backfill workloads can starve interactive Projects                                | A few tenants or fleet jobs can monopolize workers           | Latency spikes and long recovery queues                 | Partition fairly, bound batches, apply per-project concurrency, lag SLOs, and backpressure                      | P1       | M, 1–3 weeks                  | ADR 0008 retained; implementation gate                 |
| F-15 | Desired extension state can diverge after partial failure                                | Install/upgrade spans several owners without ACID            | Stuck or partially enabled extensions                   | Use fenced, idempotent reconciliation with checkpoints, observed state, cohorts, and kill switch                | P0       | L, 1–2 months                 | ADR 0024 retained                                      |
| F-16 | Solution and Plugin resource isolation lacked a common budget model                      | Valid code can still become a noisy neighbor                 | One Project degrades a cell                             | Define CPU, queue, storage, connection, invocation, and payload budgets by extension and Project                | P1       | M, 1–3 weeks                  | Strengthened by ADR 0033                               |
| F-17 | Deprecation could occur without consumer evidence                                        | Unknown consumers make removal unsafe                        | Dead APIs persist indefinitely                          | Publish deprecation/sunset metadata, measure usage, provide migration guide, and test current/previous majors   | P1       | M, 1–3 weeks                  | Resolved by ADR 0034                                   |
| F-18 | Event meaning can drift even if schemas remain readable                                  | Replay reinterprets history incorrectly                      | Corrupt projections and irreproducible audit            | Keep event meaning immutable, version schemas, use consumer upcasters and golden replay fixtures                | P0       | M, 1–3 weeks                  | ADR 0023 retained                                      |
| F-19 | Authenticated framework/CDN caches can omit actor or Project scope                       | Cache keys become a tenant side channel                      | Cross-user or cross-project response leakage            | Disable authenticated caching by default and prove every exception with isolation tests                         | P0       | S, 3–5 days                   | ADR 0014 retained                                      |
| F-20 | WebSocket delivery can be mistaken for a durable source                                  | Disconnects and fan-out loss are normal                      | Missing updates and unbounded connection state          | Send bounded at-least-once notifications with sequence/gap detection and REST recovery                          | P1       | M, 1–3 weeks                  | ADR 0022 retained; gateway separated                   |
| F-21 | Data deletion/restoration spans DB, cache, objects, events, logs, and analytics          | Deleting only primary rows is incomplete                     | Regulatory and customer trust failure                   | Maintain lifecycle ledger, retention matrix, legal holds, tombstones, and downstream deletion verification      | P0       | L, 1–2 months                 | ADR 0018 retained and analytics extended               |
| F-22 | Direct object availability creates a malware window                                      | Authorization alone does not make uploaded bytes safe        | Customer compromise and data exfiltration               | Quarantine, validate, scan, promote atomically, and reauthorize every download                                  | P0       | M, 1–3 weeks                  | ADR 0019 retained                                      |
| F-23 | Signed artifacts without provenance and revocation remain risky                          | A trusted key can sign vulnerable or replaced bytes          | Supply-chain compromise across fleet                    | Bind digest, SBOM, provenance, publisher, policy, and revocation into catalog admission                         | P0       | L, 1–2 months                 | ADR 0013 retained                                      |
| F-24 | Sampled telemetry cannot serve as security evidence                                      | Logs can drop or be modified by application roles            | Incident reconstruction and compliance fail             | Separate immutable audit with sequence integrity, WORM sink, redaction, and access policy                       | P0       | L, 1–2 months                 | ADR 0020 retained                                      |
| F-25 | Architectural checks are local scripts, not yet a protected CI gate                      | Rules can be bypassed accidentally                           | Documentation and dependency drift                      | Run architecture, format, link, contract, and graph checks as required protected-branch jobs                    | P0       | S, 3–5 days                   | Remaining technical debt                               |
| F-26 | No runtime or infrastructure exists to prove the target design                           | Documentation cannot demonstrate enforcement                 | Production approval would be evidence-free              | Implement a thin platform skeleton and executable isolation/recovery tests before any business module           | P0       | XL, multi-team                | Intentional Phase 2 blocker                            |
| F-27 | Runtime and dependency versions will age                                                 | Ten-year support needs continuous upgrades                   | Security exposure and expensive leap upgrades           | Use central policy, automated update cohorts, compatibility tests, and scheduled upgrade budget                 | P1       | M setup, ongoing              | ADR 0027 retained                                      |
| F-28 | Documentation can become inconsistent after refactors                                    | New developers act on obsolete topology                      | Architecture exists only in tribal knowledge            | Keep one index/decision map, link checks, required sections, ownership, and review cadence                      | P1       | S, 3–5 days                   | Checker and governance strengthened                    |
| F-29 | OIDC provider, database library, broker, cloud, and extension license policy remain open | Vendor choices change operations and contracts               | Late selection can force redesign                       | Resolve each open decision with evidence and an ADR before dependent implementation                             | P0       | M–L per group                 | Explicit open-decision debt                            |
| F-30 | Multi-region recovery is designed but unproven                                           | Fencing, snapshots, and restore plans can fail together      | Extended outage or split brain                          | Define RPO/RTO, automate restore, and run cell/region game days before production                               | P0       | L–XL                          | Remaining implementation gate                          |

## Architecture changes performed

- Replaced the two-process backend target with seven least-privilege composition roots.
- Renamed `apps/api` and `apps/worker` to cell-scoped data-plane applications.
- Added control-plane API/worker, realtime gateway, and extension-runner boundaries.
- Replaced `packages/shared` with explicit `packages/contracts` and
  `packages/infrastructure` zones.
- Added extension trust tiers, compatibility lifecycle, privileged access, analytics,
  and integration boundary decisions.
- Strengthened plugin target metadata and reserved-zone enforcement.
- Updated current-state documentation while preserving superseded ADR history.

No business logic, business Solution, feature, or UI was introduced.

## Technical debt

### Accepted implementation debt

The repository is an architecture foundation. It deliberately lacks NestJS/Next.js
source, schemas, Terraform, pipelines, dashboards, runbooks backed by real systems, and
load/recovery evidence. This is not hidden debt; it is the next gated platform-skeleton
milestone.

### Open decision debt

Provider-specific choices remain open for OIDC, PostgreSQL access/migration tooling,
broker/queue, cloud and regions, observability backend, secret manager, object scanning,
extension licensing, and project-specific encryption. These choices must not be made
inside feature work.

### Residual architecture risk

The highest residual risks are correctness of PostgreSQL RLS with pooling, placement
fencing during regional failure, isolated extension execution, privileged recovery, and
compatibility governance across a mixed-version fleet. Each has a P0 evidence gate.

## Top 20 recommendations before implementation

1. Make `architecture:check`, formatting, link, dependency-graph, and secret scans
   required protected-branch checks.
2. Implement composition manifests and tests proving each application loads only its
   allowlisted modules and credentials.
3. Build the PostgreSQL RLS harness first, including pool-reuse and two-Project negative
   tests under the real restricted runtime role.
4. Produce a data-flow threat model for control, data, realtime, extension, analytics,
   and privileged-access boundaries.
5. Create the machine-readable compatibility registry and contract-diff policy before
   the first endpoint or event.
6. Select the OIDC provider and document issuer, audience, MFA, lifecycle, outage, and
   key-rotation behavior in an ADR.
7. Select PostgreSQL access and migration tooling only after proving transaction-local
   tenant scope and `FORCE RLS`.
8. Implement separate workload identities and secrets for every deployment plane.
9. Define service authentication, audience restriction, and transport encryption for all
   cross-plane calls.
10. Prototype placement routing and epoch fencing under stale cache, delayed job, cell
    move, and regional failover.
11. Define the canonical signed Solution/Plugin manifest and deployment-lock schemas.
12. Threat-test an extension-runner prototype for secret, filesystem, network,
    cross-project, and resource escape.
13. Establish cell/shard connection, queue, storage, realtime, and extension capacity
    budgets before autoscaling.
14. Implement outbox/inbox idempotency, fairness, poison-message handling, and replay
    controls.
15. Automate backup, isolated Project restore, audit reconciliation, and measured
    RPO/RTO drills.
16. Implement immutable audit export and privileged-access evidence before operator
    tooling.
17. Test authenticated frontend/BFF caches with two actors and two Projects at every
    cache layer.
18. Validate realtime reconnect storms, revocation, sequence gaps, and REST recovery.
19. Create the data classification, retention, residency, lineage, and deletion
    registries before storing customer data.
20. Hold a production Architecture Review Board gate with threat, isolation, capacity,
    migration, rollback, restore, and failover evidence before launch.

## Final board position

The architecture now has coherent dependency direction, explicit trust boundaries,
tenant and extension isolation, scalable deployment planes, bounded compatibility, and
an auditable evolution model. It is approved to proceed to a **platform-skeleton
implementation only**. Business modules remain blocked until the P0 foundation checks
relevant to their data and execution paths are executable and passing.
