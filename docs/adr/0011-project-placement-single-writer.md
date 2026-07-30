# ADR 0011: Route each Project to one writable home region

- **Status:** Accepted
- **Date:** 2026-07-30
- **Owners:** Platform Architecture and Reliability

## Context

Project IDs make future sharding possible, but they do not define authoritative
placement, regional residency, failover fencing, or routing behavior. General
active-active writes would require conflict semantics in every current and future
Solution.

## Decision

Add a Core Project Placement context. Each Project has an effective cell, home region,
residency policy, and monotonic placement epoch. One region and cell accept writes for a
Project. Every write path validates the epoch. Project move and failover advance the
epoch to fence the old writer before enabling the target.

## Alternatives considered

- Global unsharded database indefinitely: rejected because placement and blast-radius
  concerns would leak into application code later.
- Active-active multi-region writes: rejected because conflict resolution is a business
  decision and cannot be safely generalized by Core.
- Client-selected region/shard: rejected because clients cannot be trusted with physical
  placement.

## Consequences

The platform gains a stable path to cells, dedicated Project placement, and residency.
Control-plane routing becomes critical infrastructure and requires cached signed
snapshots, audit, failover drills, and strict stale-epoch rejection.

## Validation

Tests move and fail over a Project while old API requests, jobs, and events remain in
flight; no stale epoch may commit.
