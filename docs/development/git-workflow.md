# Git workflow

## Branches

`main` is protected and always releasable. Work uses short-lived branches:

```text
feat/<scope>-<description>
fix/<scope>-<description>
chore/<scope>-<description>
docs/<scope>-<description>
```

Merge through reviewed pull requests with required CI. Prefer squash merge so the
resulting commit preserves a coherent Conventional Commit message.

## Commits

Use:

```text
type(scope): imperative summary
```

Allowed common types: `feat`, `fix`, `refactor`, `test`, `docs`, `build`, `ci`, `chore`,
`perf`, and `revert`. Mark breaking public-contract changes with `!` and a
`BREAKING CHANGE` footer.

## Reviews

At least one owner reviews normal changes. Identity, authorization, tenancy, migrations,
extension runtime, security policy, and deployment changes require a designated
platform/security owner once teams are established.

No generated artifact, dependency update, or migration bypasses review.

## Related decision

- [ADR 0026: Architecture quality gates](../adr/0026-architecture-quality-gates.md)
