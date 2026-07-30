# ADR 0013: Bind extension trust to immutable artifacts

- **Status:** Accepted
- **Date:** 2026-07-30
- **Owners:** Platform Architecture and Security

## Context

A signed manifest does not prove that the server, worker, and browser code loaded at
runtime are the reviewed bytes. Independent application deployment can also create
incompatible extension registries.

## Decision

Catalog identity includes the manifest and artifact-set digests. Admission verifies
publisher trust, signatures, SBOM, provenance, vulnerability policy, and revocation. CI
emits one signed deployment compatibility lock spanning web, API, worker, Core, and
extensions. Processes fail readiness when their lock digest differs.

## Alternatives considered

- Trust package names and semantic versions: rejected because versions can be
  republished or resolved to different artifacts.
- Validate only at package installation: rejected because runtime and deployment drift
  can occur later.

## Consequences

Artifacts are immutable and revocable. Build and deployment pipelines must preserve
provenance and lock identity. Emergency revocation needs a tested kill-switch and
recovery path.

## Validation

Tests replace, revoke, downgrade, and mismatch every artifact class; catalog admission
or process readiness must fail closed.
