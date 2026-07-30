# Dependency rules

## Layer rule

Dependencies point inward:

```text
transport/framework -> application -> domain
adapter/framework   -> application ports
```

The domain cannot import:

- NestJS, Next.js, React, ORM/query-builder packages
- PostgreSQL, Redis, object-storage, queue, or telemetry SDKs
- DTOs tied to HTTP, WebSocket, or persistence

## Product rule

```text
Core <- Solution <- Plugin
```

- Core has no knowledge of concrete Solutions or Plugins.
- A Solution uses only public Core APIs.
- A Plugin uses the Core Plugin SDK and a versioned extension contract exposed by its
  target Solution.
- A Plugin manifest and Nx project metadata name exactly one target Solution; its scope
  and package name must match that target.
- A Solution never imports a Plugin.
- One Solution cannot query another Solution's persistence directly.
- One Plugin cannot access another Plugin's persistence directly.

Cross-module collaboration uses:

1. synchronous public application interfaces when consistency must be immediate;
2. versioned domain/integration events when coupling can be asynchronous;
3. a read model owned by the consumer when independent querying is required.

A transaction writes data owned by one module only. Immediate cross-module reads may
participate in request orchestration, but a workflow that changes multiple owners uses a
durable process manager and compensating actions. This prevents a local ACID transaction
from becoming a hidden distributed-transaction requirement after extraction.

## Data ownership

Each module owns its tables, migrations, repositories, cache namespace, event schemas,
and object-storage namespace. Foreign keys across module-owned tables are avoided.
Stable IDs and public query contracts connect modules.

Direct SQL joins across ownership boundaries are forbidden in application code.
Reporting projections consume events into dedicated read models.

## Enforcement

The implementation phase must configure:

- Nx dependency constraints from package tags;
- ESLint restrictions for deep imports and layer imports;
- package `exports` maps exposing only `public.ts`;
- architecture tests for forbidden dependencies;
- CODEOWNERS for sensitive platform boundaries.

A CI exception requires a time-bounded ADR with an owner and removal date.

Clean Architecture is not measured by folder count. A simple package may omit a layer
that has no behavior. Ports are introduced at real I/O, volatility, or ownership
boundaries; pass-through interfaces and empty abstractions are rejected.

## Related decisions

- [ADR 0012: Module-local transactions](../adr/0012-module-local-transactions.md)
- [ADR 0015: Clean Architecture with selective DDD](../adr/0015-clean-architecture-selective-ddd.md)
- [ADR 0038: Explicit package taxonomy](../adr/0038-explicit-package-taxonomy.md)
