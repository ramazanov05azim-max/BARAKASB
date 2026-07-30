# Control-plane worker boundary

Future NestJS application-context composition root for Project lifecycle orchestration,
placement moves, extension catalog admission, desired-state reconciliation, fleet
rollout coordination, and global audit/export workflows.

It does not execute ordinary Project jobs or query Solution/Plugin business tables. Work
is idempotent, operation-ID scoped, and delegated to the effective data-plane cell
through versioned contracts.

Planned internal structure:

```text
src/
├── bootstrap/
├── composition/
├── health/
└── main.ts
```
