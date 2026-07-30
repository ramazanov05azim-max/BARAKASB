# ADR 0035: Use just-in-time privileged production access

- **Status:** Accepted
- **Date:** 2026-07-30
- **Owners:** Security, Reliability

## Context

Runtime service credentials, database-owner credentials, and human administration have
different risks. A standing administrator or developer path into shared production
stores could bypass project authorization and row-level security.

## Decision

Production privilege is deny-by-default and just in time. Humans use a dedicated,
identity-aware administrative path with strong authentication, reason, ticket, expiry,
least-privilege role, and immutable audit. Restricted data operations require dual
approval and recorded sessions.

Runtime workloads never receive migration-owner or RLS-bypass credentials. Migration,
break-glass, and recovery identities are separate, time-bound, and cannot be used from
developer laptops directly against shared production databases.

## Why this decision

It reduces standing privilege, separates duties, and makes exceptional access
attributable and revocable.

## Alternatives considered

- Permanent administrator roles: rejected due to credential exposure and weak
  accountability.
- Shared operational accounts: rejected because actions cannot be attributed.
- Rely on application authorization for operators: rejected because operators often need
  infrastructure-level recovery paths.

## Consequences

An access broker, approval workflow, runbooks, and emergency drills are required.
Emergency access may be slower, so rehearsed automation is essential.

## Validation

Quarterly access reviews and break-glass drills prove expiry, approval, recording,
alerting, and credential separation.

## Revisit when

Regulation requires stricter approval, locality, or session-recording controls.
