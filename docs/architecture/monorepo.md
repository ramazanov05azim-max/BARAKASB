# Monorepo architecture

## Structure

```text
barakasb/
├── apps/
│   ├── web/                 # Next.js shell and confidential BFF
│   ├── control-plane-api/   # Global administration API
│   ├── control-plane-worker/
│   ├── data-plane-api/      # Cell-local project API
│   ├── data-plane-worker/
│   ├── realtime-gateway/
│   └── extension-runner/
├── packages/
│   ├── core/                # Platform bounded contexts
│   ├── contracts/           # Stable universal schemas and metadata
│   ├── infrastructure/      # Technical adapters without business semantics
│   ├── frontend/            # Browser platform packages
│   └── toolchain/           # Shared engineering policy
├── solutions/               # Future business capabilities
├── plugins/                 # Future Solution extensions
├── infra/                   # Deployment and infrastructure boundaries
└── docs/                    # Architecture and operating knowledge
```

## Package identity

Packages use the `@barakasb/` scope:

- `@barakasb/core-identity`
- `@barakasb/core-projects`
- `@barakasb/contracts-platform`
- `@barakasb/infrastructure-observability`
- `@barakasb/frontend-ui`
- `@barakasb/solution-<name>`
- `@barakasb/plugin-<solution>-<name>`

Imports use package entry points. Relative imports may cross folders only inside one
package. Deep imports into another package's `src/` are forbidden.

## Nx tags

Each implementation package must declare:

- `type:app`, `type:core`, `type:contracts`, `type:infrastructure`, `type:frontend`,
  `type:solution`, `type:plugin`, or `type:tooling`
- `scope:platform`, `scope:<solution>`, or `scope:shared`
- `runtime:server`, `runtime:browser`, `runtime:universal`, or `runtime:tooling`

Enforced dependency matrix:

| Source                | Allowed dependencies                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------- |
| `type:core`           | Core public APIs and Contracts; Infrastructure only from adapter layers                           |
| `type:solution`       | Core public APIs and Contracts; Infrastructure only from adapter layers                           |
| `type:plugin`         | Core Plugin SDK, target Solution contract, and Contracts; Infrastructure only from adapter layers |
| `type:frontend`       | Frontend and universal Contracts                                                                  |
| `type:infrastructure` | Infrastructure and Contracts                                                                      |
| `type:contracts`      | Contracts only                                                                                    |
| `type:app`            | Packages selected by its least-privilege composition profile                                      |
| browser runtime       | Browser or universal packages only                                                                |

## Package shape

Backend capability:

```text
src/
├── domain/             # Entities, values, policies, domain events
├── application/        # Use cases, commands, queries, ports
├── infrastructure/     # Adapters for PostgreSQL, Redis, storage, queues
├── presentation/       # HTTP/WS/job adapters and DTO mapping
└── public.ts           # The only supported package entry point
```

Frontend capability:

```text
src/
├── domain/             # Client-side domain types only when justified
├── application/        # Orchestration and state transitions
├── infrastructure/     # API, storage, and telemetry adapters
├── presentation/       # Components and view models
└── public.ts
```

Tests live beside the unit under test; boundary and end-to-end tests use a package-level
`test/` folder.

## Task graph

Nx owns task ordering and caching. pnpm owns dependency resolution and the workspace
lockfile. Every package exposes `build`, `lint`, `test`, and `typecheck` targets where
applicable. CI executes affected targets for pull requests and the complete graph on
`main`.

Generated API clients and schemas are build artifacts. Their source is the versioned
contract, never hand-edited output.

## Related decisions

- [ADR 0001: pnpm and Nx monorepo](../adr/0001-pnpm-nx-monorepo.md)
- [ADR 0026: Architecture quality gates](../adr/0026-architecture-quality-gates.md)
- [ADR 0027: Central runtime version policy](../adr/0027-central-runtime-version-policy.md)
- [ADR 0038: Explicit package taxonomy](../adr/0038-explicit-package-taxonomy.md)
