# Threat model

## Protected assets

- project-scoped business data and objects;
- identities, sessions, memberships, and permissions;
- Solution/Plugin configuration and lifecycle;
- audit history, backups, and encryption material;
- availability and integrity of API, jobs, events, and realtime delivery.

## Primary threats

| Threat                     | Required controls                                                                |
| -------------------------- | -------------------------------------------------------------------------------- |
| Cross-project IDOR/query   | Explicit project route, membership check, capability policy, RLS, composite keys |
| Stolen session/token       | HttpOnly cookies, MFA, short lifetime, rotation/reuse detection, revocation      |
| Privilege escalation       | Deny default, stable capabilities, ownership invariants, audited changes         |
| Plugin/Solution overreach  | Signed allowlist, manifest capabilities, public contracts, kill switch           |
| Event/job confused deputy  | Signed/trusted transport, project envelope, revalidation, idempotency            |
| Object path traversal/leak | Generated object keys, scoped signed URLs, metadata authorization                |
| Injection/XSS/CSRF/SSRF    | Runtime validation, parameterization, CSP/encoding, CSRF token, egress policy    |
| Supply-chain compromise    | Lockfiles, scans, SBOM, provenance, signing, protected CI                        |
| Resource exhaustion        | Project quotas, rate limits, bounded concurrency, backpressure                   |
| Audit tampering            | Append-only store, restricted writers, retention and integrity monitoring        |
| Authenticated cache bleed  | Uncached default, scoped revision keys, framework cache-isolation tests          |
| Stale regional writer      | Authoritative placement, monotonic epoch, fenced writes, failover tests          |
| Artifact substitution      | Digest-bound manifest, trust chain, compatibility lock, revocation               |
| Control-plane failure      | Signed snapshots, least privilege, fail-closed writes, cell containment          |

## Abuse cases required in tests

- Actor changes a Project ID while retaining another Project's resource ID.
- A revoked member reuses a cached response, WebSocket, job, or signed URL.
- A Plugin asks for an undeclared capability or target Solution version.
- A consumer receives duplicate, stale, reordered, or cross-project events.
- An uploaded object is served before validation and malware scanning.
- A compromised dependency attempts network or secret access in CI/runtime.
- A cached Server Component or CDN response is requested by another actor or Project.
- An API node, job, or event with an old placement epoch writes after a Project move.
- A valid manifest is paired with a different, revoked, or mismatched browser/server
  artifact.
- Placement or policy data is stale, unavailable, replayed, or downgraded.

## Review cadence

Review at least quarterly during active development and before every trust boundary,
authentication, authorization, upload, third-party integration, or extension-runtime
change.
