# ADR 0010: Execute only reviewed first-party extensions initially

- **Status:** Accepted
- **Date:** 2026-07-30
- **Owners:** Platform Architecture and Security

## Context

Executing third-party code inside the main API, worker, or browser would expose Project
data, secrets, network access, availability, and the software supply chain.

## Decision

Initial Solutions and Plugins are reviewed packages included in signed deployment
artifacts and selected from an allowlist. Project users cannot upload or execute
arbitrary code.

## Alternatives considered

- In-process marketplace packages: rejected because language isolation is not a security
  sandbox.
- Immediate external sandbox runtime: deferred because no third-party extension
  requirement exists yet.

## Consequences

The extension model supports controlled first-party modularity, not an open marketplace.
Third-party execution requires a new threat model and ADR covering sandboxing, identity,
quotas, egress, secrets, signing, and incident controls.
