# Frontend architecture

## Application shell

`apps/web` is a Next.js shell responsible for:

- authenticated session bootstrap;
- active-project selection and routing;
- server-side authorization-aware navigation;
- loading validated Solution and Plugin UI manifests;
- global error, telemetry, accessibility, and localization concerns.

It contains no business-specific screens.

The same composition root also hosts the Platform-owned Universal Application runtime
mode under `/app`. This mode has its own route layout and minimal operational shell, but
it is not a second deployable or browser composition root. It does not reuse the
administrative navigation and it cannot import a Solution implementation directly.

## Route model

All project-scoped routes begin with:

```text
/projects/{projectId}/...
```

The route project ID is authoritative. Cached state from a previous project must be
cleared or partitioned before rendering another project. A project switch is a
security-context change, not a cosmetic dropdown update.

Universal Application routes are namespaced separately:

```text
/app
/app/connect
/app/workspace
```

The namespace prevents the operational bootstrap flow from competing with the public,
authentication, or Project-administration routes. Unknown routes inside `/app/*` return
to `/app`.

## Rendering boundaries

- Server Components are preferred for server-owned data and initial rendering.
- Client Components are used for interaction and browser APIs.
- Server Actions, if adopted, call application/API boundaries and repeat authorization;
  they do not bypass the backend.
- Sensitive tokens are never exposed to browser JavaScript when an HttpOnly session
  cookie can be used.

`apps/web` is a confidential BFF client. It owns the browser session cookie, CSRF
boundary, and on-behalf-of call to the API. Provider refresh credentials remain
server-side. The API accepts a short-lived, audience-bound internal assertion or the
validated session context; the web process never forwards a reusable provider refresh
credential.

## Cache isolation

Authenticated or Project-scoped rendering and fetches are uncached by default. Next.js
full-route, data, request memoization, CDN, and browser caches are separate mechanisms
and each requires explicit review.

An approved shared cache key includes at least:

```text
deployment + actor/session class + project_id + membership_revision
+ policy_revision + resource/version + locale
```

Public data is the only data eligible for cache sharing without actor and Project scope.
Personalized HTML uses `private`/`no-store` semantics. Cache tags include Project and
authorization revisions so membership changes can invalidate derived content. Framework
upgrades rerun cache-bleed tests.

## State ownership

1. URL owns navigation and selected project.
2. Server state is fetched through the generated API client and is uncached unless an
   explicit scoped cache policy is approved.
3. Local component state remains local.
4. Cross-page client state is introduced only for true browser workflows.

Changing project invalidates all project-scoped queries, subscriptions, optimistic
updates, local storage entries, and extension registrations.

Offline persistence and service-worker caching of authenticated data are disabled until
a separate threat model defines encryption, logout, revocation, and Project-switch
semantics.

## Extension UI

Solutions expose declarative contributions through versioned manifests:

- navigation items;
- routes;
- dashboard slots;
- commands;
- required capabilities.

Plugins may contribute only to slots declared by their target Solution. The extension
host validates versions, capabilities, route ownership, and project enablement before
registration. Arbitrary runtime JavaScript from untrusted sources is not executed in the
main application.

Every contribution has a route/slot namespace, error boundary, loading budget, bundle
budget, and deterministic conflict priority. Manifest display text is untrusted and
escaped. One failing extension cannot break the shell or Core administration.

The transport-neutral Solution Runtime manifest is declared in `contracts-platform`. The
browser-side in-memory registry is owned by `frontend-extension-host`; it is empty by
default and rejects duplicate `solutionKey` registrations. It does not own the Solution
catalog, Project installation state, compatibility policy, or lifecycle. Those
responsibilities remain in `core-solutions-runtime`.

## Design system

`@barakasb/frontend-ui` owns tokens and accessible primitives, not business components.
Solution-specific components remain inside the Solution package. Accessibility target is
WCAG 2.2 AA.

## Related decisions

- [ADR 0007: REST and WebSocket contracts](../adr/0007-rest-websocket-contracts.md)
- [ADR 0014: Authenticated cache isolation](../adr/0014-authenticated-cache-isolation.md)
- [ADR 0017: Confidential web BFF](../adr/0017-confidential-web-bff.md)
- [ADR 0022: WebSocket notification semantics](../adr/0022-websocket-notification-semantics.md)
- [Universal Application runtime mode](universal-application.md)
