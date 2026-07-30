# Solution engine

## Purpose

A Solution is an independently versioned business capability installed into a Project.
Core knows how to catalog, validate, install, configure, migrate, enable, disable, and
observe a Solution; it does not know the Solution's business rules.

No concrete Solution is part of Phase 1.

## Manifest

Every Solution publishes a signed, versioned manifest with:

- stable ID, display metadata, and semantic version;
- required Core API range;
- server and UI entry points;
- declared capabilities;
- owned migration stream and storage namespaces;
- REST, event, job, and UI contributions;
- Plugin extension points and their contract versions;
- health checks and lifecycle hooks;
- dependencies on Core capabilities, never concrete Plugins.

The manifest is validated at build time and again at deployment startup.

The manifest binds to immutable server and UI artifact digests, publisher identity,
signature chain, SBOM, build provenance, and revocation status. Every composition root
publishes the same deployment compatibility-lock digest; startup fails closed when Core
or extension registries disagree.

## Installation lifecycle

```text
available -> installing -> enabled -> disabling -> disabled
                |            |
                v            v
              failed      upgrading
                                |
                                v
                         enabled / failed
```

Installation is project-scoped and idempotent. The runtime records desired version,
effective version, configuration revision, migration checkpoint, health, and failure
reason. A failed migration cannot expose a partially enabled Solution.

The runtime is a desired-state reconciler. Lifecycle operations have monotonic operation
IDs, leases/fencing, checkpoints, and compensating steps. Reconciliation resumes after
restart and never infers completion from an expired lock.

## Runtime registration

Applications load a deployment allowlist at startup. A Project installation can enable
only a Solution present in that allowlist. Runtime registration produces immutable
registries of routes, consumers, jobs, capabilities, UI contributions, and Plugin slots.

Core does not scan arbitrary directories or execute packages uploaded by a Project user.

Routes and handlers are deployment-global registrations guarded by per-request Project
installation state. Enabling a Solution does not mutate the NestJS or Next.js route
graph at runtime.

## Compatibility

Solution versions follow semantic versioning. Public REST and event contracts may evolve
independently but must state compatibility windows. Core upgrades verify every deployed
Solution's required Core range before rollout.

Structural database migrations run once per cell/shard. Project data backfills and
configuration upgrades run in observable cohorts with concurrency budgets, checkpoints,
pause conditions, and canary Projects. A fleet upgrade cannot lock every Project table
or enqueue unbounded work simultaneously.

## Failure isolation

A failing optional Solution must not prevent Core administration from starting. Its
project installation is marked degraded, its endpoints fail closed, and operators
receive telemetry. Database migration failures stop only deployments that would make
data compatibility unsafe.

## Related decisions

- [ADR 0006: Solution and Plugin contracts](../adr/0006-solution-plugin-contracts.md)
- [ADR 0013: Extension artifact trust](../adr/0013-extension-artifact-trust.md)
- [ADR 0024: Extension desired state](../adr/0024-extension-desired-state.md)
- [ADR 0025: Fleet migrations](../adr/0025-expand-contract-fleet-migrations.md)
- [ADR 0034: Contract compatibility and versioning](../adr/0034-contract-compatibility-versioning.md)
