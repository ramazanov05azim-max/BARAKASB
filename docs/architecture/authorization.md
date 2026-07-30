# Authorization

## Model

Authorization combines project-scoped RBAC with contextual policy checks:

```text
decision = active membership
        AND role grants capability
        AND contextual policy allows action
        AND target belongs to active project
```

The default result is deny.

## Capability naming

Capabilities are namespaced and stable:

```text
core.projects.read
core.projects.manage
core.memberships.manage
solution.<solution>.resource.read
plugin.<solution>.<plugin>.action
```

Routes, use cases, events, and UI contributions reference capabilities, not role names.
Roles are project-owned bundles of capabilities.

## Built-in administrative roles

The platform may bootstrap `owner` and `administrator` roles to ensure project
governance. Additional roles are data, not code. Ownership transfer is a high-risk
workflow requiring reauthentication, audit, and invariant checks.

No role can bypass project isolation. A platform operator is not automatically a Project
member.

## Policy decision point

`access-control` owns the policy decision interface. Enforcement points exist at REST,
WebSocket, job, and application-service boundaries. The application layer performs the
authoritative decision; UI checks are usability only.

A decision records:

- actor and project;
- capability;
- target type and ID when applicable;
- policy version;
- allow/deny result and machine-readable reason;
- correlation ID.
- membership revision, policy revision, and placement epoch.

Sensitive denials are audit events. High-volume routine denials are structured security
telemetry with sampling rules.

## Membership changes

Role removal, membership suspension, and Project suspension invalidate related caches,
active WebSocket subscriptions, and privileged sessions promptly. Authorization caches
are short-lived, versioned by membership revision, and never broaden access on failure.

Invalidation is a versioned event, not best-effort cache deletion. API, BFF, WebSocket,
worker, and extension-host caches reject entries with an older membership or policy
revision. Security-sensitive writes compare the revision again inside their database
transaction to close time-of-check/time-of-use races.

## Capability lifecycle

Capabilities have immutable identifiers, owner, risk class, description, introduction
version, and retirement state. Disabling a Solution or Plugin removes its capabilities
from effective role grants without deleting historical assignments. Re-enablement does
not silently restore grants retired by policy.

Break-glass platform access, if introduced, is separate from normal Project roles,
time-bound, dual-approved, reason-bound, user-visible where lawful, and fully audited.

## Related decision

- [ADR 0005: Capability authorization](../adr/0005-capability-authorization.md)
