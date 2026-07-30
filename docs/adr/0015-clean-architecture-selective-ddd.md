# ADR 0015: Use Clean Architecture with selective DDD

- **Status:** Accepted
- **Date:** 2026-07-30
- **Owners:** Platform Architecture

## Context

BARAKASB must keep domain rules independent from NestJS, Next.js, PostgreSQL, Redis, and
provider SDKs. Applying full tactical DDD to every configuration record would, however,
create ceremony without protecting meaningful invariants.

## Decision drivers

- framework and provider replaceability;
- testable domain behavior;
- explicit module ownership;
- low accidental complexity for simple platform metadata.

## Decision

Dependencies point inward from presentation and infrastructure to application and
domain. Domain code is framework-free. Ports are introduced at I/O, volatility, or
ownership boundaries.

Use aggregates, value objects, domain services, and domain events only where behavior
and invariants justify them. Simple CRUD-shaped metadata may use validated application
services without artificial aggregates or empty layers.

## Why this option

It protects the expensive, long-lived business and security rules while avoiding a
folder-and-interface tax for behaviorless code. The rule is dependency direction and
ownership, not a mandatory number of classes.

## Alternatives considered

- Framework-centric modules: rejected because domain rules would inherit framework and
  persistence lifecycle.
- Full tactical DDD everywhere: rejected because ceremony would obscure rather than
  clarify simple data operations.
- Transaction-script-only architecture: rejected because complex invariants would
  scatter across entry points.

## Consequences

Reviewers must judge when domain modeling is warranted. Packages may omit unused layers,
but cannot bypass public boundaries or place domain rules in controllers, repositories,
or React components.

## Validation

Dependency tests reject framework imports from domain layers. Reviews and tests prove
that invariants have one owner.
