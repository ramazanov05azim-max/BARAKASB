# Architecture principles

## Business boundaries first

Packages are organized around capabilities and ownership, not technical framework
folders. DDD is applied where behavior and invariants justify a domain model.
CRUD-shaped platform metadata may use simpler application services.

## Clean Architecture

Every backend capability follows this dependency direction:

```text
presentation -> application -> domain
infrastructure -> application/domain ports
```

The domain layer is framework-free. Application use cases coordinate domain objects and
ports. Infrastructure implements ports. Presentation maps transport contracts to use
cases.

## SOLID in practice

- A module has one clearly stated reason to change.
- Use cases depend on ports, not database, queue, or vendor SDK implementations.
- Public interfaces are small and capability-oriented.
- Extensions add behavior through registered contracts rather than conditionals in Core.
- Implementations can be replaced without altering domain rules.

## Explicit over implicit

Project context, authorization decisions, transactions, idempotency, event versions, and
dependency ownership must be visible in code and tests. Global mutable state, ambient
tenant state outside a controlled request scope, and magic discovery by file-system
scanning are forbidden.

## Secure by default

All access is denied unless explicitly granted. All business data is project-scoped.
Trust boundaries are validated at entry points and preserved through background jobs and
events.

## Evolution without compatibility debt

Public APIs, events, Solution contracts, and Plugin extension points are versioned.
Breaking changes require a migration window, compatibility policy, and ADR.

## Related decision

- [ADR 0015: Clean Architecture with selective DDD](../adr/0015-clean-architecture-selective-ddd.md)
