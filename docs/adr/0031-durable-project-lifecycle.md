# ADR 0031: Orchestrate Project lifecycle as a durable workflow

- **Status:** Accepted
- **Date:** 2026-07-30
- **Owners:** Platform Architecture

## Context

Provisioning, suspension, archival, movement, and deletion involve Projects, Placement,
Access Control, extension runtimes, data owners, objects, jobs, and backups. One
synchronous transaction cannot own all of them.

## Decision drivers

- observable and resumable lifecycle;
- module-local transaction ownership;
- safe compensation and deletion evidence;
- consistent state across cells and extensions.

## Decision

Project lifecycle is an explicit state machine driven by durable operation IDs.
Cross-module transitions use a process manager, outbox events, idempotent steps, and
compensation. `active` is reached only after required owners report readiness for the
same operation.

Suspension blocks writes/jobs by policy. Final deletion freezes placement, disables
extensions, collects deletion evidence from every owner, applies legal-hold/backup
rules, and retains only the minimum permitted tombstone.

## Why this option

Durable orchestration survives process failure and makes partial progress visible. It
respects module ownership instead of relying on an impossible cross-system transaction.

## Alternatives considered

- One synchronous API transaction: rejected because lifecycle crosses modules, stores,
  processes, and backup time horizons.
- Manual operator checklist: rejected because it is not idempotent, observable, or
  scalable.
- Infer state from resource existence: rejected because partial failure becomes
  ambiguous.

## Consequences

Users and operators see transitional/degraded states. Process-manager recovery,
timeouts, compensation, and reconciliation become Core platform responsibilities.

## Validation

Tests inject failure after every lifecycle step, repeat commands, move Projects, retain
legal holds, and verify convergence without cross-Project effects.
