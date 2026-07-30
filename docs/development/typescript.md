# TypeScript standards

## Compiler policy

All packages extend `tsconfig.base.json`. Strictness may not be weakened locally without
an ADR. `any`, non-null assertions, unchecked casts, and `@ts-ignore` require a
documented boundary justification; `unknown` plus validation is preferred.

## Types

- Use branded IDs to prevent mixing identity, Project, and resource IDs.
- Use discriminated unions for state and result variants.
- Model invalid states out when practical.
- Prefer immutable inputs and values.
- Avoid enums in public contracts; use literal unions or schema-owned values.
- Do not reuse persistence records or generated transport DTOs as domain types.

## Imports and exports

- Every package exposes an explicit `exports` map backed by `public.ts`.
- Use `import type` for type-only dependencies.
- Avoid barrels inside implementation layers when they obscure dependencies.
- Cross-package imports use `@barakasb/*`, never filesystem paths.
- Server-only and browser-only entry points are separate.

## Async behavior

- Promises are awaited or deliberately returned.
- Every external call has timeout, cancellation where supported, and an error
  translation boundary.
- Parallel work uses explicit concurrency bounds.
- Retries are owned by infrastructure policy and applied only to idempotent operations.

## Validation

Static types do not validate runtime input. HTTP, events, configuration, database JSON,
cache payloads, and provider responses use versioned runtime schemas before becoming
application values.

## Naming

- Types/classes: `PascalCase`
- Variables/functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE` only for true process-wide constants
- Files: `kebab-case.ts`
- Use cases: verb + noun (`CreateProject`)
- Events: past tense (`ProjectCreated`)
- Capabilities: lowercase dot-separated namespaces

## Related decisions

- [ADR 0015: Clean Architecture with selective DDD](../adr/0015-clean-architecture-selective-ddd.md)
- [ADR 0027: Central runtime version policy](../adr/0027-central-runtime-version-policy.md)
