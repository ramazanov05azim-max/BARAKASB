# Project-scoped request lifecycle

This is the canonical path for REST, WebSocket commands, and equivalent worker
operations.

## Synchronous request

```text
1. Edge/BFF validates transport limits and correlation context
2. Identity authenticates the Actor/session
3. Route supplies the Project ID
4. Project Placement resolves cell, home region, and epoch
5. Projects verifies lifecycle state
6. Access Control verifies membership, capability, target, and policy revision
7. Tenancy creates immutable ProjectContext
8. Persistence opens a transaction and applies/asserts SET LOCAL scope
9. Application use case executes one module-owned write boundary
10. State, module outbox, and audit intent commit atomically
11. Presentation maps result/error to the public contract
12. Worker publishes outbox events; consumers update owned projections
```

The exact transport may differ, but none of the security and ownership steps may be
skipped.

## Context carried through execution

```text
actor_id
session/workload identity
project_id
cell_id
placement_epoch
membership_revision
policy_revision
correlation_id
causation_id
trace context
```

Context is constructed from trusted server-side resolution, not copied blindly from a
request body or event payload.

## Sensitive write

Before commit, sensitive writes recheck membership/policy revision, Project lifecycle,
and placement epoch inside the transaction. This closes the race where access or
placement changes after the initial request check.

## Multi-module workflow

If a workflow changes more than one owner:

```text
module A transaction + outbox
  -> process manager receives event
  -> module B idempotent command
  -> success event or compensating action
  -> process manager converges terminal state
```

Do not share a transaction or repository to make this look synchronous.

## Read request

Reads still authenticate, resolve Project placement, authorize, and apply RLS. A read
replica is allowed only when the query declares staleness tolerance. Authorization,
membership, placement, ownership, and read-after-write checks use the authoritative
writer path.

## WebSocket

Connection authentication is followed by authorization for each Project subscription.
The subscription records policy revisions. Revision invalidation removes access across
nodes. After a cursor gap or bounded-buffer disconnect, the client obtains an
authoritative REST snapshot.

## Background job

A job carries Project ID, placement epoch, idempotency key, authority, and trace
context. The worker resolves current placement and policy again. A stale job cannot
write to the old cell.
