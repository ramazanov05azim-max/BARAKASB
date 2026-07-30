# Applications

Applications are least-privilege deployable composition roots. They select platform
packages, Solutions, and Plugins from a signed deployment compatibility lock and provide
runtime wiring. They must not own domain rules or persistence models.

| Application            | Runtime                    | Responsibility                                                             |
| ---------------------- | -------------------------- | -------------------------------------------------------------------------- |
| `web`                  | Next.js                    | Browser shell, confidential BFF, and server rendering                      |
| `control-plane-api`    | NestJS                     | Global identity, Project governance, placement, and extension control APIs |
| `control-plane-worker` | NestJS application context | Project lifecycle, placement, extension reconciliation, catalog workflows  |
| `data-plane-api`       | NestJS                     | Project-scoped REST delivery inside a cell                                 |
| `data-plane-worker`    | NestJS application context | Cell-local outbox, events, schedules, and Project jobs                     |
| `realtime-gateway`     | NestJS WebSocket           | Project connections, fan-out, invalidation, and backpressure               |
| `extension-runner`     | Isolated runtime boundary  | Future out-of-process execution for non-platform extensions                |

Control-plane processes have no direct business-data credentials. Data-plane processes
cannot mutate global placement or identity policy. The extension runner has no direct
database, cache, or secret-store access.
