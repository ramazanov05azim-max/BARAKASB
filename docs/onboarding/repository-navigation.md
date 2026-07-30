# Repository navigation

## Top-level map

```text
apps/                  deployable composition roots
packages/core/         business-neutral platform bounded contexts
packages/contracts/    stable universal schemas and compatibility metadata
packages/infrastructure/ business-neutral technical adapters
packages/frontend/     browser platform packages
packages/toolchain/    repository engineering policy
solutions/             future business Solutions
plugins/               future Solution extensions
infra/                 infrastructure ownership boundaries
tools/architecture/    executable Foundation structure checks
docs/                  architecture, ADRs, operations, onboarding
```

## Where a change belongs

| Change                               | Owner                                        |
| ------------------------------------ | -------------------------------------------- |
| Identity/session behavior            | `packages/core/identity`                     |
| Membership/capability policy         | `packages/core/access-control`               |
| Project lifecycle                    | `packages/core/projects`                     |
| Cell/home-region mapping             | `packages/core/project-placement`            |
| Verified Project execution context   | `packages/core/tenancy`                      |
| Solution installation/reconciliation | `packages/core/solutions-runtime`            |
| Plugin installation/reconciliation   | `packages/core/plugins-runtime`              |
| Security administration evidence     | `packages/core/audit`                        |
| Stable cross-runtime schema          | matching `packages/contracts/*` package      |
| Generic DB/queue/storage adapter     | matching `packages/infrastructure/*` package |
| Design-system primitive              | `packages/frontend/ui`                       |
| Browser Project switch               | `packages/frontend/project-context`          |
| Deployment/bootstrap wiring          | matching `apps/*` composition root           |

If two rows appear to own the same invariant, stop and resolve ownership before coding.

## Internal package shape

Layers are used when they have responsibility:

```text
domain/           framework-free behavior and invariants
application/      use cases and ports
infrastructure/   provider and persistence adapters
presentation/     HTTP, WebSocket, job, or UI adapters
public.ts         supported package surface
```

A simple package may omit an unused layer. It may not move domain behavior outward just
to avoid a layer.

## Imports

- Cross-package imports use public `@barakasb/*` exports.
- Deep imports into another package's `src/` are forbidden.
- Core cannot import Solutions or Plugins.
- Contracts cannot import Core, Infrastructure, Solutions, or Plugins.
- Infrastructure cannot contain business rules or expose provider types to domains.
- Frontend cannot import server runtime packages.
- One module cannot import another module's repositories or migrations.

## Documentation ownership

- `docs/architecture/`: current design and invariants.
- `docs/adr/`: decision history and rationale.
- `docs/operations/`: how the platform is safely operated.
- `docs/development/`: engineering policy.
- `docs/reviews/`: point-in-time assessments, not the current source of truth.

When review findings are accepted, the architecture docs and ADRs become authoritative;
the review remains historical evidence.
