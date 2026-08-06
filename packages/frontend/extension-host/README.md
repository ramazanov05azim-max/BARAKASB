# Frontend extension host

Validates and composes project-enabled Solution and Plugin UI contributions. Only
deployment-allowlisted, version-compatible entry points may register.

Stage 7.1 provides an empty in-memory `SolutionRuntimeRegistry` as the browser-side
composition seam. Registration is keyed by `solutionKey`; duplicate registration is
rejected explicitly. The registry is not the Solution catalog and does not own Project
installation state, compatibility policy, or lifecycle.

The package also owns the browser-only Operational Module runtime registry. It binds one
validated transport-neutral module manifest to one renderer per `workspaceType`.
Renderers remain Solution-owned and are composed by the existing `apps/web` allowlist;
the registry never supplies shared business UI or discovers arbitrary code.
