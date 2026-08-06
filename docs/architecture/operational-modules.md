# Operational Module architecture

## Purpose

An Operational Module is a Solution-owned vertical slice rendered inside one Operational
Workspace. Bar is the reference implementation. Kitchen, Warehouse, Purchasing,
Production, Finance, CRM, Delivery and Pickup must use the same boundary when their
implementation is approved.

This standard introduces no application, deployable, composition root or business
functionality. The Universal Application remains the only operational browser mode in
`apps/web`.

The standard covers this Solution-owned workspace family:

| Source identifier | Russian product name | Foundation status                   |
| ----------------- | -------------------- | ----------------------------------- |
| `bar`             | Бар                  | Reference implementation registered |
| `kitchen`         | Кухня                | Architecture only                   |
| `warehouse`       | Склад                | v1 implementation registered        |
| `purchasing`      | Закупщик             | Architecture only                   |
| `production`      | Производство         | Architecture only                   |
| `finance`         | Финансы              | Architecture only                   |
| `crm`             | CRM                  | Architecture only                   |
| `delivery`        | Доставка             | Architecture only                   |
| `pickup`          | Самовывоз            | Architecture only                   |

“Architecture only” does not create a route, screen, repository or runtime registration.

## Ownership model

```text
apps/web Universal Application host
  -> frontend-extension-host Operational Module registry
    -> Solution-owned Operational Module renderer
      -> module application services
        -> module domain and repository ports
          <- module infrastructure adapters
```

The host owns device binding, employee authentication, session bootstrap and selection
of the registered renderer. The Solution owns the module. A module owns its navigation,
logical routes, screens, state, application services, repositories, capabilities and
tests.

One `workspaceType` has exactly one registered UI owner. Registration is deployment
allowlisted and validated before use. There is no runtime directory scan and no Project
may upload executable code.

## Required module shape

When a module receives real functionality, it uses this feature-oriented shape inside
its owning Solution:

```text
operational-modules/<module>/
├── domain/          # module entities, values, policies and events
├── application/     # use cases, state transitions and repository/platform ports
├── infrastructure/  # local/API adapters owned by the module
├── presentation/    # module navigation, screens and view models
├── manifest.ts      # transport-neutral declaration
└── *.test.ts(x)     # domain, contract, presentation and isolation tests
```

Empty layers and placeholder screens are forbidden. A folder appears only when the
module has approved behavior for it. Before that point only architecture documentation
names the future module.

## Manifest contract

`@barakasb/contracts-platform` publishes `OperationalModuleManifest`. It declares:

- Solution and module identity plus contract version;
- the owned Workspace type;
- initial and available logical routes plus their owned screens;
- module-local navigation mapped to those routes;
- namespaced required capabilities;
- opt-in platform service dependencies;
- state schema, application service and repository contract versions.

Labels are localization keys. The manifest contains no React component, repository
implementation, business state, access code, provider SDK or executable entry point.

The browser-side `OperationalModuleRuntimeRegistry` lives in the existing
`frontend-extension-host`. Its renderer is generic so the registry does not share or
prescribe business UI. `apps/web` statically composes reviewed Solution renderers from
the deployment allowlist.

## Module-local navigation and routing

The public operational routes remain:

```text
/app
/app/connect
/app/workspace
```

An Operational Module owns the logical screen route below `/app/workspace`. These keys
drive the module's own navigation and state; they are not global Project routes and do
not expose Project, Solution Installation, Business Environment, Workspace Code or other
Manager-only identities.

One module cannot add navigation to another module, import another module's screen or
render another module's UI. Cross-module shortcuts issue a public command or navigate
through a host-owned capability; they never reuse presentation components.

## State and repository ownership

Each module owns:

- its state schema and migration version;
- application commands and queries;
- repositories and persistence namespace;
- cached and offline records;
- events and audit action names;
- error taxonomy and recovery behavior.

Project identity and isolation scope are present in every internal execution context,
even though they are not displayed to an operational employee. Repository operations
must be Project-scoped. A future server adapter applies forced RLS and authoritative
capability checks.

Direct repository access across modules is forbidden. Immediate validation uses a public
application interface. Independent processing uses versioned events and a consumer-owned
read model. One transaction writes one module owner's state and outbox.

