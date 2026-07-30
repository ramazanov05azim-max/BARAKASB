# ADR 0028: Validate runtime configuration and externalize secrets

- **Status:** Accepted
- **Date:** 2026-07-30
- **Owners:** Platform Engineering and Security

## Context

Environment-specific configuration and credentials change independently of code.
Unvalidated values cause late runtime failures; secrets in files, images, command lines,
or manifests are difficult to rotate and commonly leak.

## Decision drivers

- fail fast on invalid deployment state;
- no secret material in repository or build artifacts;
- rotation without code deployment;
- one typed configuration contract per process.

## Decision

Each process validates typed configuration exactly once at startup and fails readiness
for missing, malformed, conflicting, or insecure production values.

Production secrets live in an external managed secret store and are accessed through
workload identity or short-lived references. Secret values never enter Git, container
images, frontend bundles, URLs, ordinary logs, or extension manifests.

## Why this option

Startup validation turns configuration errors into controlled deployment failures.
External secret ownership reduces credential lifetime and separates code/build access
from production-secret access.

## Alternatives considered

- Checked-in environment files: rejected because secrets and environment drift become
  part of source history.
- Long-lived environment credentials managed manually: rejected because rotation,
  attribution, and revocation are weak.
- Lazy validation at first use: rejected because failures appear under user traffic.

## Consequences

Processes depend on configuration/secret availability during startup and need documented
rotation and degraded behavior. Local development uses disposable values and an ignored
`.env`.

## Validation

Deployment tests exercise invalid configuration, secret absence/rotation, redaction, and
prove that artifacts and logs contain no secret values.
