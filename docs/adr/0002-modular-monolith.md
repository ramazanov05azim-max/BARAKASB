# ADR 0002: Start the backend as a modular monolith

- **Status:** Superseded
- **Date:** 2026-07-30
- **Owners:** Platform Architecture
- **Superseded by:** [ADR 0032](0032-plane-separated-modular-deployments.md)

## Context

The platform needs strong domain boundaries and future scalability, but Phase 1 has no
evidence that independent network services improve delivery or reliability.

## Decision

Deploy a stateless NestJS API and separate worker composed from independently owned
modules. Modules communicate through public application interfaces or events, own their
data, and never query another module's repositories.

## Alternatives considered

- Microservices from the start: rejected due to distributed consistency, deployment,
  observability, and developer-cost overhead without measured need.
- Unstructured monolith: rejected because it prevents ownership and extraction.

## Consequences

Transactions and local development remain simpler. Boundary enforcement becomes a
critical CI responsibility. Modules may be extracted only using the criteria in the
backend architecture.

## Revisit when

A bounded context has independent scale, compliance, failure-isolation, or team
ownership requirements that the modular deployment cannot satisfy.
