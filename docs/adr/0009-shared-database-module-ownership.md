# ADR 0009: Share PostgreSQL infrastructure while preserving module ownership

- **Status:** Accepted
- **Date:** 2026-07-30
- **Owners:** Platform Architecture

## Context

A modular monolith benefits from simple transactions and operations, but a shared
database can create accidental coupling.

## Decision

Modules share a PostgreSQL deployment initially but own schema namespaces, migrations,
tables, repositories, and read models. Cross-module SQL and direct repository access are
forbidden. Collaboration uses IDs, public interfaces, or events.

## Alternatives considered

- Database per module: rejected initially because it imposes distributed consistency and
  operating cost without deployment independence.
- Shared unrestricted schema: rejected because ownership would be unenforceable.

## Consequences

Infrastructure is simpler while logical extraction remains possible. Architecture tests,
permissions, and reviews must detect cross-owner access.
