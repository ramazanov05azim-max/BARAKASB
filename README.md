# BARAKASB

BARAKASB is a multi-project Business Operating System. One identity can manage multiple
independent projects, while every project's business data remains strictly isolated.

This repository contains the architecture and UX foundations, the platform frontend, the
Coffee Solution blueprint, and the Coffee Project administration environment. The
current implementation uses typed mock repositories and contains no backend integration
or live coffee-shop operations.

## Architecture at a glance

```text
Applications (web, control plane, data plane, realtime, extension runner)
              |
              v
          Composition
              |
      +-------+--------+
      |                |
      v                v
  Solutions <------ Plugins
      |
      v
     Core
```

The dependency rule is:

```text
Core <- Solutions <- Plugins
```

- **Core** provides identity, projects, tenancy, access control, audit, and the
  extension runtimes.
- **Solutions** provide independently installable business capabilities.
- **Plugins** extend a specific Solution through explicit versioned contracts.
- **Applications** are composition roots. They contain delivery concerns, not domain
  rules.

Coffee is the first reference Solution. Its administration environment is implemented
without POS transactions, order processing, stock movements, finance ledger, realtime
events, or hardware integrations. No Plugin is implemented.

## Repository map

| Path                       | Purpose                                              |
| -------------------------- | ---------------------------------------------------- |
| `apps/`                    | Deployable Next.js and NestJS application boundaries |
| `packages/core/`           | Platform capabilities that every Solution may use    |
| `packages/contracts/`      | Stable universal schemas and compatibility metadata  |
| `packages/infrastructure/` | Business-neutral technical adapters                  |
| `packages/frontend/`       | Shared frontend platform packages                    |
| `packages/toolchain/`      | Workspace-wide build, lint, test, and TS policy      |
| `solutions/`               | Independently owned first-party business Solutions   |
| `plugins/`                 | Future extensions to Solutions                       |
| `infra/`                   | Infrastructure ownership and deployment boundaries   |
| `docs/`                    | Architecture, decisions, standards, and operations   |

New developers start with [BARAKASB Master Context](docs/BARAKASB_MASTER_CONTEXT.md),
followed by [Developer onboarding](docs/onboarding/README.md). The
[documentation index](docs/index.md) provides the complete reference, and the
[architecture decision map](docs/architecture/decision-map.md) connects every major
design rule to the ADR that explains why it exists. The
[Architecture Validation Report](ARCHITECTURE_VALIDATION_REPORT.md) records the
Enterprise Architecture Review Board findings, scores, and production conditions. The
product experience begins with the [UX Foundation](UX_FOUNDATION.md) and
[Screen Map](SCREEN_MAP.md). The first business blueprint begins with
[Coffee Solution](COFFEE_SOLUTION.md).

## Platform invariants

1. A request has exactly one authenticated actor and, for project-scoped operations,
   exactly one verified project context.
2. Business records, cache keys, events, object paths, jobs, logs, and realtime channels
   are project-scoped.
3. Cross-project business queries are forbidden in request paths.
4. Access is denied by default and granted through explicit capabilities.
5. Core never imports Solutions or Plugins.
6. Extensions use public contracts; deep imports are forbidden.
7. Domain code has no dependency on NestJS, Next.js, PostgreSQL, Redis, or HTTP.
8. State changes that publish integration events use a transactional outbox.
9. A Project has one authoritative placement, home region, writable cell, and fencing
   epoch.
10. Authenticated frontend data is uncached by default; an approved cache key includes
    actor, Project, authorization revision, and data revision.

## Tooling baseline

- Node.js 24 LTS
- pnpm workspaces
- Nx task graph and boundary enforcement
- executable Phase 1 architecture validation
- TypeScript strict mode
- Conventional Commits and Architecture Decision Records

The platform frontend is implemented in `apps/web`. Other applications remain
architecture boundaries for later platform implementation. Each package declares its Nx
identity and tags as described in
[Monorepo architecture](docs/architecture/monorepo.md).

## Current status

The platform frontend and Coffee Project administration environment are implemented
against Project-scoped typed mock repositories. Backend services and live Coffee
operations remain future work governed by [Roadmap](docs/roadmap.md) and
[Coffee Implementation Roadmap](COFFEE_IMPLEMENTATION_ROADMAP.md).
