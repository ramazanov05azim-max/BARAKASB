# ADR 0029: Build once and promote immutable artifacts

- **Status:** Accepted
- **Date:** 2026-07-30
- **Owners:** Platform Engineering and Reliability

## Context

Rebuilding separately for staging and production can produce different dependencies or
bytes. Mixing environment configuration into builds weakens provenance and rollback.

## Decision drivers

- identical tested and production bytes;
- verifiable provenance;
- predictable promotion and rollback;
- strict environment isolation.

## Decision

CI builds and signs each artifact once. The same immutable digest is promoted through
test, staging, and production. Environment-specific configuration and secret references
are injected at runtime.

Environment classes use separate accounts/projects, identities, networks, databases,
buckets, caches, encryption keys, and telemetry access. Production deploys only
artifacts promoted by the trusted pipeline.

## Why this option

Promotion preserves the evidence produced in test and makes rollback select a known
digest rather than repeat an uncontrolled build.

## Alternatives considered

- Build separately per environment: rejected because dependency and toolchain drift can
  make staging evidence irrelevant.
- Bake production secrets/config into images: rejected because artifacts become
  sensitive, non-portable, and hard to rotate.
- Deploy mutable tags: rejected because the same release label can refer to different
  bytes.

## Consequences

Artifacts must be environment-neutral. Runtime configuration compatibility is tested.
Data rollback remains a separate forward-fix/recovery concern.

## Validation

Promotion verifies digest, signature, SBOM, provenance, compatibility lock, and runtime
configuration schema before readiness.
