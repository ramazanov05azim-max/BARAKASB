# Local development contract

Phase 1 intentionally provides no runnable applications. The implementation phase will
add a Docker-based dependency profile and package manifests.

The local environment must eventually provide:

- PostgreSQL with RLS enabled and a non-bypass application role;
- Redis;
- S3-compatible object storage;
- an OIDC development realm/provider;
- OpenTelemetry collector and inspectable local telemetry.

Local defaults must use synthetic data and disposable credentials. Configuration comes
from a validated `.env` generated from `.env.example`; `.env` is ignored.

Planned workflow:

```text
corepack enable
pnpm install --frozen-lockfile
pnpm infra:up
pnpm migrate
pnpm dev
```

These commands must not be added until their targets are implemented and verified.
Documentation never claims a command works before it exists.

## Related decisions

- [ADR 0027: Central runtime version policy](../adr/0027-central-runtime-version-policy.md)
- [ADR 0028: Validated configuration and external secrets](../adr/0028-validated-config-external-secrets.md)
