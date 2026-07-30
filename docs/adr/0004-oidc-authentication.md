# ADR 0004: Use provider-neutral OIDC authentication

- **Status:** Accepted
- **Date:** 2026-07-30
- **Owners:** Platform Architecture and Security

## Context

Secure credential storage, MFA, recovery, federation, and abuse protection are
specialized capabilities. BARAKASB still needs provider portability and its own
revocable application sessions.

## Decision

Use OpenID Connect with OAuth 2.1 Authorization Code and PKCE through an adapter. Use
opaque secure browser sessions, short-lived access credentials, rotation, reuse
detection, and server-side Project authorization.

## Alternatives considered

- First-party password authentication: rejected until a separate ADR justifies its
  security and operational burden.
- Provider tokens in browser storage: rejected due to exposure and revocation risk.

## Consequences

BARAKASB depends on an identity provider but avoids vendor-specific domain coupling.
Provider outage and account-linking behavior need explicit handling.