## Permissions

Workspace assignment determines which employees may attempt to enter a workspace; it
does not authorize every action. Each screen, navigation item and use case declares a
stable namespaced capability. The host may hide denied navigation for usability, while
the authoritative application/server boundary denies by default.

Employee, Workspace, Project scope and timestamp accompany operational actions. A module
cannot infer authorization from a role label, a visible button or device binding.

## Shared platform contracts

Modules may consume these opt-in platform-owned ports:

| Port             | Responsibility                               | Module restriction                      |
| ---------------- | -------------------------------------------- | --------------------------------------- |
| Employee session | Immutable authenticated execution context    | Cannot authenticate or switch employees |
| Authorization    | Authoritative capability decision            | Cannot replace policy with UI state     |
| Media            | Resolve project-scoped media references      | Cannot own global blob storage          |
| Notifications    | Publish typed, deduplicated notifications    | Cannot call another module's UI         |
| Printing         | Enqueue idempotent document jobs             | Cannot depend on printer SDKs           |
| Audit            | Record actor, workspace, time and action     | Cannot write secrets or credentials     |
| Synchronization  | Exchange scoped cursors and idempotency keys | Cannot merge Projects or module stores  |

Authentication, employee session, media, notifications, printing, audit, permissions,
repositories and synchronization may share platform mechanisms. Business components,
view models, navigation and screen state never become platform UI.

Modules receive only the ports they declare. A broad service locator is forbidden.
Provider implementations are composed at the approved application/adapter boundary.

## Bar reference implementation

Bar is the first registered Operational Module:

- `bar-domain.ts` owns operational order and floor-plan state;
- `bar-service.ts` owns application use cases;
- `bar-repository-contracts.ts` owns its repository port;
- `bar-local-repository.ts` is the replaceable local adapter;
- `bar-workspace-screen.tsx` owns Bar presentation;
- `operational-modules/bar/manifest.ts` declares the Bar contract;
- Bar tests cover domain, service, repository, presentation and Project isolation.

The current file layout may be moved mechanically into the standard feature folders when
backend adapters are introduced. That move must not change business behavior or create a
second Bar implementation.

No future module may copy Bar screens. It may reuse only public platform ports,
Solution-level domain engines such as the Recipe Engine, and design-system primitives.

## Warehouse v1 implementation

Warehouse is the second registered Operational Module and the first consumer of the
Recipe Engine. It owns an append-only movement ledger, balances derived exclusively from
that ledger, receipt/write-off/transfer/inventory use cases, history and local Project +
Business Environment scoped persistence. Bar publishes terminal completion through an
application port; Warehouse expands the applicable recipe and records an idempotent
atomic consumption batch. Missing recipe or source-warehouse configuration creates a
visible unresolved issue and never changes the completed order.

The detailed behavior and migration rules are documented in
[Coffee Warehouse Operational Module v1](../solutions/coffee/warehouse-operational-module.md).

## Testing contract

Every implemented module must provide:

1. manifest validation and capability declaration tests;
2. domain and application use-case tests;
3. repository contract tests for each adapter;
4. presentation tests for allowed and denied states;
5. two-Project negative isolation tests;
6. session and workspace mismatch tests;
7. state migration and refresh tests where local/offline state exists;
8. registration conflict and unknown-workspace tests;
9. architecture tests proving no cross-module UI or repository import.

No module is considered available merely because its identifier exists in the Solution
Constructor. Availability requires a validated manifest, registered implementation and
all quality gates.

## Related decisions

- [ADR 0003: Project isolation](../adr/0003-project-isolation.md)
- [ADR 0005: Capability authorization](../adr/0005-capability-authorization.md)
- [ADR 0006: Solution and Plugin contracts](../adr/0006-solution-plugin-contracts.md)
- [ADR 0012: Module-local transactions](../adr/0012-module-local-transactions.md)
- [ADR 0015: Clean Architecture with selective DDD](../adr/0015-clean-architecture-selective-ddd.md)
- [ADR 0038: Explicit package taxonomy](../adr/0038-explicit-package-taxonomy.md)
