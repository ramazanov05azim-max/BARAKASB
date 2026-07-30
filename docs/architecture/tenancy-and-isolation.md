# Project tenancy and isolation

## Terminology

BARAKASB uses **Project** as the tenant boundary. An identity may belong to many
Projects, but a business datum belongs to exactly one Project.

## Isolation strategy

Project-scoped relational tables use:

- a non-null `project_id`;
- composite primary/unique keys that include `project_id` where appropriate;
- composite foreign keys that prevent references across Projects;
- PostgreSQL Row-Level Security (RLS);
- policies bound to a transaction-local verified project setting.

The application opens a transaction and uses parameterized `SET LOCAL` semantics through
a controlled persistence adapter to set `app.current_project_id`,
`app.current_placement_epoch`, and, when required, actor/security revision. Scope is set
and asserted before repositories run. Session-level `SET` is forbidden.

The runtime database role is not a table owner, superuser, or `BYPASSRLS` role.
Project-scoped tables use both `ENABLE ROW LEVEL SECURITY` and
`FORCE ROW LEVEL SECURITY`. Migration and ownership credentials are unavailable to
application processes.

Connection pools may use session or transaction pooling only when the adapter proves
scope setup inside every transaction. Scope is never assumed to survive a pool checkout,
and repository access outside a scoped transaction fails.

Repository methods do not accept an optional project. Project-scoped repository
instances are created from `ProjectContext`.

## Defense in depth

| Layer          | Control                                                     |
| -------------- | ----------------------------------------------------------- |
| Route          | Project ID is explicit in the URL                           |
| Identity       | Actor is authenticated                                      |
| Access control | Active membership and capability are verified               |
| Application    | Project context is required by use cases                    |
| Persistence    | RLS and composite constraints enforce scope                 |
| Cache          | Every key includes environment and project ID               |
| Events/jobs    | Envelope includes project ID and consumer revalidates scope |
| Objects        | Namespace and signed access are project-scoped              |
| Realtime       | Connections subscribe only to authorized project channels   |
| Observability  | Project ID is a structured attribute, never inferred        |

## Global platform data

Identity, session, Project directory, membership, Solution catalog, and Plugin catalog
are platform data. Their records are not business data, but access is still
least-privileged and audited.

Installation state belongs to a Project. A global catalog entry does not grant access or
enable a capability.

## Cross-project operations

Interactive cross-project business queries are forbidden. Platform administration and
anonymized aggregate analytics require separate privileged pipelines, explicit purpose,
audit logging, and an ADR.

Support impersonation is not part of the initial platform. If introduced, it must be
time-bound, user-visible, separately authorized, and fully audited.

## Tests

Isolation tests must attempt:

- reading, updating, and deleting another Project's rows;
- referencing another Project's IDs through foreign keys;
- cache-key and object-path collisions;
- replaying jobs/events with a changed project ID;
- retaining data after a frontend project switch;
- subscribing to another Project's WebSocket channels.
- reusing a pooled connection after commit, rollback, timeout, and cancellation;
- attempting access with the runtime role while scope is absent or malformed;
- replaying a request or job with a stale placement epoch.

These tests are release blockers.

## Related decisions

- [ADR 0003: Project isolation](../adr/0003-project-isolation.md)
- [ADR 0011: Project placement](../adr/0011-project-placement-single-writer.md)
- [ADR 0026: Architecture quality gates](../adr/0026-architecture-quality-gates.md)
