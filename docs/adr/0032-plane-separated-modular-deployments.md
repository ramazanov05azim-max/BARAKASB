# ADR 0032: Separate control, data, realtime, and extension deployment planes

- **Status:** Accepted
- **Date:** 2026-07-30
- **Owners:** Platform Architecture, Reliability
- **Supersedes:** [ADR 0002](0002-modular-monolith.md)

## Context

One API and one worker would combine global administration, project data, realtime
connections, and extension execution in processes with different credentials, failure
modes, scaling signals, and release risk. Cells and regional placement also require
data-plane processes to scale independently from global control-plane workflows.

## Decision drivers

- least privilege and bounded blast radius;
- independent scaling and deployment cadence;
- cell-local data execution;
- control-plane survival during a cell incident;
- isolation of non-platform extension code.

## Decision

Use seven least-privilege composition roots:

- `web` is the Next.js shell and confidential BFF;
- `control-plane-api` exposes global platform administration;
- `control-plane-worker` runs durable global workflows;
- `data-plane-api` serves project-scoped REST traffic inside a cell;
- `data-plane-worker` runs cell-local asynchronous workloads;
- `realtime-gateway` owns project-scoped connections and fan-out;
- `extension-runner` is the out-of-process boundary for non-platform extensions.

Each backend composition root remains a modular monolith internally. Deployments share
only versioned contracts and a signed compatibility lock; they do not share runtime
memory or broad credentials.

## Why this decision

Plane separation follows real trust, availability, and scaling boundaries without
creating a network service for every bounded context. It preserves module extraction
options while making the first production topology least-privilege.

## Alternatives considered

- One API and one worker: rejected because credentials, scaling, and blast radius are
  too broad.
- A microservice per bounded context: rejected because its distributed-system cost is
  not supported by current evidence.
- One binary with runtime flags: rejected because accidental wiring and excessive
  credentials remain possible.

## Consequences

There are more deployable artifacts, network contracts, health checks, and local
composition profiles. Cross-plane operations require idempotency and explicit failure
semantics. In return, each plane can be independently secured, scaled, rolled back, and
operated.

## Validation

CI validates composition allowlists. Deployment tests prove that each workload starts
with only its declared modules and credentials. Failure drills prove that a data cell,
realtime gateway, or extension runner can fail without granting or exhausting the
control plane.

## Revisit when

Measured load or team ownership justifies extracting a bounded context, or a simpler
deployment can provide equivalent credential and failure isolation.
