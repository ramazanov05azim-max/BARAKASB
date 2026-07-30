# Backup and recovery

## Scope

Recovery covers PostgreSQL, object storage, configuration history, encryption key
dependencies, and the metadata required to reconcile events and objects. Redis is
rebuilt and is not a recovery source.

## Baseline

- encrypted automated PostgreSQL backups with point-in-time recovery;
- object versioning and lifecycle protection;
- cross-failure-domain copies appropriate to agreed objectives;
- restricted, audited restore permissions;
- documented retention and deletion interaction.

Backup catalogs record cell/shard, region, encryption key version, schema versions, time
range, and expiry. Project deletion produces a retention-ledger entry identifying every
backup that may still contain the Project and the date at which it becomes
unrecoverable.

Selective Project recovery never restores a shared production backup in place. It
restores into an isolated environment, extracts validated project-scoped records and
objects through an audited tool, and imports through a placement-fenced recovery
workflow.

## Drills

Restore drills run on a schedule into an isolated environment. They verify:

- database consistency and migration state;
- Project isolation policies and restricted roles;
- object-reference checksums and availability;
- outbox/inbox replay boundaries;
- application startup and critical Core workflows.
- placement metadata, fencing epoch, and cell routing;
- selective single-Project recovery without exposing another Project;
- regional recovery under the declared residency policy.

Results record achieved recovery point and time. A backup is not considered valid until
restore is proven.

## Related decisions

- [ADR 0018: Data classification and lifecycle](../adr/0018-data-classification-lifecycle.md)
- [ADR 0030: PITR and isolated Project recovery](../adr/0030-pitr-isolated-project-recovery.md)
