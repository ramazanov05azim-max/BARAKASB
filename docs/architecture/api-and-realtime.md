# REST API and realtime

## REST

The canonical project-scoped resource prefix is:

```text
/api/v1/projects/{projectId}/...
```

Global identity and project-directory resources use `/api/v1/...` without a project
prefix. A project ID from headers or request bodies cannot override the route context.

## Contract rules

- OpenAPI is generated and validated in CI.
- Request and response schemas are explicit and reject unknown sensitive fields.
- IDs are opaque strings at transport boundaries.
- Dates use RFC 3339 UTC.
- Pagination uses opaque cursors for changing collections.
- Errors use RFC 9457 Problem Details with stable machine-readable codes.
- Mutating retries use an `Idempotency-Key` scoped to actor, project, operation, and
  normalized request hash.
- Optimistic concurrency uses an entity version or `ETag`/`If-Match`.

Breaking changes require a new API version or a documented compatibility migration.
Internal database models are never serialized directly.

An idempotency record is atomically claimed before side effects and has `in_progress`,
`completed`, or `failed_retryable` state. The same key with a different request hash
returns conflict. Concurrent duplicates wait or receive a stable in-progress response;
completed duplicates replay the status and response reference. Retention is longer than
the maximum client retry window and is capacity-limited per Project.

## WebSocket

WebSocket is for notifications and collaborative updates, not authoritative state
mutation unless a protocol explicitly defines command semantics.

Connection flow:

1. authenticate the session/token;
2. bind actor and correlation context;
3. authorize each project subscription;
4. join a server-generated project namespace;
5. revalidate on permission/lifecycle revision;
6. disconnect or remove subscriptions when access changes.

Clients cannot provide raw channel names. Events contain event ID, type, version,
project ID, occurred-at time, sequence/cursor, and payload.

## Delivery semantics

Realtime delivery is at least once. Clients deduplicate by event ID, detect cursor gaps,
and refetch authoritative REST state after reconnect. Redis may fan out events across
API instances but does not replace persisted outbox/event state.

Connections are partitioned by cell and node. Membership, policy, Project lifecycle, and
placement revisions fan out through a versioned invalidation stream. Each
connection/subscription records the revision it authorized. Nodes acknowledge
invalidation progress; stale nodes fail subscriptions closed after the security
deadline.

Outbound buffers are bounded per connection and Project. Slow clients receive a
resynchronization marker and disconnect rather than consuming unbounded memory. Clients
recover through a cursor-bearing REST snapshot.

## Rate limits

Limits are keyed by authenticated actor, Project, client, and endpoint class.
Authentication and invitation endpoints have stricter abuse controls. Rate-limit
failures do not reveal whether protected resources exist.

## Related decisions

- [ADR 0007: REST and WebSocket contracts](../adr/0007-rest-websocket-contracts.md)
- [ADR 0021: API idempotency and concurrency](../adr/0021-api-idempotency-concurrency.md)
- [ADR 0022: WebSocket notification semantics](../adr/0022-websocket-notification-semantics.md)
