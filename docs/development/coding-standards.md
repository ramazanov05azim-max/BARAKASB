# Coding standards

## General

- Prefer explicit, boring code over clever abstractions.
- Model invariants once, in the owning domain.
- Keep functions and public interfaces focused.
- Depend on capabilities through ports and public package exports.
- Return typed results for expected failures; throw only for programming or
  infrastructure failures.
- Make time, randomness, identity generation, and external I/O injectable.
- Do not log and rethrow at every layer; record failures once with context.

## Module rules

- One package owns each concept and persistence model.
- Controllers and React components do not contain domain rules.
- Repositories do not return ORM records outside infrastructure.
- DTOs do not become domain entities through type aliases.
- Cross-module calls use public application interfaces or events.
- Project-scoped code cannot accept a missing/optional Project context.

## API rules

- Validate at entry points and reject unknown fields where ambiguity is risky.
- Map domain errors to stable Problem Details codes.
- Do not expose stack traces, SQL, provider errors, or internal identifiers.
- Require idempotency for retryable state-changing endpoints.
- Version public contracts and test backward compatibility.

## Security rules

- Never authorize from frontend state or token claims alone.
- Never construct project scope from body data when it exists in the route.
- Never create cache, object, event, job, or lock keys without Project scope.
- Never interpolate SQL, shell commands, paths, or HTML from untrusted input.
- Treat secrets and personal data as redacted by default.

## Comments and documentation

Comments explain why, constraints, or non-obvious risk—not what syntax does. Public
contracts document invariants, compatibility, errors, idempotency, and authorization.
Architecture changes update docs and ADRs in the same change.

## File limits

File size is a review signal, not an automatic refactoring rule. Split code when it
contains multiple responsibilities or ownership boundaries. Do not create generic
`utils`, `helpers`, or `common` dumping grounds.

## Related decisions

- [ADR 0015: Clean Architecture with selective DDD](../adr/0015-clean-architecture-selective-ddd.md)
- [ADR 0026: Architecture quality gates](../adr/0026-architecture-quality-gates.md)
