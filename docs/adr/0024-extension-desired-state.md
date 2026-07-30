# ADR 0024: Reconcile extension desired state to effective state

- **Status:** Accepted
- **Date:** 2026-07-30
- **Owners:** Extension Platform

## Context

Installing or upgrading an extension spans validation, schema compatibility, Project
backfills, configuration, capability activation, and health verification. A synchronous
request cannot reliably complete this workflow across restarts and partial failures.

## Decision drivers

- resumable Project-scoped lifecycle;
- deterministic dependency ordering;
- observable partial failure;
- safe fleet rollout.

## Decision

Commands change desired installation state. A durable reconciler advances effective
state through idempotent checkpointed steps using a monotonic operation ID and placement
epoch. Dependencies form a validated acyclic graph.

Capability activation occurs last, after artifacts, compatibility lock, structural
schema, Project data/configuration, and health agree on one compatibility epoch.
Authoritative fencing prevents two reconcilers; a Redis lease alone is insufficient.

## Why this option

The controller/reconciler model converges after crashes and makes current, desired, and
failed state observable. It scales better than holding a request open or inferring
completion from locks.

## Alternatives considered

- Synchronous install transaction: rejected because the workflow crosses module,
  migration, and process boundaries.
- Fire-and-forget scripts: rejected because state, retry, ownership, and recovery would
  be implicit.
- Dynamic route mutation per Project: rejected because application registries become
  inconsistent across instances.

## Consequences

Users and operators observe intermediate states. Reconciliation requires operation
history, checkpoints, retry budgets, canary cohorts, pause, and kill switches.

## Validation

Failure is injected after every step and during node/placement changes; reconciliation
must resume or compensate without partial capability exposure.
