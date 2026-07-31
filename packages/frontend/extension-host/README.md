# Frontend extension host

Validates and composes project-enabled Solution and Plugin UI contributions. Only
deployment-allowlisted, version-compatible entry points may register.

Stage 7.1 provides an empty in-memory `SolutionRuntimeRegistry` as the browser-side
composition seam. Registration is keyed by `solutionKey`; duplicate registration is
rejected explicitly. The registry is not the Solution catalog and does not own Project
installation state, compatibility policy, or lifecycle.
