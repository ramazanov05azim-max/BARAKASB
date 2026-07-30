# Backend architecture

## Runtime topology

The backend uses least-privilege composition roots:

- **Control-plane API and worker**: global governance and durable workflows.
- **Data-plane API and worker**: project-scoped synchronous and asynchronous execution
  inside a cell.
- **Realtime gateway**: connections, scoped notification fan-out, and backpressure.
- **Extension runner**: isolated execution of non-platform extension code.

They share versioned contracts but never runtime memory or broad credentials. Processes
are stateless and horizontally scalable. PostgreSQL is authoritative; Redis and object
storage are adapters.

## Modular monolith

Each application is a composition root, not a business module. It wires modules from a
signed deployment compatibility lock and provides cross-cutting adapters. A Core or
Solution module owns its controllers, use cases, domain, and infrastructure adapters but
exports only its public contract.

NestJS decorators and dependency injection remain in presentation and infrastructure
composition. Domain objects are plain TypeScript.

## Command path

```text
Controller / WS handler / job consumer
  -> validate transport contract
  -> authenticate and create ActorContext
  -> resolve verified ProjectContext
  -> authorize capability
  -> execute command in scoped transaction
  -> persist aggregate changes + outbox + audit intent
  -> map result to transport response
```

Application commands represent state changes and queries represent reads. CQRS does not
require separate infrastructure by default; separate read stores are introduced only for
measured needs.

## Transactions

- One use case defines one transaction boundary.
- One transaction writes data owned by one module.
- Repositories receive an explicit unit of work.
- Project scope is applied when the transaction begins.
- External network calls do not occur inside database transactions.
- Integration events are written to the outbox in the same transaction.
- Consumers are idempotent and record processed message IDs.

Distributed transactions are forbidden. Multi-module workflows use a process
manager/saga with compensating actions.

Sensitive writes revalidate membership/policy revision and placement epoch inside the
transaction before state changes. A request-scoped decision is insufficient when
ownership, membership, suspension, or placement may have changed.

## Error model

Domain and application errors are typed, stable, and transport-neutral. HTTP maps them
to RFC 9457 Problem Details. Internal errors receive a correlation ID and return no
implementation details.

Expected classes include validation failure, unauthenticated, forbidden, not-found,
conflict, concurrency conflict, rate-limited, and dependency unavailable.

## Extraction criteria

A module may become a service only when at least one is true:

- independent scaling is repeatedly required;
- isolation or compliance requires a separate deployment/data plane;
- a dedicated team owns its lifecycle;
- failure isolation materially improves reliability.

Extraction must preserve contracts and data ownership; it is not justified by folder
size.

## Related decisions

- [ADR 0032: Plane-separated modular deployments](../adr/0032-plane-separated-modular-deployments.md)
- [ADR 0008: Transactional outbox](../adr/0008-transactional-outbox.md)
- [ADR 0012: Module-local transactions](../adr/0012-module-local-transactions.md)
- [ADR 0015: Clean Architecture with selective DDD](../adr/0015-clean-architecture-selective-ddd.md)
