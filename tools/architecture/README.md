# Architecture checks

`check.mjs` validates the Phase 1 repository contract without implementing product
behavior. It checks:

- every declared application and package directory has one valid Nx project;
- project names, roots, types, scopes, and runtime tags are unambiguous;
- each project has boundary documentation;
- required architecture and governance files exist;
- ADR numbers are unique and indexed;
- local Markdown links resolve;
- Solutions and Plugins contain no implementation code during the Foundation phase.

Run:

```text
pnpm architecture:check
```

When the Foundation acceptance gate authorizes implementations in `solutions/` or
`plugins/`, update the phase policy and checker in the same approved ADR.
