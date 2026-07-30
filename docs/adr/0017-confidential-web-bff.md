# ADR 0017: Use a confidential web BFF with opaque browser sessions

- **Status:** Accepted
- **Date:** 2026-07-30
- **Owners:** Frontend Platform and Security

## Context

The Next.js application performs server rendering and calls the API for a browser.
Forwarding reusable provider tokens to browser JavaScript expands the impact of XSS,
storage leakage, and extension code.

## Decision drivers

- minimize credentials exposed to the browser;
- centralized CSRF and session revocation;
- consistent SSR and API identity;
- provider portability.

## Decision

`apps/web` acts as a confidential BFF client. The browser receives only a secure,
HttpOnly, host-scoped opaque BARAKASB session cookie. Provider refresh credentials stay
server-side. State-changing browser requests use origin checks and an anti-CSRF token.

The BFF calls the API with a short-lived audience-bound internal assertion or validated
session context. It never forwards a reusable provider refresh credential.

## Why this option

It keeps high-value tokens out of browser storage while giving server rendering and API
calls one revocable session model. The provider remains behind an adapter.

## Alternatives considered

- SPA-held access/refresh tokens: rejected because browser storage and JavaScript
  increase token exposure.
- Direct browser-to-provider/API for every call: rejected because it duplicates session,
  CSRF, refresh, and SSR concerns.
- Stateful authorization in the BFF only: rejected because the API remains the
  authoritative enforcement point.

## Consequences

The BFF becomes security-sensitive and must scale as stateless compute backed by the
session store. API authorization is still repeated; BFF checks are not trusted as the
final decision.

## Validation

Tests cover CSRF, cookie scope, logout/revocation, token non-exposure, SSR identity, and
BFF/API audience confusion.
