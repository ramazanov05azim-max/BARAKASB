# ADR 0001: Use pnpm workspaces with Nx

- **Status:** Accepted
- **Date:** 2026-07-30
- **Owners:** Platform Architecture

## Context

BARAKASB needs one repository for deployable applications, Core modules, Solutions,
Plugins, shared packages, and uniform quality gates. Dependency direction must be
enforceable as the package count grows.

## Decision

Use pnpm for workspace dependency management and a single lockfile. Use Nx for the
project graph, affected execution, caching, and tag-based dependency constraints.
Packages expose explicit entry points and do not use deep imports.

## Alternatives considered

- Independent repositories: rejected because contracts and coordinated platform changes
  would be harder during early development.
- pnpm scripts alone: rejected because dependency constraints and affected task
  execution would require custom tooling.

## Consequences

Tooling policy is centralized and CI can scale with the affected graph. The team must
maintain Nx metadata and avoid repository-wide implicit coupling.

## Validation

CI runs graph-boundary checks and affected targets; `main` runs the full graph.
