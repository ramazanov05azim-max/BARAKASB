# ADR 0005: Use capability authorization with Project RBAC and policy

- **Status:** Accepted
- **Date:** 2026-07-30
- **Owners:** Platform Architecture and Security

## Context

Static role checks do not scale across independent Solutions and Plugins, and token
claims become stale after membership changes.

## Decision

Define stable namespaced capabilities. Project roles grant capabilities; a server-side
policy decision also validates membership, Project lifecycle, resource ownership, and
contextual constraints. Default is deny.

## Alternatives considered

- Hard-coded role checks: rejected because roles and extension permissions evolve
  independently.
- Token-only permissions: rejected because revocation and membership changes would not
  take effect promptly.

## Consequences

Policy decisions are consistent across REST, WebSocket, jobs, and use cases. Capability
governance and compatibility become part of extension review.
