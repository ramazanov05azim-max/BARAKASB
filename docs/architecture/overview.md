# Architecture overview

## Context

BARAKASB is a Business Operating System in which one identity can participate in many
independent projects. A Project is the security, data, configuration,
Solution-installation, and operational isolation boundary.

The system distinguishes global platform data from project-scoped business data.
Identity and the directory of project memberships are global platform concerns. Business
data is always owned by exactly one Project.

## Logical architecture

```text
Browser / Client
       |
       v
Next.js Web / BFF
       |
       +--------------------------+
       |                          |
       v                          v
Control-plane API          Placement router
       |                          |
Control-plane worker              v
                         Data-plane API (cell)
                                  |
                         Data-plane worker
                                  |
                         Realtime gateway
                                  |
                         Extension runner
       |                          |
       +-------------+------------+
                     |
       Core + installed Solution/Plugin contracts
                     |
       PostgreSQL / Redis / Objects / Telemetry
```

## Deployment shape

Each deployment plane is a modular monolith with independently packaged bounded
contexts. Modules own their data, communicate through public application interfaces or
events, and have no cross-module repository access. Plane separation follows trust,
availability, and scaling boundaries without creating a service per bounded context.

The web application is a single Next.js shell that discovers installed Solutions and
Plugins through server-provided manifests. It does not encode business-specific
navigation in Core.

At scale, deployments are organized into cells. The global control plane owns Project
placement and desired extension state; the selected data-plane cell owns execution and
business data. A Project has one writable home region and a fencing epoch. See
[Control plane and data plane](control-plane-and-data-plane.md).

## Request invariant

For a project-scoped operation, the execution chain is:

```text
authenticate actor
    -> resolve project from route
    -> verify active membership
    -> authorize capability
    -> resolve placement and verify fencing epoch
    -> open project-scoped unit of work
    -> execute application use case
    -> persist state and outbox atomically
    -> emit audit record
    -> return contract response
```

Skipping or reordering project resolution, authorization, or scoped persistence is a
security defect.

## Quality attributes

Priority order:

1. Project isolation and security
2. Correctness and auditability
3. Maintainability and explicit ownership
4. Availability and recoverability
5. Performance and horizontal scalability
6. Extension ergonomics

When two goals conflict, the higher priority wins unless an ADR explicitly changes the
decision.

## Related decisions

- [ADR 0032: Plane-separated modular deployments](../adr/0032-plane-separated-modular-deployments.md)
- [ADR 0003: Project isolation](../adr/0003-project-isolation.md)
- [ADR 0006: Solution and Plugin contracts](../adr/0006-solution-plugin-contracts.md)
- [ADR 0011: Project placement](../adr/0011-project-placement-single-writer.md)
- [ADR 0012: Module-local transactions](../adr/0012-module-local-transactions.md)
