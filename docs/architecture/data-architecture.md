# Data architecture

## Systems of record

- PostgreSQL is authoritative for platform and business state.
- Object storage is authoritative for binary objects referenced by PostgreSQL.
- Redis is ephemeral: cache, distributed coordination, rate limiting, presence, and
  short-lived delivery state.
- The event broker, when introduced, transports facts but is not the primary business
  database.

## PostgreSQL ownership

Each module owns a schema namespace and migration stream. Table names are snake_case;
identifiers are UUIDv7 where ordering benefits indexes. Timestamps are UTC
`timestamptz`. Monetary values use integer minor units plus ISO currency, unless a
Solution ADR requires arbitrary precision.

Project-scoped tables include `project_id`, `created_at`, and `updated_at`. Audited
mutable records use optimistic concurrency through a version column.

Operational indexes for Project-scoped access normally lead with `project_id` and then
the query's selective or ordering columns. Index selection is justified by measured
plans under RLS and realistic Project-size skew. Unbounded list queries are forbidden.

Soft deletion is used only when product, audit, or recovery requirements demand it. It
is not a default substitute for lifecycle modeling.

## Migrations

Migrations are forward-only in production and owned by one module. They are:

- deterministic and repeatable in clean environments;
- backward-compatible during rolling deployments;
- separated into expand, backfill, verify, and contract stages;
- exercised against production-like data volume;
- observable and safely resumable for long backfills.

See [Database migrations](../operations/migrations.md).

## Redis

Key format:

```text
barakasb:{environment}:{projectId}:{module}:{purpose}:{key}
```

Global keys replace `projectId` with `global`. Cache entries have explicit TTLs and
versioned payloads. Correctness cannot depend on cache presence.

## Object storage

Object keys begin with:

```text
projects/{projectId}/{module}/{objectId}/{version}
```

Clients receive short-lived signed URLs only after authorization. Object references,
content type, checksum, size, lifecycle, and scan status are stored in PostgreSQL.
User-provided filenames are metadata, not trusted paths.

## Data lifecycle

Every module documents retention, archival, export, and deletion semantics. Project
deletion is an asynchronous, auditable state machine that covers PostgreSQL, Redis,
object storage, search indexes, analytics projections, backups, and pending messages.

## Placement and sharding

Repositories obtain a data-plane connection from the Project Placement contract, never
from a global default pool. A placement record selects cell, shard, and fencing epoch.
Application APIs do not expose physical shard identifiers.

Shard-local connection budgets are enforced per API and worker instance. Scaling
instances without a connection budget is forbidden. Pool saturation, queueing time, and
per-Project query cost are capacity signals.

Structural migrations run once per shard. Project-specific data transformations run as
resumable jobs in controlled cohorts. Cross-shard joins and transactions are forbidden.

## Related decisions

- [ADR 0003: Project isolation](../adr/0003-project-isolation.md)
- [ADR 0009: Shared database and module ownership](../adr/0009-shared-database-module-ownership.md)
- [ADR 0016: Authoritative storage roles](../adr/0016-authoritative-storage-roles.md)
- [ADR 0025: Expand/contract fleet migrations](../adr/0025-expand-contract-fleet-migrations.md)
