# Realtime gateway boundary

Future NestJS WebSocket composition root for Project-scoped connection authentication,
subscription authorization, revision invalidation, cell-local fan-out, bounded buffers,
backpressure, and resynchronization markers.

It is independently deployable so long-lived connections scale and roll separately from
request/response APIs. It stores no authoritative state and exposes no general business
mutation surface.

Planned internal structure:

```text
src/
├── bootstrap/
├── composition/
├── connections/
├── health/
└── main.ts
```
