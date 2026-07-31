# Coffee Solution frontend

This package owns the browser-side Coffee Project administration environment.

It contains Coffee-specific presentation, typed mock repository contracts and the local
mock adapter used before backend integration. It receives the active Project identity,
locale and platform-owned UI slots from `apps/web`.

The package does not own platform identity, Project lifecycle, subscriptions,
authentication or authoritative authorization. UI permission checks are usability
controls only and must be repeated by the future backend adapter.
