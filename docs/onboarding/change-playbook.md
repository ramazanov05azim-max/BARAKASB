# Architecture change playbook

## Before changing anything

1. Identify the owning bounded context in the
   [Module catalog](../architecture/module-catalog.md).
2. Read its architecture document and related ADRs through the
   [Decision map](../architecture/decision-map.md).
3. Determine data class, Project/global scope, write owner, public contract, failure
   modes, and capacity impact.
4. Create an ADR first if the change alters a cross-cutting rule or accepted decision.

## Add a Core capability

- Prove it is business-neutral and needed by more than one future Solution or by
  platform governance itself.
- Define one owner and public application contract.
- Keep domain logic framework-free.
- Declare Project/global scope, capabilities, events, data lifecycle, and failure mode.
- Add Nx tags, boundary documentation, architecture tests, and CODEOWNERS.

Do not place a capability in Core merely because it is reusable.

## Add a Solution

This is blocked until the Foundation acceptance gate is complete and an ADR authorizes
the first Solution.

When allowed, define bounded context, manifest, Core compatibility, capabilities,
project-scoped storage, contracts, migrations, lifecycle, health, quotas, data classes,
retention, residency, and Plugin extension points. A Solution cannot import another
Solution's internals.

## Add a Plugin

Target one Solution and one compatible extension-contract range. Request the minimum
capabilities. Declare immutable artifacts, configuration schema, storage namespace, data
lifecycle, resource budgets, lifecycle hooks, and failure policy.

Never patch Core, replace authorization, deep-import the Solution, or execute
user-uploaded code in the main processes.

## Add or change an API

- Put Project ID in the canonical route when scoped.
- Define runtime schemas and Problem Details errors.
- Declare capability, idempotency, concurrency, pagination, and compatibility.
- Update OpenAPI and generated-client contract tests.
- Add a two-Project negative test.

## Add an event or job

- Event names are past-tense facts owned by the producer.
- Define schema version, Project/global scope, actor/system authority, ordering key,
  sensitive-data classification, retention, and replay behavior.
- Write events through the outbox.
- Make consumers and jobs idempotent and placement-epoch aware.

## Add a migration

Use expand/contract. Structural changes are cell/shard scoped; Project transformations
are bounded checkpointed jobs rolled out through canary cohorts. Never run an unbounded
fleet backfill during application startup.

## Add caching

Begin with no cache. Identify the authoritative source, invalidation revision, TTL,
failure behavior, capacity, and Project/actor/policy key dimensions. Authenticated
frontend caching requires the evidence in ADR 0014.

## Finish

Run:

```text
pnpm format:check
pnpm architecture:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Targets without implementation may report no tasks during Foundation. Complete the
[Definition of Done](../development/definition-of-done.md).
