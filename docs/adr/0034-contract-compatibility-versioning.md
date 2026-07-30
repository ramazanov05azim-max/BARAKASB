# ADR 0034: Govern contract compatibility and versioning

- **Status:** Accepted
- **Date:** 2026-07-30
- **Owners:** Platform Architecture, API Governance

## Context

A ten-year platform must upgrade clients, cells, events, Solutions, and Plugins without
requiring an instantaneous fleet release or silently changing meaning.

## Decision

Maintain a machine-readable compatibility registry:

- public REST uses an explicit major version; additive changes stay within a major;
- a superseded public major remains supported for at least twelve months after its
  successor is generally available, normally including current and previous major;
- deprecation and sunset metadata are published before removal;
- event type and schema versions are explicit; published meaning is immutable and
  consumers own upcasters;
- Solution and Plugin manifests use Semantic Versioning compatibility ranges while the
  deployment lock resolves exact signed artifact digests;
- private monorepo packages release with the platform and are not treated as public
  SemVer APIs;
- database schemas evolve through expand/contract and are never a client contract.

Security emergency removal may shorten the window through an approved exception,
communication plan, and migration path.

## Why this decision

Explicit compatibility windows make independent rollout safe while limiting permanent
legacy support.

## Alternatives considered

- Version everything independently: rejected because it creates coordination overhead
  for private packages.
- Lockstep all external clients and extensions: rejected because fleet and customer
  upgrades cannot be atomic.
- Indefinite backward compatibility: rejected because it creates unbounded technical
  debt and security exposure.

## Consequences

Contract tests, usage telemetry, deprecation ownership, and migration guides are
mandatory. Breaking changes require a new major and coexistence plan.

## Validation

CI checks the compatibility registry, schemas, generated clients, event fixtures, and
current/previous-major consumer tests.

## Revisit when

Commercial support commitments or regulated deployments require a different support
window.
