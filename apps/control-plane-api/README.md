# Control-plane API boundary

Future NestJS composition root for global identity, Project directory and lifecycle,
membership governance, placement, extension catalogs, desired installation state, and
privileged administrative APIs.

It never receives direct credentials for Project business-data shards. Cross-plane
workflows use versioned commands/events and placement-fenced data-plane endpoints.

Planned internal structure:

```text
src/
├── bootstrap/
├── composition/
├── health/
└── main.ts
```
