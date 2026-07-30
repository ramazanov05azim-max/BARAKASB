# Authentication

## Goals

Authentication proves the actor's identity. It never grants access to a Project or
business capability by itself.

## Protocol

BARAKASB uses an OpenID Connect provider with OAuth 2.1 Authorization Code flow and
PKCE. The provider is replaceable behind an identity adapter. Password and MFA
implementation are delegated to the provider unless an ADR accepts the security and
operating cost of first-party credentials.

Required provider capabilities:

- verified email and immutable issuer-plus-subject identifier;
- MFA and WebAuthn/passkeys;
- session revocation;
- key rotation and standards-compliant discovery;
- risk and audit signals suitable for enterprise operations.

## Web session

The browser uses a secure, HttpOnly, SameSite cookie containing an opaque BARAKASB
session identifier. The backend stores only hashed refresh credentials or provider
session references. CSRF defenses are required for state changes.

Access credentials are short-lived. Refresh credentials rotate on use, detect reuse, and
revoke the session family after suspected theft.

Email is contact/recovery metadata, not identity. Linking two provider identities
requires an authenticated, reauthenticated workflow and cannot occur solely because
emails match. Sensitive actions such as ownership transfer, security-setting changes,
credential export, and destructive Project operations require recent step-up
authentication.

The BFF is a confidential OAuth client. Browser cookies are host-only where practical,
`Secure`, `HttpOnly`, and explicitly scoped. State-changing browser requests use origin
checks and anti-CSRF tokens bound to the session.

## API and WebSocket

Machine clients use scoped OAuth access tokens. Tokens are validated for issuer,
audience, signature, expiry, and authorized party. WebSocket authentication occurs
during connection establishment; authorization is rechecked on subscription and when
membership changes.

Tokens do not contain authoritative project permissions. Permission decisions use
current server-side membership and policy data.

Workloads use dedicated service identities with audience- and purpose-scoped
credentials. A human session is never copied into a background job. Jobs record the
requesting actor for audit and execute under an explicit system authority.

## Session lifecycle

Security events include sign-in, sign-out, refresh reuse, MFA change, identity
link/unlink, session revocation, and recovery. Sessions expose device and last activity
metadata to the user and support revocation per device or globally.

Account recovery is a privileged workflow with rate limiting, strong audit, and
notifications. It cannot silently change project ownership.

## Related decisions

- [ADR 0004: Provider-neutral OIDC](../adr/0004-oidc-authentication.md)
- [ADR 0017: Confidential web BFF](../adr/0017-confidential-web-bff.md)
