# Database migrations

## Ownership

Each module owns one ordered migration stream and may change only its database objects.
Shared persistence tooling coordinates execution and records checksum, version, module,
duration, and deployment.

Structural migrations execute per cell/shard. Data backfills execute per Project or
bounded key range with durable checkpoints, rate limits, retry policy, and a deployment
cohort. Migration orchestration has a global concurrency budget and cannot enqueue the
entire Project fleet at once.

## Zero-downtime sequence

1. **Expand**: add backward-compatible schema.
2. **Deploy writers/readers** compatible with old and new states.
3. **Backfill** in bounded resumable batches.
4. **Verify** completeness and invariants.
5. **Switch** reads/writes with observability.
6. **Contract** obsolete schema in a later release.

Destructive DDL, long table rewrites, and unbounded data updates require an explicit
maintenance/online strategy.

## Project safety

Project-scoped tables must enable and force RLS before use. Migrations execute with a
migration role, while application tests execute with the restricted runtime role. Every
migration suite proves that runtime access cannot bypass Project scope.

Extension enablement waits for the relevant structural schema version, but a failed
Project backfill degrades only that installation when compatibility permits. Canary
Projects and automatic pause thresholds precede fleet rollout.

## Rollback

Application artifacts can roll back only while schema compatibility is maintained.
Production data migrations are forward-fixed or restored through a tested recovery
procedure; ad hoc reverse migrations are not assumed safe.

## Related decision

- [ADR 0025: Expand/contract fleet migrations](../adr/0025-expand-contract-fleet-migrations.md)
