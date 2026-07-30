# Data-plane worker boundary

Future NestJS application-context composition root for cell-local asynchronous work.

It wires shard-local outbox publishers, consumers, schedules, and module-owned Project
job handlers. It validates Project placement epochs and has no public HTTP API beyond
health/metrics when the deployment platform requires them.

Planned internal structure:

```text
src/
├── bootstrap/
├── composition/
├── health/
└── main.ts
```
