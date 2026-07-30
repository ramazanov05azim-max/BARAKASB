# ADR 0037: Isolate external integration boundaries

- **Status:** Accepted
- **Date:** 2026-07-30
- **Owners:** Platform Architecture, Security

## Context

Webhooks and provider APIs introduce untrusted payloads, retries, secret rotation,
provider-specific SDKs, SSRF risk, and rate limits. Allowing these concerns inside
domain modules would spread external failure and trust assumptions.

## Decision

Inbound and outbound integrations use dedicated adapters behind platform ports. Inbound
webhooks authenticate before parsing expensive payloads, enforce size and rate limits,
store replay-safe receipt identity, and enqueue project-scoped processing. Outbound
delivery is signed, at-least-once, idempotent, observable, quota-limited, and uses an
egress allowlist with SSRF defenses.

Provider SDK types, credentials, and retry semantics do not cross into domain or public
application contracts. A separate deployable integration gateway is introduced only when
measured scale or trust isolation requires it.

## Why this decision

It contains provider churn and hostile traffic while keeping the domain portable and
retry semantics explicit.

## Alternatives considered

- Provider SDKs in domain modules: rejected due to coupling and secret leakage.
- Synchronous callbacks inside transactions: rejected because provider failure would
  hold locks and corrupt retry semantics.
- A gateway service immediately: rejected until scale or ownership justifies another
  deployable.

## Consequences

Adapters require contract fixtures, secret rotation, delivery ledgers, dead-letter
handling, and provider-specific observability.

## Validation

Tests cover signature failure, replay, SSRF, payload bombs, timeout, duplicate delivery,
secret rotation, and cross-project attempts.

## Revisit when

Integration volume or organizational ownership justifies a dedicated gateway.
