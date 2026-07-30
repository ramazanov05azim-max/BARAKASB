# Security architecture

## Trust boundaries

Untrusted inputs include browsers, API clients, webhooks, uploaded files,
Solution/Plugin configuration, queue payloads, cache values, and all external provider
responses.

Validation occurs at each boundary. Internal provenance does not make stale or replayed
data trustworthy.

## Baseline controls

- OIDC/OAuth 2.1, MFA, secure session cookies, and credential rotation
- deny-by-default project-scoped authorization
- PostgreSQL RLS and composite project constraints
- TLS in transit and managed encryption at rest
- secret manager references with workload identity
- dependency, container, IaC, and secret scanning
- strict CSP, output encoding, CSRF protection, and safe CORS allowlists
- upload type/size checks, malware scanning, and quarantined object state
- immutable audit trail for security and administrative changes
- classified data with explicit residency, retention, deletion, and key ownership

## Secret boundaries

Secrets are injected at runtime and never placed in Git, images, build logs, browser
bundles, URLs, manifests, or ordinary application logs. Applications request the
narrowest secret at the point of use. Rotation does not require a code deployment.

## Audit versus logs

Audit records answer who performed which security-relevant action, in which Project,
against what target, with what result and correlation ID. They are append-only and
retained under policy.

Application roles cannot update or delete audit records. Records are streamed to a
separately administered immutable/WORM-capable sink. Sequence checkpoints and integrity
digests make gaps or rewriting detectable; integrity metadata never replaces ordinary
backup and access controls.

Application logs diagnose behavior. They are structured, redacted, and may be sampled.
Neither system stores passwords, tokens, raw cookies, full payment data, or unrestricted
request bodies.

## Supply chain

Dependencies and container bases are pinned through lockfiles/digests. CI emits an SBOM,
verifies provenance, scans artifacts, and signs release artifacts. Production deploys
only artifacts promoted from CI.

Solution and Plugin manifests bind immutable artifact digests, signatures, SBOM,
provenance, and revocation status. A signed manifest never authorizes a different server
or browser bundle.

Redis coordination is advisory unless a database constraint, fencing token, or other
authoritative mechanism protects the invariant. A Redis lease alone cannot guarantee a
business-critical lock across pause, partition, or failover.

## Object ingestion

Uploads begin as bounded, expiring upload sessions. Clients write only to a generated
quarantine object key. Completion verifies size, content type, checksum, Project
ownership, and malware scan before atomic metadata promotion to available state. Signed
download access rechecks current authorization and object state.

## Security review triggers

Threat-model review is mandatory for authentication, authorization, file uploads,
webhooks, new external providers, new extension points, cryptography, cross-project
processing, data export/deletion, and third-party Plugin execution.

## Related decisions

- [ADR 0003: Project isolation](../adr/0003-project-isolation.md)
- [ADR 0004: OIDC authentication](../adr/0004-oidc-authentication.md)
- [ADR 0005: Capability authorization](../adr/0005-capability-authorization.md)
- [ADR 0013: Extension artifact trust](../adr/0013-extension-artifact-trust.md)
- [ADR 0018: Data lifecycle](../adr/0018-data-classification-lifecycle.md)
- [ADR 0019: Quarantined object ingestion](../adr/0019-quarantined-object-ingestion.md)
- [ADR 0020: OpenTelemetry and separate audit](../adr/0020-opentelemetry-and-separate-audit.md)
- [ADR 0033: Extension execution isolation](../adr/0033-extension-execution-isolation.md)
- [ADR 0035: Privileged production access](../adr/0035-privileged-production-access.md)
- [ADR 0037: Integration boundaries](../adr/0037-integration-boundaries.md)
