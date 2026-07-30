# ADR 0022: Use WebSocket for notifications with REST recovery

- **Status:** Accepted
- **Date:** 2026-07-30
- **Owners:** API and Realtime Platform

## Context

Realtime UX needs low-latency updates, but connections disconnect, nodes restart,
messages duplicate, and slow clients can consume unbounded memory. Treating WebSocket
delivery as authoritative makes recovery fragile.

## Decision drivers

- Project-scoped authorization and revocation;
- horizontal connection scaling;
- bounded resource use;
- deterministic client recovery.

## Decision

WebSocket provides at-least-once notifications and explicitly designed collaborative
protocols, not general authoritative mutation. Each event has ID, version, Project,
cursor/sequence, and occurred-at time. Clients deduplicate and use a cursor-bearing REST
snapshot after gaps or reconnect.

Connection/subscription authorization records membership and policy revisions. Revision
events invalidate subscriptions across nodes. Per-connection and per-Project buffers are
bounded; slow clients receive a resync marker and disconnect.

## Why this option

REST remains the recoverable source of state while WebSocket optimizes latency.
At-least-once delivery matches distributed fan-out reality without claiming exactly-once
semantics.

## Alternatives considered

- WebSocket-only state synchronization: rejected because reconnect and missed-message
  recovery become application-specific and brittle.
- Unbounded server queues: rejected because slow consumers can exhaust a node.
- Best-effort revocation on reconnect only: rejected because removed members could
  retain active subscriptions.

## Consequences

Clients implement deduplication, cursors, and resynchronization. The platform operates a
revision-invalidation channel and observes acknowledgement lag.

## Validation

Tests cover duplicate/reordered events, cursor gaps, reconnect storms, revoked
membership, stale nodes, slow consumers, and node loss.
