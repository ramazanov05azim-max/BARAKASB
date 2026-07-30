# Testing strategy

## Test pyramid

1. Domain unit tests for invariants and policies
2. Application tests with in-memory or contract-test ports
3. Adapter integration tests against real PostgreSQL, Redis, and object-storage
   compatible services
4. Module boundary tests through public interfaces
5. API and WebSocket contract tests
6. A small number of critical end-to-end workflows

Mocking framework internals or database behavior is avoided when a real containerized
dependency gives more trustworthy results.

## Mandatory suites

- project-isolation and RLS tests;
- authorization matrix tests;
- migration forward/rolling-compatibility tests;
- outbox and consumer idempotency tests;
- Solution/Plugin manifest compatibility tests;
- API and event schema compatibility tests;
- frontend project-switch data-clearing tests;
- Next.js SSR, data-cache, request-memoization, CDN, and browser cache-bleed tests;
- pooled-connection RLS reset tests after commit, rollback, cancellation, and timeout;
- stale membership/policy and placement-epoch rejection tests;
- extension artifact digest, signature, revocation, and cross-runtime lock tests;
- outbox fairness, replay, backlog, and noisy-Project tests;
- WebSocket invalidation, slow-consumer, reconnect-storm, and bounded-buffer tests;
- backup restore drills and object-reference reconciliation.
- composition-profile tests proving each plane lacks undeclared modules and credentials;
- extension-runner secret, filesystem, network, cross-project, and resource-escape
  tests;
- compatibility-registry tests against current and previous public majors;
- privileged-access expiry, approval, recording, and break-glass drills.

## Test data

Factories create explicit Projects and actors. Tests involving business data use at
least two Projects and prove both allowed access and denied cross-project access.
Production data and credentials are forbidden.

## Quality gates

A pull request must pass format, lint, typecheck, affected tests, architecture
constraints, schema compatibility, dependency/security scanning, and relevant builds.
`main` additionally runs full isolation, integration, and migration suites.

Pre-production runs load, soak, burst, cache-loss, dependency-failure, cell-failover,
and extension-rollout profiles against declared capacity budgets. Averages are
insufficient; tests include Project-size and traffic skew.

Flaky tests are treated as defects. Quarantine requires an owner, issue, expiry, and no
loss of a security or isolation gate.

## Related decision

- [ADR 0026: Architecture quality gates](../adr/0026-architecture-quality-gates.md)
- [ADR 0032: Plane-separated modular deployments](../adr/0032-plane-separated-modular-deployments.md)
- [ADR 0033: Extension execution isolation](../adr/0033-extension-execution-isolation.md)
