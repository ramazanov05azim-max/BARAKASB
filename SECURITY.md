# Security policy

## Reporting a vulnerability

Do not open a public issue for suspected vulnerabilities. Until a dedicated security
mailbox and private reporting workflow are established, contact the repository owner
directly through a private GitHub channel.

Include the affected boundary, impact, reproduction conditions, and suggested
mitigation. Never include production credentials or customer data.

## Security baseline

- Secrets never enter the repository, logs, URLs, or client bundles.
- Authentication follows OIDC/OAuth 2.1; authorization is enforced server-side.
- Every business-data operation is bound to a verified project context.
- PostgreSQL row-level security is mandatory for project-scoped tables.
- Dependencies and container images are pinned, scanned, and updated regularly.
- Security-relevant actions produce immutable audit records.

See [Security architecture](docs/architecture/security.md) and
[Threat model](docs/security/threat-model.md). Privileged operational access follows
[the just-in-time access model](docs/security/privileged-access.md).
