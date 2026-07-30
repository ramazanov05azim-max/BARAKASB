# Extension execution isolation

## Trust tiers

Package boundaries support maintainability; they do not sandbox code. Every extension
artifact is assigned a trust tier before activation:

| Tier              | Ownership                                | Execution                 | Data access              |
| ----------------- | ---------------------------------------- | ------------------------- | ------------------------ |
| Platform trusted  | reviewed and operated by BARAKASB        | approved host composition | declared ports only      |
| External isolated | partner or customer controlled           | `extension-runner`        | scoped platform API only |
| Quarantined       | unknown, revoked, or failed verification | none                      | none                     |

Trust is based on provenance and policy, not whether an artifact is called a Solution or
Plugin.

## Isolated runner boundary

The runner receives an exact signed digest and a short-lived token containing project,
artifact, capabilities, policy revision, placement epoch, audience, and expiry. It has
no database, cache, object-store, control-plane, or secret-store credentials.

Network and filesystem access are denied by default. Platform calls are allowlisted and
audited. CPU, memory, execution time, request rate, concurrency, and response size have
hard limits. The platform can terminate and revoke one artifact without affecting other
projects.

## Contract design

Extension APIs are coarse-grained, transport-neutral, idempotent, and explicitly
versioned. Context is supplied by the platform and never accepted from extension input
as authority. Errors and quota exhaustion are stable contract outcomes.

## Failure behavior

Extension failure cannot fail platform authentication, authorization, audit, or Project
lifecycle. Circuit breakers, bulkheads, bounded queues, and per-project fairness prevent
one extension from exhausting the cell.

## Related decisions

- [ADR 0010: First-party extensions initially](../adr/0010-first-party-extensions-only.md)
- [ADR 0013: Extension artifact trust](../adr/0013-extension-artifact-trust.md)
- [ADR 0033: Extension execution isolation](../adr/0033-extension-execution-isolation.md)
