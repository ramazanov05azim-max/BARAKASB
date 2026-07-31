# Solutions runtime

Owns the Solution catalog, manifests, Project installation state, compatibility,
lifecycle orchestration, and immutable runtime registration. It does not contain
business Solution implementations.

## Data governance

Solution Runtime data is governed by the module lifecycle ledger. Business Environment
Code remains Confidential by default and is never emitted to ordinary logs, traces, or
metric labels.

- [Solution Runtime data lifecycle ledger](DATA_LIFECYCLE.md)
