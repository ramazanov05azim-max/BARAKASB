# Bounded-context map

## Core relationships

```text
Identity
   |
   | authenticated Actor
   v
Access Control <------ Projects ------> Project Placement
   |                       |
   | policy decision       | lifecycle facts
   v                       v
Tenancy ------------> scoped execution
   |
   +------> Solutions Runtime ------> concrete Solution contracts
   |                |
   |                +---------------> Plugins Runtime
   |
   +------> Audit
```

Arrows represent published contracts or facts, not database access.

## Context roles

| Upstream          | Downstream          | Relationship                                                                                   |
| ----------------- | ------------------- | ---------------------------------------------------------------------------------------------- |
| Identity          | Access Control      | Identity publishes immutable actor identity; access control does not infer identity from email |
| Projects          | Access Control      | Project lifecycle constrains membership; each context keeps its own model                      |
| Project Placement | Tenancy/Persistence | Placement supplies shard, home region, and fencing epoch                                       |
| Access Control    | Applications        | Policy service supplies decisions and revision metadata                                        |
| Solutions Runtime | Applications        | Runtime supplies validated, immutable composition registry                                     |
| Solution          | Plugin              | Solution publishes a versioned extension contract; Plugin conforms                             |
| All modules       | Audit               | Modules publish security audit intents; Audit owns durable representation                      |

## Collaboration patterns

- Use a **published language** for IDs, event envelopes, capabilities, and lifecycle
  facts.
- Use an **anti-corruption layer** around identity providers, databases, queues, storage
  providers, and external systems.
- Use a synchronous public interface only for local validation or reads that require
  immediate response.
- One command cannot write data owned by multiple modules in one transaction.
  Cross-owner workflows use a process manager and integration events.
- Reporting consumes events into owned projections instead of joining another context's
  tables.

## Cycle prevention

If two contexts require synchronous calls in both directions, the design is invalid.
Resolve it by moving the invariant to its true owner, introducing a published
policy/value, or converting one direction to an event/projection.

Contract or infrastructure packages cannot be used to hide a domain cycle.

Analytics consumes published, minimized facts and never becomes an upstream dependency
of operational contexts. External integration adapters sit at the edge and translate
provider contracts into owned application ports; provider types never become the
published language.

## Related decisions

- [ADR 0006: Solution and Plugin contracts](../adr/0006-solution-plugin-contracts.md)
- [ADR 0012: Module-local transactions](../adr/0012-module-local-transactions.md)
- [ADR 0015: Clean Architecture with selective DDD](../adr/0015-clean-architecture-selective-ddd.md)
- [ADR 0036: Governed analytics plane](../adr/0036-governed-analytics-plane.md)
- [ADR 0037: Integration boundaries](../adr/0037-integration-boundaries.md)
