# External integration boundaries

## Inbound

Webhook adapters terminate at a controlled ingress boundary. They verify provider
signatures and freshness before expensive parsing, limit body size and rate, record a
replay-safe delivery identity, resolve the Project through configured ownership, and
enqueue idempotent processing. Payload fields never establish Project or actor
authority.

## Outbound

Outbound delivery uses a project-scoped subscription, signed request, delivery ID,
bounded retry schedule, dead-letter state, and visible operator controls. Destinations
are normalized and checked against egress and SSRF policy on every redirect and DNS
resolution. Secrets are referenced by version and rotate without changing domain state.

## Ownership

Domain/application packages define provider-neutral ports and events. Integration
adapters own SDKs, wire schemas, authentication, timeouts, rate limits, and provider
error mapping. No external call occurs inside a database transaction.

A dedicated integration-gateway deployment is optional and requires measured scale,
failure isolation, or separate ownership; the boundary exists before the service does.

## Related decisions

- [ADR 0008: Transactional outbox](../adr/0008-transactional-outbox.md)
- [ADR 0021: API idempotency and concurrency](../adr/0021-api-idempotency-concurrency.md)
- [ADR 0037: Integration boundaries](../adr/0037-integration-boundaries.md)
