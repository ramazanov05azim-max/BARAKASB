# Module catalog

This catalog declares ownership before implementation. A module may expose only use
cases, query interfaces, contracts, and events explicitly listed in its public entry
point.

## Deployable applications

| Module                      | Responsibility                                                |
| --------------------------- | ------------------------------------------------------------- |
| `apps/web`                  | Next.js shell, confidential BFF, and extension UI composition |
| `apps/control-plane-api`    | Global identity, Project, placement, and catalog API          |
| `apps/control-plane-worker` | Durable Project lifecycle and reconciliation workflows        |
| `apps/data-plane-api`       | Project-scoped REST composition root in a cell                |
| `apps/data-plane-worker`    | Cell-local outbox, events, schedules, and jobs                |
| `apps/realtime-gateway`     | Project connections, notification fan-out, and backpressure   |
| `apps/extension-runner`     | Isolated non-platform extension execution boundary            |

## Core modules

| Module              | Owns                                                  | Does not own                         |
| ------------------- | ----------------------------------------------------- | ------------------------------------ |
| `kernel`            | IDs, clocks, result/error primitives, event contracts | Framework helpers, business behavior |
| `identity`          | Identities, sessions, external identity links         | Project permissions, business users  |
| `projects`          | Project lifecycle and metadata                        | Solution business data               |
| `project-placement` | Cell, home region, residency, and fencing epoch       | Business data and membership         |
| `tenancy`           | Verified project context and scoped execution policy  | Membership decisions                 |
| `access-control`    | Memberships, roles, capabilities, policy decisions    | Authentication credentials           |
| `solutions-runtime` | Solution catalog, installation state, lifecycle       | Solution behavior                    |
| `plugins-runtime`   | Plugin catalog, enablement, compatibility, lifecycle  | Plugin behavior                      |
| `audit`             | Append-only security and administrative audit records | General application logs             |

## Contract modules

| Module               | Responsibility                                                 |
| -------------------- | -------------------------------------------------------------- |
| `contracts/platform` | Transport-neutral schema primitives and compatibility metadata |

Contracts are side-effect free and cannot import Core, Infrastructure, Solutions, or
Plugins.

## Infrastructure modules

| Module           | Responsibility                                                   |
| ---------------- | ---------------------------------------------------------------- |
| `config`         | Typed configuration loading and validation                       |
| `persistence`    | Transactions, migrations, outbox plumbing, project scope adapter |
| `messaging`      | Event envelope plumbing, broker adapters, idempotent consumption |
| `object-storage` | Project-scoped object adapter and signed-access implementation   |
| `observability`  | Logging, metrics, tracing, correlation, OpenTelemetry adapters   |

Infrastructure modules contain no business rules. Provider SDK types cannot cross into
domain/application public contracts.

## Frontend platform modules

| Module            | Responsibility                                            |
| ----------------- | --------------------------------------------------------- |
| `ui`              | Accessible design-system primitives and tokens            |
| `api-client`      | Generated REST client and error normalization             |
| `auth`            | Browser session state and authenticated navigation guards |
| `project-context` | Active-project selection and mismatch prevention          |
| `extension-host`  | Validated Solution and Plugin UI registration             |

## Reserved extension zones

`solutions/` and `plugins/` contain only their governance README files in Phase 1.
Creating the first package requires an approved ADR, manifest schema, threat review, and
Core foundation acceptance.

## Related decisions

- [ADR 0001: pnpm and Nx monorepo](../adr/0001-pnpm-nx-monorepo.md)
- [ADR 0006: Solution and Plugin contracts](../adr/0006-solution-plugin-contracts.md)
- [ADR 0012: Module-local transactions](../adr/0012-module-local-transactions.md)
- [ADR 0032: Plane-separated modular deployments](../adr/0032-plane-separated-modular-deployments.md)
- [ADR 0038: Explicit package taxonomy](../adr/0038-explicit-package-taxonomy.md)
