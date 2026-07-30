# Contributing

BARAKASB is architecture-first. A change is acceptable only when it preserves project
isolation, dependency direction, explicit contracts, and auditability.

## Before implementation

1. Read [Engineering standards](docs/development/coding-standards.md).
2. Find the owning bounded context in the
   [Module catalog](docs/architecture/module-catalog.md).
3. Create an ADR when the change affects a cross-cutting constraint, public contract,
   data ownership, security model, or deployment topology.
4. Add the smallest public contract needed; never deep-import another module.

## Pull requests

- Use Conventional Commits.
- Keep infrastructure, behavior, and refactoring changes reviewable.
- Include tests at the appropriate layer.
- Call out data migrations, security impact, API compatibility, and rollback.
- Update documentation in the same pull request.

The complete review checklist is in
[Definition of Done](docs/development/definition-of-done.md).

For Phase 1 structural changes, run:

```text
pnpm format:check
pnpm architecture:check
```
