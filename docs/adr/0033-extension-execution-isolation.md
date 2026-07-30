# ADR 0033: Isolate non-platform extension execution

- **Status:** Accepted
- **Date:** 2026-07-30
- **Owners:** Platform Architecture, Security

## Context

Solutions and Plugins can eventually include partner or customer-controlled code. An
in-process extension inherits the host's memory, credentials, network, and failure
domain, so package boundaries alone are not a security boundary.

## Decision

Only reviewed platform-owned extensions may run in trusted application processes.
Partner or customer-controlled code runs out of process in `extension-runner` with:

- a dedicated workload identity and short-lived project-scoped capability token;
- no direct PostgreSQL, Redis, object-store, or secret-store access;
- an allowlisted, audited platform API;
- denied-by-default network and filesystem access;
- CPU, memory, time, concurrency, and outbound-request quotas;
- revocation, termination, and per-artifact quarantine controls.

The extension contract is transport-neutral so the same extension can move from trusted
in-process execution to an isolated runner without changing business semantics.

## Why this decision

This turns the extension trust classification into an enforceable runtime boundary and
contains compromise, resource abuse, and dependency failure.

## Alternatives considered

- Run every extension in process: rejected because code ownership would be confused with
  trust.
- Forbid third-party extensions forever: rejected because it conflicts with the
  platform's long-term extensibility goal.
- Rely only on language-level sandboxing: rejected because it does not isolate native
  dependencies, credentials, network, or resource exhaustion.

## Consequences

Isolated calls add latency and operational complexity. Extension APIs must be coarse,
versioned, retry-safe, and quota-aware. Local development needs an isolated-runner
profile.

## Validation

Threat tests attempt secret, filesystem, cross-project, network, and resource escape.
Revocation tests prove a compromised artifact loses access without a platform release.

## Revisit when

A formally evaluated sandbox can provide equivalent isolation with lower operational
cost.
