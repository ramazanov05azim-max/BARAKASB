# Environment strategy

## Environment classes

- **local**: developer-owned, disposable dependencies and synthetic data
- **test**: ephemeral per-branch/CI resources
- **staging**: production-like topology and release candidate validation
- **production**: customer workloads under controlled change management

Resources, identities, networks, databases, buckets, encryption keys, and telemetry
access are isolated between classes. Credentials are never reused.

## Promotion

CI builds an immutable artifact once. The same signed artifact is promoted from test to
staging to production with environment-specific configuration injected at runtime.

Production deploys require successful compatibility, migration, isolation, security,
smoke, and rollback checks. Emergency changes follow the same artifact and audit path
with expedited review.

## Data policy

Production data does not enter lower environments. Debugging uses redacted exports
produced by an approved pipeline or synthetic reproduction data.

## Related decision

- [ADR 0029: Build once and promote artifacts](../adr/0029-build-once-promote-artifacts.md)
