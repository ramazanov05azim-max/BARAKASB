# Coffee Solution frontend

This package owns the browser-side Coffee Project administration environment.

It contains Coffee-specific presentation, transport-neutral repository contracts and the
local browser mock adapter used before backend integration. It receives the active
Project identity, locale and platform-owned UI slots from `apps/web`.

`CoffeeProjectEnvironment` accepts an optional `CoffeeManagerRepositories` adapter. The
current composition uses the package-local `localStorage` implementation for Coffee
entities. Image binaries are not part of that JSON: menu items contain only
`imageAssetId`, while `@barakasb/frontend-media` stores metadata and normalized Blobs in
project-isolated IndexedDB stores. A future production adapter must be supplied by the
existing `apps/web` composition root after the platform API and Stage 7.2 runtime
contracts exist; Coffee screens must not import platform persistence, messaging,
identity, or runtime internals.

The package does not own platform identity, Project lifecycle, subscriptions,
authentication or authoritative authorization. UI permission checks are usability
controls only and must be repeated by the future backend adapter.

The local adapter is prototype infrastructure. Its Project-keyed storage and contract
tests prevent accidental browser-state mixing, but they are not a substitute for
PostgreSQL constraints, forced RLS, transactions, audit, or backend authorization.
