# Control plane and data plane

## Separation

The **control plane** owns identity links, Project directory, membership policy,
extension catalogs, desired installation state, and Project placement.

The **data plane** executes project-scoped commands and queries against the Project's
assigned cell. A cell has independently scalable data API, data worker, and realtime
gateway workloads plus PostgreSQL shard, Redis namespace/cluster, object-storage
placement, and telemetry boundary. Extension runners are isolated cell-adjacent
workloads and never receive direct data-store credentials.

Control-plane availability must not silently route writes with stale placement.
Data-plane reads may use signed/versioned snapshots where policy allows.

## Project placement record

Each Project has an authoritative placement record:

```text
project_id
cell_id
home_region
data_residency_policy
placement_epoch
state
desired_placement
effective_placement
updated_at
```

`placement_epoch` is a fencing token. Every write path, job, event consumer, and Project
move checks the current epoch. An old cell cannot accept writes after the epoch
advances.

## Request routing

1. Edge/BFF resolves Project ID from the canonical route.
2. Placement router obtains a signed/versioned placement record.
3. Request is routed to the effective cell.
4. The cell verifies Project ID, cell ID, and placement epoch before opening the unit of
   work.
5. Authorization and RLS execute inside the selected cell.

Placement caches use short TTL plus event-driven invalidation. Cache uncertainty fails
writes closed; it never guesses another cell.

## Regional model

A Project has one writable home region. Read replicas may serve explicitly
stale-tolerant queries, but authorization-sensitive or read-after-write paths use the
writer.

Failover is an orchestrated state machine:

```text
freeze writes -> confirm replication/recovery point -> advance epoch
-> promote target -> update placement -> invalidate routes -> resume writes
```

This avoids general active-active conflict resolution in business domains.

## Project move

Moves are resumable and audited:

1. create target and begin snapshot/copy;
2. continuously replicate changes;
3. verify counts, checksums, RLS, objects, and lag;
4. freeze or buffer writes within an agreed window;
5. advance epoch and switch effective placement;
6. observe, then retire source after rollback window.

Jobs and events in flight carry the old epoch and are rejected or redirected
idempotently.

## Cell scaling

Cells limit blast radius and noisy neighbors. Placement uses capacity, residency,
extension requirements, and operational health. A single very large Project may receive
a dedicated cell without changing application contracts.

## Related decision

- [ADR 0011: Project placement with one writable home region](../adr/0011-project-placement-single-writer.md)
- [ADR 0032: Plane-separated modular deployments](../adr/0032-plane-separated-modular-deployments.md)
