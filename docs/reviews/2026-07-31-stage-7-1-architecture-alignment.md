# Stage 7.1 architecture alignment

- **Date:** 2026-07-31
- **Status:** Approved implementation interpretation
- **Scope:** Universal Application Foundation
- **ADR impact:** None

## Purpose

This review aligns `BARAKASB_STAGE_7_1_UNIVERSAL_APPLICATION_FOUNDATION.md` with the
accepted BARAKASB architecture before implementation. It does not change a deployment
topology, trust boundary, public API, or accepted ADR.

The governing interpretation is:

> Universal Application is a Platform-owned runtime mode inside the existing `apps/web`
> Next.js shell. It is not a separate deployable application or an additional browser
> composition root.

## Sources reviewed

- `docs/architecture/overview.md`
- `docs/architecture/frontend.md`
- `docs/architecture/module-catalog.md`
- `docs/architecture/monorepo.md`
- `docs/roadmap.md`
- `docs/governance/architecture-governance.md`
- ADR 0001 through ADR 0038, including superseded ADR 0002

## Conflict report

### SAC-001 — Additional browser composition root

- **Specification section:** 4, 5.1, 8, 31
- **Conflict:** Stage 7.1 requests a separate Nx application, preferably
  `apps/solution-app`, with independent build and serve targets.
- **Authority:** ADR 0032, Decision; Architecture Overview, Deployment shape; Module
  Catalog, Deployable applications; Monorepo Architecture, Structure.
- **Reason:** ADR 0032 defines seven least-privilege composition roots and assigns the
  browser shell and confidential BFF responsibility to `apps/web`. A second browser
  application would change the approved deployment topology and compatibility lock.
- **Possible resolutions:**
  1. Preferred: implement Universal Application as a runtime mode inside `apps/web`.
  2. Alternative: create and approve a superseding ADR before adding another deployable.
- **Resolution selected:** option 1. No `apps/solution-app` is created.

### SAC-002 — Independent application entry and targets

- **Specification section:** 4, 8, 31
- **Conflict:** Stage 7.1 requires an independent entry point, build, serve, lint, test,
  routing, and environment configuration.
- **Authority:** ADR 0001; ADR 0026; ADR 0027; ADR 0032; Frontend Architecture,
  Application shell.
- **Reason:** An independent process is incompatible with the single approved browser
  composition root. Independent dependency versions or a parallel toolchain would also
  violate the central runtime policy.
- **Possible resolutions:**
  1. Treat a namespaced route layout as the runtime-mode entry point and use `app-web`
     targets.
  2. Add a new deployable through an ADR.
- **Resolution selected:** option 1. `app-web` receives a test target; existing build,
  dev, lint, and typecheck targets remain authoritative.

### SAC-003 — Root route ownership

- **Specification section:** 17
- **Conflict:** Unnamespaced Universal routes overlap existing Manager Platform routes,
  especially the public landing route `/`.
- **Authority:** Frontend Architecture, Route model and State ownership; existing
  approved Platform UX route map.
- **Reason:** Two runtime modes cannot own the same route without hidden mode state or
  ambiguous navigation.
- **Possible resolutions:**
  1. Namespace the Universal runtime mode.
  2. Replace existing Manager Platform routes.
- **Resolution selected:** namespace the canonical Workspace routes as `/app`,
  `/app/connect`, and `/app/workspace`. Unknown `/app/*` routes are not handled by a
  compatibility fallback.

### SAC-004 — Runtime Registry ownership

- **Specification section:** 15, 16
- **Conflict:** Stage 7.1 describes a new generic Runtime Registry without assigning it
  to an existing bounded module.
- **Authority:** ADR 0006; ADR 0010; ADR 0013; ADR 0024; Module Catalog, Core modules
  and Frontend platform modules; Frontend Architecture, Extension UI.
- **Reason:** A second catalog or installation registry would create a competing source
  of truth. Browser composition and server-side installation lifecycle have different
  owners.
- **Possible resolutions:**
  1. Put catalog, installation, compatibility, and lifecycle in
     `core-solutions-runtime`; put browser registration/composition in
     `frontend-extension-host`.
  2. Introduce a new runtime subsystem through architecture governance.
- **Resolution selected:** option 1. Transport-neutral runtime manifest contracts live
  in `contracts-platform`; the empty in-memory browser registry lives in
  `frontend-extension-host`. It does not own installation state or resolve a Project.

### SAC-005 — PWA scope and authenticated caching

- **Specification section:** 20
- **Conflict:** A general service worker or offline cache could cover authenticated
  Manager Platform or future Project data.
- **Authority:** ADR 0014; Frontend Architecture, Cache isolation and State ownership.
- **Reason:** Authenticated and Project-scoped content is uncached by default. Offline
  authenticated persistence is not approved.
- **Possible resolutions:**
  1. Add manifest-only PWA metadata scoped to `/app/`, without a service worker.
  2. Introduce offline caching after a separate threat model and approval.
