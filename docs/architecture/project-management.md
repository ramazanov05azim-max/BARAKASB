# Project management

## Aggregate

Project is the root of business isolation. Core owns only platform metadata:

- immutable project ID;
- display name and unique human-facing slug;
- lifecycle state;
- owner identity;
- membership revision;
- enabled Solution and Plugin references;
- creation, suspension, archival, and deletion timestamps.

Business profile fields belong to Solutions, not Core.

## Lifecycle

```text
provisioning -> active -> suspended -> active
                    |
                    v
                 archived -> deleting -> deleted
```

- `provisioning`: storage and baseline policy are being prepared.
- `active`: normal use.
- `suspended`: reads may be available to authorized administrators; writes and
  background work are blocked by policy.
- `archived`: immutable except for restore or deletion workflows.
- `deleting`: asynchronous irreversible cleanup is in progress.
- `deleted`: tombstone retained only as required for security and audit.

Transitions are idempotent, authorized, and audited. Failed provisioning is compensated
before a Project becomes active.

Provisioning is a durable cross-module workflow: Projects creates the Project record,
Project Placement assigns a cell and epoch, Access Control establishes ownership, and
the selected data plane verifies readiness. Each step commits only its owning module and
publishes an event. `active` is reached only after every required step reports the same
provisioning operation ID.

## Project selection

The active Project is explicit in URLs and API resources. A user's last selected Project
is a preference, not authorization evidence. Every request revalidates membership and
lifecycle state.

## Membership

Membership relates identity, Project, status, role assignments, inviter, and revision.
Invitations are single-purpose, expire, and cannot be redeemed by a different verified
identity without an explicit recovery flow.

The last owner cannot leave, be removed, or lose the ownership capability until
ownership is transferred or the Project is deleted.

## Solution and Plugin state

Installations are children of the Project lifecycle but are managed by their runtime
modules. Project suspension pauses their commands, jobs, and realtime delivery. Project
deletion asks each installed extension to execute its versioned cleanup contract and
verifies completion.

Placement is frozen during final deletion. Data owners produce deletion evidence and the
Project record retains a minimal tombstone until backup-retention and legal-hold
obligations are satisfied.

## Related decisions

- [ADR 0011: Project placement](../adr/0011-project-placement-single-writer.md)
- [ADR 0012: Module-local transactions](../adr/0012-module-local-transactions.md)
- [ADR 0018: Data lifecycle](../adr/0018-data-classification-lifecycle.md)
- [ADR 0031: Durable Project lifecycle](../adr/0031-durable-project-lifecycle.md)
