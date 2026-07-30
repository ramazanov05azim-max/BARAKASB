# Extension contracts and reconciliation

## Immutable catalog identity

Catalog identity is the tuple:

```text
extension_id + semantic_version + manifest_digest + artifact_set_digest
```

Reusing a version for different bytes is forbidden. Catalog admission verifies
publisher, signature chain, build provenance, SBOM, vulnerability policy, artifact
digests, and revocation status.

## Manifest model

A Solution or Plugin manifest contains these contract groups:

| Group         | Required content                                                       |
| ------------- | ---------------------------------------------------------------------- |
| Identity      | ID, version, publisher, license decision, integrity metadata           |
| Compatibility | Core range, target Solution/extension-point ranges, runtime protocol   |
| Artifacts     | Immutable server/browser/worker entry-point digests                    |
| Capabilities  | Declared definitions or requested grants with risk classes             |
| Data          | schema owner, storage namespaces, classification, retention, residency |
| Interfaces    | REST, events, jobs, WebSocket topics, UI contributions                 |
| Lifecycle     | install, reconcile, upgrade, disable, uninstall, health, recovery      |
| Operations    | quotas, timeouts, concurrency, telemetry, kill-switch policy           |

The canonical machine-readable schema will be versioned in the contracts package during
the platform-skeleton phase. Unknown manifest fields fail validation for
security-sensitive groups.

## Deployment compatibility lock

CI creates one signed compatibility lock for all composition roots, the Core SDK,
Solutions, and Plugins. Every process reports the lock digest. A deployment cannot
become ready when digests differ or when an artifact is revoked.

Project installation selects only versions present in the effective deployment lock. The
Project never provides a package URL or executable entry point.

## Desired-state reconciliation

Installation commands change desired state. A reconciler advances effective state
through idempotent checkpointed steps:

```text
validate -> reserve -> structural-version check -> project backfill/configuration
-> health verify -> capability activation -> effective
```

Each operation has a monotonic operation ID and placement epoch. One active operation
per Project and extension is enforced with authoritative fencing, not a Redis lease
alone.

Retries resume at a verified checkpoint. Compensation never deletes data unless the
manifest retention contract and explicit operation authorize deletion.

## Fleet rollout

Rollouts use canary Projects and bounded cohorts. Automatic pause signals include error
rate, latency, outbox/job lag, migration failures, authorization denials, and resource
budget violations. A global kill switch prevents new invocations but preserves
diagnostic and recovery access.

## Extension-point execution

Each extension point defines:

- synchronous or asynchronous semantics;
- deterministic ordering and conflict resolution;
- transaction and side-effect allowance;
- timeout, retry, and failure-isolation behavior;
- input/output schema and size limits;
- actor, Project, placement, authorization, and trace context;
- compatibility and deprecation policy.

Synchronous hooks are excluded from critical transactions unless they are trusted,
bounded, deterministic, and part of the same owning module contract. Optional hooks
cannot reduce Core availability.

## Related decisions

- [ADR 0006: Solution and Plugin contracts](../adr/0006-solution-plugin-contracts.md)
- [ADR 0013: Extension artifact trust](../adr/0013-extension-artifact-trust.md)
- [ADR 0024: Extension desired state](../adr/0024-extension-desired-state.md)
- [ADR 0025: Fleet migrations](../adr/0025-expand-contract-fleet-migrations.md)
- [ADR 0033: Extension execution isolation](../adr/0033-extension-execution-isolation.md)
- [ADR 0034: Contract compatibility and versioning](../adr/0034-contract-compatibility-versioning.md)
