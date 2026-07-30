# Data-plane API boundary

Future NestJS composition root for Project-scoped REST delivery inside a cell.

Allowed contents: bootstrap, cell and placement fencing, module wiring, global transport
policy, health endpoints, shutdown, and adapter configuration. Domain behavior belongs
in Core, Solution, or Plugin packages. WebSocket connection ownership belongs to the
realtime gateway.

Planned internal structure:

```text
src/
├── bootstrap/
├── composition/
├── health/
└── main.ts
```
