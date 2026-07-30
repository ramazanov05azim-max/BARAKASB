# Deployment and scalability

## Environments

Development, test, staging, and production use separate accounts/projects, networks,
credentials, databases, buckets, Redis namespaces, and encryption keys. Production data
is never copied to lower environments without an approved sanitization process.

## Components

- Next.js web instances are stateless.
- Control-plane and data-plane API instances are stateless and scale independently.
- Control-plane and data-plane workers scale by workflow, queue, and job class.
- Realtime gateways scale by connection and fan-out budgets.
- Extension runners scale by trust tier and resource quota.
- PostgreSQL uses managed backups, point-in-time recovery, replicas, and connection
  pooling.
- Redis is treated as disposable and configured for the durability needed by each
  non-authoritative use.
- Object storage uses versioning, lifecycle policies, and restricted service identities.

Deployments are grouped into cells described in
[Control plane and data plane](control-plane-and-data-plane.md). A cell has explicit
connection, worker, storage, realtime, and extension capacity budgets.

## Availability

Health endpoints distinguish liveness, readiness, and dependency degradation.
Deployments use rolling or canary strategies with backward-compatible migrations. A
release has automated rollback for application artifacts; data rollback uses explicit
migration/recovery procedures.

## Scaling model

The first scaling dimensions are:

1. independent web, control, data, realtime, and extension-plane replicas;
2. database connection pooling and query/index optimization;
3. cache and read models for measured hot paths;
4. partitioning large tables by project hash or time;
5. moving a Project to a database shard behind the persistence routing port;
6. extracting a bounded context only when extraction criteria are met.

Project IDs are present in all persistence and messaging contracts so physical sharding
can be introduced without changing domain APIs.

## Regional consistency

Each Project has one writable home region. General active-active writes are rejected
because they would force conflict semantics into every domain. Regional failover
advances a placement fencing epoch before the target accepts writes.

Read replicas are used only by queries with declared staleness tolerance. Membership,
authorization, placement, ownership, and read-after-write queries use strongly
consistent paths.

Control-plane degradation has explicit behavior:

- writes requiring uncertain placement or policy fail closed;
- data-plane operations may use a non-expired signed placement/policy snapshot;
- Core administration remains reachable in a safe degraded mode;
- one cell failure does not exhaust global control-plane workers or queues.

## Reliability targets

Service-level objectives must be agreed before production launch. At minimum, define
availability, latency, error-rate, queue-lag, recovery-point, and recovery-time
objectives. Alerts are derived from user-visible SLO burn rates, not raw infrastructure
thresholds alone.

## Capacity safeguards

Per-project quotas, request limits, job concurrency, storage limits, circuit breakers,
and backpressure prevent one Project from exhausting shared resources. Limits are
observable and return stable errors.

Capacity reviews model both average traffic and skew: one large Project, synchronized
jobs, extension rollout waves, reconnect storms, cache loss, shard failover, and
control-plane recovery. Autoscaling is constrained by downstream connection and queue
budgets.

## Related decisions

- [ADR 0032: Plane-separated modular deployments](../adr/0032-plane-separated-modular-deployments.md)
- [ADR 0011: Project placement](../adr/0011-project-placement-single-writer.md)
- [ADR 0025: Fleet migrations](../adr/0025-expand-contract-fleet-migrations.md)
