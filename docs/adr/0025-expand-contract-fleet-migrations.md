# ADR 0025: Use expand/contract and cohort-based fleet migrations

- **Status:** Accepted
- **Date:** 2026-07-30
- **Owners:** Data Platform and Extension Platform

## Context

Rolling application releases require old and new code to coexist. A Solution or Plugin
upgrade may also need work across thousands of Project installations. One fleet-wide
transaction or unbounded backfill can lock tables and exhaust workers.

## Decision drivers

- zero-downtime rolling compatibility;
- bounded database and worker load;
- resumable per-Project transformation;
- automatic pause on unsafe rollout.

## Decision

Schema changes use expand, compatible deploy, bounded backfill, verify, switch, and
later contract. Structural migrations execute once per cell/shard.

Project data/configuration transformations are idempotent jobs with durable checkpoints,
Project or key-range scope, and global/per-cell concurrency budgets. Rollout progresses
through canary Projects and bounded cohorts with health-based pause conditions.

## Why this option

It separates schema compatibility from tenant-fleet work, keeping rolling releases safe
and preventing the number of Projects from becoming one unbounded operation.

## Alternatives considered

- In-place destructive migration: rejected because old processes and rollback would
  break.
- Migrate every Project during deployment startup: rejected because startup time and
  blast radius grow with tenant count.
- Manual one-off scripts: rejected because retry, observability, and evidence are weak.

## Consequences

Temporary dual schema/code paths increase short-term complexity. Contract cleanup is a
separate tracked release and cannot be forgotten.

## Validation

Migration tests run mixed application versions, production-like volume, skewed Projects,
pause/resume, repeated jobs, shard failure, and rollback within the compatibility
window.
