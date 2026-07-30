# ADR 0026: Make architecture and isolation executable quality gates

- **Status:** Accepted
- **Date:** 2026-07-30
- **Owners:** Platform Architecture and Quality Engineering

## Context

Documentation and code review alone cannot reliably prevent deep imports, missing
Project scope, cache leakage, or incomplete contracts as teams and packages grow.

## Decision drivers

- fast feedback before merge;
- objective enforcement of platform invariants;
- protection against cross-Project regressions;
- scalable review effort.

## Decision

CI enforces repository structure, package tags, dependency constraints, public exports,
format, typecheck, tests, builds, schema compatibility, migrations, supply-chain scans,
and documentation links.

Every project-scoped behavior has positive access tests and two-Project negative tests.
`main` runs full isolation, integration, migration, restore, and contract suites.
Security and isolation gates cannot be quarantined.

## Why this option

Executable constraints remain consistent as contributors and packages grow. The
two-Project pattern proves denial, not merely the expected success path.

## Alternatives considered

- Review checklist only: rejected because repetitive structural mistakes are easy to
  miss.
- End-to-end tests only: rejected because feedback is slow and failures are difficult to
  localize.
- Coverage percentage as the primary gate: rejected because it does not prove critical
  invariants.

## Consequences

Tooling and test infrastructure are production assets with owners. Exceptions require a
time-bounded ADR or risk record and cannot weaken Project isolation.

## Validation

The gate is tested with intentionally invalid fixtures and monitored for runtime,
flakiness, bypass, and false-positive rate.