- **Resolution selected:** option 1. Stage 7.1 adds no service worker, runtime cache,
  persistent code storage, or authenticated offline data.

### SAC-006 — Business Environment Code persistence

- **Specification section:** 3, 12, 13, 24
- **Conflict:** Future environment resolution is Project-sensitive, while the current
  stage has no authoritative backend or session boundary.
- **Authority:** ADR 0003; ADR 0005; ADR 0014; ADR 0017; ADR 0028.
- **Reason:** Persisting or transmitting the code now would invent a security and data
  ownership model before environment resolution and device authorization exist.
- **Possible resolutions:**
  1. Keep the normalized value only in local React state and return a neutral
     not-implemented state on submit.
  2. Create mock resolution or persistence.
- **Resolution selected:** option 1. No URL, log, analytics, cookie, browser storage,
  repository, or API receives the code.

### SAC-007 — Design-system ownership versus implementation state

- **Specification section:** 21
- **Conflict:** Architecture assigns tokens and primitives to `frontend-ui`, while the
  currently implemented visual primitives remain local to `apps/web`.
- **Authority:** Frontend Architecture, Design system; Module Catalog, Frontend platform
  modules.
- **Reason:** Copying primitives into a new feature or creating another UI library would
  deepen the implementation/documentation mismatch.
- **Possible resolutions:**
  1. Reuse existing `apps/web` primitives inside the same shell and avoid duplication.
  2. Perform a repository-wide design-system extraction before Stage 7.1.
- **Resolution selected:** option 1 for this bounded stage. The feature introduces no
  new design-system package or duplicate token set. Extraction remains separate work.

### SAC-008 — Test target gap

- **Specification section:** 14, 16, 25, 26, 27, 30, 31
- **Conflict:** `app-web` currently has no Nx test target and the repository-wide
  `pnpm test` executes no tasks.
- **Authority:** ADR 0001; ADR 0026; Monorepo Architecture, Task graph.
- **Reason:** Stage 7.1 acceptance cannot be demonstrated without an executable test
  target.
- **Possible resolutions:**
  1. Add a test target to the existing `app-web` project using the repository runtime
     and lockfile.
  2. Leave tests as external/manual evidence.
- **Resolution selected:** option 1. This strengthens an existing quality gate and does
  not add a composition root.

## Adapted implementation boundaries

```text
apps/web
└── /app runtime mode
    ├── /app
    ├── /app/connect
    └── /app/workspace
             |
             v
packages/frontend/extension-host
             |
             v
packages/contracts/platform
```

Server-side ownership remains unchanged:

```text
core-solutions-runtime
└── catalog, Project installation state, compatibility, lifecycle
```

The browser registry is not authoritative and is empty by default. It only establishes
the future UI composition boundary for reviewed, allowlisted Solution runtimes.

## Adapted acceptance criteria

The following original criteria are replaced:

| Original Stage 7.1 wording                | Aligned criterion                                            |
| ----------------------------------------- | ------------------------------------------------------------ |
| Separate Nx application                   | Separate runtime mode inside `app-web`                       |
| Independent browser entry point           | Namespaced `/app` route layout                               |
| Independent serve/build/lint/typecheck    | Existing `app-web` targets                                   |
| Independent test target                   | New `app-web:test` target                                    |
| `/`, `/connect`, `/workspace`             | `/app`, `/app/connect`, `/app/workspace`                     |
| New generic runtime subsystem             | Contracts Platform plus existing Frontend Extension Host     |
| Installable application with own artifact | Manifest-scoped PWA foundation inside the existing web build |

All remaining functional, accessibility, privacy, responsive, localization, bootstrap,
registry, and testing requirements remain unchanged.

## Implementation plan

1. Add transport-neutral Solution Runtime manifest contracts to `contracts-platform`.
2. Implement the empty in-memory browser registry in `frontend-extension-host`.
3. Add package public surfaces and Nx lint, typecheck, test, and build targets where
   applicable.
4. Add the Universal Application feature area under `apps/web/src/features`.
5. Add `/app`, `/app/connect`, and `/app/workspace` routes.
6. Add manifest-only PWA metadata scoped to `/app/`; do not add a service worker.
7. Add Russian and English localization keys for every visible string.
8. Add unit, component, bootstrap, registry, and routing tests.
9. Add the Universal Application architecture document and documentation links.
10. Run formatting, lint, typecheck, tests, builds, architecture checks, responsive
    checks, accessibility checks, and Manager Platform regression checks.

## ADR conclusion

No new ADR is required because the aligned plan:

- keeps all seven ADR 0032 composition roots unchanged;
- keeps one Next.js browser shell;
- uses already assigned module responsibilities;
- introduces no backend, provider, store, trust boundary, or deployment topology;
- adds only local implementation within accepted package and routing boundaries.
