# Universal Application runtime mode

## Purpose

The Universal BARAKASB Application is the Platform-owned operational entry point for
employees and devices. It is designed to host any approved Solution Runtime. Coffee is
the first planned consumer, but does not own the application, its contracts, or its
shell.

Stage 7.1 implements this product as a runtime mode inside the existing `apps/web`
Next.js application. It does not add a deployable, browser composition root, backend, or
Coffee runtime.

## Architectural placement

```text
apps/web /app runtime mode
        |
        v
frontend-extension-host
        |
        v
contracts-platform
```

The responsibilities remain separated:

- `apps/web` owns the browser shell, namespaced routes, localization, local bootstrap,
  and PWA metadata.
- `contracts-platform` owns transport-neutral Solution Runtime manifest contracts.
- `frontend-extension-host` owns browser registration and future validated UI
  composition.
- `core-solutions-runtime` remains the authoritative owner of the Solution catalog,
  Project installation state, compatibility policy, and lifecycle.

The `/app` feature area does not import Coffee or another Solution implementation.
Elsewhere, `apps/web` may compose approved administrative Solution screens through
their public boundary. A future operational Solution UI may be composed only through
reviewed contracts and the extension host.

## Route model

| Route              | Responsibility                                   |
| ------------------ | ------------------------------------------------ |
| `/app`             | Run local bootstrap and enter the required state |
| `/app/connect`     | Collect and validate a Business Environment Code |
| `/app/unavailable` | Render a neutral bootstrap failure state         |
| unknown `/app/*`   | Return to the safe `/app` bootstrap entry        |

These routes form a distinct operational mode while sharing the approved `apps/web`
build, process, runtime versions, and deployment. The mode does not render Manager
Platform navigation or Project administration.

## Bootstrap model

The typed state model reserves the future progression:

```text
starting
  -> requires-environment-code
  -> resolving-environment
  -> requires-device-authorization
  -> requires-employee-authentication
  -> loading-runtime
  -> ready
```

`unavailable` and `error` represent terminal bootstrap outcomes. Stage 7.1 executes only
the first transition from `starting` to `requires-environment-code`. It performs no fake
resolution, authorization, authentication, session creation, or runtime loading.

## Business Environment Code

The Business Environment Code is a permanent identifier of a business environment. In
future stages it will resolve the relevant Project and Solution Installation. It does
not contain business configuration and is not:

- a device enrollment code;
- an employee password or PIN;
- a one-time token;
- a Coffee-specific identifier;
- the only security factor.

Stage 7.1 validates only a sixteen-digit format. The normalized code lives solely in
local component memory. It is not placed in a URL, log, analytics event, cookie,
`localStorage`, `sessionStorage`, IndexedDB, repository, or network request.

Device authorization and employee authentication remain separate future security steps.
Business configuration will be loaded only after authoritative environment resolution.

## Runtime registry

The browser registry starts empty and contains no hard-coded Solution list. It can
register, retrieve, and check a neutral runtime manifest by `solutionKey`. Duplicate
registration throws an explicit error rather than silently replacing an entry.

The registry is a browser composition seam only. It does not select a runtime during
Stage 7.1 and does not supersede `core-solutions-runtime`.

## PWA boundary

The web manifest is scoped to `/app` and supplies install metadata and an approved
BARAKASB icon. Stage 7.1 adds no service worker, API cache, runtime cache, background
sync, push notifications, or offline business database. Authenticated and Project-scoped
content remains uncached by default.

## Stage 7.1 exclusions

The foundation intentionally excludes:

- code generation and authoritative environment resolution;
- backend integration;
- device authorization or device sessions;
- employee authentication or employee sessions;
- runtime selection or dynamic module loading;
- Coffee and other Solution runtimes;
- operational workspaces;
- offline business operations.

## Governance

This runtime mode is the aligned interpretation recorded in
[Stage 7.1 architecture alignment](../reviews/2026-07-31-stage-7-1-architecture-alignment.md).
It preserves the single browser composition root and deployment topology accepted by
ADR 0032. No ADR is added or changed.

## Related decisions

- [ADR 0006: Solution and Plugin contracts](../adr/0006-solution-plugin-contracts.md)
- [ADR 0014: Authenticated cache isolation](../adr/0014-authenticated-cache-isolation.md)
- [ADR 0032: Plane-separated modular deployments](../adr/0032-plane-separated-modular-deployments.md)
- [ADR 0038: Explicit package taxonomy](../adr/0038-explicit-package-taxonomy.md)
