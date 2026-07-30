# ADR 0027: Maintain one runtime compatibility and dependency policy

- **Status:** Accepted
- **Date:** 2026-07-30
- **Owners:** Platform Engineering

## Context

Next.js, React, NestJS, TypeScript, Node.js, build tools, and generated contracts evolve
at different rates. Independent package upgrades can create multiple runtimes, broken
types, or delayed security fixes.

## Decision drivers

- reproducible builds;
- one tested framework compatibility matrix;
- timely security updates;
- controlled major upgrades and rollback.

## Decision

The root engine range, pnpm version, catalog, and lockfile are authoritative. Platform
Engineering owns a repository compatibility matrix. Packages cannot independently choose
another major runtime or duplicate framework versions.

Updates are classified as emergency security, routine patch/minor, or major/framework.
Major updates run framework-specific cache, request-context, RLS transaction, contract,
performance, canary, and rollback evidence.

## Why this option

One matrix turns compatibility into a repository property rather than a negotiation
between packages. It reduces duplicate bundles and makes security remediation
predictable.

## Alternatives considered

- Independent versions per package: rejected because the monorepo would not represent
  one deployable platform.
- Automatic unreviewed upgrades: rejected because framework semantics can change
  security-sensitive behavior.
- Freeze dependencies indefinitely: rejected because security and ecosystem support
  degrade.

## Consequences

Some packages wait for coordinated upgrades. Emergency updates still use expedited
evidence and a time-bounded risk process when compatibility is blocked.

## Validation

Clean frozen-lockfile install, compatibility suites, provenance/license scans, canary,
and rollback evidence are required for version changes.
