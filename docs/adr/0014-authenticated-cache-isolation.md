# ADR 0014: Keep authenticated frontend data uncached by default

- **Status:** Accepted
- **Date:** 2026-07-30
- **Owners:** Frontend Platform and Security

## Context

Next.js, React request memoization, CDNs, browser caches, and service workers can cache
at different layers. Omitting actor, Project, or authorization state can expose one
Project's response to another.

## Decision

Authenticated and Project-scoped responses are uncached by default. An exception
requires an explicit policy and a key containing actor/session class, Project ID,
membership revision, policy revision, resource version, deployment, and relevant
presentation dimensions. Personalized HTML is private/no-store. Offline authenticated
storage is disabled until separately approved.

## Alternatives considered

- Project-only cache keys: rejected because users in one Project can have different
  capabilities and membership revisions.
- Rely on framework defaults: rejected because defaults and cache semantics change
  across framework versions.

## Consequences

Initial cache hit rates may be lower. Performance work must prove isolation rather than
enabling broad caching. Framework upgrades trigger the cache-isolation suite.

## Validation

Tests alternate actors, Projects, roles, revisions, routes, locales, and deployment
versions across server render, data cache, request memoization, CDN, browser, and
Project-switch paths.
