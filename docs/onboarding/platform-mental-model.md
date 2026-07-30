# Platform mental model

## The one-sentence model

BARAKASB is a platform where one authenticated identity can operate many Projects, but
every Project is an independent security, data, extension, routing, and operational
boundary.

## Five concepts to remember

### Actor

The authenticated human or workload initiating an operation. Authentication proves who
the Actor is. It does not grant Project access.

### Project

The tenant boundary. Business data belongs to exactly one Project. Membership and
capabilities determine what an Actor may do in that Project.

### Core

Business-neutral platform capabilities: identity, Projects, placement, tenancy, access
control, audit, and extension runtimes. Core never imports a concrete Solution or
Plugin.

### Solution

A versioned business capability that may be installed into a Project. It uses public
Core contracts and owns its behavior and data. No Solution exists in Foundation.

### Plugin

A versioned extension of one Solution. It may use only the Core Plugin SDK and extension
points published by its target Solution. No Plugin exists in Foundation.

## Dependency direction

```text
Core <- Solution <- Plugin
```

Applications are composition roots. They assemble allowed packages but do not own domain
rules.

## Control plane versus data plane

The control plane knows identities, membership policy, extension catalog/desired state,
and where a Project lives.

The data plane executes that Project's commands and queries inside its selected cell. A
Project has one writable home region and a monotonic placement epoch. The epoch fences
old writers after a move or failover.

## Data rule

PostgreSQL is authoritative for state, object storage for binary bytes, Redis is
ephemeral, and the broker transports facts. Every project-scoped database table uses
`project_id`, composite constraints, and forced RLS.

## Consistency rule

One transaction writes data owned by one module. A workflow changing multiple owners
uses durable state, outbox events, idempotent steps, and compensation. This makes
eventual consistency explicit instead of hiding it inside a shared database.

## Extension rule

Project installation selects reviewed immutable artifacts from the deployment
compatibility lock. A Project never supplies executable package URLs. Desired state is
reconciled to effective state through resumable checkpoints.

## Security rule

The platform denies by default. A project-scoped operation needs:

```text
authenticated Actor
+ active Project
+ current placement epoch
+ active membership
+ capability
+ contextual policy
+ Project-owned target
```

The UI may hide unavailable actions, but only the backend authorizes.

## Recovery rule

WebSocket and caches improve latency; neither is authoritative. REST/PostgreSQL
recovery, outbox replay, backup restoration, and object reconciliation restore truth.
